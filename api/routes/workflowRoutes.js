// Workflow management routes - handles patient workflow transitions
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * Helper function to create queue entry
 */
async function createQueueEntry(connection, patientId, servicePoint, priority = 'normal', notes = null, userId = null) {
    // Generate ticket number
    const [count] = await connection.execute(
        'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = ?',
        [servicePoint]
    );
    const ticketNum = count[0].count + 1;
    const servicePointPrefix = servicePoint.substring(0, 1).toUpperCase();
    const ticketNumber = `${servicePointPrefix}-${String(ticketNum).padStart(3, '0')}`;

    const [result] = await connection.execute(
        `INSERT INTO queue_entries 
        (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
        VALUES (?, ?, ?, ?, 'waiting', ?, ?)`,
        [patientId, ticketNumber, servicePoint, priority, notes, userId]
    );

    return result.insertId;
}

/**
 * Helper function to calculate time differences in minutes
 */
function calculateTimeDifference(startTime, endTime) {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / 1000 / 60); // Return minutes
}

/**
 * @route POST /api/workflow/triage-to-cashier
 * @description After triage completion, create cashier queue for consultation fees payment
 */
router.post('/triage-to-cashier', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, triageId, servicePoint, priority = 'normal' } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        if (!patientId) {
            await connection.rollback();
            return res.status(400).json({ message: 'patientId is required' });
        }

        // Create queue entry for cashier (consultation fees payment)
        const queueId = await createQueueEntry(
            connection,
            patientId,
            'cashier',
            priority,
            `Consultation fees payment - Service: ${servicePoint || 'consultation'}`,
            userId
        );

        await connection.commit();

        const [queueEntry] = await connection.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.queueId = ?`,
            [queueId]
        );

        connection.release();
        res.status(201).json(queueEntry[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating cashier queue after triage:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

/**
 * @route POST /api/workflow/cashier-to-consultation
 * @description After consultation fees payment, create consultation queue
 */
router.post('/cashier-to-consultation', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, queueId, doctorId, servicePoint = 'consultation', priority = 'normal' } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        if (!patientId) {
            await connection.rollback();
            return res.status(400).json({ message: 'patientId is required' });
        }

        // Update cashier queue status to completed
        if (queueId) {
            await connection.execute(
                `UPDATE queue_entries SET status = 'completed', endTime = NOW() WHERE queueId = ?`,
                [queueId]
            );
        }

        // Create queue entry for consultation
        const newQueueId = await createQueueEntry(
            connection,
            patientId,
            servicePoint,
            priority,
            doctorId ? `Assigned to doctor ID: ${doctorId}` : null,
            userId
        );

        await connection.commit();

        const [queueEntry] = await connection.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.queueId = ?`,
            [newQueueId]
        );

        connection.release();
        res.status(201).json(queueEntry[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating consultation queue after payment:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

/**
 * @route POST /api/workflow/consultation-to-lab
 * @description After consultation, send patient to laboratory queue
 */
router.post('/consultation-to-lab', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, queueId, priority = 'normal' } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        if (!patientId) {
            await connection.rollback();
            return res.status(400).json({ message: 'patientId is required' });
        }

        // Update consultation queue status to completed
        if (queueId) {
            await connection.execute(
                `UPDATE queue_entries SET status = 'completed', endTime = NOW() WHERE queueId = ?`,
                [queueId]
            );
        }

        // Create queue entry for laboratory
        const newQueueId = await createQueueEntry(
            connection,
            patientId,
            'laboratory',
            priority,
            'Laboratory tests requested',
            userId
        );

        await connection.commit();

        const [queueEntry] = await connection.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.queueId = ?`,
            [newQueueId]
        );

        connection.release();
        res.status(201).json(queueEntry[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating laboratory queue:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

/**
 * @route POST /api/workflow/prescription-to-cashier
 * @description After prescription created, create cashier queue for drug payment
 */
router.post('/prescription-to-cashier', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, prescriptionId, queueId, priority = 'normal' } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        if (!patientId) {
            await connection.rollback();
            return res.status(400).json({ message: 'patientId is required' });
        }

        // Update consultation queue status to completed if queueId provided
        if (queueId) {
            await connection.execute(
                `UPDATE queue_entries SET status = 'completed', endTime = NOW() WHERE queueId = ?`,
                [queueId]
            );
        }

        // Create queue entry for cashier (drug payment)
        const newQueueId = await createQueueEntry(
            connection,
            patientId,
            'cashier',
            priority,
            prescriptionId ? `Drug payment - Prescription ID: ${prescriptionId}` : 'Drug payment',
            userId
        );

        await connection.commit();

        const [queueEntry] = await connection.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.queueId = ?`,
            [newQueueId]
        );

        connection.release();
        res.status(201).json(queueEntry[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating cashier queue after prescription:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

/**
 * @route POST /api/workflow/cashier-to-pharmacy
 * @description After drug payment, create pharmacy queue
 */
router.post('/cashier-to-pharmacy', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { patientId, queueId, prescriptionId, priority = 'normal' } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        if (!patientId) {
            await connection.rollback();
            return res.status(400).json({ message: 'patientId is required' });
        }

        // Update cashier queue status to completed
        if (queueId) {
            await connection.execute(
                `UPDATE queue_entries SET status = 'completed', endTime = NOW() WHERE queueId = ?`,
                [queueId]
            );
        }

        // Create queue entry for pharmacy
        const newQueueId = await createQueueEntry(
            connection,
            patientId,
            'pharmacy',
            priority,
            prescriptionId ? `Prescription ID: ${prescriptionId}` : 'Drug collection',
            userId
        );

        await connection.commit();

        const [queueEntry] = await connection.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.queueId = ?`,
            [newQueueId]
        );

        connection.release();
        res.status(201).json(queueEntry[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating pharmacy queue after payment:', error);
        res.status(500).json({ message: 'Error creating queue entry', error: error.message });
    }
});

/**
 * @route GET /api/workflow/queue/:id/time-summary
 * @description Get time breakdown for a queue entry
 */
router.get('/queue/:id/time-summary', async (req, res) => {
    try {
        const { id } = req.params;

        const [queue] = await pool.execute(
            'SELECT * FROM queue_entries WHERE queueId = ?',
            [id]
        );

        if (queue.length === 0) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        const entry = queue[0];
        const now = new Date();

        // Calculate time differences
        const waitTime = entry.calledTime 
            ? calculateTimeDifference(entry.arrivalTime, entry.calledTime)
            : (entry.status === 'waiting' ? calculateTimeDifference(entry.arrivalTime, now) : null);

        const serviceTime = entry.startTime && entry.endTime
            ? calculateTimeDifference(entry.startTime, entry.endTime)
            : (entry.startTime && !entry.endTime && entry.status !== 'completed'
                ? calculateTimeDifference(entry.startTime, now)
                : null);

        const totalTime = entry.endTime
            ? calculateTimeDifference(entry.arrivalTime, entry.endTime)
            : calculateTimeDifference(entry.arrivalTime, now);

        res.status(200).json({
            queueId: entry.queueId,
            patientId: entry.patientId,
            servicePoint: entry.servicePoint,
            status: entry.status,
            times: {
                arrivalTime: entry.arrivalTime,
                calledTime: entry.calledTime,
                startTime: entry.startTime,
                endTime: entry.endTime,
            },
            durations: {
                waitTimeMinutes: waitTime, // Time from arrival to being called/started
                serviceTimeMinutes: serviceTime, // Time from start to end
                totalTimeMinutes: totalTime, // Total time from arrival to end
            }
        });
    } catch (error) {
        console.error('Error fetching queue time summary:', error);
        res.status(500).json({ message: 'Error fetching time summary', error: error.message });
    }
});

/**
 * @route GET /api/workflow/patients/:id/queue-history
 * @description Get all queue entries for a patient with time tracking
 */
router.get('/patients/:id/queue-history', async (req, res) => {
    try {
        const { id } = req.params;

        const [queues] = await pool.execute(
            `SELECT q.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM queue_entries q
             LEFT JOIN patients p ON q.patientId = p.patientId
             WHERE q.patientId = ?
             ORDER BY q.arrivalTime DESC`,
            [id]
        );

        // Add time calculations for each queue entry
        const queuesWithTime = queues.map(entry => {
            const waitTime = entry.calledTime 
                ? calculateTimeDifference(entry.arrivalTime, entry.calledTime)
                : (entry.status === 'waiting' ? calculateTimeDifference(entry.arrivalTime, new Date()) : null);

            const serviceTime = entry.startTime && entry.endTime
                ? calculateTimeDifference(entry.startTime, entry.endTime)
                : (entry.startTime && !entry.endTime && entry.status !== 'completed'
                    ? calculateTimeDifference(entry.startTime, new Date())
                    : null);

            const totalTime = entry.endTime
                ? calculateTimeDifference(entry.arrivalTime, entry.endTime)
                : calculateTimeDifference(entry.arrivalTime, new Date());

            return {
                ...entry,
                timeSummary: {
                    waitTimeMinutes: waitTime,
                    serviceTimeMinutes: serviceTime,
                    totalTimeMinutes: totalTime,
                }
            };
        });

        res.status(200).json(queuesWithTime);
    } catch (error) {
        console.error('Error fetching patient queue history:', error);
        res.status(500).json({ message: 'Error fetching queue history', error: error.message });
    }
});

module.exports = router;


