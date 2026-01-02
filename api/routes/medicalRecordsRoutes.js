// Medical Records routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/medical-records
 * @description Get all medical records
 */
router.get('/', async (req, res) => {
    try {
        const { search, patientId, doctorId, visitType, department, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                mr.*,
                p.patientNumber,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                CONCAT(p.firstName, ' ', p.lastName) as patientName,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                CONCAT(u.firstName, ' ', u.lastName) as doctorName
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patientId = p.patientId
            LEFT JOIN users u ON mr.doctorId = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (
                p.firstName LIKE ? OR 
                p.lastName LIKE ? OR 
                p.patientNumber LIKE ? OR
                mr.diagnosis LIKE ? OR
                mr.chiefComplaint LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (patientId) {
            query += ` AND mr.patientId = ?`;
            params.push(patientId);
        }

        if (doctorId) {
            query += ` AND mr.doctorId = ?`;
            params.push(doctorId);
        }

        if (visitType) {
            query += ` AND mr.visitType = ?`;
            params.push(visitType);
        }

        if (department) {
            query += ` AND mr.department = ?`;
            params.push(department);
        }

        query += ` ORDER BY mr.visitDate DESC, mr.createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ message: 'Error fetching medical records', error: error.message });
    }
});

/**
 * @route GET /api/medical-records/:id
 * @description Get a single medical record
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                mr.*,
                p.patientNumber,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                CONCAT(p.firstName, ' ', p.lastName) as patientName,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                CONCAT(u.firstName, ' ', u.lastName) as doctorName
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patientId = p.patientId
            LEFT JOIN users u ON mr.doctorId = u.userId
            WHERE mr.recordId = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Medical record not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ message: 'Error fetching medical record', error: error.message });
    }
});

/**
 * @route POST /api/medical-records
 * @description Create a new medical record
 */
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            patientId,
            visitDate,
            visitType = 'Outpatient',
            department,
            chiefComplaint,
            diagnosis,
            treatment,
            prescription,
            notes,
            doctorId,
            createdBy
        } = req.body;

        if (!patientId || !visitDate) {
            return res.status(400).json({ message: 'Patient ID and visit date are required' });
        }

        const [result] = await connection.execute(
            `INSERT INTO medical_records (
                patientId, visitDate, visitType, department, chiefComplaint,
                diagnosis, treatment, prescription, notes, doctorId, createdBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                visitDate,
                visitType || null,
                department || null,
                chiefComplaint || null,
                diagnosis || null,
                treatment || null,
                prescription || null,
                notes || null,
                doctorId || null,
                createdBy || null
            ]
        );

        const [newRecord] = await connection.execute(
            `SELECT 
                mr.*,
                p.patientNumber,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                CONCAT(p.firstName, ' ', p.lastName) as patientName,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                CONCAT(u.firstName, ' ', u.lastName) as doctorName
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patientId = p.patientId
            LEFT JOIN users u ON mr.doctorId = u.userId
            WHERE mr.recordId = ?`,
            [result.insertId]
        );

        await connection.commit();
        res.status(201).json(newRecord[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating medical record:', error);
        res.status(500).json({ message: 'Error creating medical record', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/medical-records/:id
 * @description Update a medical record
 */
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            patientId,
            visitDate,
            visitType,
            department,
            chiefComplaint,
            diagnosis,
            treatment,
            prescription,
            notes,
            doctorId
        } = req.body;

        // Check if record exists
        const [existing] = await connection.execute(
            'SELECT * FROM medical_records WHERE recordId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Medical record not found' });
        }

        await connection.execute(
            `UPDATE medical_records SET
                patientId = ?,
                visitDate = ?,
                visitType = ?,
                department = ?,
                chiefComplaint = ?,
                diagnosis = ?,
                treatment = ?,
                prescription = ?,
                notes = ?,
                doctorId = ?
            WHERE recordId = ?`,
            [
                patientId !== undefined ? patientId : existing[0].patientId,
                visitDate !== undefined ? visitDate : existing[0].visitDate,
                visitType !== undefined ? visitType : existing[0].visitType,
                department !== undefined ? department : existing[0].department,
                chiefComplaint !== undefined ? chiefComplaint : existing[0].chiefComplaint,
                diagnosis !== undefined ? diagnosis : existing[0].diagnosis,
                treatment !== undefined ? treatment : existing[0].treatment,
                prescription !== undefined ? prescription : existing[0].prescription,
                notes !== undefined ? notes : existing[0].notes,
                doctorId !== undefined ? doctorId : existing[0].doctorId,
                req.params.id
            ]
        );

        const [updatedRecord] = await connection.execute(
            `SELECT 
                mr.*,
                p.patientNumber,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                CONCAT(p.firstName, ' ', p.lastName) as patientName,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                CONCAT(u.firstName, ' ', u.lastName) as doctorName
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patientId = p.patientId
            LEFT JOIN users u ON mr.doctorId = u.userId
            WHERE mr.recordId = ?`,
            [req.params.id]
        );

        await connection.commit();
        res.status(200).json(updatedRecord[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating medical record:', error);
        res.status(500).json({ message: 'Error updating medical record', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/medical-records/:id
 * @description Delete a medical record (soft delete by setting a flag or hard delete)
 */
router.delete('/:id', async (req, res) => {
    try {
        // Check if record exists
        const [existing] = await pool.execute(
            'SELECT * FROM medical_records WHERE recordId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Medical record not found' });
        }

        // Hard delete (medical records are typically kept for legal reasons, but we'll allow deletion)
        await pool.execute(
            'DELETE FROM medical_records WHERE recordId = ?',
            [req.params.id]
        );

        res.status(200).json({ message: 'Medical record deleted successfully' });
    } catch (error) {
        console.error('Error deleting medical record:', error);
        res.status(500).json({ message: 'Error deleting medical record', error: error.message });
    }
});

module.exports = router;

