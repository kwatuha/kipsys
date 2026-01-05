// Patient management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/patients
 * @description Get all patients
 */
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM patients 
            WHERE voided = 0
        `;
        const params = [];

        if (search) {
            query += ` AND (firstName LIKE ? OR lastName LIKE ? OR patientNumber LIKE ? OR phone LIKE ? OR email LIKE ? OR CONCAT(firstName, ' ', lastName) LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Error fetching patients', error: error.message });
    }
});

/**
 * @route GET /api/patients/:id
 * @description Get a single patient by ID
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM patients WHERE patientId = ? AND voided = 0',
            [id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ message: 'Error fetching patient', error: error.message });
    }
});

/**
 * @route POST /api/patients
 * @description Create a new patient
 */
router.post('/', async (req, res) => {
    const patientData = req.body;
    const userId = req.user?.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Generate patient number if not provided
        if (!patientData.patientNumber) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM patients');
            patientData.patientNumber = `P-${String(count[0].count + 1).padStart(6, '0')}`;
        }

        const [result] = await connection.execute(
            `INSERT INTO patients (
                patientNumber, firstName, lastName, middleName, dateOfBirth, gender,
                phone, email, address, county, subcounty, ward, idNumber, idType,
                nextOfKinName, nextOfKinPhone, nextOfKinRelationship,
                bloodGroup, allergies, medicalHistory, createdBy, voided
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                patientData.patientNumber || null,
                patientData.firstName,
                patientData.lastName,
                patientData.middleName || null,
                patientData.dateOfBirth || null,
                patientData.gender || null,
                patientData.phone || null,
                patientData.email || null,
                patientData.address || null,
                patientData.county || null,
                patientData.subcounty || null,
                patientData.ward || null,
                patientData.idNumber || null,
                patientData.idType || null,
                patientData.nextOfKinName || null,
                patientData.nextOfKinPhone || null,
                patientData.nextOfKinRelationship || null,
                patientData.bloodGroup || null,
                patientData.allergies || null,
                patientData.medicalHistory || null,
                userId || null
            ]
        );

        const patientId = result.insertId;

        // After patient registration, create invoice for registration fees, then create queue entry for cashier
        try {
            // Find or get registration fee service charge
            // Try to find by chargeCode 'REG-FEE' or name containing 'Registration'
            let [regFeeCharge] = await connection.execute(
                `SELECT chargeId, cost FROM service_charges 
                 WHERE (chargeCode = 'REG-FEE' OR name LIKE '%Registration%Fee%') 
                 AND status = 'Active' 
                 LIMIT 1`
            );

            let registrationFeeAmount = 500.00; // Default fee if not found
            let chargeId = null;

            if (regFeeCharge.length > 0) {
                chargeId = regFeeCharge[0].chargeId;
                registrationFeeAmount = parseFloat(regFeeCharge[0].cost);
            } else {
                // Create a default registration fee service charge if it doesn't exist
                const [newCharge] = await connection.execute(
                    `INSERT INTO service_charges (chargeCode, name, category, cost, description, status)
                     VALUES ('REG-FEE', 'Patient Registration Fee', 'Registration', ?, 'Patient registration fee', 'Active')`,
                    [registrationFeeAmount]
                );
                chargeId = newCharge.insertId;
            }

            // Generate invoice number
            const [invoiceCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM invoices WHERE DATE(createdAt) = CURDATE()'
            );
            const invoiceNum = invoiceCount[0].count + 1;
            const invoiceNumber = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(invoiceNum).padStart(4, '0')}`;

            // Create invoice for registration fee
            const [invoiceResult] = await connection.execute(
                `INSERT INTO invoices (invoiceNumber, patientId, invoiceDate, totalAmount, balance, status, notes, createdBy)
                 VALUES (?, ?, CURDATE(), ?, ?, 'pending', ?, ?)`,
                [
                    invoiceNumber,
                    patientId,
                    registrationFeeAmount,
                    registrationFeeAmount, // balance = totalAmount initially
                    'Registration fee payment',
                    userId || null
                ]
            );

            const invoiceId = invoiceResult.insertId;

            // Create invoice item
            await connection.execute(
                `INSERT INTO invoice_items (invoiceId, chargeId, description, quantity, unitPrice, totalPrice)
                 VALUES (?, ?, ?, 1, ?, ?)`,
                [
                    invoiceId,
                    chargeId,
                    'Patient Registration Fee',
                    registrationFeeAmount,
                    registrationFeeAmount
                ]
            );

            // Generate ticket number for cashier queue
            const [cashierCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "cashier"'
            );
            const cashierTicketNum = cashierCount[0].count + 1;
            const cashierTicketNumber = `C-${String(cashierTicketNum).padStart(3, '0')}`;

            // Create queue entry for cashier (registration fees payment)
            await connection.execute(
                `INSERT INTO queue_entries 
                (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                VALUES (?, ?, 'cashier', 'normal', 'waiting', ?, ?)`,
                [
                    patientId,
                    cashierTicketNumber,
                    'Registration fees payment',
                    userId || null
                ]
            );
        } catch (queueError) {
            // Log error but don't fail patient registration if queue/invoice creation fails
            console.error('Error creating invoice and cashier queue after patient registration:', queueError);
            // Rollback only the invoice/queue creation, but keep patient registration
            // We'll let the transaction continue since patient registration is the main operation
        }

        await connection.commit();

        const [newPatient] = await connection.execute(
            'SELECT * FROM patients WHERE patientId = ?',
            [patientId]
        );

        connection.release();
        res.status(201).json(newPatient[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating patient:', error);
        res.status(500).json({ message: 'Error creating patient', error: error.message });
    }
});

/**
 * @route PUT /api/patients/:id
 * @description Update a patient
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const patientData = req.body;

    try {
        const updates = [];
        const values = [];

        Object.keys(patientData).forEach(key => {
            // Prevent updating voided, patientId, createdAt, createdBy through this endpoint
            // voided should only be changed via DELETE endpoint
            if (patientData[key] !== undefined && 
                key !== 'patientId' && 
                key !== 'voided' && 
                key !== 'createdAt' && 
                key !== 'createdBy') {
                updates.push(`${key} = ?`);
                values.push(patientData[key]);
            }
        });
        
        // Ensure voided is always 0 on update
        updates.push('voided = 0');

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE patients SET ${updates.join(', ')}, updatedAt = NOW() WHERE patientId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM patients WHERE patientId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Error updating patient', error: error.message });
    }
});

/**
 * @route DELETE /api/patients/:id
 * @description Soft delete a patient (set voided = 1)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // Check if patient exists and is not already voided
        const [existing] = await pool.execute(
            'SELECT * FROM patients WHERE patientId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (existing[0].voided === 1) {
            return res.status(400).json({ message: 'Patient is already deleted' });
        }

        // Soft delete: set voided = 1
        await pool.execute(
            'UPDATE patients SET voided = 1, updatedAt = NOW() WHERE patientId = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Patient deleted successfully',
            patientId: id
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Error deleting patient', error: error.message });
    }
});

/**
 * @route GET /api/patients/:id/vitals
 * @description Get patient vital signs (optionally filtered by date)
 */
router.get('/:id/vitals', async (req, res) => {
    const { id } = req.params;
    const { date, today } = req.query;

    try {
        let query = `
            SELECT vs.*, 
                   u.firstName as recordedByFirstName, 
                   u.lastName as recordedByLastName
            FROM vital_signs vs
            LEFT JOIN users u ON vs.recordedBy = u.userId
            WHERE vs.patientId = ?
        `;
        const params = [id];

        if (today === 'true' || date) {
            if (today === 'true') {
                query += ` AND DATE(vs.recordedDate) = CURDATE()`;
            } else {
                query += ` AND DATE(vs.recordedDate) = ?`;
                params.push(date);
            }
        }

        query += ` ORDER BY vs.recordedDate DESC LIMIT 10`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient vitals:', error);
        res.status(500).json({ message: 'Error fetching patient vitals', error: error.message });
    }
});

module.exports = router;

