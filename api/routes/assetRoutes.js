// Asset management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/assets
 * @description Get all assets with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, category, search } = req.query;
        
        let query = `
            SELECT *
            FROM assets
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (assetName LIKE ? OR assetCode LIKE ? OR serialNumber LIKE ? OR manufacturer LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY createdAt DESC, assetName ASC';
        
        const [rows] = await pool.execute(query, params);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Error fetching assets', error: error.message });
    }
});

/**
 * @route GET /api/assets/:id
 * @description Get a single asset by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM assets WHERE assetId = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ message: 'Error fetching asset', error: error.message });
    }
});

/**
 * @route POST /api/assets
 * @description Create a new asset
 */
router.post('/', async (req, res) => {
    try {
        const {
            assetCode,
            assetName,
            category,
            assetType,
            purchaseDate,
            purchaseCost,
            currentValue,
            depreciationMethod,
            depreciationRate,
            location,
            serialNumber,
            manufacturer,
            model,
            status = 'active',
            notes
        } = req.body;

        if (!assetName || !purchaseCost) {
            return res.status(400).json({ error: 'Asset name and purchase cost are required' });
        }

        // Generate asset code if not provided
        let finalAssetCode = assetCode;
        if (!finalAssetCode) {
            const [count] = await pool.execute('SELECT COUNT(*) as count FROM assets');
            const assetNum = count[0].count + 1;
            finalAssetCode = `AST-${String(assetNum).padStart(6, '0')}`;
        } else {
            // Check if code already exists
            const [existing] = await pool.execute('SELECT assetId FROM assets WHERE assetCode = ?', [finalAssetCode]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Asset code already exists' });
            }
        }

        // Set currentValue to purchaseCost if not provided
        const finalCurrentValue = currentValue !== undefined ? currentValue : purchaseCost;
        const finalAccumulatedDepreciation = 0;

        const [result] = await pool.execute(
            `INSERT INTO assets (
                assetCode, assetName, category, assetType, purchaseDate, purchaseCost,
                currentValue, depreciationMethod, depreciationRate, accumulatedDepreciation,
                location, serialNumber, manufacturer, model, status, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalAssetCode,
                assetName,
                category || null,
                assetType || null,
                purchaseDate || null,
                purchaseCost,
                finalCurrentValue,
                depreciationMethod || null,
                depreciationRate || null,
                finalAccumulatedDepreciation,
                location || null,
                serialNumber || null,
                manufacturer || null,
                model || null,
                status,
                notes || null
            ]
        );
        
        const [newAsset] = await pool.execute(
            'SELECT * FROM assets WHERE assetId = ?',
            [result.insertId]
        );
        
        res.status(201).json(newAsset[0]);
    } catch (error) {
        console.error('Error creating asset:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Asset code already exists' });
        }
        res.status(500).json({ message: 'Error creating asset', error: error.message });
    }
});

/**
 * @route PUT /api/assets/:id
 * @description Update an asset
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            assetCode,
            assetName,
            category,
            assetType,
            purchaseDate,
            purchaseCost,
            currentValue,
            depreciationMethod,
            depreciationRate,
            accumulatedDepreciation,
            location,
            serialNumber,
            manufacturer,
            model,
            status,
            disposedDate,
            disposedValue,
            notes
        } = req.body;

        // Check if asset exists
        const [existing] = await pool.execute('SELECT assetId FROM assets WHERE assetId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Check for duplicate asset code if it's being changed
        if (assetCode) {
            const [duplicate] = await pool.execute(
                'SELECT assetId FROM assets WHERE assetCode = ? AND assetId != ?',
                [assetCode, id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ error: 'Asset code already exists' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (assetCode !== undefined) { updates.push('assetCode = ?'); values.push(assetCode); }
        if (assetName !== undefined) { updates.push('assetName = ?'); values.push(assetName); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (assetType !== undefined) { updates.push('assetType = ?'); values.push(assetType); }
        if (purchaseDate !== undefined) { updates.push('purchaseDate = ?'); values.push(purchaseDate); }
        if (purchaseCost !== undefined) { updates.push('purchaseCost = ?'); values.push(purchaseCost); }
        if (currentValue !== undefined) { updates.push('currentValue = ?'); values.push(currentValue); }
        if (depreciationMethod !== undefined) { updates.push('depreciationMethod = ?'); values.push(depreciationMethod); }
        if (depreciationRate !== undefined) { updates.push('depreciationRate = ?'); values.push(depreciationRate); }
        if (accumulatedDepreciation !== undefined) { updates.push('accumulatedDepreciation = ?'); values.push(accumulatedDepreciation); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location); }
        if (serialNumber !== undefined) { updates.push('serialNumber = ?'); values.push(serialNumber); }
        if (manufacturer !== undefined) { updates.push('manufacturer = ?'); values.push(manufacturer); }
        if (model !== undefined) { updates.push('model = ?'); values.push(model); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (disposedDate !== undefined) { updates.push('disposedDate = ?'); values.push(disposedDate); }
        if (disposedValue !== undefined) { updates.push('disposedValue = ?'); values.push(disposedValue); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.execute(
            `UPDATE assets SET ${updates.join(', ')}, updatedAt = NOW() WHERE assetId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM assets WHERE assetId = ?',
            [id]
        );
        
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating asset:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Asset code already exists' });
        }
        res.status(500).json({ message: 'Error updating asset', error: error.message });
    }
});

/**
 * @route DELETE /api/assets/:id
 * @description Delete an asset
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if asset exists
        const [existing] = await pool.execute('SELECT assetId FROM assets WHERE assetId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        await pool.execute('DELETE FROM assets WHERE assetId = ?', [id]);
        
        res.status(200).json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    }
});

/**
 * @route GET /api/assets/stats/summary
 * @description Get summary statistics for assets
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalAssets,
                SUM(purchaseCost) as totalPurchaseCost,
                SUM(currentValue) as totalCurrentValue,
                SUM(accumulatedDepreciation) as totalDepreciation,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as activeCount,
                COUNT(CASE WHEN status = 'disposed' THEN 1 END) as disposedCount,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenanceCount,
                COUNT(CASE WHEN status = 'retired' THEN 1 END) as retiredCount
            FROM assets
        `);
        
        res.status(200).json(stats[0] || {
            totalAssets: 0,
            totalPurchaseCost: 0,
            totalCurrentValue: 0,
            totalDepreciation: 0,
            activeCount: 0,
            disposedCount: 0,
            maintenanceCount: 0,
            retiredCount: 0,
        });
    } catch (error) {
        console.error('Error fetching asset stats:', error);
        res.status(500).json({ message: 'Error fetching asset stats', error: error.message });
    }
});

module.exports = router;

