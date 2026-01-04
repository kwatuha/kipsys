// Triage management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/triage
 * @description Get all triage records
 */
router.get('/', async (req, res) => {
    try {
        const { priority, status, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.*, 
                   p.patientId, p.firstName, p.lastName, p.patientNumber,
                   u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                   vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                   vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
            FROM triage_assessments t
            LEFT JOIN patients p ON t.patientId = p.patientId
            LEFT JOIN users u ON t.triagedBy = u.userId
            LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
            WHERE 1=1
        `;
        const params = [];

        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }
        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        if (search) {
            query += ` AND (p.firstName LIKE ? OR p.lastName LIKE ? OR p.patientNumber LIKE ? OR t.chiefComplaint LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY t.createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching triage records:', error);
        res.status(500).json({ message: 'Error fetching triage records', error: error.message });
    }
});

/**
 * @route GET /api/triage/critical-vital-ranges
 * @description Get all critical vital sign range configurations
 */
router.get('/critical-vital-ranges', async (req, res) => {
    try {
        const query = `
            SELECT * FROM critical_vital_ranges
            WHERE isActive = 1
            ORDER BY vitalParameter
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching critical vital ranges:', error);
        res.status(500).json({ message: 'Error fetching critical vital ranges', error: error.message });
    }
});

/**
 * @route GET /api/triage/:id
 * @description Get a single triage record
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT t.*, 
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Triage record not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching triage record:', error);
        res.status(500).json({ message: 'Error fetching triage record', error: error.message });
    }
});

/**
 * @route POST /api/triage
 * @description Create a new triage record
 */
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            patientId, chiefComplaint, temperature, bloodPressure, heartRate, 
            respiratoryRate, oxygenSaturation, painLevel, priority, notes, triagedBy,
            assignedToDoctorId, assignedToDepartment, servicePoint
        } = req.body;

        // Validate required fields
        if (!patientId || !chiefComplaint) {
            await connection.rollback();
            return res.status(400).json({ message: 'Missing required fields: patientId, chiefComplaint' });
        }

        // triagedBy is required - use provided value or default to user 1 (system/admin)
        // In production, this should come from authenticated user session
        const triagedByUserId = triagedBy || req.user?.id || 1;

        // Parse blood pressure
        let systolicBP = null;
        let diastolicBP = null;
        if (bloodPressure && bloodPressure.includes('/')) {
            const bpParts = bloodPressure.split('/');
            systolicBP = parseInt(bpParts[0]);
            diastolicBP = parseInt(bpParts[1]);
        }

        // Map priority to triage category
        let triageCategory = 'green'; // Default to non-urgent
        let priorityLevel = 4;
        if (priority === 'Emergency') {
            triageCategory = 'red';
            priorityLevel = 1;
        } else if (priority === 'Urgent') {
            triageCategory = 'yellow';
            priorityLevel = 2;
        } else if (priority === 'Semi-urgent') {
            triageCategory = 'yellow';
            priorityLevel = 3;
        } else if (priority === 'Non-urgent') {
            triageCategory = 'green';
            priorityLevel = 4;
        }

        // Generate triage number
        const [count] = await connection.query(
            'SELECT COUNT(*) as count FROM triage_assessments WHERE DATE(triageDate) = CURDATE()'
        );
        const triageNumber = `TRI-${String(count[0].count + 1).padStart(6, '0')}`;

        // Insert triage assessment
        const [result] = await connection.query(
            `INSERT INTO triage_assessments (
                triageNumber, patientId, triageDate, chiefComplaint, triageCategory, 
                priorityLevel, status, notes, triagedBy, assignedToDoctorId, assignedToDepartment
            )
            VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [
                triageNumber,
                patientId,
                chiefComplaint,
                triageCategory,
                priorityLevel,
                notes || null,
                triagedByUserId,
                assignedToDoctorId || null,
                assignedToDepartment || null
            ]
        );

        const triageId = result.insertId;

        // Insert vital signs
        if (temperature || systolicBP || heartRate || respiratoryRate || oxygenSaturation || painLevel) {
            await connection.query(
                `INSERT INTO vital_signs (
                    patientId, recordedDate, systolicBP, diastolicBP, heartRate,
                    respiratoryRate, temperature, oxygenSaturation, painScore, 
                    context, triageId, recordedBy
                )
                VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'triage', ?, ?)`,
                [
                    patientId,
                    systolicBP,
                    diastolicBP,
                    heartRate ? parseInt(heartRate) : null,
                    respiratoryRate ? parseInt(respiratoryRate) : null,
                    temperature ? parseFloat(temperature) : null,
                    oxygenSaturation ? parseFloat(oxygenSaturation) : null,
                    painLevel ? parseInt(painLevel) : null,
                    triageId,
                    triagedByUserId
                ]
            );
        }

        // After triage completion, create queue entry for cashier (consultation fees payment)
        if (servicePoint) {
            // Determine queue priority based on triage category
            let queuePriority = 'normal';
            if (triageCategory === 'red') queuePriority = 'emergency';
            else if (triageCategory === 'yellow') queuePriority = 'urgent';

            // Generate ticket number for cashier queue
            const [cashierCount] = await connection.query(
                'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "cashier"'
            );
            const cashierTicketNum = cashierCount[0].count + 1;
            const cashierTicketNumber = `C-${String(cashierTicketNum).padStart(3, '0')}`;

            // Create queue entry for cashier (consultation fees payment)
            await connection.query(
                `INSERT INTO queue_entries 
                (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                VALUES (?, ?, 'cashier', ?, 'waiting', ?, ?)`,
                [
                    patientId,
                    cashierTicketNumber,
                    queuePriority,
                    `Consultation fees payment - Service: ${servicePoint}`,
                    triagedByUserId
                ]
            );
        }

        await connection.commit();

        // Fetch the created record
        const [newTriage] = await connection.query(
            `SELECT t.*, 
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [triageId]
        );

        res.status(201).json(newTriage[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating triage record:', error);
        res.status(500).json({ message: 'Error creating triage record', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/triage/:id
 * @description Update a triage record
 */
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { 
            chiefComplaint, temperature, bloodPressure, heartRate, 
            respiratoryRate, oxygenSaturation, painLevel, priority, status, notes 
        } = req.body;

        // Check if triage exists
        const [existing] = await connection.query(
            'SELECT * FROM triage_assessments WHERE triageId = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Triage record not found' });
        }

        // Parse blood pressure if provided
        let systolicBP = existing[0].systolicBP;
        let diastolicBP = existing[0].diastolicBP;
        if (bloodPressure && bloodPressure.includes('/')) {
            const bpParts = bloodPressure.split('/');
            systolicBP = parseInt(bpParts[0]);
            diastolicBP = parseInt(bpParts[1]);
        }

        // Build update query for triage_assessments
        const updates = [];
        const values = [];

        if (chiefComplaint !== undefined) {
            updates.push('chiefComplaint = ?');
            values.push(chiefComplaint);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || null);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        // Update vital signs if provided
        if (temperature !== undefined || bloodPressure !== undefined || heartRate !== undefined || 
            respiratoryRate !== undefined || oxygenSaturation !== undefined || painLevel !== undefined) {
            const [vitalExists] = await connection.query(
                'SELECT vitalSignId FROM vital_signs WHERE triageId = ?',
                [id]
            );

            if (vitalExists.length > 0) {
                // Update existing vital signs
                const vitalUpdates = [];
                const vitalValues = [];
                if (temperature !== undefined) {
                    vitalUpdates.push('temperature = ?');
                    vitalValues.push(temperature ? parseFloat(temperature) : null);
                }
                if (bloodPressure !== undefined) {
                    vitalUpdates.push('systolicBP = ?, diastolicBP = ?');
                    vitalValues.push(systolicBP, diastolicBP);
                }
                if (heartRate !== undefined) {
                    vitalUpdates.push('heartRate = ?');
                    vitalValues.push(heartRate ? parseInt(heartRate) : null);
                }
                if (respiratoryRate !== undefined) {
                    vitalUpdates.push('respiratoryRate = ?');
                    vitalValues.push(respiratoryRate ? parseInt(respiratoryRate) : null);
                }
                if (oxygenSaturation !== undefined) {
                    vitalUpdates.push('oxygenSaturation = ?');
                    vitalValues.push(oxygenSaturation ? parseFloat(oxygenSaturation) : null);
                }
                if (painLevel !== undefined) {
                    vitalUpdates.push('painScore = ?');
                    vitalValues.push(painLevel ? parseInt(painLevel) : null);
                }
                if (vitalUpdates.length > 0) {
                    vitalValues.push(id);
                    await connection.query(
                        `UPDATE vital_signs SET ${vitalUpdates.join(', ')} WHERE triageId = ?`,
                        vitalValues
                    );
                }
            } else {
                // Insert new vital signs
                await connection.query(
                    `INSERT INTO vital_signs (
                        patientId, recordedDate, systolicBP, diastolicBP, heartRate,
                        respiratoryRate, temperature, oxygenSaturation, painScore, 
                        context, triageId, recordedBy
                    )
                    VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'triage', ?, ?)`,
                    [
                        existing[0].patientId,
                        systolicBP,
                        diastolicBP,
                        heartRate ? parseInt(heartRate) : null,
                        respiratoryRate ? parseInt(respiratoryRate) : null,
                        temperature ? parseFloat(temperature) : null,
                        oxygenSaturation ? parseFloat(oxygenSaturation) : null,
                        painLevel ? parseInt(painLevel) : null,
                        id,
                        existing[0].triagedBy
                    ]
                );
            }
        }

        // Map priority to triage category if priority is being updated
        if (priority !== undefined) {
            let triageCategory = 'green';
            if (priority === 'Emergency') {
                triageCategory = 'red';
            } else if (priority === 'Urgent') {
                triageCategory = 'yellow';
            } else if (priority === 'Semi-urgent') {
                triageCategory = 'yellow';
            } else if (priority === 'Non-urgent') {
                triageCategory = 'green';
            }
            updates.push('triageCategory = ?');
            values.push(triageCategory);
            updates.push('priorityLevel = ?');
            values.push(priority === 'Emergency' ? 1 : priority === 'Urgent' ? 2 : priority === 'Semi-urgent' ? 3 : 4);
        }

        if (updates.length > 0) {
            values.push(id);
            await connection.query(
                `UPDATE triage_assessments SET ${updates.join(', ')} WHERE triageId = ?`,
                values
            );
        }

        await connection.commit();

        // Fetch updated record
        const [updated] = await connection.query(
            `SELECT t.*, 
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating triage record:', error);
        res.status(500).json({ message: 'Error updating triage record', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/triage/critical-vital-ranges
 * @description Get all critical vital sign range configurations
 */
router.get('/critical-vital-ranges', async (req, res) => {
    try {
        const query = `
            SELECT * FROM critical_vital_ranges
            WHERE isActive = 1
            ORDER BY vitalParameter
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching critical vital ranges:', error);
        res.status(500).json({ message: 'Error fetching critical vital ranges', error: error.message });
    }
});

/**
 * @route POST /api/triage/critical-vital-ranges
 * @description Add a new critical vital sign range
 */
router.post('/critical-vital-ranges', async (req, res) => {
    try {
        const { vitalParameter, unit, criticalLowValue, criticalHighValue, description } = req.body;
        
        if (!vitalParameter) {
            return res.status(400).json({ message: 'vitalParameter is required' });
        }

        if (criticalLowValue === null && criticalHighValue === null) {
            return res.status(400).json({ message: 'At least one of criticalLowValue or criticalHighValue must be provided' });
        }

        // Check if already exists
        const [existing] = await pool.execute(
            'SELECT criticalVitalId FROM critical_vital_ranges WHERE vitalParameter = ?',
            [vitalParameter]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Critical range for this vital parameter already exists' });
        }

        // Insert new critical vital range
        const [result] = await pool.execute(
            'INSERT INTO critical_vital_ranges (vitalParameter, unit, criticalLowValue, criticalHighValue, description, isActive) VALUES (?, ?, ?, ?, ?, 1)',
            [vitalParameter, unit || null, criticalLowValue || null, criticalHighValue || null, description || null]
        );

        // Fetch the created record
        const [newRange] = await pool.execute(
            'SELECT * FROM critical_vital_ranges WHERE criticalVitalId = ?',
            [result.insertId]
        );

        res.status(201).json(newRange[0]);
    } catch (error) {
        console.error('Error creating critical vital range:', error);
        res.status(500).json({ message: 'Error creating critical vital range', error: error.message });
    }
});

/**
 * @route PUT /api/triage/critical-vital-ranges/:id
 * @description Update a critical vital sign range
 */
router.put('/critical-vital-ranges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { vitalParameter, unit, criticalLowValue, criticalHighValue, description, isActive } = req.body;

        // Check if exists
        const [existing] = await pool.execute(
            'SELECT criticalVitalId FROM critical_vital_ranges WHERE criticalVitalId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Critical vital range not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (vitalParameter !== undefined) { updates.push('vitalParameter = ?'); values.push(vitalParameter); }
        if (unit !== undefined) { updates.push('unit = ?'); values.push(unit || null); }
        if (criticalLowValue !== undefined) { updates.push('criticalLowValue = ?'); values.push(criticalLowValue || null); }
        if (criticalHighValue !== undefined) { updates.push('criticalHighValue = ?'); values.push(criticalHighValue || null); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
        if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE critical_vital_ranges SET ${updates.join(', ')}, updatedAt = NOW() WHERE criticalVitalId = ?`,
            values
        );

        // Fetch updated record
        const [updated] = await pool.execute(
            'SELECT * FROM critical_vital_ranges WHERE criticalVitalId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating critical vital range:', error);
        res.status(500).json({ message: 'Error updating critical vital range', error: error.message });
    }
});

/**
 * @route DELETE /api/triage/critical-vital-ranges/:id
 * @description Delete a critical vital sign range
 */
router.delete('/critical-vital-ranges/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exists
        const [existing] = await pool.execute(
            'SELECT criticalVitalId FROM critical_vital_ranges WHERE criticalVitalId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Critical vital range not found' });
        }

        // Delete
        await pool.execute(
            'DELETE FROM critical_vital_ranges WHERE criticalVitalId = ?',
            [id]
        );

        res.status(200).json({ message: 'Critical vital range deleted successfully', criticalVitalId: id });
    } catch (error) {
        console.error('Error deleting critical vital range:', error);
        res.status(500).json({ message: 'Error deleting critical vital range', error: error.message });
    }
});


