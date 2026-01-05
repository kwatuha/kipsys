// Queue management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { servicePoint, status, includeCompleted } = req.query;
        let query = `
            SELECT q.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_entries q
            LEFT JOIN patients p ON q.patientId = p.patientId
            WHERE 1=1
        `;
        const params = [];

        // By default, exclude completed and cancelled entries for active queue
        // Set includeCompleted=true to see all entries including completed ones
        if (includeCompleted !== 'true') {
            query += ` AND q.status NOT IN ('completed', 'cancelled')`;
        }

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
        const doctorId = queueData.doctorId !== undefined && queueData.doctorId !== null && queueData.doctorId !== '' 
            ? parseInt(queueData.doctorId) 
            : null;

        const [result] = await pool.execute(
            `INSERT INTO queue_entries 
            (patientId, doctorId, ticketNumber, servicePoint, priority, status, estimatedWaitTime, notes, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                queueData.patientId,
                doctorId,
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
        const { patientId, servicePoint, priority, estimatedWaitTime, notes, doctorId } = req.body;

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
        if (doctorId !== undefined) {
            updates.push('doctorId = ?');
            values.push(doctorId !== null && doctorId !== '' ? parseInt(doctorId) : null);
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

/**
 * @route POST /api/queue/:id/archive
 * @description Archive a completed queue entry to history table
 */
router.post('/:id/archive', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Get the queue entry
        const [queueEntries] = await connection.execute(
            'SELECT * FROM queue_entries WHERE queueId = ?',
            [id]
        );

        if (queueEntries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        const queue = queueEntries[0];

        // Calculate service metrics
        let waitTimeMinutes = null;
        let serviceTimeMinutes = null;
        let totalTimeMinutes = null;

        if (queue.arrivalTime) {
            const arrival = new Date(queue.arrivalTime);
            
            if (queue.calledTime) {
                const called = new Date(queue.calledTime);
                waitTimeMinutes = Math.floor((called - arrival) / 60000);
            }
            
            if (queue.startTime && queue.endTime) {
                const start = new Date(queue.startTime);
                const end = new Date(queue.endTime);
                serviceTimeMinutes = Math.floor((end - start) / 60000);
            }
            
            if (queue.endTime) {
                const end = new Date(queue.endTime);
                totalTimeMinutes = Math.floor((end - arrival) / 60000);
            }
        }

        // Insert into history table
        await connection.execute(
            `INSERT INTO queue_history 
            (queueId, patientId, ticketNumber, servicePoint, priority, status, 
             estimatedWaitTime, arrivalTime, calledTime, startTime, endTime, notes, createdBy,
             waitTimeMinutes, serviceTimeMinutes, totalTimeMinutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                queue.queueId,
                queue.patientId,
                queue.ticketNumber,
                queue.servicePoint,
                queue.priority,
                queue.status || 'completed',
                queue.estimatedWaitTime,
                queue.arrivalTime,
                queue.calledTime,
                queue.startTime,
                queue.endTime,
                queue.notes,
                queue.createdBy,
                waitTimeMinutes,
                serviceTimeMinutes,
                totalTimeMinutes
            ]
        );

        // Delete from active queue
        await connection.execute(
            'DELETE FROM queue_entries WHERE queueId = ?',
            [id]
        );

        await connection.commit();
        res.status(200).json({ 
            message: 'Queue entry archived successfully',
            waitTimeMinutes,
            serviceTimeMinutes,
            totalTimeMinutes
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error archiving queue entry:', error);
        res.status(500).json({ message: 'Error archiving queue entry', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/queue/history
 * @description Get archived queue entries (history)
 */
router.get('/history', async (req, res) => {
    try {
        const { servicePoint, status, patientId, startDate, endDate, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT qh.*, 
                   p.firstName as patientFirstName, p.lastName as patientLastName,
                   p.phone as patientPhone, p.patientNumber
            FROM queue_history qh
            LEFT JOIN patients p ON qh.patientId = p.patientId
            WHERE 1=1
        `;
        const params = [];

        if (servicePoint) {
            query += ` AND qh.servicePoint = ?`;
            params.push(servicePoint);
        }
        if (status) {
            query += ` AND qh.status = ?`;
            params.push(status);
        }
        if (patientId) {
            query += ` AND qh.patientId = ?`;
            params.push(patientId);
        }
        if (startDate) {
            query += ` AND DATE(qh.endTime) >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND DATE(qh.endTime) <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY qh.endTime DESC, qh.archivedAt DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching queue history:', error);
        res.status(500).json({ message: 'Error fetching queue history', error: error.message });
    }
});

/**
 * @route POST /api/queue/archive-completed
 * @description Archive all completed queue entries (batch operation)
 */
router.post('/archive-completed', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get all completed entries
        const [completedEntries] = await connection.execute(
            `SELECT * FROM queue_entries 
             WHERE status IN ('completed', 'cancelled')`
        );

        let archivedCount = 0;

        for (const queue of completedEntries) {
            // Calculate service metrics
            let waitTimeMinutes = null;
            let serviceTimeMinutes = null;
            let totalTimeMinutes = null;

            if (queue.arrivalTime) {
                const arrival = new Date(queue.arrivalTime);
                
                if (queue.calledTime) {
                    const called = new Date(queue.calledTime);
                    waitTimeMinutes = Math.floor((called - arrival) / 60000);
                }
                
                if (queue.startTime && queue.endTime) {
                    const start = new Date(queue.startTime);
                    const end = new Date(queue.endTime);
                    serviceTimeMinutes = Math.floor((end - start) / 60000);
                }
                
                if (queue.endTime) {
                    const end = new Date(queue.endTime);
                    totalTimeMinutes = Math.floor((end - arrival) / 60000);
                }
            }

            // Insert into history
            await connection.execute(
                `INSERT INTO queue_history 
                (queueId, patientId, ticketNumber, servicePoint, priority, status, 
                 estimatedWaitTime, arrivalTime, calledTime, startTime, endTime, notes, createdBy,
                 waitTimeMinutes, serviceTimeMinutes, totalTimeMinutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    queue.queueId,
                    queue.patientId,
                    queue.ticketNumber,
                    queue.servicePoint,
                    queue.priority,
                    queue.status,
                    queue.estimatedWaitTime,
                    queue.arrivalTime,
                    queue.calledTime,
                    queue.startTime,
                    queue.endTime,
                    queue.notes,
                    queue.createdBy,
                    waitTimeMinutes,
                    serviceTimeMinutes,
                    totalTimeMinutes
                ]
            );

            // Delete from active queue
            await connection.execute(
                'DELETE FROM queue_entries WHERE queueId = ?',
                [queue.queueId]
            );

            archivedCount++;
        }

        await connection.commit();
        res.status(200).json({ 
            message: `Successfully archived ${archivedCount} queue entries`,
            archivedCount
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error archiving completed entries:', error);
        res.status(500).json({ message: 'Error archiving completed entries', error: error.message });
    } finally {
        connection.release();
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

        // For safety, only allow deletion of non-completed entries
        // Completed entries should be archived instead
        if (existing[0].status === 'completed' || existing[0].status === 'cancelled') {
            return res.status(400).json({ 
                message: 'Cannot delete completed entries. Use archive endpoint instead.' 
            });
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

