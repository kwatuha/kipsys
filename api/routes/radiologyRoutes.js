// Radiology routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/radiology/exam-types
 * @description Get all radiology exam types
 */
router.get('/exam-types', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM radiology_exam_types WHERE 1=1';
        const params = [];

        if (search) {
            query += ` AND (examName LIKE ? OR examCode LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }

        query += ` ORDER BY examName LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching radiology exam types:', error);
        res.status(500).json({ message: 'Error fetching radiology exam types', error: error.message });
    }
});

/**
 * @route GET /api/radiology/exam-types/:id
 * @description Get a single radiology exam type
 */
router.get('/exam-types/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM radiology_exam_types WHERE examTypeId = ?',
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Radiology exam type not found' });
        }
    } catch (error) {
        console.error('Error fetching radiology exam type:', error);
        res.status(500).json({ message: 'Error fetching radiology exam type', error: error.message });
    }
});

/**
 * @route POST /api/radiology/exam-types
 * @description Create a new radiology exam type
 */
router.post('/exam-types', async (req, res) => {
    try {
        const examData = req.body;
        const [result] = await pool.execute(
            `INSERT INTO radiology_exam_types (examCode, examName, category, duration, cost, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                examData.examCode || null,
                examData.examName,
                examData.category || null,
                examData.duration || null,
                examData.cost || examData.unitPrice || null,
                examData.description || null
            ]
        );

        const [newExam] = await pool.execute(
            'SELECT * FROM radiology_exam_types WHERE examTypeId = ?',
            [result.insertId]
        );

        res.status(201).json(newExam[0]);
    } catch (error) {
        console.error('Error creating radiology exam type:', error);
        res.status(500).json({ message: 'Error creating radiology exam type', error: error.message });
    }
});

/**
 * @route PUT /api/radiology/exam-types/:id
 * @description Update a radiology exam type
 */
router.put('/exam-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const examData = req.body;
        
        // Check if exam type exists
        const [existing] = await pool.execute(
            'SELECT examTypeId FROM radiology_exam_types WHERE examTypeId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Radiology exam type not found' });
        }

        const updates = [];
        const values = [];

        if (examData.examCode !== undefined) { updates.push('examCode = ?'); values.push(examData.examCode || null); }
        if (examData.examName !== undefined) { updates.push('examName = ?'); values.push(examData.examName); }
        if (examData.category !== undefined) { updates.push('category = ?'); values.push(examData.category || null); }
        if (examData.duration !== undefined) { updates.push('duration = ?'); values.push(examData.duration || null); }
        if (examData.cost !== undefined) { updates.push('cost = ?'); values.push(examData.cost || null); }
        if (examData.unitPrice !== undefined) { updates.push('cost = ?'); values.push(examData.unitPrice || null); }
        if (examData.description !== undefined) { updates.push('description = ?'); values.push(examData.description || null); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE radiology_exam_types SET ${updates.join(', ')}, updatedAt = NOW() WHERE examTypeId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM radiology_exam_types WHERE examTypeId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating radiology exam type:', error);
        res.status(500).json({ message: 'Error updating radiology exam type', error: error.message });
    }
});

/**
 * @route DELETE /api/radiology/exam-types/:id
 * @description Delete a radiology exam type
 */
router.delete('/exam-types/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if exam type exists
        const [existing] = await pool.execute(
            'SELECT * FROM radiology_exam_types WHERE examTypeId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Radiology exam type not found' });
        }

        // Delete the exam type
        await pool.execute(
            'DELETE FROM radiology_exam_types WHERE examTypeId = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Radiology exam type deleted successfully',
            examTypeId: id
        });
    } catch (error) {
        console.error('Error deleting radiology exam type:', error);
        res.status(500).json({ message: 'Error deleting radiology exam type', error: error.message });
    }
});

/**
 * @route GET /api/radiology/orders
 * @description Get radiology exam orders
 */
router.get('/orders', async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ro.*, 
                   pt.firstName, pt.lastName, pt.patientNumber,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM radiology_exam_orders ro
            LEFT JOIN patients pt ON ro.patientId = pt.patientId
            LEFT JOIN users u ON ro.orderedBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            query += ` AND ro.patientId = ?`;
            params.push(patientId);
        }

        if (status) {
            query += ` AND ro.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY ro.orderDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching radiology orders:', error);
        res.status(500).json({ message: 'Error fetching radiology orders', error: error.message });
    }
});

/**
 * @route POST /api/radiology/orders
 * @description Create a new radiology exam order
 */
router.post('/orders', async (req, res) => {
    try {
        const { orderNumber, patientId, orderedBy, examTypeId, orderDate, bodyPart, clinicalIndication, priority, status, scheduledDate, notes } = req.body;

        // Generate order number if not provided
        let orderNum = orderNumber;
        if (!orderNum) {
            const [count] = await pool.execute('SELECT COUNT(*) as count FROM radiology_exam_orders');
            orderNum = `RAD-${String(count[0].count + 1).padStart(6, '0')}`;
        }

        const [result] = await pool.execute(
            `INSERT INTO radiology_exam_orders (orderNumber, patientId, orderedBy, examTypeId, orderDate, bodyPart, clinicalIndication, priority, status, scheduledDate, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderNum, patientId, orderedBy, examTypeId, orderDate || new Date(), bodyPart || null, clinicalIndication || null, priority || 'routine', status || 'pending', scheduledDate || null, notes || null]
        );

        const [newOrder] = await pool.execute(
            `SELECT ro.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM radiology_exam_orders ro
             LEFT JOIN patients pt ON ro.patientId = pt.patientId
             LEFT JOIN users u ON ro.orderedBy = u.userId
             WHERE ro.orderId = ?`,
            [result.insertId]
        );

        res.status(201).json(newOrder[0]);
    } catch (error) {
        console.error('Error creating radiology order:', error);
        res.status(500).json({ message: 'Error creating radiology order', error: error.message });
    }
});

/**
 * @route GET /api/radiology/orders/:id
 * @description Get a single radiology exam order with details
 */
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get order with patient and doctor info
        const [orders] = await pool.execute(
            `SELECT ro.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    ret.examCode, ret.examName, ret.category
             FROM radiology_exam_orders ro
             LEFT JOIN patients pt ON ro.patientId = pt.patientId
             LEFT JOIN users u ON ro.orderedBy = u.userId
             LEFT JOIN radiology_exam_types ret ON ro.examTypeId = ret.examTypeId
             WHERE ro.orderId = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Radiology order not found' });
        }

        res.status(200).json(orders[0]);
    } catch (error) {
        console.error('Error fetching radiology order:', error);
        res.status(500).json({ message: 'Error fetching radiology order', error: error.message });
    }
});

/**
 * @route PUT /api/radiology/orders/:id
 * @description Update a radiology exam order
 */
router.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, scheduledDate, notes, priority, clinicalIndication, bodyPart, examTypeId } = req.body;

        // Check if order exists
        const [existing] = await pool.execute(
            'SELECT orderId FROM radiology_exam_orders WHERE orderId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Radiology order not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }

        if (clinicalIndication !== undefined) {
            updates.push('clinicalIndication = ?');
            values.push(clinicalIndication || null);
        }

        if (bodyPart !== undefined) {
            updates.push('bodyPart = ?');
            values.push(bodyPart || null);
        }

        if (examTypeId !== undefined) {
            updates.push('examTypeId = ?');
            values.push(examTypeId);
        }

        if (scheduledDate !== undefined) {
            updates.push('scheduledDate = ?');
            values.push(scheduledDate || null);
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
            `UPDATE radiology_exam_orders SET ${updates.join(', ')} WHERE orderId = ?`,
            values
        );

        // Fetch updated order
        const [updated] = await pool.execute(
            `SELECT ro.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    ret.examCode, ret.examName, ret.category
             FROM radiology_exam_orders ro
             LEFT JOIN patients pt ON ro.patientId = pt.patientId
             LEFT JOIN users u ON ro.orderedBy = u.userId
             LEFT JOIN radiology_exam_types ret ON ro.examTypeId = ret.examTypeId
             WHERE ro.orderId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating radiology order:', error);
        res.status(500).json({ message: 'Error updating radiology order', error: error.message });
    }
});

module.exports = router;
