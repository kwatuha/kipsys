// Procedures routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/procedures
 * @description Get all procedures (optionally filtered)
 */
router.get('/', async (req, res) => {
    try {
        const { search, category, isActive, chargeId } = req.query;
        let query = `
            SELECT 
                p.*,
                sc.chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                sc.chargeType, sc.status as chargeStatus
            FROM procedures p
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (p.procedureName LIKE ? OR p.procedureCode LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (category) {
            query += ' AND p.category = ?';
            params.push(category);
        }

        if (isActive !== undefined) {
            query += ' AND p.isActive = ?';
            params.push(isActive === 'true' ? 1 : 0);
        } else {
            // Default: show only active procedures
            query += ' AND p.isActive = 1';
        }

        if (chargeId) {
            query += ' AND p.chargeId = ?';
            params.push(chargeId);
        }

        query += ' ORDER BY p.procedureName ASC';

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching procedures:', error);
        res.status(500).json({ message: 'Error fetching procedures', error: error.message });
    }
});

/**
 * @route GET /api/procedures/:id
 * @description Get a single procedure by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `SELECT 
                p.*,
                sc.chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                sc.chargeType, sc.status as chargeStatus
            FROM procedures p
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            WHERE p.procedureId = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Procedure not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching procedure:', error);
        res.status(500).json({ message: 'Error fetching procedure', error: error.message });
    }
});

/**
 * @route POST /api/procedures
 * @description Create a new procedure
 */
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { procedureCode, procedureName, category, description, duration, cost, chargeId, isActive = true } = req.body;

        if (!procedureName) {
            return res.status(400).json({ error: 'Procedure name is required' });
        }

        // Generate procedure code if not provided
        let finalProcedureCode = procedureCode;
        if (!finalProcedureCode) {
            const codeParts = procedureName.toUpperCase().split(' ').slice(0, 2).map(part => part.substring(0, 3));
            finalProcedureCode = codeParts.join('-');

            // Ensure uniqueness
            let counter = 1;
            let [existing] = await connection.execute('SELECT procedureId FROM procedures WHERE procedureCode = ?', [finalProcedureCode]);
            while (existing.length > 0) {
                finalProcedureCode = `${codeParts.join('-')}-${counter}`;
                [existing] = await connection.execute('SELECT procedureId FROM procedures WHERE procedureCode = ?', [finalProcedureCode]);
                counter++;
            }
        } else {
            // Check if code already exists
            const [existing] = await connection.execute('SELECT procedureId FROM procedures WHERE procedureCode = ?', [finalProcedureCode]);
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Procedure code already exists' });
            }
        }

        // If chargeId is provided, verify it exists and has chargeType='Procedure'
        if (chargeId) {
            const [chargeCheck] = await connection.execute(
                'SELECT chargeId, chargeType FROM service_charges WHERE chargeId = ?',
                [chargeId]
            );
            if (chargeCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Service charge not found' });
            }
            // Optionally check if chargeType is Procedure (but allow linking to any charge)
        }

        const [result] = await connection.execute(
            `INSERT INTO procedures (procedureCode, procedureName, category, description, duration, cost, chargeId, isActive)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalProcedureCode,
                procedureName,
                category || null,
                description || null,
                duration || null,
                cost || null,
                chargeId || null,
                isActive ? 1 : 0
            ]
        );

        const [newProcedure] = await connection.execute(
            `SELECT 
                p.*,
                sc.chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                sc.chargeType, sc.status as chargeStatus
            FROM procedures p
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            WHERE p.procedureId = ?`,
            [result.insertId]
        );

        await connection.commit();
        res.status(201).json(newProcedure[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating procedure:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Procedure code already exists' });
        }
        res.status(500).json({ message: 'Error creating procedure', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/procedures/:id
 * @description Update a procedure
 */
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { procedureCode, procedureName, category, description, duration, cost, chargeId, isActive } = req.body;

        // Check if procedure exists
        const [existing] = await connection.execute('SELECT procedureId FROM procedures WHERE procedureId = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Procedure not found' });
        }

        // Check for duplicate procedure code if it's being changed
        if (procedureCode) {
            const [duplicate] = await connection.execute(
                'SELECT procedureId FROM procedures WHERE procedureCode = ? AND procedureId != ?',
                [procedureCode, id]
            );
            if (duplicate.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Procedure code already exists' });
            }
        }

        // Verify chargeId if provided
        if (chargeId !== undefined && chargeId !== null) {
            const [chargeCheck] = await connection.execute(
                'SELECT chargeId FROM service_charges WHERE chargeId = ?',
                [chargeId]
            );
            if (chargeCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Service charge not found' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (procedureCode !== undefined) { updates.push('procedureCode = ?'); values.push(procedureCode); }
        if (procedureName !== undefined) { updates.push('procedureName = ?'); values.push(procedureName); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
        if (cost !== undefined) { updates.push('cost = ?'); values.push(cost); }
        if (chargeId !== undefined) { updates.push('chargeId = ?'); values.push(chargeId); }
        if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive ? 1 : 0); }

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await connection.execute(
            `UPDATE procedures SET ${updates.join(', ')}, updatedAt = NOW() WHERE procedureId = ?`,
            values
        );

        const [updated] = await connection.execute(
            `SELECT 
                p.*,
                sc.chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                sc.chargeType, sc.status as chargeStatus
            FROM procedures p
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            WHERE p.procedureId = ?`,
            [id]
        );

        await connection.commit();
        res.status(200).json(updated[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating procedure:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Procedure code already exists' });
        }
        res.status(500).json({ message: 'Error updating procedure', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/procedures/:id
 * @description Delete (deactivate) a procedure
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if procedure is used in patient_procedures
        const [used] = await pool.execute(
            'SELECT COUNT(*) as count FROM patient_procedures WHERE procedureId = ?',
            [id]
        );

        if (used[0].count > 0) {
            // Soft delete by setting isActive to false
            await pool.execute(
                'UPDATE procedures SET isActive = 0, updatedAt = NOW() WHERE procedureId = ?',
                [id]
            );
            return res.status(200).json({ message: 'Procedure deactivated (used in patient records)' });
        }

        // Hard delete if not used
        const [result] = await pool.execute('DELETE FROM procedures WHERE procedureId = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Procedure not found' });
        }

        res.status(200).json({ message: 'Procedure deleted successfully' });
    } catch (error) {
        console.error('Error deleting procedure:', error);
        res.status(500).json({ message: 'Error deleting procedure', error: error.message });
    }
});

/**
 * @route GET /api/patient-procedures
 * @description Get patient procedures (optionally filtered by patient and date)
 */
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { date, procedureId } = req.query;

        let query = `
            SELECT 
                pp.*,
                p.procedureCode, p.procedureName, p.category, p.description, p.duration, p.cost,
                p.chargeId,
                sc.chargeCode as chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                u.firstName as performedByFirstName, u.lastName as performedByLastName
            FROM patient_procedures pp
            LEFT JOIN procedures p ON pp.procedureId = p.procedureId
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            LEFT JOIN users u ON pp.performedBy = u.userId
            WHERE pp.patientId = ?
        `;
        const params = [patientId];

        if (date) {
            query += ' AND pp.procedureDate = ?';
            params.push(date);
        }

        if (procedureId) {
            query += ' AND pp.procedureId = ?';
            params.push(procedureId);
        }

        query += ' ORDER BY pp.procedureDate DESC, pp.createdAt DESC';

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient procedures:', error);
        res.status(500).json({ message: 'Error fetching patient procedures', error: error.message });
    }
});

/**
 * @route POST /api/patient-procedures
 * @description Record a procedure performed on a patient
 */
router.post('/patient', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, procedureId, procedureCode, procedureName, procedureDate, performedBy, notes, complications } = req.body;
        const userId = req.user?.id;

        if (!patientId || !procedureDate) {
            await connection.rollback();
            return res.status(400).json({ error: 'Patient ID and procedure date are required' });
        }

        // If procedureId is provided, get procedure details
        let finalProcedureCode = procedureCode;
        let finalProcedureName = procedureName;

        if (procedureId) {
            const [procedure] = await connection.execute(
                'SELECT procedureCode, procedureName FROM procedures WHERE procedureId = ?',
                [procedureId]
            );
            if (procedure.length > 0) {
                finalProcedureCode = finalProcedureCode || procedure[0].procedureCode;
                finalProcedureName = finalProcedureName || procedure[0].procedureName;
            }
        }

        if (!finalProcedureName) {
            await connection.rollback();
            return res.status(400).json({ error: 'Procedure name is required' });
        }

        const [result] = await connection.execute(
            `INSERT INTO patient_procedures 
            (patientId, procedureId, procedureCode, procedureName, procedureDate, performedBy, notes, complications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                procedureId || null,
                finalProcedureCode || null,
                finalProcedureName,
                procedureDate,
                performedBy || userId || null,
                notes || null,
                complications || null
            ]
        );

        const [newPatientProcedure] = await connection.execute(
            `SELECT 
                pp.*,
                p.procedureCode, p.procedureName, p.category, p.description, p.duration, p.cost,
                p.chargeId,
                sc.chargeCode as chargeCode, sc.name as chargeName, sc.cost as chargeCost,
                u.firstName as performedByFirstName, u.lastName as performedByLastName
            FROM patient_procedures pp
            LEFT JOIN procedures p ON pp.procedureId = p.procedureId
            LEFT JOIN service_charges sc ON p.chargeId = sc.chargeId
            LEFT JOIN users u ON pp.performedBy = u.userId
            WHERE pp.patientProcedureId = ?`,
            [result.insertId]
        );

        await connection.commit();
        res.status(201).json(newPatientProcedure[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating patient procedure:', error);
        res.status(500).json({ message: 'Error creating patient procedure', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;







