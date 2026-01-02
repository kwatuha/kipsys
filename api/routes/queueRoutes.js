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
                   p.phone as patientPhone
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
        const userId = req.user?.id;

        // Generate ticket number
        if (!queueData.ticketNumber) {
            const [count] = await pool.execute(
                'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE()'
            );
            const ticketNum = count[0].count + 1;
            queueData.ticketNumber = `${queueData.servicePoint.substring(0, 1).toUpperCase()}-${String(ticketNum).padStart(3, '0')}`;
        }

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
                queueData.estimatedWaitTime || null,
                queueData.notes || null,
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
            'SELECT * FROM queue_entries WHERE queueId = ?',
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating queue status:', error);
        res.status(500).json({ message: 'Error updating queue status', error: error.message });
    }
});

module.exports = router;

