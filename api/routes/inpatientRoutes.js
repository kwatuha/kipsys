// Inpatient routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/inpatient/admissions
 * @description Get all admissions
 */
router.get('/admissions', async (req, res) => {
    try {
        const { status, wardId, page = 1, limit = 50, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, 
                   pt.firstName, pt.lastName, pt.patientNumber,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName,
                   w.wardName, w.wardType,
                   b.bedNumber, b.bedType
            FROM admissions a
            LEFT JOIN patients pt ON a.patientId = pt.patientId
            LEFT JOIN users u ON a.admittingDoctorId = u.userId
            LEFT JOIN beds b ON a.bedId = b.bedId
            LEFT JOIN wards w ON b.wardId = w.wardId
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND a.status = ?`;
            params.push(status);
        }

        if (wardId) {
            query += ` AND w.wardId = ?`;
            params.push(wardId);
        }

        if (search) {
            query += ` AND (a.admissionNumber LIKE ? OR pt.firstName LIKE ? OR pt.lastName LIKE ? OR pt.patientNumber LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY a.admissionDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [admissions] = await pool.execute(query, params);

        // Get diagnoses for each admission
        for (const admission of admissions) {
            const [diagnoses] = await pool.execute(
                'SELECT * FROM admission_diagnoses WHERE admissionId = ? ORDER BY diagnosisType, diagnosisId',
                [admission.admissionId]
            );
            admission.diagnoses = diagnoses;
        }

        res.status(200).json(admissions);
    } catch (error) {
        console.error('Error fetching admissions:', error);
        res.status(500).json({ message: 'Error fetching admissions', error: error.message });
    }
});

/**
 * @route GET /api/inpatient/admissions/:id
 * @description Get a single admission
 */
router.get('/admissions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [admissions] = await pool.execute(
            `SELECT a.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    w.wardName, w.wardType, w.wardId,
                    b.bedNumber, b.bedType, b.bedId
             FROM admissions a
             LEFT JOIN patients pt ON a.patientId = pt.patientId
             LEFT JOIN users u ON a.admittingDoctorId = u.userId
             LEFT JOIN beds b ON a.bedId = b.bedId
             LEFT JOIN wards w ON b.wardId = w.wardId
             WHERE a.admissionId = ?`,
            [id]
        );

        if (admissions.length === 0) {
            return res.status(404).json({ message: 'Admission not found' });
        }

        const admission = admissions[0];

        // Get diagnoses
        const [diagnoses] = await pool.execute(
            'SELECT * FROM admission_diagnoses WHERE admissionId = ? ORDER BY diagnosisType, diagnosisId',
            [id]
        );
        admission.diagnoses = diagnoses;

        res.status(200).json(admission);
    } catch (error) {
        console.error('Error fetching admission:', error);
        res.status(500).json({ message: 'Error fetching admission', error: error.message });
    }
});

/**
 * @route POST /api/inpatient/admissions
 * @description Create a new admission
 */
router.post('/admissions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, bedId, admissionDate, admittingDoctorId, admissionDiagnosis, admissionReason, expectedDischargeDate, notes, diagnoses } = req.body;

        // Generate admission number
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM admissions');
        const admissionNumber = `IP-${String(count[0].count + 1).padStart(6, '0')}`;

        // Insert admission
        const [result] = await connection.execute(
            `INSERT INTO admissions (admissionNumber, patientId, bedId, admissionDate, admittingDoctorId, admissionDiagnosis, admissionReason, expectedDischargeDate, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted')`,
            [admissionNumber, patientId, bedId, admissionDate || new Date(), admittingDoctorId, admissionDiagnosis || null, admissionReason || null, expectedDischargeDate || null, notes || null]
        );

        const admissionId = result.insertId;

        // Insert diagnoses if provided
        if (diagnoses && Array.isArray(diagnoses) && diagnoses.length > 0) {
            for (const diagnosis of diagnoses) {
                await connection.execute(
                    `INSERT INTO admission_diagnoses (admissionId, diagnosisCode, diagnosisDescription, diagnosisType)
                     VALUES (?, ?, ?, ?)`,
                    [admissionId, diagnosis.diagnosisCode || null, diagnosis.diagnosisDescription, diagnosis.diagnosisType || 'primary']
                );
            }
        }

        // Update bed status to occupied
        await connection.execute(
            'UPDATE beds SET status = ? WHERE bedId = ?',
            ['occupied', bedId]
        );

        await connection.commit();

        // Fetch created admission
        const [newAdmission] = await connection.execute(
            `SELECT a.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    w.wardName, w.wardType,
                    b.bedNumber, b.bedType
             FROM admissions a
             LEFT JOIN patients pt ON a.patientId = pt.patientId
             LEFT JOIN users u ON a.admittingDoctorId = u.userId
             LEFT JOIN beds b ON a.bedId = b.bedId
             LEFT JOIN wards w ON b.wardId = w.wardId
             WHERE a.admissionId = ?`,
            [admissionId]
        );

        res.status(201).json(newAdmission[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating admission:', error);
        res.status(500).json({ message: 'Error creating admission', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/inpatient/admissions/:id
 * @description Update an admission
 */
router.put('/admissions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { bedId, admissionDiagnosis, admissionReason, expectedDischargeDate, notes, status, diagnoses } = req.body;

        // Check if admission exists
        const [existing] = await connection.execute(
            'SELECT bedId, status FROM admissions WHERE admissionId = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Admission not found' });
        }

        const oldBedId = existing[0].bedId;
        const oldStatus = existing[0].status;

        // Build update query
        const updates = [];
        const values = [];

        if (bedId !== undefined && bedId !== oldBedId) {
            updates.push('bedId = ?');
            values.push(bedId);
        }

        if (admissionDiagnosis !== undefined) {
            updates.push('admissionDiagnosis = ?');
            values.push(admissionDiagnosis || null);
        }

        if (admissionReason !== undefined) {
            updates.push('admissionReason = ?');
            values.push(admissionReason || null);
        }

        if (expectedDischargeDate !== undefined) {
            updates.push('expectedDischargeDate = ?');
            values.push(expectedDischargeDate || null);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || null);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length > 0) {
            updates.push('updatedAt = NOW()');
            values.push(id);
            await connection.execute(
                `UPDATE admissions SET ${updates.join(', ')} WHERE admissionId = ?`,
                values
            );
        }

        // Update bed statuses if bed changed
        if (bedId !== undefined && bedId !== oldBedId) {
            // Free old bed
            await connection.execute(
                'UPDATE beds SET status = ? WHERE bedId = ?',
                ['available', oldBedId]
            );
            // Occupy new bed
            await connection.execute(
                'UPDATE beds SET status = ? WHERE bedId = ?',
                ['occupied', bedId]
            );
        }

        // Update diagnoses if provided
        if (diagnoses !== undefined) {
            // Delete existing diagnoses
            await connection.execute(
                'DELETE FROM admission_diagnoses WHERE admissionId = ?',
                [id]
            );

            // Insert new diagnoses
            if (Array.isArray(diagnoses) && diagnoses.length > 0) {
                for (const diagnosis of diagnoses) {
                    await connection.execute(
                        `INSERT INTO admission_diagnoses (admissionId, diagnosisCode, diagnosisDescription, diagnosisType)
                         VALUES (?, ?, ?, ?)`,
                        [id, diagnosis.diagnosisCode || null, diagnosis.diagnosisDescription, diagnosis.diagnosisType || 'primary']
                    );
                }
            }
        }

        await connection.commit();

        // Fetch updated admission
        const [updated] = await connection.execute(
            `SELECT a.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    w.wardName, w.wardType,
                    b.bedNumber, b.bedType
             FROM admissions a
             LEFT JOIN patients pt ON a.patientId = pt.patientId
             LEFT JOIN users u ON a.admittingDoctorId = u.userId
             LEFT JOIN beds b ON a.bedId = b.bedId
             LEFT JOIN wards w ON b.wardId = w.wardId
             WHERE a.admissionId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating admission:', error);
        res.status(500).json({ message: 'Error updating admission', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/inpatient/admissions/:id
 * @description Delete (cancel) an admission
 */
router.delete('/admissions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Get admission details
        const [admission] = await connection.execute(
            'SELECT bedId, status FROM admissions WHERE admissionId = ?',
            [id]
        );

        if (admission.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Admission not found' });
        }

        // Update admission status to cancelled
        await connection.execute(
            'UPDATE admissions SET status = ?, updatedAt = NOW() WHERE admissionId = ?',
            ['cancelled', id]
        );

        // Free the bed if admission was active
        if (admission[0].status === 'admitted') {
            await connection.execute(
                'UPDATE beds SET status = ? WHERE bedId = ?',
                ['available', admission[0].bedId]
            );
        }

        await connection.commit();

        res.status(200).json({ message: 'Admission cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling admission:', error);
        res.status(500).json({ message: 'Error cancelling admission', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/inpatient/beds
 * @description Get all beds
 */
router.get('/beds', async (req, res) => {
    try {
        const { wardId, status, page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT b.*, 
                   w.wardName, w.wardType,
                   a.admissionId, a.admissionNumber, a.admissionDate,
                   pt.firstName, pt.lastName, pt.patientNumber
            FROM beds b
            LEFT JOIN wards w ON b.wardId = w.wardId
            LEFT JOIN admissions a ON b.bedId = a.bedId AND a.status = 'admitted'
            LEFT JOIN patients pt ON a.patientId = pt.patientId
            WHERE b.isActive = 1
        `;
        const params = [];

        if (wardId) {
            query += ` AND b.wardId = ?`;
            params.push(wardId);
        }

        if (status) {
            query += ` AND b.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY w.wardName, b.bedNumber LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [beds] = await pool.execute(query, params);

        res.status(200).json(beds);
    } catch (error) {
        console.error('Error fetching beds:', error);
        res.status(500).json({ message: 'Error fetching beds', error: error.message });
    }
});

/**
 * @route GET /api/inpatient/beds/:id
 * @description Get a single bed
 */
router.get('/beds/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [beds] = await pool.execute(
            `SELECT b.*, 
                   w.wardName, w.wardType,
                   a.admissionId, a.admissionNumber, a.admissionDate,
                   pt.firstName, pt.lastName, pt.patientNumber
            FROM beds b
            LEFT JOIN wards w ON b.wardId = w.wardId
            LEFT JOIN admissions a ON b.bedId = a.bedId AND a.status = 'admitted'
            LEFT JOIN patients pt ON a.patientId = pt.patientId
            WHERE b.bedId = ? AND b.isActive = 1`,
            [id]
        );

        if (beds.length === 0) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        res.status(200).json(beds[0]);
    } catch (error) {
        console.error('Error fetching bed:', error);
        res.status(500).json({ message: 'Error fetching bed', error: error.message });
    }
});

/**
 * @route PUT /api/inpatient/beds/:id
 * @description Update a bed
 */
router.put('/beds/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { bedNumber, wardId, bedType, status, notes } = req.body;

        // Check if bed exists
        const [existing] = await pool.execute(
            'SELECT bedId, status FROM beds WHERE bedId = ? AND isActive = 1',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Check if bed is occupied and trying to change status to available
        if (existing[0].status === 'occupied' && status === 'available') {
            // Check if there's an active admission
            const [admission] = await pool.execute(
                'SELECT admissionId FROM admissions WHERE bedId = ? AND status = ?',
                [id, 'admitted']
            );
            if (admission.length > 0) {
                return res.status(400).json({ message: 'Cannot set bed to available while it has an active admission' });
            }
        }

        // Build update query
        const updates = [];
        const values = [];

        if (bedNumber !== undefined) {
            updates.push('bedNumber = ?');
            values.push(bedNumber);
        }

        if (wardId !== undefined) {
            updates.push('wardId = ?');
            values.push(wardId);
        }

        if (bedType !== undefined) {
            updates.push('bedType = ?');
            values.push(bedType);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updatedAt = NOW()');
        values.push(id);

        await pool.execute(
            `UPDATE beds SET ${updates.join(', ')} WHERE bedId = ?`,
            values
        );

        // Fetch updated bed
        const [updated] = await pool.execute(
            `SELECT b.*, 
                   w.wardName, w.wardType,
                   a.admissionId, a.admissionNumber, a.admissionDate,
                   pt.firstName, pt.lastName, pt.patientNumber
            FROM beds b
            LEFT JOIN wards w ON b.wardId = w.wardId
            LEFT JOIN admissions a ON b.bedId = a.bedId AND a.status = 'admitted'
            LEFT JOIN patients pt ON a.patientId = pt.patientId
            WHERE b.bedId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating bed:', error);
        res.status(500).json({ message: 'Error updating bed', error: error.message });
    }
});

/**
 * @route DELETE /api/inpatient/beds/:id
 * @description Delete (soft delete) a bed
 */
router.delete('/beds/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if bed exists
        const [existing] = await pool.execute(
            'SELECT bedId, status FROM beds WHERE bedId = ? AND isActive = 1',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Check if bed is occupied
        if (existing[0].status === 'occupied') {
            const [admission] = await pool.execute(
                'SELECT admissionId FROM admissions WHERE bedId = ? AND status = ?',
                [id, 'admitted']
            );
            if (admission.length > 0) {
                return res.status(400).json({ message: 'Cannot delete bed while it has an active admission' });
            }
        }

        // Soft delete the bed
        await pool.execute(
            'UPDATE beds SET isActive = 0, updatedAt = NOW() WHERE bedId = ?',
            [id]
        );

        res.status(200).json({ message: 'Bed deleted successfully', bedId: id });
    } catch (error) {
        console.error('Error deleting bed:', error);
        res.status(500).json({ message: 'Error deleting bed', error: error.message });
    }
});

/**
 * @route GET /api/inpatient/wards
 * @description Get all wards with patient counts
 */
router.get('/wards', async (req, res) => {
    try {
        const { wardType, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT w.*, 
                   COUNT(DISTINCT CASE WHEN a.status = 'admitted' THEN a.admissionId END) as admittedPatients,
                   COUNT(DISTINCT b.bedId) as totalBeds,
                   COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.bedId END) as occupiedBeds,
                   COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.bedId END) as availableBeds
            FROM wards w
            LEFT JOIN beds b ON w.wardId = b.wardId AND b.isActive = 1
            LEFT JOIN admissions a ON b.bedId = a.bedId
            WHERE w.isActive = 1
        `;
        const params = [];

        if (wardType) {
            query += ` AND w.wardType = ?`;
            params.push(wardType);
        }

        query += ` GROUP BY w.wardId ORDER BY w.wardName LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [wards] = await pool.execute(query, params);

        res.status(200).json(wards);
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ message: 'Error fetching wards', error: error.message });
    }
});

/**
 * @route GET /api/inpatient/wards/:id
 * @description Get a single ward
 */
router.get('/wards/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [wards] = await pool.execute(
            'SELECT * FROM wards WHERE wardId = ? AND isActive = 1',
            [id]
        );

        if (wards.length === 0) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        res.status(200).json(wards[0]);
    } catch (error) {
        console.error('Error fetching ward:', error);
        res.status(500).json({ message: 'Error fetching ward', error: error.message });
    }
});

/**
 * @route POST /api/inpatient/wards
 * @description Create a new ward
 */
router.post('/wards', async (req, res) => {
    try {
        const { wardCode, wardName, wardType, capacity, location, description } = req.body;

        if (!wardName || !capacity) {
            return res.status(400).json({ message: 'Ward name and capacity are required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO wards (wardCode, wardName, wardType, capacity, location, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                wardCode || null,
                wardName,
                wardType || null,
                capacity,
                location || null,
                description || null
            ]
        );

        const [newWard] = await pool.execute(
            'SELECT * FROM wards WHERE wardId = ?',
            [result.insertId]
        );

        res.status(201).json(newWard[0]);
    } catch (error) {
        console.error('Error creating ward:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ward code already exists' });
        }
        res.status(500).json({ message: 'Error creating ward', error: error.message });
    }
});

/**
 * @route PUT /api/inpatient/wards/:id
 * @description Update a ward
 */
router.put('/wards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { wardCode, wardName, wardType, capacity, location, description } = req.body;

        // Check if ward exists
        const [existing] = await pool.execute(
            'SELECT wardId FROM wards WHERE wardId = ? AND isActive = 1',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (wardCode !== undefined) {
            updates.push('wardCode = ?');
            values.push(wardCode || null);
        }

        if (wardName !== undefined) {
            updates.push('wardName = ?');
            values.push(wardName);
        }

        if (wardType !== undefined) {
            updates.push('wardType = ?');
            values.push(wardType || null);
        }

        if (capacity !== undefined) {
            updates.push('capacity = ?');
            values.push(capacity);
        }

        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location || null);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updatedAt = NOW()');
        values.push(id);

        await pool.execute(
            `UPDATE wards SET ${updates.join(', ')} WHERE wardId = ?`,
            values
        );

        // Fetch updated ward
        const [updated] = await pool.execute(
            'SELECT * FROM wards WHERE wardId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating ward:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ward code already exists' });
        }
        res.status(500).json({ message: 'Error updating ward', error: error.message });
    }
});

/**
 * @route DELETE /api/inpatient/wards/:id
 * @description Delete (soft delete) a ward
 */
router.delete('/wards/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ward exists
        const [existing] = await pool.execute(
            'SELECT wardId FROM wards WHERE wardId = ? AND isActive = 1',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        // Check if ward has active beds
        const [beds] = await pool.execute(
            'SELECT COUNT(*) as count FROM beds WHERE wardId = ? AND isActive = 1',
            [id]
        );

        if (beds[0].count > 0) {
            return res.status(400).json({ message: 'Cannot delete ward that has active beds' });
        }

        // Soft delete the ward
        await pool.execute(
            'UPDATE wards SET isActive = 0, updatedAt = NOW() WHERE wardId = ?',
            [id]
        );

        res.status(200).json({ message: 'Ward deleted successfully', wardId: id });
    } catch (error) {
        console.error('Error deleting ward:', error);
        res.status(500).json({ message: 'Error deleting ward', error: error.message });
    }
});

module.exports = router;

