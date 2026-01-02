// Queue management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { servicePoint, status } = req.query;
        let query = `
            SELECT q.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_entries q
            LEFT JOIN patients p ON q.patientId = p.patientId
            WHERE 1=1
        `;
        const params = [];

        if (servicePoint) {
            query += ` AND q.servicePoint = ?`;
            params.push(servicePoint);
        }
        if (status) {
            query += ` AND q.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY q.arrivalTime ASC`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({ message: 'Error fetching queue', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const queueData = req.body;
        const userId = req.user?.id || null;

        // Generate ticket number
        if (!queueData.ticketNumber) {
            const [count] = await pool.execute(
                'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE()'
            );
            const ticketNum = count[0].count + 1;
            queueData.ticketNumber = `${queueData.servicePoint.substring(0, 1).toUpperCase()}-${String(ticketNum).padStart(3, '0')}`;
        }

        // Ensure all values are explicitly set to null if undefined
        const estimatedWaitTime = queueData.estimatedWaitTime !== undefined && queueData.estimatedWaitTime !== null && queueData.estimatedWaitTime !== '' 
            ? parseInt(queueData.estimatedWaitTime) 
            : null;
        const notes = queueData.notes !== undefined && queueData.notes !== null && queueData.notes !== '' 
            ? queueData.notes 
            : null;

        const [result] = await pool.execute(
            `INSERT INTO queue_entries 
            (patientId, ticketNumber, servicePoint, priority, status, estimatedWaitTime, notes, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                queueData.patientId,
                queueData.ticketNumber,
                queueData.servicePoint,
                queueData.priority || 'normal',
                queueData.status || 'waiting',
                estimatedWaitTime,
                notes,
                userId
            ]
        );

        const [newEntry] = await pool.execute(
            'SELECT * FROM queue_entries WHERE queueId = ?',
            [result.insertId]
        );

        res.status(201).json(newEntry[0]);
    } catch (error) {
        console.error('Error creating queue entry:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `SELECT q.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_entries q
            LEFT JOIN patients p ON q.patientId = p.patientId
            WHERE q.queueId = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching queue entry:', error);
        res.status(500).json({ message: 'Error fetching queue entry', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { patientId, servicePoint, priority, estimatedWaitTime, notes } = req.body;

        const updates = [];
        const values = [];

        if (patientId !== undefined) {
            updates.push('patientId = ?');
            values.push(patientId);
        }
        if (servicePoint !== undefined) {
            updates.push('servicePoint = ?');
            values.push(servicePoint);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }
        if (estimatedWaitTime !== undefined) {
            updates.push('estimatedWaitTime = ?');
            values.push(estimatedWaitTime !== null && estimatedWaitTime !== '' ? parseInt(estimatedWaitTime) : null);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes !== null && notes !== '' ? notes : null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updatedAt = NOW()');
        values.push(id);

        await pool.execute(
            `UPDATE queue_entries SET ${updates.join(', ')} WHERE queueId = ?`,
            values
        );

        const [updated] = await pool.execute(
            `SELECT q.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_entries q
            LEFT JOIN patients p ON q.patientId = p.patientId
            WHERE q.queueId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating queue entry:', error);
        res.status(500).json({ message: 'Error updating queue entry', error: error.message });
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const updates = ['status = ?'];
        const values = [status];

        if (status === 'called') {
            updates.push('calledTime = NOW()');
        } else if (status === 'serving') {
            updates.push('startTime = NOW()');
        } else if (status === 'completed' || status === 'cancelled') {
            updates.push('endTime = NOW()');
        }

        values.push(id);

        await pool.execute(
            `UPDATE queue_entries SET ${updates.join(', ')}, updatedAt = NOW() WHERE queueId = ?`,
            values
        );

        const [updated] = await pool.execute(
            `SELECT q.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_entries q
            LEFT JOIN patients p ON q.patientId = p.patientId
            WHERE q.queueId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating queue status:', error);
        res.status(500).json({ message: 'Error updating queue status', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if queue entry exists
        const [existing] = await pool.execute(
            'SELECT * FROM queue_entries WHERE queueId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        // Delete the queue entry
        await pool.execute(
            'DELETE FROM queue_entries WHERE queueId = ?',
            [id]
        );

        res.status(200).json({ message: 'Queue entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting queue entry:', error);
        res.status(500).json({ message: 'Error deleting queue entry', error: error.message });
    }
});

module.exports = router;

