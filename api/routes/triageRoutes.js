// Triage management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/triage
 * @description Get all triage records
 */
router.get('/', async (req, res) => {
    try {
        const { priority, status, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.*,
                   p.patientId, p.firstName, p.lastName, p.patientNumber,
                   u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                   vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                   vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
            FROM triage_assessments t
            LEFT JOIN patients p ON t.patientId = p.patientId
            LEFT JOIN users u ON t.triagedBy = u.userId
            LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
            WHERE 1=1
        `;
        const params = [];

        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }
        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        if (search) {
            query += ` AND (p.firstName LIKE ? OR p.lastName LIKE ? OR p.patientNumber LIKE ? OR t.chiefComplaint LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY t.createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching triage records:', error);
        res.status(500).json({ message: 'Error fetching triage records', error: error.message });
    }
});

/**
 * @route GET /api/triage/critical-vital-ranges
 * @description Get all critical vital sign range configurations
 */
router.get('/critical-vital-ranges', async (req, res) => {
    try {
        const query = `
            SELECT * FROM critical_vital_ranges
            WHERE isActive = 1
            ORDER BY vitalParameter
        `;
        const [rows] = await pool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching critical vital ranges:', error);
        res.status(500).json({ message: 'Error fetching critical vital ranges', error: error.message });
    }
});

/**
 * @route GET /api/triage/:id
 * @description Get a single triage record
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT t.*,
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Triage record not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching triage record:', error);
        res.status(500).json({ message: 'Error fetching triage record', error: error.message });
    }
});

/**
 * @route POST /api/triage
 * @description Create a new triage record
 */
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            patientId, chiefComplaint, temperature, bloodPressure, heartRate,
            respiratoryRate, oxygenSaturation, painLevel, priority, notes, triagedBy,
            assignedToDoctorId, assignedToDepartment, servicePoint
        } = req.body;

        // Validate required fields
        if (!patientId || !chiefComplaint) {
            await connection.rollback();
            return res.status(400).json({ message: 'Missing required fields: patientId, chiefComplaint' });
        }

        // triagedBy is required - use provided value or default to user 1 (system/admin)
        // In production, this should come from authenticated user session
        const triagedByUserId = triagedBy || req.user?.id || 1;

        // Parse blood pressure
        let systolicBP = null;
        let diastolicBP = null;
        if (bloodPressure && bloodPressure.includes('/')) {
            const bpParts = bloodPressure.split('/');
            const sys = parseInt(bpParts[0]);
            const dia = parseInt(bpParts[1]);
            systolicBP = !isNaN(sys) ? sys : null;
            diastolicBP = !isNaN(dia) ? dia : null;
        }

        // Map priority to triage category
        let triageCategory = 'green'; // Default to non-urgent
        let priorityLevel = 4;
        if (priority === 'Emergency') {
            triageCategory = 'red';
            priorityLevel = 1;
        } else if (priority === 'Urgent') {
            triageCategory = 'yellow';
            priorityLevel = 2;
        } else if (priority === 'Semi-urgent') {
            triageCategory = 'yellow';
            priorityLevel = 3;
        } else if (priority === 'Non-urgent') {
            triageCategory = 'green';
            priorityLevel = 4;
        }

        // Generate triage number using sequence table with proper locking
        // Since triageNumber has a GLOBAL UNIQUE constraint, we need to find the next available number
        // that doesn't exist in the entire table, not just for today
        let result;
        let triageNumber;
        const today = new Date().toISOString().split('T')[0];

        try {
            // Get the maximum triage number across ALL dates (due to global UNIQUE constraint)
            const [maxResult] = await connection.execute(
                `SELECT MAX(CAST(SUBSTRING(triageNumber, 5) AS UNSIGNED)) as maxNum
                 FROM triage_assessments
                 WHERE triageNumber LIKE 'TRI-%'`
            );

            let nextNum = (maxResult[0]?.maxNum || 0) + 1;
            triageNumber = `TRI-${String(nextNum).padStart(6, '0')}`;

            // Check if this number already exists (safety check)
            let attempts = 0;
            while (attempts < 100) {
                const [existing] = await connection.execute(
                    'SELECT triageId FROM triage_assessments WHERE triageNumber = ?',
                    [triageNumber]
                );

                if (existing.length === 0) {
                    break; // Number is available
                }
                // Number exists, try next one
                nextNum++;
                triageNumber = `TRI-${String(nextNum).padStart(6, '0')}`;
                attempts++;
            }

            if (attempts >= 100) {
                await connection.rollback();
                connection.release();
                return res.status(500).json({
                    message: 'Failed to generate unique triage number',
                    error: 'Please try again.'
                });
            }

            // Update sequence table for today (for tracking purposes)
            await connection.execute(
                `INSERT INTO triage_sequence (date_key, last_number)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE last_number = ?`,
                [today, nextNum, nextNum]
            );

            // Insert triage assessment
            [result] = await connection.execute(
                `INSERT INTO triage_assessments (
                    triageNumber, patientId, triageDate, chiefComplaint, triageCategory,
                    priorityLevel, status, notes, triagedBy, assignedToDoctorId, assignedToDepartment
                )
                VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?, ?, ?, ?)`,
                [
                    triageNumber,
                    patientId,
                    chiefComplaint,
                    triageCategory,
                    priorityLevel,
                    notes || null,
                    triagedByUserId,
                    assignedToDoctorId || null,
                    assignedToDepartment || null
                ]
            );

        } catch (insertError) {
            // Handle duplicate key error - find next available number
            if (insertError.code === 'ER_DUP_ENTRY' || insertError.errno === 1062) {
                try {
                    // Get max number and find next available
                    const [maxResult] = await connection.execute(
                        `SELECT MAX(CAST(SUBSTRING(triageNumber, 5) AS UNSIGNED)) as maxNum
                         FROM triage_assessments
                         WHERE triageNumber LIKE 'TRI-%'`
                    );

                    let retryNum = (maxResult[0]?.maxNum || 0) + 1;
                    let foundAvailable = false;
                    let retryAttempts = 0;

                    while (!foundAvailable && retryAttempts < 100) {
                        const testNumber = `TRI-${String(retryNum).padStart(6, '0')}`;
                        const [existing] = await connection.execute(
                            'SELECT triageId FROM triage_assessments WHERE triageNumber = ?',
                            [testNumber]
                        );

                        if (existing.length === 0) {
                            triageNumber = testNumber;
                            foundAvailable = true;
                        } else {
                            retryNum++;
                            retryAttempts++;
                        }
                    }

                    if (!foundAvailable) {
                        await connection.rollback();
                        connection.release();
                        return res.status(500).json({
                            message: 'Failed to generate unique triage number',
                            error: 'Please try again.'
                        });
                    }

                    // Update sequence
                    await connection.execute(
                        `INSERT INTO triage_sequence (date_key, last_number)
                         VALUES (?, ?)
                         ON DUPLICATE KEY UPDATE last_number = ?`,
                        [today, retryNum, retryNum]
                    );

                    // Retry insert
                    [result] = await connection.execute(
                        `INSERT INTO triage_assessments (
                            triageNumber, patientId, triageDate, chiefComplaint, triageCategory,
                            priorityLevel, status, notes, triagedBy, assignedToDoctorId, assignedToDepartment
                        )
                        VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?, ?, ?, ?)`,
                        [
                            triageNumber,
                            patientId,
                            chiefComplaint,
                            triageCategory,
                            priorityLevel,
                            notes || null,
                            triagedByUserId,
                            assignedToDoctorId || null,
                            assignedToDepartment || null
                        ]
                    );
                } catch (retryError) {
                    await connection.rollback();
                    connection.release();
                    console.error('Error retrying triage number generation:', retryError);
                    return res.status(500).json({
                        message: 'Failed to generate unique triage number',
                        error: 'Please try again.'
                    });
                }
            } else {
                throw insertError;
            }
        }

        const triageId = result.insertId;

        // Insert vital signs
        // Helper function to safely parse numbers, returning null for invalid values
        const safeParseInt = (value) => {
            if (!value || value === '' || value === null || value === undefined) return null;
            const parsed = parseInt(value);
            return !isNaN(parsed) ? parsed : null;
        };

        const safeParseFloat = (value) => {
            if (!value || value === '' || value === null || value === undefined) return null;
            const parsed = parseFloat(value);
            return !isNaN(parsed) ? parsed : null;
        };

        if (temperature || systolicBP || heartRate || respiratoryRate || oxygenSaturation || painLevel) {
            await connection.query(
                `INSERT INTO vital_signs (
                    patientId, recordedDate, systolicBP, diastolicBP, heartRate,
                    respiratoryRate, temperature, oxygenSaturation, painScore,
                    context, triageId, recordedBy
                )
                VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'triage', ?, ?)`,
                [
                    patientId,
                    systolicBP,
                    diastolicBP,
                    safeParseInt(heartRate),
                    safeParseInt(respiratoryRate),
                    safeParseFloat(temperature),
                    safeParseFloat(oxygenSaturation),
                    safeParseInt(painLevel),
                    triageId,
                    triagedByUserId
                ]
            );
        }

        // Determine queue priority based on triage category
        let queuePriority = 'normal';
        if (triageCategory === 'red') queuePriority = 'emergency';
        else if (triageCategory === 'yellow') queuePriority = 'urgent';

        // Create invoice for consultation charges and cashier queue entry
        try {
            // Get consultation charge (General Consultation)
            const [consultationCharges] = await connection.execute(
                `SELECT chargeId, cost, name
                 FROM service_charges
                 WHERE name LIKE '%Consultation%' AND status = 'Active'
                 ORDER BY chargeId ASC
                 LIMIT 1`
            );

            if (consultationCharges.length > 0) {
                const consultationCharge = consultationCharges[0];
                const consultationCost = parseFloat(consultationCharge.cost) || 0;

                if (consultationCost > 0) {
                    // Generate invoice number (same approach as triage numbers to avoid duplicates)
                    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                    const datePrefix = `INV-${today}-`;

                    // Get the maximum invoice number for today (extract the numeric part after last dash)
                    const [maxResult] = await connection.execute(
                        `SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNumber, '-', -1) AS UNSIGNED)) as maxNum
                         FROM invoices
                         WHERE invoiceNumber LIKE CONCAT(?, '%')`,
                        [datePrefix]
                    );

                    let nextNum = (maxResult[0]?.maxNum || 0) + 1;
                    let invoiceNumber = `${datePrefix}${String(nextNum).padStart(4, '0')}`;

                    // Check if this number already exists (safety check for race conditions)
                    let attempts = 0;
                    while (attempts < 100) {
                        const [existing] = await connection.execute(
                            'SELECT invoiceId FROM invoices WHERE invoiceNumber = ?',
                            [invoiceNumber]
                        );

                        if (existing.length === 0) {
                            break; // Number is available
                        }
                        // Number exists, try next one
                        nextNum++;
                        invoiceNumber = `${datePrefix}${String(nextNum).padStart(4, '0')}`;
                        attempts++;
                    }

                    if (attempts >= 100) {
                        await connection.rollback();
                        connection.release();
                        return res.status(500).json({
                            message: 'Failed to generate unique invoice number',
                            error: 'Please try again.'
                        });
                    }

                    // Create invoice (with retry on duplicate key error)
                    let invoiceResult;
                    try {
                        [invoiceResult] = await connection.execute(
                            `INSERT INTO invoices (invoiceNumber, patientId, invoiceDate, totalAmount, balance, status, notes, createdBy)
                             VALUES (?, ?, CURDATE(), ?, ?, 'pending', ?, ?)`,
                            [
                                invoiceNumber,
                                patientId,
                                consultationCost,
                                consultationCost,
                                `Consultation charge from triage ${triageNumber}`,
                                triagedByUserId
                            ]
                        );
                    } catch (insertError) {
                        // Handle duplicate key error - find next available number
                        if (insertError.code === 'ER_DUP_ENTRY' || insertError.errno === 1062) {
                            // Get max number and find next available
                            const [retryMaxResult] = await connection.execute(
                                `SELECT MAX(CAST(SUBSTRING_INDEX(invoiceNumber, '-', -1) AS UNSIGNED)) as maxNum
                                 FROM invoices
                                 WHERE invoiceNumber LIKE CONCAT(?, '%')`,
                                [datePrefix]
                            );

                            let retryNum = (retryMaxResult[0]?.maxNum || 0) + 1;
                            let foundAvailable = false;
                            let retryAttempts = 0;

                            while (!foundAvailable && retryAttempts < 100) {
                                const testNumber = `${datePrefix}${String(retryNum).padStart(4, '0')}`;
                                const [existing] = await connection.execute(
                                    'SELECT invoiceId FROM invoices WHERE invoiceNumber = ?',
                                    [testNumber]
                                );

                                if (existing.length === 0) {
                                    invoiceNumber = testNumber;
                                    foundAvailable = true;
                                } else {
                                    retryNum++;
                                    retryAttempts++;
                                }
                            }

                            if (!foundAvailable) {
                                await connection.rollback();
                                connection.release();
                                return res.status(500).json({
                                    message: 'Failed to generate unique invoice number',
                                    error: 'Please try again.'
                                });
                            }

                            // Retry insert with new number
                            [invoiceResult] = await connection.execute(
                                `INSERT INTO invoices (invoiceNumber, patientId, invoiceDate, totalAmount, balance, status, notes, createdBy)
                                 VALUES (?, ?, CURDATE(), ?, ?, 'pending', ?, ?)`,
                                [
                                    invoiceNumber,
                                    patientId,
                                    consultationCost,
                                    consultationCost,
                                    `Consultation charge from triage ${triageNumber}`,
                                    triagedByUserId
                                ]
                            );
                        } else {
                            throw insertError; // Re-throw if it's not a duplicate key error
                        }
                    }

                    const invoiceId = invoiceResult.insertId;

                    // Add invoice item
                    await connection.execute(
                        `INSERT INTO invoice_items (invoiceId, chargeId, description, quantity, unitPrice, totalPrice)
                         VALUES (?, ?, ?, 1, ?, ?)`,
                        [
                            invoiceId,
                            consultationCharge.chargeId,
                            consultationCharge.name,
                            consultationCost,
                            consultationCost
                        ]
                    );

                    // Create cashier queue entry for consultation fees payment
                    // Check if patient already exists in cashier queue (any active entry)
                    const [existingCashier] = await connection.execute(
                        `SELECT queueId FROM queue_entries
                         WHERE patientId = ? AND servicePoint = 'cashier'
                         AND status IN ('waiting', 'called', 'serving')`,
                        [patientId]
                    );

                    if (existingCashier.length === 0) {
                        // Generate ticket number for cashier queue
                        const [cashierCount] = await connection.execute(
                            'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "cashier"'
                        );
                        const cashierTicketNum = cashierCount[0].count + 1;
                        const cashierTicketNumber = `C-${String(cashierTicketNum).padStart(3, '0')}`;

                        // Create queue entry for cashier (consultation fees payment)
                        await connection.execute(
                            `INSERT INTO queue_entries
                            (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                            VALUES (?, ?, 'cashier', ?, 'waiting', ?, ?)`,
                            [
                                patientId,
                                cashierTicketNumber,
                                queuePriority,
                                `Consultation fees payment - Triage: ${triageNumber}`,
                                triagedByUserId
                            ]
                        );
                    }
                }
            }
        } catch (invoiceError) {
            // Log error but don't fail the triage creation
            console.error('Error creating consultation invoice:', invoiceError);
            // Optionally, you could rollback here if invoice creation is critical
            // await connection.rollback();
            // return res.status(500).json({ message: 'Error creating invoice', error: invoiceError.message });
        }

        // Note: Consultation queue entry will be created automatically when consultation fee invoice is paid
        // See billingRoutes.js payment endpoint for consultation queue creation logic

        await connection.commit();

        // Fetch the created record
        const [newTriage] = await connection.query(
            `SELECT t.*,
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [triageId]
        );

        res.status(201).json(newTriage[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating triage record:', error);
        res.status(500).json({ message: 'Error creating triage record', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/triage/:id
 * @description Update a triage record
 */
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            chiefComplaint, temperature, bloodPressure, heartRate,
            respiratoryRate, oxygenSaturation, painLevel, priority, status, notes
        } = req.body;

        // Check if triage exists
        const [existing] = await connection.query(
            'SELECT * FROM triage_assessments WHERE triageId = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Triage record not found' });
        }

        // Parse blood pressure if provided
        let systolicBP = existing[0].systolicBP;
        let diastolicBP = existing[0].diastolicBP;
        if (bloodPressure && bloodPressure.includes('/')) {
            const bpParts = bloodPressure.split('/');
            const sys = parseInt(bpParts[0]);
            const dia = parseInt(bpParts[1]);
            systolicBP = !isNaN(sys) ? sys : null;
            diastolicBP = !isNaN(dia) ? dia : null;
        }

        // Build update query for triage_assessments
        const updates = [];
        const values = [];

        if (chiefComplaint !== undefined) {
            updates.push('chiefComplaint = ?');
            values.push(chiefComplaint);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || null);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        // Update vital signs if provided
        if (temperature !== undefined || bloodPressure !== undefined || heartRate !== undefined ||
            respiratoryRate !== undefined || oxygenSaturation !== undefined || painLevel !== undefined) {
            const [vitalExists] = await connection.query(
                'SELECT vitalSignId FROM vital_signs WHERE triageId = ?',
                [id]
            );

            if (vitalExists.length > 0) {
                // Update existing vital signs
                // Helper functions to safely parse numbers
                const safeParseInt = (value) => {
                    if (!value || value === '' || value === null || value === undefined) return null;
                    const parsed = parseInt(value);
                    return !isNaN(parsed) ? parsed : null;
                };

                const safeParseFloat = (value) => {
                    if (!value || value === '' || value === null || value === undefined) return null;
                    const parsed = parseFloat(value);
                    return !isNaN(parsed) ? parsed : null;
                };

                const vitalUpdates = [];
                const vitalValues = [];
                if (temperature !== undefined) {
                    vitalUpdates.push('temperature = ?');
                    vitalValues.push(safeParseFloat(temperature));
                }
                if (bloodPressure !== undefined) {
                    vitalUpdates.push('systolicBP = ?, diastolicBP = ?');
                    vitalValues.push(systolicBP, diastolicBP);
                }
                if (heartRate !== undefined) {
                    vitalUpdates.push('heartRate = ?');
                    vitalValues.push(safeParseInt(heartRate));
                }
                if (respiratoryRate !== undefined) {
                    vitalUpdates.push('respiratoryRate = ?');
                    vitalValues.push(safeParseInt(respiratoryRate));
                }
                if (oxygenSaturation !== undefined) {
                    vitalUpdates.push('oxygenSaturation = ?');
                    vitalValues.push(safeParseFloat(oxygenSaturation));
                }
                if (painLevel !== undefined) {
                    vitalUpdates.push('painScore = ?');
                    vitalValues.push(safeParseInt(painLevel));
                }
                if (vitalUpdates.length > 0) {
                    vitalValues.push(id);
                    await connection.query(
                        `UPDATE vital_signs SET ${vitalUpdates.join(', ')} WHERE triageId = ?`,
                        vitalValues
                    );
                }
            } else {
                // Insert new vital signs
                // Helper functions to safely parse numbers
                const safeParseInt = (value) => {
                    if (!value || value === '' || value === null || value === undefined) return null;
                    const parsed = parseInt(value);
                    return !isNaN(parsed) ? parsed : null;
                };

                const safeParseFloat = (value) => {
                    if (!value || value === '' || value === null || value === undefined) return null;
                    const parsed = parseFloat(value);
                    return !isNaN(parsed) ? parsed : null;
                };

                await connection.query(
                    `INSERT INTO vital_signs (
                        patientId, recordedDate, systolicBP, diastolicBP, heartRate,
                        respiratoryRate, temperature, oxygenSaturation, painScore,
                        context, triageId, recordedBy
                    )
                    VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'triage', ?, ?)`,
                    [
                        existing[0].patientId,
                        systolicBP,
                        diastolicBP,
                        safeParseInt(heartRate),
                        safeParseInt(respiratoryRate),
                        safeParseFloat(temperature),
                        safeParseFloat(oxygenSaturation),
                        safeParseInt(painLevel),
                        id,
                        existing[0].triagedBy
                    ]
                );
            }
        }

        // Map priority to triage category if priority is being updated
        if (priority !== undefined) {
            let triageCategory = 'green';
            if (priority === 'Emergency') {
                triageCategory = 'red';
            } else if (priority === 'Urgent') {
                triageCategory = 'yellow';
            } else if (priority === 'Semi-urgent') {
                triageCategory = 'yellow';
            } else if (priority === 'Non-urgent') {
                triageCategory = 'green';
            }
            updates.push('triageCategory = ?');
            values.push(triageCategory);
            updates.push('priorityLevel = ?');
            values.push(priority === 'Emergency' ? 1 : priority === 'Urgent' ? 2 : priority === 'Semi-urgent' ? 3 : 4);
        }

        if (updates.length > 0) {
            values.push(id);
            await connection.query(
                `UPDATE triage_assessments SET ${updates.join(', ')} WHERE triageId = ?`,
                values
            );
        }

        // Note: Consultation queue entry will be created automatically when consultation fee invoice is paid
        // See billingRoutes.js payment endpoint for consultation queue creation logic

        await connection.commit();

        // Fetch updated record
        const [updated] = await connection.query(
            `SELECT t.*,
                    p.patientId, p.firstName, p.lastName, p.patientNumber,
                    u.firstName as triagedByFirstName, u.lastName as triagedByLastName,
                    vs.systolicBP, vs.diastolicBP, vs.heartRate, vs.respiratoryRate,
                    vs.temperature, vs.oxygenSaturation, vs.painScore as painLevel
             FROM triage_assessments t
             LEFT JOIN patients p ON t.patientId = p.patientId
             LEFT JOIN users u ON t.triagedBy = u.userId
             LEFT JOIN vital_signs vs ON t.triageId = vs.triageId
             WHERE t.triageId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating triage record:', error);
        res.status(500).json({ message: 'Error updating triage record', error: error.message });
    } finally {
        connection.release();
    }
});
module.exports = router;
