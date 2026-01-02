// Laboratory routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/laboratory/test-types
 * @description Get all lab test types
 */
router.get('/test-types', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM lab_test_types WHERE isActive = 1';
        const params = [];

        if (search) {
            query += ` AND (testName LIKE ? OR testCode LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }

        query += ` ORDER BY testName LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching lab test types:', error);
        res.status(500).json({ message: 'Error fetching lab test types', error: error.message });
    }
});

/**
 * @route GET /api/laboratory/test-types/:id
 * @description Get a single lab test type
 */
router.get('/test-types/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM lab_test_types WHERE testTypeId = ?',
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Lab test type not found' });
        }
    } catch (error) {
        console.error('Error fetching lab test type:', error);
        res.status(500).json({ message: 'Error fetching lab test type', error: error.message });
    }
});

/**
 * @route POST /api/laboratory/test-types
 * @description Create a new lab test type
 */
router.post('/test-types', async (req, res) => {
    try {
        const testData = req.body;
        const [result] = await pool.execute(
            `INSERT INTO lab_test_types (testCode, testName, category, specimenType, turnaroundTime, cost, description, normalRange, preparationInstructions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                testData.testCode || null,
                testData.testName,
                testData.category || null,
                testData.specimenType || null,
                testData.turnaroundTime || null,
                testData.cost || testData.unitPrice || null,
                testData.description || null,
                testData.normalRange || null,
                testData.preparationInstructions || null
            ]
        );

        const [newTest] = await pool.execute(
            'SELECT * FROM lab_test_types WHERE testTypeId = ?',
            [result.insertId]
        );

        res.status(201).json(newTest[0]);
    } catch (error) {
        console.error('Error creating lab test type:', error);
        res.status(500).json({ message: 'Error creating lab test type', error: error.message });
    }
});

/**
 * @route PUT /api/laboratory/test-types/:id
 * @description Update a lab test type
 */
router.put('/test-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const testData = req.body;
        
        // Check if test type exists
        const [existing] = await pool.execute(
            'SELECT testTypeId FROM lab_test_types WHERE testTypeId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Lab test type not found' });
        }

        const updates = [];
        const values = [];

        if (testData.testCode !== undefined) { updates.push('testCode = ?'); values.push(testData.testCode || null); }
        if (testData.testName !== undefined) { updates.push('testName = ?'); values.push(testData.testName); }
        if (testData.category !== undefined) { updates.push('category = ?'); values.push(testData.category || null); }
        if (testData.specimenType !== undefined) { updates.push('specimenType = ?'); values.push(testData.specimenType || null); }
        if (testData.turnaroundTime !== undefined) { updates.push('turnaroundTime = ?'); values.push(testData.turnaroundTime || null); }
        if (testData.cost !== undefined) { updates.push('cost = ?'); values.push(testData.cost || null); }
        if (testData.unitPrice !== undefined) { updates.push('cost = ?'); values.push(testData.unitPrice || null); }
        if (testData.description !== undefined) { updates.push('description = ?'); values.push(testData.description || null); }
        if (testData.normalRange !== undefined) { updates.push('normalRange = ?'); values.push(testData.normalRange || null); }
        if (testData.preparationInstructions !== undefined) { updates.push('preparationInstructions = ?'); values.push(testData.preparationInstructions || null); }
        if (testData.isActive !== undefined) { updates.push('isActive = ?'); values.push(testData.isActive); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE lab_test_types SET ${updates.join(', ')}, updatedAt = NOW() WHERE testTypeId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM lab_test_types WHERE testTypeId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating lab test type:', error);
        res.status(500).json({ message: 'Error updating lab test type', error: error.message });
    }
});

/**
 * @route DELETE /api/laboratory/test-types/:id
 * @description Soft delete a lab test type (set isActive = 0)
 */
router.delete('/test-types/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if test type exists
        const [existing] = await pool.execute(
            'SELECT * FROM lab_test_types WHERE testTypeId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Lab test type not found' });
        }

        // Soft delete: set isActive = 0
        await pool.execute(
            'UPDATE lab_test_types SET isActive = 0, updatedAt = NOW() WHERE testTypeId = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Lab test type deleted successfully',
            testTypeId: id
        });
    } catch (error) {
        console.error('Error deleting lab test type:', error);
        res.status(500).json({ message: 'Error deleting lab test type', error: error.message });
    }
});

/**
 * @route GET /api/laboratory/orders
 * @description Get lab test orders
 */
router.get('/orders', async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT lo.*, 
                   pt.firstName, pt.lastName, pt.patientNumber,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM lab_test_orders lo
            LEFT JOIN patients pt ON lo.patientId = pt.patientId
            LEFT JOIN users u ON lo.orderedBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            query += ` AND lo.patientId = ?`;
            params.push(patientId);
        }

        if (status) {
            query += ` AND lo.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY lo.orderDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching lab orders:', error);
        res.status(500).json({ message: 'Error fetching lab orders', error: error.message });
    }
});

/**
 * @route POST /api/laboratory/orders
 * @description Create a new lab test order
 */
router.post('/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderNumber, patientId, orderedBy, orderDate, priority, status, clinicalNotes, clinicalIndication, items } = req.body;

        // Generate order number if not provided
        let orderNum = orderNumber;
        if (!orderNum) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM lab_test_orders');
            orderNum = `LAB-${String(count[0].count + 1).padStart(6, '0')}`;
        }

        // Use clinicalIndication if provided, otherwise use clinicalNotes (for backwards compatibility)
        const clinicalInfo = clinicalIndication || clinicalNotes || null;

        // Insert order
        const [result] = await connection.execute(
            `INSERT INTO lab_test_orders (orderNumber, patientId, orderedBy, orderDate, priority, status, clinicalIndication)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderNum, patientId, orderedBy, orderDate || new Date(), priority || 'routine', status || 'pending', clinicalInfo]
        );

        const orderId = result.insertId;

        // Insert order items
        if (items && items.length > 0) {
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO lab_test_order_items (orderId, testTypeId, notes)
                     VALUES (?, ?, ?)`,
                    [orderId, item.testTypeId, (item.notes || item.instructions || null)]
                );
            }
        }

        await connection.commit();

        const [newOrder] = await connection.execute(
            `SELECT lo.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM lab_test_orders lo
             LEFT JOIN patients pt ON lo.patientId = pt.patientId
             LEFT JOIN users u ON lo.orderedBy = u.userId
             WHERE lo.orderId = ?`,
            [orderId]
        );

        res.status(201).json(newOrder[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating lab order:', error);
        res.status(500).json({ message: 'Error creating lab order', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/laboratory/orders/:id
 * @description Get a single lab test order with details
 */
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get order with patient and doctor info
        const [orders] = await pool.execute(
            `SELECT lo.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM lab_test_orders lo
             LEFT JOIN patients pt ON lo.patientId = pt.patientId
             LEFT JOIN users u ON lo.orderedBy = u.userId
             WHERE lo.orderId = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Lab order not found' });
        }

        // Get order items with test type info
        const [items] = await pool.execute(
            `SELECT loi.*, ltt.testCode, ltt.testName, ltt.category
             FROM lab_test_order_items loi
             LEFT JOIN lab_test_types ltt ON loi.testTypeId = ltt.testTypeId
             WHERE loi.orderId = ?
             ORDER BY loi.itemId`,
            [id]
        );

        const order = orders[0];
        order.items = items;

        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching lab order:', error);
        res.status(500).json({ message: 'Error fetching lab order', error: error.message });
    }
});

/**
 * @route PUT /api/laboratory/orders/:id
 * @description Update a lab test order
 */
router.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, sampleCollectionDate, expectedCompletionDate, notes, priority, clinicalIndication } = req.body;

        // Check if order exists
        const [existing] = await pool.execute(
            'SELECT orderId FROM lab_test_orders WHERE orderId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Lab order not found' });
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

        if (sampleCollectionDate !== undefined) {
            updates.push('sampleCollectionDate = ?');
            values.push(sampleCollectionDate || null);
        }

        if (expectedCompletionDate !== undefined) {
            updates.push('expectedCompletionDate = ?');
            values.push(expectedCompletionDate || null);
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
            `UPDATE lab_test_orders SET ${updates.join(', ')} WHERE orderId = ?`,
            values
        );

        // Fetch updated order
        const [updated] = await pool.execute(
            `SELECT lo.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM lab_test_orders lo
             LEFT JOIN patients pt ON lo.patientId = pt.patientId
             LEFT JOIN users u ON lo.orderedBy = u.userId
             WHERE lo.orderId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating lab order:', error);
        res.status(500).json({ message: 'Error updating lab order', error: error.message });
    }
});

/**
 * @route GET /api/laboratory/orders/:id/results
 * @description Get results for a lab test order
 */
router.get('/orders/:id/results', async (req, res) => {
    try {
        const { id } = req.params;

        // Get order items
        const [items] = await pool.execute(
            `SELECT loi.*, ltt.testCode, ltt.testName, ltt.category
             FROM lab_test_order_items loi
             LEFT JOIN lab_test_types ltt ON loi.testTypeId = ltt.testTypeId
             WHERE loi.orderId = ?
             ORDER BY loi.itemId`,
            [id]
        );

        // Get results for each item
        for (const item of items) {
            const [results] = await pool.execute(
                `SELECT ltr.*, 
                        u1.firstName as performedByFirstName, u1.lastName as performedByLastName,
                        u2.firstName as verifiedByFirstName, u2.lastName as verifiedByLastName
                 FROM lab_test_results ltr
                 LEFT JOIN users u1 ON ltr.performedBy = u1.userId
                 LEFT JOIN users u2 ON ltr.verifiedBy = u2.userId
                 WHERE ltr.orderItemId = ?
                 ORDER BY ltr.createdAt DESC
                 LIMIT 1`,
                [item.itemId]
            );

            if (results.length > 0) {
                const result = results[0];
                // Get result values
                const [values] = await pool.execute(
                    `SELECT * FROM lab_result_values WHERE resultId = ? ORDER BY valueId`,
                    [result.resultId]
                );
                result.values = values;
                item.result = result;
            }
        }

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching lab results:', error);
        res.status(500).json({ message: 'Error fetching lab results', error: error.message });
    }
});

/**
 * @route POST /api/laboratory/orders/:id/results
 * @description Add results for a lab test order item
 */
router.post('/orders/:id/results', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { orderItemId, testDate, notes, values, performedBy } = req.body;

        // Check if order item exists
        const [itemCheck] = await connection.execute(
            'SELECT itemId, orderId FROM lab_test_order_items WHERE itemId = ? AND orderId = ?',
            [orderItemId, id]
        );

        if (itemCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order item not found' });
        }

        // Create result
        const [resultInsert] = await connection.execute(
            `INSERT INTO lab_test_results (orderItemId, testDate, status, notes, performedBy)
             VALUES (?, ?, 'pending', ?, ?)`,
            [orderItemId, testDate || new Date(), notes || null, performedBy || null]
        );

        const resultId = resultInsert.insertId;

        // Add result values if provided
        if (values && Array.isArray(values) && values.length > 0) {
            for (const value of values) {
                await connection.execute(
                    `INSERT INTO lab_result_values (resultId, parameterName, value, unit, normalRange, flag, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        resultId,
                        value.parameterName,
                        value.value || null,
                        value.unit || null,
                        value.normalRange || null,
                        value.flag || 'normal',
                        value.notes || null
                    ]
                );
            }
        }

        // Update order item status to completed
        await connection.execute(
            'UPDATE lab_test_order_items SET status = ? WHERE itemId = ?',
            ['completed', orderItemId]
        );

        await connection.commit();

        // Fetch created result with values
        const [result] = await connection.execute(
            `SELECT ltr.*, 
                    u1.firstName as performedByFirstName, u1.lastName as performedByLastName
             FROM lab_test_results ltr
             LEFT JOIN users u1 ON ltr.performedBy = u1.userId
             WHERE ltr.resultId = ?`,
            [resultId]
        );

        const [resultValues] = await connection.execute(
            `SELECT * FROM lab_result_values WHERE resultId = ? ORDER BY valueId`,
            [resultId]
        );

        result[0].values = resultValues;

        res.status(201).json(result[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating lab result:', error);
        res.status(500).json({ message: 'Error creating lab result', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/laboratory/results/:resultId
 * @description Update a lab test result
 */
router.put('/results/:resultId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { resultId } = req.params;
        const { testDate, notes, status, values } = req.body;

        // Check if result exists
        const [existing] = await connection.execute(
            'SELECT resultId FROM lab_test_results WHERE resultId = ?',
            [resultId]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Result not found' });
        }

        // Update result
        const updates = [];
        const updateValues = [];

        if (testDate !== undefined) {
            updates.push('testDate = ?');
            updateValues.push(testDate);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            updateValues.push(notes || null);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            updateValues.push(status);
        }

        if (updates.length > 0) {
            updates.push('updatedAt = NOW()');
            updateValues.push(resultId);
            await connection.execute(
                `UPDATE lab_test_results SET ${updates.join(', ')} WHERE resultId = ?`,
                updateValues
            );
        }

        // Update or insert result values
        if (values && Array.isArray(values)) {
            // Delete existing values
            await connection.execute(
                'DELETE FROM lab_result_values WHERE resultId = ?',
                [resultId]
            );

            // Insert new values
            for (const value of values) {
                await connection.execute(
                    `INSERT INTO lab_result_values (resultId, parameterName, value, unit, normalRange, flag, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        resultId,
                        value.parameterName,
                        value.value || null,
                        value.unit || null,
                        value.normalRange || null,
                        value.flag || 'normal',
                        value.notes || null
                    ]
                );
            }
        }

        await connection.commit();

        // Fetch updated result
        const [result] = await connection.execute(
            `SELECT ltr.*, 
                    u1.firstName as performedByFirstName, u1.lastName as performedByLastName
             FROM lab_test_results ltr
             LEFT JOIN users u1 ON ltr.performedBy = u1.userId
             WHERE ltr.resultId = ?`,
            [resultId]
        );

        const [resultValues] = await connection.execute(
            `SELECT * FROM lab_result_values WHERE resultId = ? ORDER BY valueId`,
            [resultId]
        );

        result[0].values = resultValues;

        res.status(200).json(result[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating lab result:', error);
        res.status(500).json({ message: 'Error updating lab result', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
