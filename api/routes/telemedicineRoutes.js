const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const pool = require('../config/db');

function getUserId(req) {
  const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only_change_this_asap';
  if (req.user?.id != null) return req.user.id;
  if (req.user?.userId != null) return req.user.userId;

  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = decoded?.user ?? decoded;
    return user?.id ?? user?.userId ?? null;
  } catch {
    return null;
  }
}

async function getRoleNameByUserId(userId) {
  if (!userId) return null;
  const [rows] = await pool.execute(
    `SELECT r.roleName
     FROM users u
     LEFT JOIN roles r ON u.roleId = r.roleId
     WHERE u.userId = ? AND u.voided = 0 AND u.isActive = 1`,
    [userId]
  );
  return rows[0]?.roleName ?? null;
}

function calculateAgeYears(dob, referenceDate = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;

  const refYear = referenceDate.getFullYear();
  const dobYear = d.getFullYear();
  let age = refYear - dobYear;

  const refMonth = referenceDate.getMonth();
  const dobMonth = d.getMonth();

  const refDay = referenceDate.getDate();
  const dobDay = d.getDate();

  if (refMonth < dobMonth || (refMonth === dobMonth && refDay < dobDay)) {
    age -= 1;
  }

  return age;
}

function requireDoctorOrAdminRole(roleName) {
  if (!roleName) return false;
  const rn = roleName.toLowerCase();
  return rn === 'admin' || rn === 'doctor' || rn.includes('admin');
}

/** Pass `connection` when inside a transaction so audit rows commit with the session insert. */
async function addAudit(sessionId, eventType, actorUserId, details, executor = pool) {
  await executor.execute(
    `INSERT INTO telemedicine_session_audit (sessionId, eventType, actorUserId, details)
     VALUES (?, ?, ?, ?)`,
    [sessionId, eventType, actorUserId || null, details || null]
  );
}

/** Avoid indefinite wait when the pool is exhausted (queueLimit may still apply at pool level). */
const POOL_ACQUIRE_TIMEOUT_MS = Number(process.env.DB_POOL_ACQUIRE_TIMEOUT_MS || 15000);

async function acquirePoolConnection() {
  const connPromise = pool.getConnection();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          Object.assign(new Error('Could not acquire database connection in time'), {
            code: 'POOL_ACQUIRE_TIMEOUT',
          })
        ),
      POOL_ACQUIRE_TIMEOUT_MS
    )
  );
  try {
    return await Promise.race([connPromise, timeoutPromise]);
  } catch (e) {
    if (e && e.code === 'POOL_ACQUIRE_TIMEOUT') {
      connPromise
        .then((c) => {
          try {
            c.release();
          } catch (relErr) {
            console.error('Telemedicine: release after acquire timeout failed:', relErr);
          }
        })
        .catch(() => {});
    }
    throw e;
  }
}

function normalizeZoomUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

/** Defaults for a clinician (Personal Meeting link, etc.) — optional table until migration 42. */
async function fetchUserTelemedicineDefaults(conn, userId) {
  if (userId == null || userId === '') return null;
  try {
    const [rows] = await conn.execute(
      `SELECT defaultZoomJoinUrl, defaultZoomPassword FROM user_telemedicine_settings WHERE userId = ?`,
      [userId]
    );
    return rows[0] || null;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') return null;
    throw e;
  }
}

/** GET /api/telemedicine/my-defaults — logged-in user's saved Zoom defaults */
router.get('/my-defaults', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await pool.execute(
      `SELECT defaultZoomJoinUrl, defaultZoomPassword, updatedAt FROM user_telemedicine_settings WHERE userId = ?`,
      [userId]
    );
    const row = rows[0];
    return res.status(200).json({
      defaultZoomJoinUrl: row?.defaultZoomJoinUrl ?? null,
      defaultZoomPassword: row?.defaultZoomPassword ?? null,
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({ defaultZoomJoinUrl: null, defaultZoomPassword: null, updatedAt: null });
    }
    console.error('Telemedicine my-defaults GET error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/** PUT /api/telemedicine/my-defaults — save defaults for logged-in user */
router.put('/my-defaults', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { defaultZoomJoinUrl, defaultZoomPassword } = req.body || {};
    const url =
      defaultZoomJoinUrl !== undefined && defaultZoomJoinUrl !== null && String(defaultZoomJoinUrl).trim() !== ''
        ? normalizeZoomUrl(String(defaultZoomJoinUrl))
        : null;
    const pass =
      defaultZoomPassword !== undefined && defaultZoomPassword !== null && String(defaultZoomPassword).trim() !== ''
        ? String(defaultZoomPassword).trim()
        : null;

    await pool.execute(
      `INSERT INTO user_telemedicine_settings (userId, defaultZoomJoinUrl, defaultZoomPassword)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         defaultZoomJoinUrl = VALUES(defaultZoomJoinUrl),
         defaultZoomPassword = VALUES(defaultZoomPassword),
         updatedAt = CURRENT_TIMESTAMP`,
      [userId, url, pass]
    );

    const [rows] = await pool.execute(
      `SELECT defaultZoomJoinUrl, defaultZoomPassword, updatedAt FROM user_telemedicine_settings WHERE userId = ?`,
      [userId]
    );
    return res.status(200).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({
        error: 'Database migration required: run api/database/migrations/42_user_telemedicine_defaults.sql',
      });
    }
    console.error('Telemedicine my-defaults PUT error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/** Create session (zoom_manual: no external API; optional link can be pasted later). */
router.post('/sessions', async (req, res) => {
  const {
    originType,
    appointmentId,
    admissionId,
    patientId,
    doctorId,
    notes,
    zoomJoinUrl,
    zoomPassword,
  } = req.body || {};

  // Validate before acquiring a pool connection (avoids tying up connections on bad requests)
  if (!originType || !['appointment', 'inpatient', 'standalone'].includes(originType)) {
    return res.status(400).json({ error: 'originType must be appointment, inpatient, or standalone' });
  }
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required' });
  }
  if (originType === 'appointment' && !appointmentId) {
    return res.status(400).json({ error: 'appointmentId is required when originType=appointment' });
  }
  if (originType === 'inpatient' && !admissionId) {
    return res.status(400).json({ error: 'admissionId is required when originType=inpatient' });
  }

  const userId = getUserId(req);
  const actor = userId || null;

  const sessionUuid = crypto.randomUUID();
  let zUrl = normalizeZoomUrl(zoomJoinUrl);
  let zPass = zoomPassword != null && String(zoomPassword).trim() !== '' ? String(zoomPassword).trim() : null;

  // Load defaults using the pool (no transaction connection) before we start the transaction
  if (!zUrl && doctorId) {
    try {
      const defs = await fetchUserTelemedicineDefaults(pool, Number(doctorId));
      if (defs?.defaultZoomJoinUrl) {
        zUrl = normalizeZoomUrl(defs.defaultZoomJoinUrl);
        if (!zPass && defs.defaultZoomPassword) {
          zPass = String(defs.defaultZoomPassword).trim() || null;
        }
      }
    } catch (defErr) {
      if (defErr.code === 'ER_NO_SUCH_TABLE') {
        // optional migration
      } else {
        console.error('Telemedicine defaults fetch (pre-session):', defErr);
        return res.status(500).json({ error: defErr.message || 'Could not load Zoom defaults' });
      }
    }
  }

  let connection;
  try {
    connection = await acquirePoolConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO telemedicine_sessions
       (sessionUuid, originType, appointmentId, admissionId, provider, roomName, roomUrl, zoomJoinUrl, zoomPassword,
        patientId, doctorId, status, recordingPolicyEnabled, notes, createdBy)
       VALUES (?, ?, ?, ?, 'zoom_manual', NULL, NULL, ?, ?, ?, ?, 'created', 0, ?, ?)`,
      [
        sessionUuid,
        originType,
        appointmentId || null,
        admissionId || null,
        zUrl,
        zPass,
        patientId,
        doctorId,
        notes || null,
        actor,
      ]
    );

    const sessionId = result.insertId;
    const auditHint = zUrl ? 'zoom_manual with join URL' : 'zoom_manual (link pending)';
    await addAudit(sessionId, 'session_created', actor, auditHint, connection);

    await connection.commit();

    return res.status(201).json({
      sessionId,
      sessionUuid,
      provider: 'zoom_manual',
      zoomJoinUrl: zUrl,
      status: 'created',
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Telemedicine session rollback error:', rbErr);
      }
    }
    if (err.code === 'POOL_ACQUIRE_TIMEOUT') {
      console.error('Telemedicine session create: pool acquire timeout');
      return res.status(503).json({
        error: 'Database is busy. Please try again in a few seconds.',
        code: 'POOL_ACQUIRE_TIMEOUT',
      });
    }
    console.error('Telemedicine session create error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  } finally {
    if (connection) connection.release();
  }
});

/** Update pasted Zoom join link + optional password (doctor/admin on own session). */
router.patch('/sessions/:sessionId/link', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = getUserId(req);
    const { zoomJoinUrl, zoomPassword } = req.body || {};

    const [rows] = await pool.execute(
      `SELECT sessionId, doctorId, provider FROM telemedicine_sessions WHERE sessionId = ?`,
      [sessionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const s = rows[0];

    const roleName = await getRoleNameByUserId(userId);
    const rn = (roleName || '').toLowerCase();
    const isAdmin = rn === 'admin' || rn.includes('admin');
    if (!userId || (!isAdmin && Number(s.doctorId) !== Number(userId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const zUrl = zoomJoinUrl !== undefined ? normalizeZoomUrl(zoomJoinUrl) : undefined;
    const zPass =
      zoomPassword !== undefined
        ? zoomPassword != null && String(zoomPassword).trim() !== ''
          ? String(zoomPassword).trim()
          : null
        : undefined;

    const updates = [];
    const params = [];
    if (zUrl !== undefined) {
      updates.push('zoomJoinUrl = ?');
      params.push(zUrl);
    }
    if (zPass !== undefined) {
      updates.push('zoomPassword = ?');
      params.push(zPass);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Provide zoomJoinUrl and/or zoomPassword' });
    }
    updates.push('updatedAt = NOW()');
    params.push(sessionId);

    await pool.execute(`UPDATE telemedicine_sessions SET ${updates.join(', ')} WHERE sessionId = ?`, params);
    await addAudit(sessionId, 'zoom_link_updated', userId, null);

    const [out] = await pool.execute(
      `SELECT sessionId, zoomJoinUrl, zoomPassword, status FROM telemedicine_sessions WHERE sessionId = ?`,
      [sessionId]
    );
    return res.status(200).json(out[0]);
  } catch (err) {
    console.error('Telemedicine link update error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * GET /api/telemedicine/sessions — list sessions for current user (doctor: own sessions; admin: all)
 */
router.get('/sessions', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const roleName = await getRoleNameByUserId(userId);
    const rn = (roleName || '').toLowerCase();
    const isAdmin = rn === 'admin' || rn.includes('admin');

    let where = '1=1';
    const params = [];
    if (!isAdmin) {
      where = 'ts.doctorId = ?';
      params.push(userId);
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM telemedicine_sessions ts WHERE ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.execute(
      `SELECT ts.sessionId,
              ts.sessionUuid,
              ts.originType,
              ts.status,
              ts.patientId,
              ts.doctorId,
              ts.appointmentId,
              ts.admissionId,
              ts.zoomJoinUrl,
              ts.createdAt,
              ts.updatedAt,
              p.firstName AS patientFirstName,
              p.lastName AS patientLastName,
              p.patientNumber,
              u.firstName AS doctorFirstName,
              u.lastName AS doctorLastName
       FROM telemedicine_sessions ts
       INNER JOIN patients p ON ts.patientId = p.patientId
       INNER JOIN users u ON ts.doctorId = u.userId
       WHERE ${where}
       ORDER BY ts.createdAt DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.status(200).json({ sessions: rows, page, limit, total });
  } catch (err) {
    console.error('Telemedicine list error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = getUserId(req);

    const [rows] = await pool.execute(
      `SELECT ts.*,
              p.dateOfBirth,
              p.nextOfKinName,
              p.nextOfKinPhone,
              p.nextOfKinRelationship,
              p.firstName as patientFirstName,
              p.lastName as patientLastName,
              u.firstName as doctorFirstName,
              u.lastName as doctorLastName
       FROM telemedicine_sessions ts
       INNER JOIN patients p ON ts.patientId = p.patientId
       INNER JOIN users u ON ts.doctorId = u.userId
       WHERE ts.sessionId = ?`,
      [sessionId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const s = rows[0];

    const roleName = await getRoleNameByUserId(userId);
    const rn = (roleName || '').toLowerCase();
    if (userId && (rn === 'admin' || rn.includes('admin') || Number(s.doctorId) === Number(userId))) {
      return res.status(200).json(s);
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error('Telemedicine session fetch error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * Consent for teleconsultation (and legacy recording flags kept for audit).
 * No external recording API in zoom_manual mode.
 */
router.post('/sessions/:sessionId/consent', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { sessionId } = req.params;
    const actorUserId = getUserId(req);

    const {
      patientConsentGranted,
      guardianConsentGranted,
      guardianName,
      guardianPhone,
      guardianRelationship,
    } = req.body || {};

    if (patientConsentGranted !== true && patientConsentGranted !== false) {
      await connection.rollback();
      return res.status(400).json({ error: 'patientConsentGranted is required (boolean)' });
    }

    const [sessionRows] = await connection.execute(
      `SELECT ts.*, p.dateOfBirth
       FROM telemedicine_sessions ts
       INNER JOIN patients p ON ts.patientId = p.patientId
       WHERE ts.sessionId = ? FOR UPDATE`,
      [sessionId]
    );

    if (sessionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionRows[0];
    const ageYears = calculateAgeYears(session.dateOfBirth, new Date());

    if (ageYears === null) {
      await connection.rollback();
      return res.status(400).json({ error: 'Patient dateOfBirth is missing/invalid; cannot determine minor requirement' });
    }

    const guardianConsentRequired = ageYears < 18;

    if (guardianConsentRequired) {
      if (guardianConsentGranted !== true) {
        await connection.rollback();
        return res.status(400).json({ error: 'Guardian consent is required for minors under 18' });
      }
      if (!guardianName || !guardianRelationship) {
        await connection.rollback();
        return res.status(400).json({ error: 'Guardian name and relationship are required for minor consent' });
      }
    }

    if (patientConsentGranted !== true) {
      await connection.execute(
        `UPDATE telemedicine_sessions
         SET patientConsentGranted = ?, patientConsentAt = ?,
             patientConsentBy = ?,
             guardianConsentGranted = 0,
             guardianConsentAt = NULL,
             guardianConsentBy = NULL,
             recordingConsentSatisfiedAt = NULL,
             updatedAt = NOW(),
             status = CASE
               WHEN status IN ('in_progress','recording_started') THEN status
               ELSE 'waiting_for_consent'
             END
         WHERE sessionId = ?`,
        [0, new Date(), actorUserId || null, sessionId]
      );

      await addAudit(sessionId, 'patient_consent_recorded', actorUserId, 'Consent denied; teleconsult consent cleared');
      await connection.commit();
      return res.status(200).json({ ok: true, guardianConsentRequired, recordingConsentSatisfiedAt: null });
    }

    const now = new Date();
    const newRecordingConsentSatisfiedAt =
      patientConsentGranted === true && (!guardianConsentRequired || guardianConsentGranted === true) ? now : null;

    await connection.execute(
      `UPDATE telemedicine_sessions
       SET ageAtConsentYears = ?,
           minorRequired = ?,
           patientConsentGranted = 1,
           patientConsentAt = ?,
           patientConsentBy = ?,
           guardianConsentRequired = ?,
           guardianConsentGranted = ?,
           guardianConsentAt = ?,
           guardianConsentBy = ?,
           guardianName = ?,
           guardianPhone = ?,
           guardianRelationship = ?,
           recordingConsentSatisfiedAt = ?,
           updatedAt = NOW(),
           status = CASE
             WHEN status = 'created' THEN 'waiting_for_consent'
             ELSE status
           END
       WHERE sessionId = ?`,
      [
        ageYears,
        guardianConsentRequired ? 1 : 0,
        now,
        actorUserId || null,
        guardianConsentRequired ? 1 : 0,
        guardianConsentRequired ? 1 : 0,
        guardianConsentRequired ? now : null,
        guardianConsentRequired ? actorUserId || null : null,
        guardianConsentRequired ? guardianName || null : null,
        guardianConsentRequired ? guardianPhone || null : null,
        guardianConsentRequired ? guardianRelationship || null : null,
        newRecordingConsentSatisfiedAt,
        sessionId,
      ]
    );

    await addAudit(
      sessionId,
      guardianConsentRequired ? 'guardian_consent_recorded' : 'patient_consent_recorded',
      actorUserId,
      `guardianRequired=${guardianConsentRequired}; mode=zoom_manual`
    );

    await connection.commit();
    return res.status(200).json({
      ok: true,
      guardianConsentRequired,
      recordingConsentSatisfiedAt: newRecordingConsentSatisfiedAt,
      startedRecordingNow: false,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Telemedicine consent error:', err);
    return res.status(400).json({ error: err.message || 'Consent failed' });
  } finally {
    connection.release();
  }
});

router.post('/sessions/:sessionId/start', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { sessionId } = req.params;
    const actorUserId = getUserId(req);

    const [rows] = await connection.execute(
      `SELECT ts.sessionId, ts.status, ts.recordingConsentSatisfiedAt, ts.provider
       FROM telemedicine_sessions ts
       WHERE ts.sessionId = ? FOR UPDATE`,
      [sessionId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Session not found' });
    }
    const s = rows[0];

    if (s.status === 'ended') {
      await connection.rollback();
      return res.status(400).json({ error: 'Session is already ended' });
    }

    if (!s.recordingConsentSatisfiedAt) {
      await connection.rollback();
      return res.status(400).json({ error: 'Teleconsult consent must be recorded before starting the session' });
    }

    await connection.execute(
      `UPDATE telemedicine_sessions
       SET status = 'in_progress', updatedAt = NOW()
       WHERE sessionId = ?`,
      [sessionId]
    );
    await addAudit(sessionId, 'teleconsult_started', actorUserId, s.provider || 'zoom_manual');

    await connection.commit();
    return res.status(200).json({ ok: true, startedRecordingNow: false });
  } catch (err) {
    await connection.rollback();
    console.error('Telemedicine start error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  } finally {
    connection.release();
  }
});

router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const actorUserId = getUserId(req);

    await pool.execute(
      `UPDATE telemedicine_sessions
       SET status = 'ended', updatedAt = NOW()
       WHERE sessionId = ?`,
      [sessionId]
    );
    await pool.execute(
      `INSERT INTO telemedicine_session_audit (sessionId, eventType, actorUserId, details)
       VALUES (?, 'call_ended', ?, NULL)`,
      [sessionId, actorUserId || null]
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telemedicine end error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.get('/sessions/:sessionId/recording/download', async (req, res) => {
  return res.status(501).json({
    error: 'Cloud recording is not integrated in Zoom link mode. Record locally in Zoom if your policy allows.',
  });
});

/** Doctor join: returns stored Zoom URL (no token — user opens normal Zoom client). */
router.get('/sessions/:sessionId/join-url', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const userId = getUserId(req);
    const roleName = await getRoleNameByUserId(userId);
    if (!requireDoctorOrAdminRole(roleName)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [rows] = await pool.execute(
      `SELECT ts.zoomJoinUrl, ts.zoomPassword, ts.doctorId, ts.provider
       FROM telemedicine_sessions ts
       WHERE ts.sessionId = ?`,
      [sessionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });

    const s = rows[0];
    if (Number(s.doctorId) !== Number(userId) && !((roleName || '').toLowerCase().includes('admin'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!s.zoomJoinUrl) {
      return res.status(400).json({ error: 'No Zoom join URL saved yet. Paste the meeting link on the session page.' });
    }

    return res.status(200).json({
      joinUrl: s.zoomJoinUrl,
      zoomPassword: s.zoomPassword || null,
      provider: s.provider || 'zoom_manual',
    });
  } catch (err) {
    console.error('Telemedicine join-url error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

module.exports = router;
