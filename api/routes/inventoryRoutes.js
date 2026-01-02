// Inventory routes - placeholder
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM inventory_items WHERE status != "Expired" ORDER BY name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Error fetching inventory', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const itemData = req.body;
        const userId = req.user?.id;
        const [result] = await pool.execute(
            'INSERT INTO inventory_items (itemCode, name, category, unit, quantity, reorderLevel, unitPrice, supplier, expiryDate, location, description, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [itemData.itemCode, itemData.name, itemData.category, itemData.unit, itemData.quantity || 0, itemData.reorderLevel || 0, itemData.unitPrice, itemData.supplier, itemData.expiryDate, itemData.location, itemData.description, userId]
        );
        const [newItem] = await pool.execute('SELECT * FROM inventory_items WHERE itemId = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ message: 'Error creating inventory item', error: error.message });
    }
});

module.exports = router;

