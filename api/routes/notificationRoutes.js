// Notification routes - Drug inventory notifications
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/notifications/drug-notifications
 * @description Get all drug notifications with optional filters
 */
router.get('/drug-notifications', async (req, res) => {
    try {
        const { status, priority, search } = req.query;
        let query = `
            SELECT dn.*,
                   p.prescriptionNumber,
                   pi.dosage, pi.frequency, pi.duration
            FROM drug_notifications dn
            LEFT JOIN prescriptions p ON dn.prescriptionId = p.prescriptionId
            LEFT JOIN prescription_items pi ON dn.prescriptionItemId = pi.itemId
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND dn.status = ?';
            params.push(status);
        }

        if (priority && priority !== 'all') {
            query += ' AND dn.priority = ?';
            params.push(priority);
        }

        if (search) {
            query += ' AND (dn.medicationName LIKE ? OR dn.doctorName LIKE ? OR dn.patientName LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY dn.createdAt DESC, dn.priority DESC';

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching drug notifications:', error);
        res.status(500).json({ message: 'Error fetching drug notifications', error: error.message });
    }
});

/**
 * @route GET /api/notifications/drug-notifications/:id
 * @description Get a single drug notification by ID
 */
router.get('/drug-notifications/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT dn.*,
                    p.prescriptionNumber,
                    pi.dosage, pi.frequency, pi.duration
             FROM drug_notifications dn
             LEFT JOIN prescriptions p ON dn.prescriptionId = p.prescriptionId
             LEFT JOIN prescription_items pi ON dn.prescriptionItemId = pi.itemId
             WHERE dn.notificationId = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Drug notification not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching drug notification:', error);
        res.status(500).json({ message: 'Error fetching drug notification', error: error.message });
    }
});

/**
 * @route PUT /api/notifications/drug-notifications/:id/acknowledge
 * @description Acknowledge a drug notification
 */
router.put('/drug-notifications/:id/acknowledge', async (req, res) => {
    try {
        const userId = req.user?.id;

        const [result] = await pool.execute(
            `UPDATE drug_notifications 
             SET status = 'acknowledged', acknowledgedBy = ?, acknowledgedAt = NOW(), updatedAt = NOW()
             WHERE notificationId = ? AND status = 'pending'`,
            [userId || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Drug notification not found or already processed' });
        }

        const [updated] = await pool.execute(
            'SELECT * FROM drug_notifications WHERE notificationId = ?',
            [req.params.id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error acknowledging drug notification:', error);
        res.status(500).json({ message: 'Error acknowledging drug notification', error: error.message });
    }
});

/**
 * @route PUT /api/notifications/drug-notifications/:id/resolve
 * @description Mark a drug notification as resolved
 */
router.put('/drug-notifications/:id/resolve', async (req, res) => {
    try {
        const [result] = await pool.execute(
            `UPDATE drug_notifications 
             SET status = 'resolved', resolvedAt = NOW(), updatedAt = NOW()
             WHERE notificationId = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Drug notification not found' });
        }

        const [updated] = await pool.execute(
            'SELECT * FROM drug_notifications WHERE notificationId = ?',
            [req.params.id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error resolving drug notification:', error);
        res.status(500).json({ message: 'Error resolving drug notification', error: error.message });
    }
});

/**
 * @route DELETE /api/notifications/drug-notifications/:id
 * @description Delete a drug notification
 */
router.delete('/drug-notifications/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM drug_notifications WHERE notificationId = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Drug notification not found' });
        }

        res.status(200).json({
            message: 'Drug notification deleted successfully',
            notificationId: req.params.id
        });
    } catch (error) {
        console.error('Error deleting drug notification:', error);
        res.status(500).json({ message: 'Error deleting drug notification', error: error.message });
    }
});

module.exports = router;



