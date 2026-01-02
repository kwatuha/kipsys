// Billing routes - placeholder
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Service charges
router.get('/charges', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM service_charges WHERE status = "Active" ORDER BY name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching charges:', error);
        res.status(500).json({ message: 'Error fetching charges', error: error.message });
    }
});

router.post('/charges', async (req, res) => {
    try {
        const chargeData = req.body;
        const [result] = await pool.execute(
            'INSERT INTO service_charges (chargeCode, name, category, department, cost, description) VALUES (?, ?, ?, ?, ?, ?)',
            [chargeData.chargeCode, chargeData.name, chargeData.category, chargeData.department, chargeData.cost, chargeData.description]
        );
        const [newCharge] = await pool.execute('SELECT * FROM service_charges WHERE chargeId = ?', [result.insertId]);
        res.status(201).json(newCharge[0]);
    } catch (error) {
        console.error('Error creating charge:', error);
        res.status(500).json({ message: 'Error creating charge', error: error.message });
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

