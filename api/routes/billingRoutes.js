// Billing routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Service charges
/**
 * @route GET /api/billing/charges
 * @description Get all service charges (optionally filtered by status)
 */
router.get('/charges', async (req, res) => {
    try {
        const { status, category, department, search } = req.query;
        let query = 'SELECT * FROM service_charges WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        } else {
            // Default: show all (both Active and Inactive)
            query += ' AND (status = "Active" OR status = "Inactive")';
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (department) {
            query += ' AND department = ?';
            params.push(department);
        }

        if (search) {
            query += ' AND (name LIKE ? OR chargeCode LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY name ASC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching charges:', error);
        res.status(500).json({ message: 'Error fetching charges', error: error.message });
    }
});

/**
 * @route GET /api/billing/charges/:id
 * @description Get a single service charge by ID
 */
router.get('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching charge:', error);
        res.status(500).json({ message: 'Error fetching charge', error: error.message });
    }
});

/**
 * @route POST /api/billing/charges
 * @description Create a new service charge
 */
router.post('/charges', async (req, res) => {
    try {
        const { chargeCode, name, category, department, cost, description, status = 'Active' } = req.body;
        
        if (!name || !cost) {
            return res.status(400).json({ error: 'Name and cost are required' });
        }

        // Generate charge code if not provided
        let finalChargeCode = chargeCode;
        if (!finalChargeCode) {
            // Generate code from name (e.g., "General Consultation" -> "GEN-CONS")
            const codeParts = name.toUpperCase().split(' ').slice(0, 2).map(part => part.substring(0, 3));
            finalChargeCode = codeParts.join('-');
            
            // Ensure uniqueness
            let counter = 1;
            let [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
            while (existing.length > 0) {
                finalChargeCode = `${codeParts.join('-')}-${counter}`;
                [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
                counter++;
            }
        } else {
            // Check if code already exists
            const [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Charge code already exists' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO service_charges (chargeCode, name, category, department, cost, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [finalChargeCode, name, category || null, department || null, cost, description || null, status]
        );
        
        const [newCharge] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [result.insertId]);
        res.status(201).json(newCharge[0]);
    } catch (error) {
        console.error('Error creating charge:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Charge code already exists' });
        }
        res.status(500).json({ message: 'Error creating charge', error: error.message });
    }
});

/**
 * @route PUT /api/billing/charges/:id
 * @description Update a service charge
 */
router.put('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chargeCode, name, category, department, cost, description, status } = req.body;

        // Check if charge exists
        const [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }

        // Check for duplicate charge code if it's being changed
        if (chargeCode) {
            const [duplicate] = await pool.query(
                'SELECT chargeId FROM service_charges WHERE chargeCode = ? AND chargeId != ?',
                [chargeCode, id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ error: 'Charge code already exists' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (chargeCode !== undefined) { updates.push('chargeCode = ?'); values.push(chargeCode); }
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (department !== undefined) { updates.push('department = ?'); values.push(department); }
        if (cost !== undefined) { updates.push('cost = ?'); values.push(cost); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.query(
            `UPDATE service_charges SET ${updates.join(', ')}, updatedAt = NOW() WHERE chargeId = ?`,
            values
        );

        const [updated] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [id]);
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating charge:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Charge code already exists' });
        }
        res.status(500).json({ message: 'Error updating charge', error: error.message });
    }
});

/**
 * @route DELETE /api/billing/charges/:id
 * @description Delete (deactivate) a service charge
 */
router.delete('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if charge is used in any invoices
        const [invoices] = await pool.query(
            'SELECT COUNT(*) as count FROM invoice_items WHERE chargeId = ?',
            [id]
        );

        if (invoices[0].count > 0) {
            // Soft delete by setting status to Inactive
            await pool.query(
                'UPDATE service_charges SET status = "Inactive", updatedAt = NOW() WHERE chargeId = ?',
                [id]
            );
            return res.status(200).json({ message: 'Service charge deactivated (used in invoices)' });
        }

        // Hard delete if not used
        const [result] = await pool.query('DELETE FROM service_charges WHERE chargeId = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }

        res.status(200).json({ message: 'Service charge deleted successfully' });
    } catch (error) {
        console.error('Error deleting charge:', error);
        res.status(500).json({ message: 'Error deleting charge', error: error.message });
    }
});

// Invoices
router.get('/invoices', async (req, res) => {
    try {
        const { patientId } = req.query;
        let query = 'SELECT * FROM invoices WHERE 1=1';
        const params = [];
        if (patientId) {
            query += ' AND patientId = ?';
            params.push(patientId);
        }
        query += ' ORDER BY invoiceDate DESC';
        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});

module.exports = router;

