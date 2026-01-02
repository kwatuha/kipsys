// Pharmacy routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/pharmacy/medications
 * @description Get all medications
 */
router.get('/medications', async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM medications WHERE voided = 0';
        const params = [];

        if (search) {
            query += ` AND (name LIKE ? OR genericName LIKE ? OR medicationCode LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ message: 'Error fetching medications', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/medications/:id
 * @description Get a single medication by ID
 */
router.get('/medications/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ? AND voided = 0',
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Medication not found' });
        }
    } catch (error) {
        console.error('Error fetching medication:', error);
        res.status(500).json({ message: 'Error fetching medication', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/medications
 * @description Create a new medication
 */
router.post('/medications', async (req, res) => {
    try {
        const medicationData = req.body;
        const [result] = await pool.execute(
            `INSERT INTO medications (medicationCode, name, genericName, dosageForm, strength, category, manufacturer, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                medicationData.medicationCode || null,
                medicationData.name || medicationData.medicationName || null,
                medicationData.genericName || null,
                medicationData.dosageForm || null,
                medicationData.strength || null,
                medicationData.category || null,
                medicationData.manufacturer || null,
                medicationData.description || null
            ]
        );

        const [newMedication] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [result.insertId]
        );

        res.status(201).json(newMedication[0]);
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ message: 'Error creating medication', error: error.message });
    }
});

/**
 * @route PUT /api/pharmacy/medications/:id
 * @description Update a medication
 */
router.put('/medications/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];
        const medicationData = req.body;

        // Map fields correctly (medicationName -> name)
        if (medicationData.name !== undefined) {
            updates.push('name = ?');
            values.push(medicationData.name);
        } else if (medicationData.medicationName !== undefined) {
            updates.push('name = ?');
            values.push(medicationData.medicationName);
        }

        if (medicationData.medicationCode !== undefined) {
            updates.push('medicationCode = ?');
            values.push(medicationData.medicationCode || null);
        }
        if (medicationData.genericName !== undefined) {
            updates.push('genericName = ?');
            values.push(medicationData.genericName || null);
        }
        if (medicationData.dosageForm !== undefined) {
            updates.push('dosageForm = ?');
            values.push(medicationData.dosageForm || null);
        }
        if (medicationData.strength !== undefined) {
            updates.push('strength = ?');
            values.push(medicationData.strength || null);
        }
        if (medicationData.category !== undefined) {
            updates.push('category = ?');
            values.push(medicationData.category || null);
        }
        if (medicationData.manufacturer !== undefined) {
            updates.push('manufacturer = ?');
            values.push(medicationData.manufacturer || null);
        }
        if (medicationData.description !== undefined) {
            updates.push('description = ?');
            values.push(medicationData.description || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);

        await pool.execute(
            `UPDATE medications SET ${updates.join(', ')}, updatedAt = NOW() WHERE medicationId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [req.params.id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating medication:', error);
        res.status(500).json({ message: 'Error updating medication', error: error.message });
    }
});

/**
 * @route DELETE /api/pharmacy/medications/:id
 * @description Soft delete a medication (set voided = 1)
 */
router.delete('/medications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if medication exists
        const [existing] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Medication not found' });
        }

        // Soft delete: set voided = 1
        await pool.execute(
            'UPDATE medications SET voided = 1, updatedAt = NOW() WHERE medicationId = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Medication deleted successfully',
            medicationId: id
        });
    } catch (error) {
        console.error('Error deleting medication:', error);
        res.status(500).json({ message: 'Error deleting medication', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions
 * @description Get all prescriptions
 */
router.get('/prescriptions', async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, 
                   pt.firstName, pt.lastName, pt.patientNumber,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM prescriptions p
            LEFT JOIN patients pt ON p.patientId = pt.patientId
            LEFT JOIN users u ON p.doctorId = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            query += ` AND p.patientId = ?`;
            params.push(patientId);
        }

        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY p.prescriptionDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions/:id
 * @description Get a prescription with items
 */
router.get('/prescriptions/:id', async (req, res) => {
    try {
        const [prescription] = await pool.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [req.params.id]
        );

        if (prescription.length === 0) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        const [items] = await pool.execute(
            `SELECT pi.*, m.medicationName, m.genericName
             FROM prescription_items pi
             LEFT JOIN medications m ON pi.medicationId = m.medicationId
             WHERE pi.prescriptionId = ?`,
            [req.params.id]
        );

        res.status(200).json({
            ...prescription[0],
            items
        });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ message: 'Error fetching prescription', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/prescriptions
 * @description Create a new prescription
 */
router.post('/prescriptions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { prescriptionNumber, patientId, doctorId, prescriptionDate, status, notes, items } = req.body;
        const userId = req.user?.id;

        // Generate prescription number if not provided
        let prescNumber = prescriptionNumber;
        if (!prescNumber) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM prescriptions');
            prescNumber = `PRES-${String(count[0].count + 1).padStart(6, '0')}`;
        }

        // Insert prescription
        const [result] = await connection.execute(
            `INSERT INTO prescriptions (prescriptionNumber, patientId, doctorId, prescriptionDate, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [prescNumber, patientId, doctorId, prescriptionDate || new Date(), status || 'pending', notes]
        );

        const prescriptionId = result.insertId;

        // Insert prescription items
        if (items && items.length > 0) {
            for (const item of items) {
                // Get medication name for storage
                let medicationName = 'Unknown';
                if (item.medicationId) {
                    try {
                        const [medRows] = await connection.execute(
                            'SELECT name FROM medications WHERE medicationId = ?',
                            [item.medicationId]
                        );
                        if (medRows.length > 0 && medRows[0].name) {
                            medicationName = medRows[0].name;
                        }
                    } catch (medError) {
                        console.error('Error fetching medication name:', medError);
                    }
                }
                
                // Ensure all required fields are present
                const medicationIdNum = item.medicationId ? (isNaN(parseInt(item.medicationId)) ? null : parseInt(item.medicationId)) : null;
                const quantityNum = item.quantity ? (isNaN(parseInt(item.quantity)) ? null : parseInt(item.quantity)) : null;
                
                const insertData = [
                    prescriptionId,
                    medicationIdNum,
                    medicationName,
                    item.dosage || '',
                    item.frequency || '',
                    item.duration || '',
                    quantityNum,
                    item.instructions || null
                ];
                
                await connection.execute(
                    `INSERT INTO prescription_items (prescriptionId, medicationId, medicationName, dosage, frequency, duration, quantity, instructions)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    insertData
                );
            }
        }

        await connection.commit();

        const [newPrescription] = await connection.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [prescriptionId]
        );

        res.status(201).json(newPrescription[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Error creating prescription', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/pharmacy/prescriptions/:id
 * @description Update a prescription
 */
router.put('/prescriptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Check if prescription exists
        const [existing] = await pool.execute(
            'SELECT prescriptionId FROM prescriptions WHERE prescriptionId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE prescriptions SET ${updates.join(', ')}, updatedAt = NOW() WHERE prescriptionId = ?`,
            values
        );

        // Get updated prescription with joined data
        const [updated] = await pool.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Error updating prescription', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/inventory
 * @description Get pharmacy inventory
 */
router.get('/inventory', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT pi.*, m.medicationName, m.medicationCode, m.genericName
             FROM pharmacy_inventory pi
             LEFT JOIN medications m ON pi.medicationId = m.medicationId
             ORDER BY m.medicationName`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching pharmacy inventory:', error);
        res.status(500).json({ message: 'Error fetching pharmacy inventory', error: error.message });
    }
});

module.exports = router;
