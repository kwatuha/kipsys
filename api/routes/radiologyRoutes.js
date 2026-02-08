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
                   u.firstName as doctorFirstName, u.lastName as doctorLastName,
                   ret.examName, ret.examCode, ret.category
            FROM radiology_exam_orders ro
            LEFT JOIN patients pt ON ro.patientId = pt.patientId
            LEFT JOIN users u ON ro.orderedBy = u.userId
            LEFT JOIN radiology_exam_types ret ON ro.examTypeId = ret.examTypeId
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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderNumber, patientId, orderedBy, examTypeId, orderDate, bodyPart, clinicalIndication, priority, status, scheduledDate, notes, admissionId } = req.body;

        // Get exam type details to include in clinical indication
        let examName = null;
        if (examTypeId) {
            const [examType] = await connection.execute(
                'SELECT examName, examCode FROM radiology_exam_types WHERE examTypeId = ?',
                [examTypeId]
            );
            if (examType.length > 0) {
                examName = examType[0].examName;
            }
        }

        // Build clinical indication: include exam name if provided, then append user's clinical indication
        let finalClinicalIndication = clinicalIndication || null;
        if (examName) {
            if (finalClinicalIndication && finalClinicalIndication.trim()) {
                // If clinical indication is provided, prepend exam name
                finalClinicalIndication = `${examName}: ${finalClinicalIndication.trim()}`;
            } else {
                // If no clinical indication, use exam name as default
                finalClinicalIndication = examName;
            }
        }

        // Generate order number if not provided
        let orderNum = orderNumber;
        if (!orderNum) {
            // Get the maximum order number to avoid duplicates
            const [maxResult] = await connection.execute(
                `SELECT MAX(CAST(SUBSTRING(orderNumber, 5) AS UNSIGNED)) as maxNum
                 FROM radiology_exam_orders
                 WHERE orderNumber LIKE 'RAD-%'`
            );

            let nextNum = (maxResult[0]?.maxNum || 0) + 1;
            orderNum = `RAD-${String(nextNum).padStart(6, '0')}`;
        }

        let result;
        let insertAttempts = 0;
        let finalOrderNum = orderNum;

        // Try to insert with retry logic for duplicate key errors
        while (insertAttempts < 100) {
            // First check if the number exists before trying to insert
            const [existing] = await connection.execute(
                'SELECT orderId FROM radiology_exam_orders WHERE orderNumber = ?',
                [finalOrderNum]
            );

            if (existing.length > 0) {
                // Number exists, extract current number and increment
                const currentNum = parseInt(finalOrderNum.substring(4)) || 0;
                const nextNum = currentNum + 1;
                finalOrderNum = `RAD-${String(nextNum).padStart(6, '0')}`;
                insertAttempts++;

                if (insertAttempts >= 100) {
                    await connection.rollback();
                    connection.release();
                    return res.status(500).json({
                        message: 'Failed to generate unique radiology order number',
                        error: 'Please try again.'
                    });
                }
                // Continue to check next number
                continue;
            }

            // Number doesn't exist, try to insert
            try {
                [result] = await connection.execute(
                    `INSERT INTO radiology_exam_orders (orderNumber, patientId, orderedBy, examTypeId, orderDate, bodyPart, clinicalIndication, priority, status, scheduledDate, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [finalOrderNum, patientId, orderedBy, examTypeId, orderDate || new Date(), bodyPart || null, finalClinicalIndication, priority || 'routine', status || 'pending', scheduledDate || null, notes || null]
                );
                // Success - break out of retry loop
                break;
            } catch (insertError) {
                // Check if it's a duplicate key error (race condition - another request inserted it)
                if (insertError.code === 'ER_DUP_ENTRY' || insertError.errno === 1062) {
                    // Extract current number and increment
                    const currentNum = parseInt(finalOrderNum.substring(4)) || 0;
                    const nextNum = currentNum + 1;
                    finalOrderNum = `RAD-${String(nextNum).padStart(6, '0')}`;
                    insertAttempts++;

                    if (insertAttempts >= 100) {
                        await connection.rollback();
                        connection.release();
                        return res.status(500).json({
                            message: 'Failed to generate unique radiology order number',
                            error: 'Please try again.'
                        });
                    }
                    // Continue to retry with new number
                } else {
                    // Not a duplicate key error - rethrow
                    await connection.rollback();
                    connection.release();
                    throw insertError;
                }
            }
        }

        const [newOrder] = await connection.execute(
            `SELECT ro.*,
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName,
                    ret.examName, ret.examCode, ret.category
             FROM radiology_exam_orders ro
             LEFT JOIN patients pt ON ro.patientId = pt.patientId
             LEFT JOIN users u ON ro.orderedBy = u.userId
             LEFT JOIN radiology_exam_types ret ON ro.examTypeId = ret.examTypeId
             WHERE ro.orderId = ?`,
            [result.insertId]
        );

        await connection.commit();
        connection.release();
        res.status(201).json(newOrder[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
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

        // Check if order exists and get current exam type
        const [existing] = await pool.execute(
            'SELECT examTypeId, clinicalIndication FROM radiology_exam_orders WHERE orderId = ?',
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

        // Handle clinical indication: ensure it includes exam name
        let finalClinicalIndication = clinicalIndication;
        if (clinicalIndication !== undefined) {
            // Determine which exam type to use (new one if being updated, otherwise current one)
            const targetExamTypeId = examTypeId !== undefined ? examTypeId : existing[0].examTypeId;

            // Get exam name
            const [examType] = await pool.execute(
                'SELECT examName FROM radiology_exam_types WHERE examTypeId = ?',
                [targetExamTypeId]
            );

            if (examType.length > 0 && examType[0].examName) {
                const examName = examType[0].examName;
                if (clinicalIndication && clinicalIndication.trim()) {
                    // Check if clinical indication already starts with exam name
                    if (clinicalIndication.trim().startsWith(examName + ':')) {
                        // Already has exam name, use as-is
                        finalClinicalIndication = clinicalIndication.trim();
                    } else {
                        // Prepend exam name
                        finalClinicalIndication = `${examName}: ${clinicalIndication.trim()}`;
                    }
                } else {
                    // No clinical indication provided, use exam name
                    finalClinicalIndication = examName;
                }
            } else {
                finalClinicalIndication = clinicalIndication || null;
            }

            updates.push('clinicalIndication = ?');
            values.push(finalClinicalIndication);
        } else if (examTypeId !== undefined && examTypeId !== existing[0].examTypeId) {
            // Exam type is being changed but clinical indication not provided
            // Update clinical indication to include new exam name
            const [examType] = await pool.execute(
                'SELECT examName FROM radiology_exam_types WHERE examTypeId = ?',
                [examTypeId]
            );
            if (examType.length > 0 && examType[0].examName) {
                const examName = examType[0].examName;
                const currentIndication = existing[0].clinicalIndication;
                // Extract the part after the colon if it exists
                if (currentIndication && currentIndication.includes(':')) {
                    const parts = currentIndication.split(':');
                    finalClinicalIndication = `${examName}: ${parts.slice(1).join(':').trim()}`;
                } else {
                    finalClinicalIndication = examName;
                }
                updates.push('clinicalIndication = ?');
                values.push(finalClinicalIndication);
            }
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
