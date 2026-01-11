// Pharmacy routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/pharmacy/medications
 * @description Get all medications
 */
router.get('/medications', async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM medications WHERE voided = 0';
        const params = [];

        if (search) {
            query += ` AND (name LIKE ? OR genericName LIKE ? OR medicationCode LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ message: 'Error fetching medications', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/medications/:id
 * @description Get a single medication by ID
 */
router.get('/medications/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ? AND voided = 0',
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Medication not found' });
        }
    } catch (error) {
        console.error('Error fetching medication:', error);
        res.status(500).json({ message: 'Error fetching medication', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/medications
 * @description Create a new medication
 */
router.post('/medications', async (req, res) => {
    try {
        const medicationData = req.body;
        const [result] = await pool.execute(
            `INSERT INTO medications (medicationCode, name, genericName, dosageForm, strength, category, manufacturer, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                medicationData.medicationCode || null,
                medicationData.name || medicationData.medicationName || null,
                medicationData.genericName || null,
                medicationData.dosageForm || null,
                medicationData.strength || null,
                medicationData.category || null,
                medicationData.manufacturer || null,
                medicationData.description || null
            ]
        );

        const [newMedication] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [result.insertId]
        );

        res.status(201).json(newMedication[0]);
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ message: 'Error creating medication', error: error.message });
    }
});

/**
 * @route PUT /api/pharmacy/medications/:id
 * @description Update a medication
 */
router.put('/medications/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];
        const medicationData = req.body;

        // Map fields correctly (medicationName -> name)
        if (medicationData.name !== undefined) {
            updates.push('name = ?');
            values.push(medicationData.name);
        } else if (medicationData.medicationName !== undefined) {
            updates.push('name = ?');
            values.push(medicationData.medicationName);
        }

        if (medicationData.medicationCode !== undefined) {
            updates.push('medicationCode = ?');
            values.push(medicationData.medicationCode || null);
        }
        if (medicationData.genericName !== undefined) {
            updates.push('genericName = ?');
            values.push(medicationData.genericName || null);
        }
        if (medicationData.dosageForm !== undefined) {
            updates.push('dosageForm = ?');
            values.push(medicationData.dosageForm || null);
        }
        if (medicationData.strength !== undefined) {
            updates.push('strength = ?');
            values.push(medicationData.strength || null);
        }
        if (medicationData.category !== undefined) {
            updates.push('category = ?');
            values.push(medicationData.category || null);
        }
        if (medicationData.manufacturer !== undefined) {
            updates.push('manufacturer = ?');
            values.push(medicationData.manufacturer || null);
        }
        if (medicationData.description !== undefined) {
            updates.push('description = ?');
            values.push(medicationData.description || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);

        await pool.execute(
            `UPDATE medications SET ${updates.join(', ')}, updatedAt = NOW() WHERE medicationId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [req.params.id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating medication:', error);
        res.status(500).json({ message: 'Error updating medication', error: error.message });
    }
});

/**
 * @route DELETE /api/pharmacy/medications/:id
 * @description Soft delete a medication (set voided = 1)
 */
router.delete('/medications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if medication exists
        const [existing] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Medication not found' });
        }

        // Soft delete: set voided = 1
        await pool.execute(
            'UPDATE medications SET voided = 1, updatedAt = NOW() WHERE medicationId = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Medication deleted successfully',
            medicationId: id
        });
    } catch (error) {
        console.error('Error deleting medication:', error);
        res.status(500).json({ message: 'Error deleting medication', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions
 * @description Get all prescriptions
 */
router.get('/prescriptions', async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, 
                   pt.firstName, pt.lastName, pt.patientNumber,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM prescriptions p
            LEFT JOIN patients pt ON p.patientId = pt.patientId
            LEFT JOIN users u ON p.doctorId = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            query += ` AND p.patientId = ?`;
            params.push(patientId);
        }

        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY p.prescriptionDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions/:id
 * @description Get a prescription with items
 */
router.get('/prescriptions/:id', async (req, res) => {
    try {
        const [prescription] = await pool.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [req.params.id]
        );

        if (prescription.length === 0) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Get prescription items with medication info
        const [items] = await pool.execute(
            `SELECT pi.*, m.name as medicationNameFromCatalog, m.genericName
             FROM prescription_items pi
             LEFT JOIN medications m ON pi.medicationId = m.medicationId
             WHERE pi.prescriptionId = ?
             ORDER BY pi.itemId`,
            [req.params.id]
        );

        // Get pricing from drug_inventory for each medication
        // Use the minimum sellPrice if multiple batches exist
        const itemsWithPricing = await Promise.all(items.map(async (item) => {
            if (!item.medicationId) {
                return { ...item, sellPrice: null, unitPrice: null, inInventory: false };
            }

            try {
                const [pricing] = await pool.execute(
                    `SELECT MIN(di.sellPrice) as minSellPrice, AVG(di.sellPrice) as avgSellPrice,
                            MIN(di.unitPrice) as minUnitPrice, SUM(di.quantity) as totalQuantity
                     FROM drug_inventory di
                     WHERE di.medicationId = ? AND di.quantity > 0
                     GROUP BY di.medicationId`,
                    [item.medicationId]
                );

                if (pricing.length > 0 && pricing[0].minSellPrice) {
                    return {
                        ...item,
                        sellPrice: parseFloat(pricing[0].minSellPrice),
                        unitPrice: pricing[0].minUnitPrice ? parseFloat(pricing[0].minUnitPrice) : null,
                        inInventory: true,
                        availableQuantity: pricing[0].totalQuantity ? parseInt(pricing[0].totalQuantity) : 0
                    };
                }
            } catch (error) {
                console.error(`Error fetching pricing for medication ${item.medicationId}:`, error);
            }

            return { ...item, sellPrice: null, unitPrice: null, inInventory: false };
        }));

        res.status(200).json({
            ...prescription[0],
            items: itemsWithPricing
        });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ message: 'Error fetching prescription', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/prescriptions
 * @description Create a new prescription
 */
router.post('/prescriptions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { prescriptionNumber, patientId, doctorId, prescriptionDate, status, notes, items } = req.body;
        const userId = req.user?.id;

        // Generate prescription number if not provided
        let prescNumber = prescriptionNumber;
        if (!prescNumber) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM prescriptions');
            prescNumber = `PRES-${String(count[0].count + 1).padStart(6, '0')}`;
        }

        // Insert prescription
        const [result] = await connection.execute(
            `INSERT INTO prescriptions (prescriptionNumber, patientId, doctorId, prescriptionDate, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [prescNumber, patientId, doctorId, prescriptionDate || new Date(), status || 'pending', notes]
        );

        const prescriptionId = result.insertId;

        // Get doctor and patient names for notifications
        let doctorName = 'Unknown Doctor';
        let patientName = 'Unknown Patient';
        try {
            const [doctorRows] = await connection.execute(
                'SELECT firstName, lastName FROM users WHERE userId = ?',
                [doctorId]
            );
            if (doctorRows.length > 0 && doctorRows[0].firstName) {
                doctorName = `Dr. ${doctorRows[0].firstName} ${doctorRows[0].lastName || ''}`.trim();
            }
        } catch (error) {
            console.error('Error fetching doctor name:', error);
        }
        
        try {
            const [patientRows] = await connection.execute(
                'SELECT firstName, lastName FROM patients WHERE patientId = ?',
                [patientId]
            );
            if (patientRows.length > 0 && patientRows[0].firstName) {
                patientName = `${patientRows[0].firstName} ${patientRows[0].lastName || ''}`.trim();
            }
        } catch (error) {
            console.error('Error fetching patient name:', error);
        }

        // Insert prescription items and check for missing drugs in inventory
        if (items && items.length > 0) {
            for (const item of items) {
                // Get medication name for storage
                let medicationName = 'Unknown';
                if (item.medicationId) {
                    try {
                        const [medRows] = await connection.execute(
                            'SELECT name FROM medications WHERE medicationId = ?',
                            [item.medicationId]
                        );
                        if (medRows.length > 0 && medRows[0].name) {
                            medicationName = medRows[0].name;
                        }
                    } catch (medError) {
                        console.error('Error fetching medication name:', medError);
                    }
                }
                
                // Ensure all required fields are present
                const medicationIdNum = item.medicationId ? (isNaN(parseInt(item.medicationId)) ? null : parseInt(item.medicationId)) : null;
                const quantityNum = item.quantity ? (isNaN(parseInt(item.quantity)) ? null : parseInt(item.quantity)) : null;
                
                const insertData = [
                    prescriptionId,
                    medicationIdNum,
                    medicationName,
                    item.dosage || '',
                    item.frequency || '',
                    item.duration || '',
                    quantityNum,
                    item.instructions || null
                ];
                
                const [itemResult] = await connection.execute(
                    `INSERT INTO prescription_items (prescriptionId, medicationId, medicationName, dosage, frequency, duration, quantity, instructions)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    insertData
                );
                
                const prescriptionItemId = itemResult.insertId;
                
                // Check if medication is in drug_inventory
                if (medicationIdNum) {
                    try {
                        const [inventoryCheck] = await connection.execute(
                            `SELECT COUNT(*) as count FROM drug_inventory 
                             WHERE medicationId = ? AND quantity > 0`,
                            [medicationIdNum]
                        );
                        
                        // If medication is not in inventory, create a notification
                        if (inventoryCheck.length > 0 && inventoryCheck[0].count === 0) {
                            const message = `${medicationName} was prescribed by ${doctorName} for ${patientName} but is not available in drug inventory.`;
                            
                            await connection.execute(
                                `INSERT INTO drug_notifications 
                                 (medicationId, medicationName, prescriptionId, prescriptionItemId, doctorId, doctorName, patientId, patientName, status, priority, message)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'medium', ?)`,
                                [
                                    medicationIdNum,
                                    medicationName,
                                    prescriptionId,
                                    prescriptionItemId,
                                    doctorId,
                                    doctorName,
                                    patientId,
                                    patientName,
                                    message
                                ]
                            );
                        }
                    } catch (notificationError) {
                        console.error('Error checking inventory or creating notification:', notificationError);
                        // Don't fail the prescription creation if notification creation fails
                    }
                }
            }
        }

        // After prescription creation, create invoice and queue entry for cashier (drug payment)
        // Only create if prescription has items with quantity (drugs in inventory)
        const itemsWithQuantity = items.filter(item => item.quantity !== null && item.quantity > 0);
        const hasItemsInInventory = itemsWithQuantity.length > 0;
        
        if (hasItemsInInventory) {
            // Calculate total amount for invoice by getting prices from drug_inventory
            let totalAmount = 0;
            const invoiceItems = [];

            for (const item of itemsWithQuantity) {
                if (item.medicationId) {
                    try {
                        // Get the oldest batch (FIFO - First In First Out by receipt date) from drug_inventory for this medication
                        // Select the batch that was received first (earliest receipt transaction date)
                        const [oldestBatch] = await connection.execute(
                            `SELECT 
                                di.drugInventoryId, 
                                di.sellPrice, 
                                di.batchNumber, 
                                di.expiryDate, 
                                di.quantity,
                                di.unitPrice,
                                -- Get first receipt date for FIFO ordering
                                COALESCE(
                                    (SELECT MIN(transactionDate) 
                                     FROM drug_inventory_transactions 
                                     WHERE drugInventoryId = di.drugInventoryId 
                                     AND transactionType = 'RECEIPT'),
                                    di.createdAt
                                ) as firstReceiptDate
                             FROM drug_inventory di
                             WHERE di.medicationId = ? 
                               AND di.quantity > 0
                               AND di.status = 'active'
                               AND (di.expiryDate IS NULL OR di.expiryDate >= CURDATE())
                             -- FIFO: Order by first receipt date (oldest first), then by expiry date
                             ORDER BY 
                                COALESCE(
                                    (SELECT MIN(transactionDate) 
                                     FROM drug_inventory_transactions 
                                     WHERE drugInventoryId = di.drugInventoryId 
                                     AND transactionType = 'RECEIPT'),
                                    di.createdAt
                                ) ASC,
                                di.expiryDate ASC
                             LIMIT 1`,
                            [item.medicationId]
                        );

                        if (oldestBatch.length > 0 && oldestBatch[0].drugInventoryId) {
                            const batch = oldestBatch[0];
                            const unitPrice = parseFloat(batch.sellPrice);
                            const quantity = parseInt(item.quantity);
                            const itemTotal = unitPrice * quantity;
                            totalAmount += itemTotal;

                            // Get medication name
                            let medicationName = item.medicationName || 'Unknown';
                            if (!medicationName || medicationName === 'Unknown') {
                                const [medRows] = await connection.execute(
                                    'SELECT name FROM medications WHERE medicationId = ?',
                                    [item.medicationId]
                                );
                                if (medRows.length > 0 && medRows[0].name) {
                                    medicationName = medRows[0].name;
                                }
                            }

                            invoiceItems.push({
                                medicationId: item.medicationId,
                                description: `Prescription Item: ${medicationName}`,
                                quantity: quantity,
                                unitPrice: unitPrice,
                                totalPrice: itemTotal,
                                drugInventoryId: batch.drugInventoryId // Store the selected batch for dispensing
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching pricing for medication ${item.medicationId}:`, error);
                    }
                }
            }

            // Create invoice if we have items with pricing
            if (invoiceItems.length > 0 && totalAmount > 0) {
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
                            totalAmount,
                            totalAmount, // balance = totalAmount initially
                            `Drug payment - Prescription: ${prescNumber}`,
                            userId || null
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
                                totalAmount,
                                totalAmount,
                                `Drug payment - Prescription: ${prescNumber}`,
                                userId || null
                            ]
                        );
                    } else {
                        throw insertError; // Re-throw if it's not a duplicate key error
                    }
                }

                const invoiceId = invoiceResult.insertId;

                // Create invoice items with selected batch (drugInventoryId)
                for (const invoiceItem of invoiceItems) {
                    await connection.execute(
                        `INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, totalPrice, drugInventoryId)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            invoiceId,
                            invoiceItem.description,
                            invoiceItem.quantity,
                            invoiceItem.unitPrice,
                            invoiceItem.totalPrice,
                            invoiceItem.drugInventoryId || null
                        ]
                    );
                }

                // Generate ticket number for cashier queue
                const [cashierCount] = await connection.execute(
                    'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "cashier"'
                );
                const cashierTicketNum = cashierCount[0].count + 1;
                const cashierTicketNumber = `C-${String(cashierTicketNum).padStart(3, '0')}`;

                // Create queue entry for cashier (drug payment)
                await connection.execute(
                    `INSERT INTO queue_entries 
                    (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                    VALUES (?, ?, 'cashier', 'normal', 'waiting', ?, ?)`,
                    [
                        patientId,
                        cashierTicketNumber,
                        `Drug payment - Prescription: ${prescNumber}`,
                        userId || null
                    ]
                );
            }
        }

        await connection.commit();

        const [newPrescription] = await connection.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [prescriptionId]
        );

        res.status(201).json(newPrescription[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Error creating prescription', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/pharmacy/prescriptions/:id
 * @description Update a prescription
 */
router.put('/prescriptions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { status, notes, patientId, doctorId, prescriptionDate, items } = req.body;
        const userId = req.user?.id || req.user?.userId || null;

        // Get existing prescription
        const [existing] = await connection.execute(
            'SELECT * FROM prescriptions WHERE prescriptionId = ?',
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Prescription not found' });
        }

        const oldPrescription = existing[0];

        // Build update query
        const updates = [];
        const values = [];
        const historyEntries = [];

        // Track changes for history
        if (status !== undefined && status !== oldPrescription.status) {
            updates.push('status = ?');
            values.push(status);
            historyEntries.push({
                fieldName: 'status',
                oldValue: oldPrescription.status,
                newValue: status
            });
        }

        if (notes !== undefined && notes !== oldPrescription.notes) {
            updates.push('notes = ?');
            values.push(notes);
            historyEntries.push({
                fieldName: 'notes',
                oldValue: oldPrescription.notes || '',
                newValue: notes || ''
            });
        }

        if (patientId !== undefined && patientId !== oldPrescription.patientId) {
            updates.push('patientId = ?');
            values.push(patientId);
            historyEntries.push({
                fieldName: 'patientId',
                oldValue: oldPrescription.patientId?.toString() || '',
                newValue: patientId?.toString() || ''
            });
        }

        if (doctorId !== undefined && doctorId !== oldPrescription.doctorId) {
            updates.push('doctorId = ?');
            values.push(doctorId);
            historyEntries.push({
                fieldName: 'doctorId',
                oldValue: oldPrescription.doctorId?.toString() || '',
                newValue: doctorId?.toString() || ''
            });
        }

        if (prescriptionDate !== undefined && prescriptionDate !== oldPrescription.prescriptionDate) {
            updates.push('prescriptionDate = ?');
            values.push(prescriptionDate);
            historyEntries.push({
                fieldName: 'prescriptionDate',
                oldValue: oldPrescription.prescriptionDate || '',
                newValue: prescriptionDate || ''
            });
        }

        // Update prescription if there are changes
        if (updates.length > 0) {
            values.push(id);
            await connection.execute(
                `UPDATE prescriptions SET ${updates.join(', ')}, updatedAt = NOW() WHERE prescriptionId = ?`,
                values
            );

            // Record history
            for (const entry of historyEntries) {
                await connection.execute(
                    `INSERT INTO prescription_history (prescriptionId, fieldName, oldValue, newValue, changedBy, changeType)
                     VALUES (?, ?, ?, ?, ?, 'update')`,
                    [id, entry.fieldName, entry.oldValue, entry.newValue, userId]
                );
            }
        }

        // Handle items updates if provided
        if (items && Array.isArray(items)) {
            // Get existing items
            const [existingItems] = await connection.execute(
                'SELECT * FROM prescription_items WHERE prescriptionId = ?',
                [id]
            );

            // Delete removed items
            const newItemIds = items.filter(item => item.itemId).map(item => item.itemId);
            const itemsToDelete = existingItems.filter(item => !newItemIds.includes(item.itemId));
            
            for (const item of itemsToDelete) {
                await connection.execute(
                    `INSERT INTO prescription_items_history (itemId, prescriptionId, fieldName, oldValue, newValue, changedBy, changeType)
                     VALUES (?, ?, 'item', ?, ?, ?, 'delete')`,
                    [item.itemId, id, JSON.stringify(item), '', userId]
                );
                await connection.execute('DELETE FROM prescription_items WHERE itemId = ?', [item.itemId]);
            }

            // Update or insert items
            for (const item of items) {
                let medicationName = item.medicationName || 'Unknown';
                if (item.medicationId && !medicationName) {
                    const [medRows] = await connection.execute(
                        'SELECT name FROM medications WHERE medicationId = ?',
                        [item.medicationId]
                    );
                    if (medRows.length > 0) {
                        medicationName = medRows[0].name;
                    }
                }

                if (item.itemId) {
                    // Update existing item
                    const existingItem = existingItems.find(ei => ei.itemId === item.itemId);
                    if (existingItem) {
                        const itemUpdates = [];
                        const itemValues = [];
                        const itemHistoryEntries = [];

                        const fieldsToCheck = ['medicationId', 'medicationName', 'dosage', 'frequency', 'duration', 'quantity', 'instructions', 'status'];
                        for (const field of fieldsToCheck) {
                            if (item[field] !== undefined && item[field] !== existingItem[field]) {
                                itemUpdates.push(`${field} = ?`);
                                itemValues.push(item[field] === null ? null : item[field]);
                                itemHistoryEntries.push({
                                    fieldName: field,
                                    oldValue: existingItem[field]?.toString() || '',
                                    newValue: item[field]?.toString() || ''
                                });
                            }
                        }

                        if (itemUpdates.length > 0) {
                            itemValues.push(item.itemId);
                            await connection.execute(
                                `UPDATE prescription_items SET ${itemUpdates.join(', ')}, updatedAt = NOW() WHERE itemId = ?`,
                                itemValues
                            );

                            // Record item history
                            for (const entry of itemHistoryEntries) {
                                await connection.execute(
                                    `INSERT INTO prescription_items_history (itemId, prescriptionId, fieldName, oldValue, newValue, changedBy, changeType)
                                     VALUES (?, ?, ?, ?, ?, ?, 'update')`,
                                    [item.itemId, id, entry.fieldName, entry.oldValue, entry.newValue, userId]
                                );
                            }
                        }
                    }
                } else {
                    // Insert new item
                    const [result] = await connection.execute(
                        `INSERT INTO prescription_items (prescriptionId, medicationId, medicationName, dosage, frequency, duration, quantity, instructions, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            id,
                            item.medicationId || null,
                            medicationName,
                            item.dosage || '',
                            item.frequency || '',
                            item.duration || '',
                            item.quantity || null,
                            item.instructions || null,
                            item.status || 'pending'
                        ]
                    );

                    // Record creation in history
                    await connection.execute(
                        `INSERT INTO prescription_items_history (itemId, prescriptionId, fieldName, oldValue, newValue, changedBy, changeType)
                         VALUES (?, ?, 'item', '', ?, ?, 'create')`,
                        [result.insertId, id, JSON.stringify(item), userId]
                    );
                }
            }
        }

        await connection.commit();

        // Get updated prescription with joined data
        const [updated] = await connection.execute(
            `SELECT p.*, 
                    pt.firstName, pt.lastName, pt.patientNumber,
                    u.firstName as doctorFirstName, u.lastName as doctorLastName
             FROM prescriptions p
             LEFT JOIN patients pt ON p.patientId = pt.patientId
             LEFT JOIN users u ON p.doctorId = u.userId
             WHERE p.prescriptionId = ?`,
            [id]
        );

        connection.release();
        res.status(200).json(updated[0]);
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Error updating prescription', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/inventory
 * @description Get pharmacy inventory
 */
router.get('/inventory', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT pi.*, m.name as medicationName, m.medicationCode, m.genericName
             FROM pharmacy_inventory pi
             LEFT JOIN medications m ON pi.medicationId = m.medicationId
             ORDER BY m.name`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching pharmacy inventory:', error);
        res.status(500).json({ message: 'Error fetching pharmacy inventory', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory
 * @description Get all drug inventory items
 */
router.get('/drug-inventory', async (req, res) => {
    try {
        const { medicationId, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT di.*, 
                   m.name as medicationName, 
                   m.medicationCode, 
                   m.genericName,
                   m.dosageForm,
                   m.strength
            FROM drug_inventory di
            LEFT JOIN medications m ON di.medicationId = m.medicationId
            WHERE 1=1
        `;
        const params = [];

        if (medicationId) {
            query += ` AND di.medicationId = ?`;
            params.push(medicationId);
        }

        if (search) {
            query += ` AND (m.name LIKE ? OR m.genericName LIKE ? OR di.batchNumber LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY di.expiryDate ASC, m.name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching drug inventory:', error);
        res.status(500).json({ message: 'Error fetching drug inventory', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/:id
 * @description Get a single drug inventory item by ID
 */
router.get('/drug-inventory/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT di.*, 
                    m.name as medicationName, 
                    m.medicationCode, 
                    m.genericName,
                    m.dosageForm,
                    m.strength
             FROM drug_inventory di
             LEFT JOIN medications m ON di.medicationId = m.medicationId
             WHERE di.drugInventoryId = ?`,
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Drug inventory item not found' });
        }
    } catch (error) {
        console.error('Error fetching drug inventory item:', error);
        res.status(500).json({ message: 'Error fetching drug inventory item', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/drug-inventory
 * @description Create a new drug inventory item
 */
router.post('/drug-inventory', async (req, res) => {
    try {
        const {
            medicationId,
            batchNumber,
            quantity,
            unitPrice,
            manufactureDate,
            expiryDate,
            minPrice,
            sellPrice,
            location,
            notes
        } = req.body;

        if (!medicationId || !batchNumber || !expiryDate || !sellPrice) {
            return res.status(400).json({ message: 'Missing required fields: medicationId, batchNumber, expiryDate, sellPrice' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const userId = req.user?.id || req.user?.userId || null;
            const receivedQuantity = quantity || 0;
            const transactionDate = new Date().toISOString().split('T')[0];

            // Insert new drug inventory record
            // Store originalQuantity and set status to 'active'
            const [result] = await connection.execute(
                `INSERT INTO drug_inventory 
                 (medicationId, batchNumber, quantity, originalQuantity, unitPrice, manufactureDate, expiryDate, minPrice, sellPrice, location, notes, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    medicationId,
                    batchNumber,
                    receivedQuantity,
                    receivedQuantity, // Store original quantity for history tracking
                    unitPrice || 0,
                    manufactureDate || null,
                    expiryDate,
                    minPrice || null,
                    sellPrice,
                    location || null,
                    notes || null
                ]
            );

            const drugInventoryId = result.insertId;

            // Record RECEIPT transaction for complete history
            try {
                const unitPriceForTransaction = unitPrice || 0;
                const sellPriceForTransaction = sellPrice || 0;
                const totalValue = receivedQuantity * unitPriceForTransaction;
                const totalSellValue = receivedQuantity * sellPriceForTransaction;
                
                await connection.execute(
                    `INSERT INTO drug_inventory_transactions 
                     (drugInventoryId, transactionType, transactionDate, quantityChange, quantityBefore, quantityAfter, balanceAfter,
                      unitPrice, sellPrice, totalValue, totalSellValue, referenceType, referenceId, referenceNumber, performedBy, notes)
                     VALUES (?, 'RECEIPT', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'purchase_order', ?, ?, ?, ?)`,
                    [
                        drugInventoryId,
                        transactionDate,
                        receivedQuantity, // Positive for receipt
                        0, // Quantity before (new batch starts at 0)
                        receivedQuantity, // Quantity after receipt
                        receivedQuantity, // Balance after
                        unitPriceForTransaction,
                        sellPriceForTransaction,
                        totalValue,
                        totalSellValue,
                        null, // Reference ID (can be linked to purchase order later)
                        batchNumber, // Reference number (use batch number for now)
                        userId,
                        `Initial stock receipt: ${receivedQuantity} units. Batch: ${batchNumber}${notes ? `. Notes: ${notes}` : ''}`
                    ]
                );

                // Also create stock adjustment record
                await connection.execute(
                    `INSERT INTO drug_stock_adjustments 
                     (drugInventoryId, medicationId, adjustmentType, adjustmentDate, quantity, batchNumber, unitPrice, sellPrice, 
                      manufactureDate, expiryDate, minPrice, location, referenceType, referenceNumber, performedBy, notes)
                     VALUES (?, ?, 'RECEIPT', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'purchase_order', ?, ?, ?)`,
                    [
                        drugInventoryId,
                        medicationId,
                        transactionDate,
                        receivedQuantity, // Positive for receipt
                        batchNumber,
                        unitPriceForTransaction,
                        sellPriceForTransaction,
                        manufactureDate || null,
                        expiryDate,
                        minPrice || null,
                        location || null,
                        batchNumber, // Reference number
                        userId,
                        `Initial stock receipt: ${receivedQuantity} units. Batch: ${batchNumber}${notes ? `. Notes: ${notes}` : ''}`
                    ]
                );
            } catch (transactionError) {
                console.error('Error recording drug inventory receipt transaction:', transactionError);
                // Don't fail the transaction if transaction logging fails, but log it
            }

            await connection.commit();

            // Get the created item with details
            const [newItem] = await connection.execute(
                `SELECT di.*, 
                        m.name as medicationName, 
                        m.medicationCode, 
                        m.genericName,
                        m.dosageForm,
                        m.strength
                 FROM drug_inventory di
                 LEFT JOIN medications m ON di.medicationId = m.medicationId
                 WHERE di.drugInventoryId = ?`,
                [drugInventoryId]
            );

            res.status(201).json(newItem[0]);
        } catch (error) {
            await connection.rollback();
            console.error('Error creating drug inventory item:', error);
            res.status(500).json({ message: 'Error creating drug inventory item', error: error.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating drug inventory item:', error);
        res.status(500).json({ message: 'Error creating drug inventory item', error: error.message });
    }
});

/**
 * @route PUT /api/pharmacy/drug-inventory/:id
 * @description Update a drug inventory item
 */
router.put('/drug-inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            medicationId,
            batchNumber,
            quantity,
            unitPrice,
            manufactureDate,
            expiryDate,
            minPrice,
            sellPrice,
            location,
            notes
        } = req.body;

        // Check if item exists
        const [existing] = await pool.execute(
            'SELECT drugInventoryId FROM drug_inventory WHERE drugInventoryId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Drug inventory item not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (medicationId !== undefined) {
            updates.push('medicationId = ?');
            values.push(medicationId);
        }
        if (batchNumber !== undefined) {
            updates.push('batchNumber = ?');
            values.push(batchNumber);
        }
        if (quantity !== undefined) {
            updates.push('quantity = ?');
            values.push(quantity);
        }
        if (unitPrice !== undefined) {
            updates.push('unitPrice = ?');
            values.push(unitPrice);
        }
        if (manufactureDate !== undefined) {
            updates.push('manufactureDate = ?');
            values.push(manufactureDate || null);
        }
        if (expiryDate !== undefined) {
            updates.push('expiryDate = ?');
            values.push(expiryDate);
        }
        if (minPrice !== undefined) {
            updates.push('minPrice = ?');
            values.push(minPrice || null);
        }
        if (sellPrice !== undefined) {
            updates.push('sellPrice = ?');
            values.push(sellPrice);
        }
        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location || null);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE drug_inventory SET ${updates.join(', ')}, updatedAt = NOW() WHERE drugInventoryId = ?`,
            values
        );

        const [updated] = await pool.execute(
            `SELECT di.*, 
                    m.name as medicationName, 
                    m.medicationCode, 
                    m.genericName,
                    m.dosageForm,
                    m.strength
             FROM drug_inventory di
             LEFT JOIN medications m ON di.medicationId = m.medicationId
             WHERE di.drugInventoryId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating drug inventory item:', error);
        res.status(500).json({ message: 'Error updating drug inventory item', error: error.message });
    }
});

/**
 * @route DELETE /api/pharmacy/drug-inventory/:id
 * @description Delete a drug inventory item
 */
router.delete('/drug-inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item exists
        const [existing] = await pool.execute(
            'SELECT drugInventoryId, quantity, batchNumber FROM drug_inventory WHERE drugInventoryId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Drug inventory item not found' });
        }

        // IMPORTANT: Drug inventory records should NOT be deleted as they contain vital audit information
        // Even when quantity reaches 0, the record should be preserved for:
        // - Historical batch tracking (batch number, expiry date)
        // - Purchase price records (unitPrice, sellPrice)
        // - Dispensation audit trail (linked via dispensations table)
        // - Regulatory compliance (tracking all batches that entered the system)
        // 
        // If correction is needed (e.g., data entry error), update the record instead of deleting.
        // Records with quantity = 0 are automatically excluded from active inventory queries.
        
        return res.status(403).json({ 
            message: 'Drug inventory records cannot be deleted to preserve audit trail',
            reason: 'Records contain vital historical information and must be retained for compliance and audit purposes',
            suggestion: 'If correction is needed, update the record or contact system administrator'
        });
    } catch (error) {
        console.error('Error attempting to delete drug inventory item:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions/:id/history
 * @description Get prescription history/audit log
 */
router.get('/prescriptions/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [history] = await pool.execute(
            `SELECT ph.*, 
                    u.firstName as changedByFirstName, 
                    u.lastName as changedByLastName,
                    u.username as changedByUsername
             FROM prescription_history ph
             LEFT JOIN users u ON ph.changedBy = u.userId
             WHERE ph.prescriptionId = ?
             ORDER BY ph.changeDate DESC`,
            [id]
        );

        const [itemsHistory] = await pool.execute(
            `SELECT pih.*, 
                    u.firstName as changedByFirstName, 
                    u.lastName as changedByLastName,
                    u.username as changedByUsername
             FROM prescription_items_history pih
             LEFT JOIN users u ON pih.changedBy = u.userId
             WHERE pih.prescriptionId = ?
             ORDER BY pih.changeDate DESC`,
            [id]
        );

        res.status(200).json({
            prescriptionHistory: history,
            itemsHistory: itemsHistory
        });
    } catch (error) {
        console.error('Error fetching prescription history:', error);
        res.status(500).json({ message: 'Error fetching prescription history', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/:id/history
 * @description Get drug inventory history/audit log
 */
router.get('/drug-inventory/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [history] = await pool.execute(
            `SELECT dih.*, 
                    u.firstName as changedByFirstName, 
                    u.lastName as changedByLastName,
                    u.username as changedByUsername
             FROM drug_inventory_history dih
             LEFT JOIN users u ON dih.changedBy = u.userId
             WHERE dih.drugInventoryId = ?
             ORDER BY dih.changeDate DESC`,
            [id]
        );

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching drug inventory history:', error);
        res.status(500).json({ message: 'Error fetching drug inventory history', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions/paid/ready-for-dispensing
 * @description Get paid prescription items that are ready for dispensing (only items with drug_inventory)
 */
router.get('/prescriptions/paid/ready-for-dispensing', async (req, res) => {
    try {
        const { patientId } = req.query;
        
        let query = `
            SELECT 
                pi.itemId,
                pi.prescriptionId,
                pi.medicationId,
                pi.medicationName,
                pi.dosage,
                pi.frequency,
                pi.duration,
                pi.quantity as prescribedQuantity,
                pi.instructions,
                pi.status,
                p.prescriptionNumber,
                p.prescriptionDate,
                p.patientId,
                pt.firstName as patientFirstName,
                pt.lastName as patientLastName,
                pt.patientNumber,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                i.invoiceId,
                i.invoiceNumber,
                i.status as invoiceStatus,
                ii.drugInventoryId,
                ii.unitPrice,
                ii.totalPrice,
                di.batchNumber,
                di.expiryDate,
                di.quantity as availableQuantity
            FROM prescription_items pi
            INNER JOIN prescriptions p ON pi.prescriptionId = p.prescriptionId
            INNER JOIN patients pt ON p.patientId = pt.patientId
            INNER JOIN users u ON p.doctorId = u.userId
            INNER JOIN invoices i ON i.notes LIKE CONCAT('%Prescription: ', p.prescriptionNumber, '%')
            INNER JOIN invoice_items ii ON ii.invoiceId = i.invoiceId 
                AND ii.description LIKE CONCAT('%Prescription Item: ', pi.medicationName, '%')
            INNER JOIN drug_inventory di ON ii.drugInventoryId = di.drugInventoryId
            WHERE pi.status = 'pending'
            AND i.status = 'paid'
            AND pi.medicationId IS NOT NULL
            AND di.quantity > 0
        `;
        const params = [];
        
        if (patientId) {
            query += ' AND p.patientId = ?';
            params.push(patientId);
        }
        
        query += ' ORDER BY p.prescriptionDate DESC, pi.itemId ASC';
        
        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching prescription items ready for dispensing:', error);
        res.status(500).json({ message: 'Error fetching prescription items ready for dispensing', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/prescriptions/:prescriptionId/items/ready-for-dispensing
 * @description Get prescription items ready for dispensing for a specific prescription
 */
router.get('/prescriptions/:prescriptionId/items/ready-for-dispensing', async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        
        const [rows] = await pool.execute(
            `
            SELECT 
                pi.itemId,
                pi.prescriptionId,
                pi.medicationId,
                pi.medicationName,
                pi.dosage,
                pi.frequency,
                pi.duration,
                pi.quantity as prescribedQuantity,
                pi.instructions,
                pi.status,
                p.prescriptionNumber,
                p.prescriptionDate,
                p.patientId,
                pt.firstName as patientFirstName,
                pt.lastName as patientLastName,
                pt.patientNumber,
                u.firstName as doctorFirstName,
                u.lastName as doctorLastName,
                i.invoiceId,
                i.invoiceNumber,
                i.status as invoiceStatus
            FROM prescription_items pi
            INNER JOIN prescriptions p ON pi.prescriptionId = p.prescriptionId
            INNER JOIN patients pt ON p.patientId = pt.patientId
            INNER JOIN users u ON p.doctorId = u.userId
            INNER JOIN invoices i ON i.notes LIKE CONCAT('%Prescription: ', p.prescriptionNumber, '%')
            WHERE pi.prescriptionId = ?
            AND pi.status = 'pending'
            AND i.status = 'paid'
            ORDER BY pi.itemId ASC
            `,
            [prescriptionId]
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching prescription items ready for dispensing:', error);
        res.status(500).json({ message: 'Error fetching prescription items ready for dispensing', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/available/:medicationId
 * @description Get available drug inventory for a medication
 * Returns batches in FIFO order (First In First Out) - oldest batches first
 * Orders by first receipt date (earliest transaction), then by expiry date for same-day receipts
 */
router.get('/drug-inventory/available/:medicationId', async (req, res) => {
    try {
        const { medicationId } = req.params;
        
        const [rows] = await pool.execute(
            `
            SELECT 
                di.drugInventoryId,
                di.medicationId,
                di.batchNumber,
                di.quantity,
                di.unitPrice,
                di.sellPrice,
                di.expiryDate,
                di.location,
                di.status,
                di.createdAt,
                m.name as medicationName,
                -- Get the first receipt date for this batch (FIFO ordering)
                COALESCE(
                    (SELECT MIN(transactionDate) 
                     FROM drug_inventory_transactions 
                     WHERE drugInventoryId = di.drugInventoryId 
                     AND transactionType = 'RECEIPT'),
                    di.createdAt
                ) as firstReceiptDate
            FROM drug_inventory di
            INNER JOIN medications m ON di.medicationId = m.medicationId
            WHERE di.medicationId = ?
            AND di.quantity > 0
            AND di.status = 'active'
            AND (di.expiryDate IS NULL OR di.expiryDate >= CURDATE())
            -- FIFO: Order by first receipt date (oldest first), then by expiry date (earliest expiry first)
            ORDER BY 
                COALESCE(
                    (SELECT MIN(transactionDate) 
                     FROM drug_inventory_transactions 
                     WHERE drugInventoryId = di.drugInventoryId 
                     AND transactionType = 'RECEIPT'),
                    di.createdAt
                ) ASC,
                di.expiryDate ASC
            `,
            [medicationId]
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching available drug inventory:', error);
        res.status(500).json({ message: 'Error fetching available drug inventory', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/dispensations
 * @description Dispense medications from prescription items
 */
router.post('/dispensations', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { prescriptionItemId, drugInventoryId, quantityDispensed, batchNumber, expiryDate, notes } = req.body;
        const userId = req.user?.id || req.user?.userId || 1; // Default to system user in development
        
        if (!prescriptionItemId || !quantityDispensed) {
            await connection.rollback();
            return res.status(400).json({ error: 'Prescription item ID and quantity are required' });
        }
        
        // Get prescription item
        const [prescriptionItems] = await connection.execute(
            'SELECT * FROM prescription_items WHERE itemId = ?',
            [prescriptionItemId]
        );
        
        if (prescriptionItems.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Prescription item not found' });
        }
        
        const prescriptionItem = prescriptionItems[0];
        
        let drugInventory;
        let selectedDrugInventoryId = drugInventoryId;
        
        // If drugInventoryId not provided, auto-select oldest batch using FIFO (First In First Out)
        if (!selectedDrugInventoryId && prescriptionItem.medicationId) {
            const [oldestBatches] = await connection.execute(
                `SELECT 
                    di.drugInventoryId,
                    di.*,
                    COALESCE(
                        (SELECT MIN(transactionDate) 
                         FROM drug_inventory_transactions 
                         WHERE drugInventoryId = di.drugInventoryId 
                         AND transactionType = 'RECEIPT'),
                        di.createdAt
                    ) as firstReceiptDate
                 FROM drug_inventory di
                 WHERE di.medicationId = ?
                   AND di.quantity > 0
                   AND di.status = 'active'
                   AND (di.expiryDate IS NULL OR di.expiryDate >= CURDATE())
                 ORDER BY 
                    COALESCE(
                        (SELECT MIN(transactionDate) 
                         FROM drug_inventory_transactions 
                         WHERE drugInventoryId = di.drugInventoryId 
                         AND transactionType = 'RECEIPT'),
                        di.createdAt
                    ) ASC,
                    di.expiryDate ASC
                 LIMIT 1`,
                [prescriptionItem.medicationId]
            );
            
            if (oldestBatches.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'No available stock found for this medication' });
            }
            
            drugInventory = oldestBatches[0];
            selectedDrugInventoryId = drugInventory.drugInventoryId;
        } else {
            // Get drug inventory if ID was provided
            const [drugInventories] = await connection.execute(
                'SELECT * FROM drug_inventory WHERE drugInventoryId = ?',
                [selectedDrugInventoryId]
            );
            
            if (drugInventories.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Drug inventory not found' });
            }
            
            drugInventory = drugInventories[0];
        }
        
        // Check if enough quantity is available
        if (drugInventory.quantity < quantityDispensed) {
            await connection.rollback();
            return res.status(400).json({ error: `Insufficient stock in batch ${drugInventory.batchNumber}. Available: ${drugInventory.quantity}, Requested: ${quantityDispensed}` });
        }
        
        // Use the selected drug inventory ID
        const finalDrugInventoryId = selectedDrugInventoryId;
        
        // Format expiryDate - extract date part if it's in ISO format
        let formattedExpiryDate = expiryDate || drugInventory.expiryDate;
        if (formattedExpiryDate) {
            // If it's an ISO string with timestamp, extract just the date part
            if (typeof formattedExpiryDate === 'string' && formattedExpiryDate.includes('T')) {
                formattedExpiryDate = formattedExpiryDate.split('T')[0];
            }
            // If it's a Date object, format it as YYYY-MM-DD
            else if (formattedExpiryDate instanceof Date) {
                formattedExpiryDate = formattedExpiryDate.toISOString().split('T')[0];
            }
        }

        // Create dispensation record
        const [dispensationResult] = await connection.execute(
            `INSERT INTO dispensations 
            (prescriptionItemId, dispensationDate, quantityDispensed, batchNumber, expiryDate, dispensedBy, notes)
            VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`,
            [
                prescriptionItemId,
                quantityDispensed,
                batchNumber || drugInventory.batchNumber,
                formattedExpiryDate || null,
                userId,
                notes || null
            ]
        );
        
        // Store dispensation ID for transaction record (before updating inventory)
        const dispensationId = dispensationResult.insertId;
        
        // Update drug inventory quantity (record is preserved even when quantity reaches 0 for audit purposes)
        const oldQuantity = drugInventory.quantity;
        const newQuantity = oldQuantity - quantityDispensed;
        const balanceAfter = newQuantity; // Running balance after this transaction
        
        // Determine batch status
        let batchStatus = 'active';
        let dateExhausted = null;
        if (newQuantity <= 0) {
            batchStatus = 'exhausted';
            dateExhausted = new Date().toISOString().split('T')[0]; // Today's date
            // Set quantity to 0 if it goes negative (shouldn't happen, but safety check)
            const finalQuantity = newQuantity < 0 ? 0 : newQuantity;
            await connection.execute(
                `UPDATE drug_inventory 
                 SET quantity = ?, status = ?, dateExhausted = ?, updatedAt = NOW() 
                 WHERE drugInventoryId = ?`,
                [finalQuantity, batchStatus, dateExhausted, finalDrugInventoryId]
            );
        } else {
            await connection.execute(
                'UPDATE drug_inventory SET quantity = ?, updatedAt = NOW() WHERE drugInventoryId = ?',
                [newQuantity, finalDrugInventoryId]
            );
        }

        // Get patient information from prescription
        const [prescriptionInfo] = await connection.execute(
            `SELECT p.patientId, p.prescriptionId 
             FROM prescriptions p
             INNER JOIN prescription_items pi ON p.prescriptionId = pi.prescriptionId
             WHERE pi.itemId = ?`,
            [prescriptionItemId]
        );
        const patientId = prescriptionInfo.length > 0 ? prescriptionInfo[0].patientId : null;
        const prescriptionId = prescriptionInfo.length > 0 ? prescriptionInfo[0].prescriptionId : null;

        // Record transaction in drug_inventory_transactions table for complete history
        try {
            const transactionDate = new Date().toISOString().split('T')[0];
            const unitPriceForTransaction = drugInventory.unitPrice || 0; // Buying/cost price
            const sellPriceForTransaction = drugInventory.sellPrice || 0; // Selling price
            const totalValue = quantityDispensed * unitPriceForTransaction; // Cost value
            const totalSellValue = quantityDispensed * sellPriceForTransaction; // Selling value (negative for dispensation)
            
            await connection.execute(
                `INSERT INTO drug_inventory_transactions 
                 (drugInventoryId, patientId, prescriptionId, dispensationId, transactionType, transactionDate, quantityChange, quantityBefore, quantityAfter, balanceAfter,
                  unitPrice, sellPrice, totalValue, totalSellValue, referenceType, referenceId, referenceNumber, performedBy, notes)
                 VALUES (?, ?, ?, ?, 'DISPENSATION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dispensation', ?, ?, ?, ?)`,
                [
                    finalDrugInventoryId,
                    patientId,
                    prescriptionId,
                    dispensationId, // Reference to the dispensation record
                    transactionDate,
                    -quantityDispensed, // Negative for dispensation
                    oldQuantity,
                    newQuantity < 0 ? 0 : newQuantity, // Don't allow negative quantities
                    newQuantity < 0 ? 0 : balanceAfter,
                    unitPriceForTransaction,
                    sellPriceForTransaction,
                    -totalValue, // Negative cost value (outgoing stock)
                    -totalSellValue, // Negative selling value (revenue)
                    dispensationId, // Reference ID
                    `DISP-${dispensationId}`, // Human-readable reference
                    userId,
                    `Dispensed ${quantityDispensed} units to patient. Batch: ${drugInventory.batchNumber}${notes ? `. Notes: ${notes}` : ''}`
                ]
            );

            // Also create stock adjustment record
            await connection.execute(
                `INSERT INTO drug_stock_adjustments 
                 (drugInventoryId, medicationId, adjustmentType, adjustmentDate, quantity, batchNumber, unitPrice, sellPrice, 
                  expiryDate, location, patientId, prescriptionId, dispensationId, referenceType, referenceId, referenceNumber, performedBy, notes)
                 VALUES (?, ?, 'DISPENSATION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dispensation', ?, ?, ?, ?)`,
                [
                    finalDrugInventoryId,
                    drugInventory.medicationId,
                    transactionDate,
                    -quantityDispensed, // Negative for dispensation
                    drugInventory.batchNumber,
                    unitPriceForTransaction,
                    sellPriceForTransaction,
                    drugInventory.expiryDate,
                    drugInventory.location,
                    patientId,
                    prescriptionId,
                    dispensationId,
                    dispensationId,
                    `DISP-${dispensationId}`,
                    userId,
                    `Dispensed ${quantityDispensed} units to patient. Batch: ${drugInventory.batchNumber}${notes ? `. Notes: ${notes}` : ''}`
                ]
            );
        } catch (transactionError) {
            console.error('Error recording drug inventory transaction:', transactionError);
            // Don't fail the transaction if transaction logging fails, but log it
        }

        // Also record in audit history for tracking quantity changes (for backward compatibility)
        try {
            await connection.execute(
                `INSERT INTO drug_inventory_history 
                 (drugInventoryId, fieldName, oldValue, newValue, changedBy, changeType, notes)
                 VALUES (?, 'quantity', ?, ?, ?, 'update', ?)`,
                [
                    finalDrugInventoryId,
                    oldQuantity.toString(),
                    (newQuantity < 0 ? 0 : newQuantity).toString(),
                    userId,
                    `Dispensed ${quantityDispensed} units. Batch: ${drugInventory.batchNumber}. Status: ${batchStatus}`
                ]
            );
        } catch (historyError) {
            console.error('Error recording drug inventory history:', historyError);
            // Don't fail the transaction if history logging fails
        }
        
        // Update prescription item status to 'dispensed' if fully dispensed
        const totalDispensed = parseFloat(prescriptionItem.quantity || 0);
        if (quantityDispensed >= totalDispensed) {
            await connection.execute(
                'UPDATE prescription_items SET status = "dispensed", updatedAt = NOW() WHERE itemId = ?',
                [prescriptionItemId]
            );
        }
        
        // Check if all items in prescription are dispensed, update prescription status
        const [pendingItems] = await connection.execute(
            'SELECT COUNT(*) as count FROM prescription_items WHERE prescriptionId = ? AND status = "pending"',
            [prescriptionItem.prescriptionId]
        );
        
        if (pendingItems[0].count === 0) {
            await connection.execute(
                'UPDATE prescriptions SET status = "dispensed", updatedAt = NOW() WHERE prescriptionId = ?',
                [prescriptionItem.prescriptionId]
            );
        }
        
        await connection.commit();
        
        // Get created dispensation with details
        const [dispensation] = await connection.execute(
            `SELECT d.*,
                    pi.medicationName,
                    pi.dosage,
                    pi.frequency,
                    pi.duration,
                    p.prescriptionNumber,
                    u.firstName as dispensedByFirstName,
                    u.lastName as dispensedByLastName
             FROM dispensations d
             INNER JOIN prescription_items pi ON d.prescriptionItemId = pi.itemId
             INNER JOIN prescriptions p ON pi.prescriptionId = p.prescriptionId
             INNER JOIN users u ON d.dispensedBy = u.userId
             WHERE d.dispensationId = ?`,
            [dispensationResult.insertId]
        );
        
        res.status(201).json(dispensation[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating dispensation:', error);
        res.status(500).json({ message: 'Error creating dispensation', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/pharmacy/batch-trace/:batchNumber
 * @description Trace all patients who received drugs from a specific batch number
 */
router.get('/batch-trace/:batchNumber', async (req, res) => {
    try {
        const { batchNumber } = req.params;
        
        if (!batchNumber) {
            return res.status(400).json({ message: 'Batch number is required' });
        }
        
        const [rows] = await pool.execute(
            `
            SELECT 
                d.dispensationId,
                d.dispensationDate,
                d.quantityDispensed,
                d.batchNumber,
                d.expiryDate,
                d.notes as dispensationNotes,
                d.createdAt as dispensedAt,
                
                -- Prescription item details
                pi.itemId as prescriptionItemId,
                pi.medicationName,
                pi.dosage,
                pi.frequency,
                pi.duration,
                pi.instructions,
                
                -- Prescription details
                p.prescriptionId,
                p.prescriptionNumber,
                p.prescriptionDate,
                p.status as prescriptionStatus,
                
                -- Patient details
                pt.patientId,
                pt.patientNumber,
                pt.firstName as patientFirstName,
                pt.lastName as patientLastName,
                pt.phone as patientPhone,
                pt.dateOfBirth,
                pt.gender,
                
                -- Doctor details
                dr.firstName as doctorFirstName,
                dr.lastName as doctorLastName,
                dr.username as doctorUsername,
                
                -- Dispensed by details
                dispenser.firstName as dispensedByFirstName,
                dispenser.lastName as dispensedByLastName,
                dispenser.username as dispensedByUsername,
                
                -- Medication details
                m.medicationId,
                m.medicationCode,
                m.name as medicationFullName,
                m.genericName,
                m.dosageForm,
                m.strength,
                m.manufacturer
                
            FROM dispensations d
            INNER JOIN prescription_items pi ON d.prescriptionItemId = pi.itemId
            INNER JOIN prescriptions p ON pi.prescriptionId = p.prescriptionId
            INNER JOIN patients pt ON p.patientId = pt.patientId
            INNER JOIN users dr ON p.doctorId = dr.userId
            INNER JOIN users dispenser ON d.dispensedBy = dispenser.userId
            LEFT JOIN medications m ON pi.medicationId = m.medicationId
            WHERE d.batchNumber = ?
            ORDER BY d.dispensationDate DESC, p.prescriptionDate DESC
            `,
            [batchNumber]
        );
        
        // Also get batch information from drug_inventory
        const [batchInfo] = await pool.execute(
            `
            SELECT 
                di.drugInventoryId,
                di.medicationId,
                di.batchNumber,
                di.quantity as currentQuantity,
                di.unitPrice,
                di.manufactureDate,
                di.expiryDate,
                di.minPrice,
                di.sellPrice,
                di.location,
                di.notes,
                di.createdAt,
                m.name as medicationName,
                m.medicationCode,
                m.genericName
            FROM drug_inventory di
            LEFT JOIN medications m ON di.medicationId = m.medicationId
            WHERE di.batchNumber = ?
            LIMIT 1
            `,
            [batchNumber]
        );
        
        res.status(200).json({
            batchNumber: batchNumber,
            batchInfo: batchInfo.length > 0 ? batchInfo[0] : null,
            dispensations: rows,
            totalDispensations: rows.length,
            totalQuantityDispensed: rows.reduce((sum, row) => sum + (row.quantityDispensed || 0), 0),
            uniquePatients: [...new Set(rows.map(row => row.patientId))].length
        });
    } catch (error) {
        console.error('Error tracing batch number:', error);
        res.status(500).json({ message: 'Error tracing batch number', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/batch-trace
 * @description Get all unique batch numbers with summary information (for search/listing)
 */
router.get('/batch-trace', async (req, res) => {
    try {
        const { search, medicationId } = req.query;
        
        let query = `
            SELECT DISTINCT
                d.batchNumber,
                COUNT(DISTINCT d.dispensationId) as dispensationCount,
                COUNT(DISTINCT p.patientId) as patientCount,
                SUM(d.quantityDispensed) as totalQuantityDispensed,
                MIN(d.dispensationDate) as firstDispensationDate,
                MAX(d.dispensationDate) as lastDispensationDate,
                di.expiryDate,
                di.medicationId,
                m.name as medicationName,
                m.medicationCode
            FROM dispensations d
            INNER JOIN prescription_items pi ON d.prescriptionItemId = pi.itemId
            INNER JOIN prescriptions p ON pi.prescriptionId = p.prescriptionId
            LEFT JOIN drug_inventory di ON d.batchNumber = di.batchNumber
            LEFT JOIN medications m ON COALESCE(pi.medicationId, di.medicationId) = m.medicationId
            WHERE d.batchNumber IS NOT NULL AND d.batchNumber != ''
        `;
        
        const params = [];
        
        if (search) {
            query += ` AND (d.batchNumber LIKE ? OR m.name LIKE ? OR m.genericName LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (medicationId) {
            query += ` AND (pi.medicationId = ? OR di.medicationId = ?)`;
            params.push(medicationId, medicationId);
        }
        
        query += ` 
            GROUP BY d.batchNumber, di.expiryDate, di.medicationId, m.name, m.medicationCode
            ORDER BY MAX(d.dispensationDate) DESC
            LIMIT 100
        `;
        
        const [rows] = await pool.execute(query, params);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching batch trace list:', error);
        res.status(500).json({ message: 'Error fetching batch trace list', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/:id/transactions
 * @description Get complete transaction history for a specific batch (drugInventoryId)
 * Shows all receipts, dispensations, adjustments, etc. for the batch
 */
router.get('/drug-inventory/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, transactionType } = req.query;

        let query = `
            SELECT 
                dit.transactionId,
                dit.drugInventoryId,
                di.batchNumber,
                di.medicationId,
                m.name as medicationName,
                m.medicationCode,
                dit.transactionType,
                dit.transactionDate,
                dit.transactionTime,
                dit.quantityChange,
                dit.quantityBefore,
                dit.quantityAfter,
                dit.balanceAfter,
                dit.unitPrice,
                dit.sellPrice,
                dit.totalValue,
                dit.totalSellValue,
                dit.referenceType,
                dit.referenceId,
                dit.referenceNumber,
                dit.patientId,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                p.patientNumber,
                dit.prescriptionId,
                pr.prescriptionNumber,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName,
                dit.notes,
                di.originalQuantity,
                di.quantity as currentQuantity,
                di.status as batchStatus,
                di.dateExhausted,
                di.expiryDate
            FROM drug_inventory_transactions dit
            INNER JOIN drug_inventory di ON dit.drugInventoryId = di.drugInventoryId
            LEFT JOIN medications m ON di.medicationId = m.medicationId
            LEFT JOIN users u ON dit.performedBy = u.userId
            LEFT JOIN patients p ON dit.patientId = p.patientId
            LEFT JOIN prescriptions pr ON dit.prescriptionId = pr.prescriptionId
            WHERE dit.drugInventoryId = ?
        `;
        const params = [id];

        if (startDate) {
            query += ` AND dit.transactionDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND dit.transactionDate <= ?`;
            params.push(endDate);
        }

        if (transactionType) {
            query += ` AND dit.transactionType = ?`;
            params.push(transactionType);
        }

        query += ` ORDER BY dit.transactionDate DESC, dit.transactionTime DESC`;

        const [rows] = await pool.execute(query, params);

        // Get batch summary
        const [batchSummary] = await pool.execute(
            `SELECT 
                di.drugInventoryId,
                di.batchNumber,
                di.medicationId,
                m.name as medicationName,
                m.medicationCode,
                di.originalQuantity,
                di.quantity as currentQuantity,
                di.status,
                di.dateExhausted,
                di.expiryDate,
                di.unitPrice,
                di.sellPrice,
                di.location,
                di.createdAt as batchCreatedAt
             FROM drug_inventory di
             LEFT JOIN medications m ON di.medicationId = m.medicationId
             WHERE di.drugInventoryId = ?`,
            [id]
        );

        res.status(200).json({
            batch: batchSummary[0] || null,
            transactions: rows,
            totalTransactions: rows.length,
            summary: {
                totalReceived: rows.filter(t => t.transactionType === 'RECEIPT').reduce((sum, t) => sum + t.quantityChange, 0),
                totalDispensed: Math.abs(rows.filter(t => t.transactionType === 'DISPENSATION').reduce((sum, t) => sum + t.quantityChange, 0)),
                totalAdjustments: rows.filter(t => t.transactionType === 'ADJUSTMENT').reduce((sum, t) => sum + t.quantityChange, 0),
                firstTransaction: rows.length > 0 ? rows[rows.length - 1] : null,
                lastTransaction: rows.length > 0 ? rows[0] : null
            }
        });
    } catch (error) {
        console.error('Error fetching drug inventory transactions:', error);
        res.status(500).json({ message: 'Error fetching drug inventory transactions', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/batch/:batchNumber/transactions
 * @description Get complete transaction history for a batch by batch number
 */
router.get('/drug-inventory/batch/:batchNumber/transactions', async (req, res) => {
    try {
        const { batchNumber } = req.params;
        const { startDate, endDate, transactionType } = req.query;

        // First, find the drugInventoryId for this batch
        const [batches] = await pool.execute(
            'SELECT drugInventoryId FROM drug_inventory WHERE batchNumber = ? ORDER BY createdAt DESC LIMIT 1',
            [batchNumber]
        );

        if (batches.length === 0) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const drugInventoryId = batches[0].drugInventoryId;

        // Redirect to the drugInventoryId endpoint or query directly
        let query = `
            SELECT 
                dit.transactionId,
                dit.drugInventoryId,
                di.batchNumber,
                di.medicationId,
                m.name as medicationName,
                m.medicationCode,
                dit.transactionType,
                dit.transactionDate,
                dit.transactionTime,
                dit.quantityChange,
                dit.quantityBefore,
                dit.quantityAfter,
                dit.balanceAfter,
                dit.unitPrice,
                dit.totalValue,
                dit.referenceType,
                dit.referenceId,
                dit.referenceNumber,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName,
                dit.notes
            FROM drug_inventory_transactions dit
            INNER JOIN drug_inventory di ON dit.drugInventoryId = di.drugInventoryId
            LEFT JOIN medications m ON di.medicationId = m.medicationId
            LEFT JOIN users u ON dit.performedBy = u.userId
            WHERE dit.drugInventoryId = ?
        `;
        const params = [drugInventoryId];

        if (startDate) {
            query += ` AND dit.transactionDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND dit.transactionDate <= ?`;
            params.push(endDate);
        }

        if (transactionType) {
            query += ` AND dit.transactionType = ?`;
            params.push(transactionType);
        }

        query += ` ORDER BY dit.transactionDate DESC, dit.transactionTime DESC`;

        const [rows] = await pool.execute(query, params);

        res.status(200).json({
            batchNumber: batchNumber,
            drugInventoryId: drugInventoryId,
            transactions: rows,
            totalTransactions: rows.length
        });
    } catch (error) {
        console.error('Error fetching batch transactions:', error);
        res.status(500).json({ message: 'Error fetching batch transactions', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/medication/:medicationId/history
 * @description Get complete inventory history for a medication (all batches)
 */
router.get('/drug-inventory/medication/:medicationId/history', async (req, res) => {
    try {
        const { medicationId } = req.params;
        const { startDate, endDate, status } = req.query;

        // Get all batches for this medication
        let batchQuery = `
            SELECT 
                di.drugInventoryId,
                di.batchNumber,
                di.originalQuantity,
                di.quantity as currentQuantity,
                di.status,
                di.dateExhausted,
                di.expiryDate,
                di.unitPrice,
                di.sellPrice,
                di.createdAt as batchCreatedAt,
                di.updatedAt as batchUpdatedAt
            FROM drug_inventory di
            WHERE di.medicationId = ?
        `;
        const batchParams = [medicationId];

        if (status) {
            batchQuery += ` AND di.status = ?`;
            batchParams.push(status);
        }

        batchQuery += ` ORDER BY di.createdAt DESC`;

        const [batches] = await pool.execute(batchQuery, batchParams);

        // Get all transactions for all batches of this medication
        let transactionQuery = `
            SELECT 
                dit.*,
                di.batchNumber,
                di.medicationId,
                m.name as medicationName,
                m.medicationCode,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName
            FROM drug_inventory_transactions dit
            INNER JOIN drug_inventory di ON dit.drugInventoryId = di.drugInventoryId
            LEFT JOIN medications m ON di.medicationId = m.medicationId
            LEFT JOIN users u ON dit.performedBy = u.userId
            WHERE di.medicationId = ?
        `;
        const transactionParams = [medicationId];

        if (startDate) {
            transactionQuery += ` AND dit.transactionDate >= ?`;
            transactionParams.push(startDate);
        }

        if (endDate) {
            transactionQuery += ` AND dit.transactionDate <= ?`;
            transactionParams.push(endDate);
        }

        transactionQuery += ` ORDER BY dit.transactionDate DESC, dit.transactionTime DESC`;

        const [transactions] = await pool.execute(transactionQuery, transactionParams);

        // Get medication info
        const [medication] = await pool.execute(
            'SELECT * FROM medications WHERE medicationId = ?',
            [medicationId]
        );

        res.status(200).json({
            medication: medication[0] || null,
            batches: batches,
            transactions: transactions,
            summary: {
                totalBatches: batches.length,
                activeBatches: batches.filter(b => b.status === 'active').length,
                exhaustedBatches: batches.filter(b => b.status === 'exhausted').length,
                totalTransactions: transactions.length,
                totalReceived: transactions.filter(t => t.transactionType === 'RECEIPT').reduce((sum, t) => sum + t.quantityChange, 0),
                totalDispensed: Math.abs(transactions.filter(t => t.transactionType === 'DISPENSATION').reduce((sum, t) => sum + t.quantityChange, 0)),
                currentStock: batches.reduce((sum, b) => sum + (b.currentQuantity || 0), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching medication inventory history:', error);
        res.status(500).json({ message: 'Error fetching medication inventory history', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-inventory/:id/stock-levels
 * @description Get historical stock levels at different points in time (snapshots)
 * Useful for seeing inventory levels over time
 */
router.get('/drug-inventory/:id/stock-levels', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // Get all transactions ordered by date
        let query = `
            SELECT 
                dit.transactionDate,
                dit.transactionTime,
                dit.transactionType,
                dit.balanceAfter as stockLevel,
                dit.quantityChange,
                dit.referenceNumber,
                dit.notes
            FROM drug_inventory_transactions dit
            WHERE dit.drugInventoryId = ?
        `;
        const params = [id];

        if (startDate) {
            query += ` AND dit.transactionDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND dit.transactionDate <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY dit.transactionDate ASC, dit.transactionTime ASC`;

        const [rows] = await pool.execute(query, params);

        // Get batch info
        const [batch] = await pool.execute(
            `SELECT 
                di.*,
                m.name as medicationName,
                m.medicationCode
             FROM drug_inventory di
             LEFT JOIN medications m ON di.medicationId = m.medicationId
             WHERE di.drugInventoryId = ?`,
            [id]
        );

        res.status(200).json({
            batch: batch[0] || null,
            stockLevels: rows,
            summary: {
                initialStock: rows.length > 0 ? rows[0].stockLevel - rows[0].quantityChange : 0,
                finalStock: rows.length > 0 ? rows[rows.length - 1].stockLevel : 0,
                minStock: rows.length > 0 ? Math.min(...rows.map(r => r.stockLevel)) : 0,
                maxStock: rows.length > 0 ? Math.max(...rows.map(r => r.stockLevel)) : 0,
                dataPoints: rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching stock levels:', error);
        res.status(500).json({ message: 'Error fetching stock levels', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-history
 * @description Get comprehensive drug history with filters
 * Supports filtering by medication, patient, date range, batch, type, etc.
 */
router.get('/drug-history', async (req, res) => {
    try {
        const { 
            medicationId, 
            patientId, 
            batchNumber, 
            adjustmentType, 
            startDate, 
            endDate,
            search,
            page = 1,
            limit = 50
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT 
                dsa.*,
                m.name as medicationName,
                m.medicationCode,
                m.genericName,
                p.firstName as patientFirstName,
                p.lastName as patientLastName,
                p.patientNumber,
                pr.prescriptionNumber,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName
            FROM drug_stock_adjustments dsa
            INNER JOIN medications m ON dsa.medicationId = m.medicationId
            LEFT JOIN patients p ON dsa.patientId = p.patientId
            LEFT JOIN prescriptions pr ON dsa.prescriptionId = pr.prescriptionId
            LEFT JOIN users u ON dsa.performedBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (medicationId && medicationId !== "all") {
            query += ` AND dsa.medicationId = ?`;
            params.push(medicationId);
        }

        if (patientId && patientId !== "all") {
            query += ` AND dsa.patientId = ?`;
            params.push(patientId);
        }

        if (batchNumber && batchNumber !== "all") {
            query += ` AND dsa.batchNumber = ?`;
            params.push(batchNumber);
        }

        if (adjustmentType && adjustmentType !== "all") {
            query += ` AND dsa.adjustmentType = ?`;
            params.push(adjustmentType);
        }

        if (startDate) {
            query += ` AND dsa.adjustmentDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND dsa.adjustmentDate <= ?`;
            params.push(endDate);
        }

        if (search) {
            query += ` AND (
                m.name LIKE ? OR 
                m.medicationCode LIKE ? OR 
                dsa.batchNumber LIKE ? OR
                p.firstName LIKE ? OR
                p.lastName LIKE ? OR
                p.patientNumber LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Get total count (before adding LIMIT/OFFSET)
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const countParams = [...params]; // Copy params for count query
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Add ordering and pagination to main query (use direct values for LIMIT/OFFSET)
        const safeLimit = parseInt(limit) || 50;
        const safeOffset = parseInt(offset) || 0;
        query += ` ORDER BY dsa.adjustmentDate DESC, dsa.adjustmentTime DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

        const [rows] = await pool.execute(query, params);

        res.status(200).json({
            adjustments: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching drug history:', error);
        res.status(500).json({ message: 'Error fetching drug history', error: error.message });
    }
});

/**
 * @route GET /api/pharmacy/drug-history/patient/:patientId
 * @description Get drug history for a specific patient
 */
router.get('/drug-history/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { startDate, endDate } = req.query;

        let query = `
            SELECT 
                dsa.*,
                m.name as medicationName,
                m.medicationCode,
                pr.prescriptionNumber,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName
            FROM drug_stock_adjustments dsa
            INNER JOIN medications m ON dsa.medicationId = m.medicationId
            LEFT JOIN prescriptions pr ON dsa.prescriptionId = pr.prescriptionId
            LEFT JOIN users u ON dsa.performedBy = u.userId
            WHERE dsa.patientId = ? AND dsa.adjustmentType = 'DISPENSATION'
        `;
        const params = [patientId];

        if (startDate) {
            query += ` AND dsa.adjustmentDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND dsa.adjustmentDate <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY dsa.adjustmentDate DESC, dsa.adjustmentTime DESC`;

        const [rows] = await pool.execute(query, params);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient drug history:', error);
        res.status(500).json({ message: 'Error fetching patient drug history', error: error.message });
    }
});

/**
 * @route POST /api/pharmacy/stock-adjustments
 * @description Create a stock adjustment (manual stock movement)
 * Supports: RECEIPT, DISPENSATION, ADJUSTMENT, TRANSFER, EXPIRY, DAMAGE, RETURN, CORRECTION
 */
router.post('/stock-adjustments', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            drugInventoryId,
            medicationId,
            adjustmentType,
            adjustmentDate,
            quantity,
            batchNumber,
            unitPrice,
            sellPrice,
            manufactureDate,
            expiryDate,
            minPrice,
            location,
            referenceType,
            referenceId,
            referenceNumber,
            notes
        } = req.body;
        
        const userId = req.user?.id || req.user?.userId || 1;
        
        // Validate required fields
        if (!medicationId || !adjustmentType || !adjustmentDate || quantity === undefined) {
            await connection.rollback();
            return res.status(400).json({ error: 'medicationId, adjustmentType, adjustmentDate, and quantity are required' });
        }
        
        // For RECEIPT, batchNumber is required
        if (adjustmentType === 'RECEIPT' && !batchNumber) {
            await connection.rollback();
            return res.status(400).json({ error: 'batchNumber is required for RECEIPT adjustments' });
        }
        
        let drugInventory;
        let actualDrugInventoryId = drugInventoryId;
        let isNewBatch = false;
        
        // For RECEIPT adjustments, check if batch already exists, if not create new batch
        if (adjustmentType === 'RECEIPT' && batchNumber) {
            // Check if batch already exists
            const [existingBatches] = await connection.execute(
                'SELECT * FROM drug_inventory WHERE batchNumber = ? AND medicationId = ?',
                [batchNumber, medicationId]
            );
            
            if (existingBatches.length > 0) {
                // Batch exists, use it
                drugInventory = existingBatches[0];
                actualDrugInventoryId = drugInventory.drugInventoryId;
                isNewBatch = false;
            } else {
                // Create new batch
                if (!unitPrice || !sellPrice || !expiryDate) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'unitPrice, sellPrice, and expiryDate are required when creating a new batch' });
                }
                
                const [newBatchResult] = await connection.execute(
                    `INSERT INTO drug_inventory 
                     (medicationId, batchNumber, quantity, unitPrice, sellPrice, minPrice, manufactureDate, expiryDate, location, notes, status, originalQuantity)
                     VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
                    [
                        medicationId,
                        batchNumber,
                        unitPrice,
                        sellPrice,
                        minPrice || null,
                        manufactureDate || null,
                        expiryDate,
                        location || null,
                        notes || null,
                        Math.abs(quantity) // originalQuantity
                    ]
                );
                
                actualDrugInventoryId = newBatchResult.insertId;
                isNewBatch = true;
                
                // Get the newly created batch
                const [newBatches] = await connection.execute(
                    'SELECT * FROM drug_inventory WHERE drugInventoryId = ?',
                    [actualDrugInventoryId]
                );
                drugInventory = newBatches[0];
            }
        } else {
            // For non-RECEIPT adjustments, drugInventoryId is required
            if (!drugInventoryId) {
                await connection.rollback();
                return res.status(400).json({ error: 'drugInventoryId is required for non-RECEIPT adjustments' });
            }
            
            // Get current drug inventory
            const [drugInventories] = await connection.execute(
                'SELECT * FROM drug_inventory WHERE drugInventoryId = ?',
                [drugInventoryId]
            );
            
            if (drugInventories.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Drug inventory not found' });
            }
            
            drugInventory = drugInventories[0];
            actualDrugInventoryId = drugInventoryId;
            isNewBatch = false;
        }
        
        // Calculate new quantity based on adjustment type
        let newQuantity = drugInventory.quantity;
        if (adjustmentType === 'RECEIPT') {
            newQuantity += quantity; // Positive for receipts
        } else if (adjustmentType === 'DISPENSATION') {
            newQuantity -= Math.abs(quantity); // Negative for dispensations
        } else if (adjustmentType === 'ADJUSTMENT' || adjustmentType === 'CORRECTION') {
            // Adjustments can be positive or negative
            newQuantity += quantity;
        } else if (['EXPIRY', 'DAMAGE', 'TRANSFER', 'RETURN'].includes(adjustmentType)) {
            // These are typically negative (removing stock)
            newQuantity -= Math.abs(quantity);
        }
        
        // Ensure quantity doesn't go negative (unless it's an adjustment/correction that explicitly allows it)
        if (newQuantity < 0 && adjustmentType !== 'ADJUSTMENT' && adjustmentType !== 'CORRECTION') {
            await connection.rollback();
            return res.status(400).json({ error: `Adjustment would result in negative quantity. Current: ${drugInventory.quantity}, Adjustment: ${quantity}` });
        }
        
        if (newQuantity < 0) {
            newQuantity = 0; // Prevent negative quantities
        }
        
        // Update drug inventory quantity
        let batchStatus = drugInventory.status || 'active';
        let dateExhausted = null;
        
        if (newQuantity <= 0 && adjustmentType !== 'RECEIPT') {
            batchStatus = 'exhausted';
            dateExhausted = adjustmentDate || new Date().toISOString().split('T')[0];
        } else if (newQuantity > 0 && drugInventory.status === 'exhausted') {
            batchStatus = 'active';
            dateExhausted = null;
        }
        
        // Update drug inventory (also update originalQuantity for RECEIPT if it's the first receipt)
        if (adjustmentType === 'RECEIPT') {
            // For RECEIPT, also update originalQuantity if it's the first receipt transaction
            const [existingTransactions] = await connection.execute(
                'SELECT COUNT(*) as count FROM drug_inventory_transactions WHERE drugInventoryId = ? AND transactionType = "RECEIPT"',
                [actualDrugInventoryId]
            );
            
            if (existingTransactions[0].count === 0) {
                // First receipt, update originalQuantity
                await connection.execute(
                    `UPDATE drug_inventory 
                     SET quantity = ?, 
                         originalQuantity = ?,
                         status = ?, 
                         dateExhausted = ?,
                         updatedAt = NOW()
                     WHERE drugInventoryId = ?`,
                    [newQuantity, newQuantity, batchStatus, dateExhausted, actualDrugInventoryId]
                );
            } else {
                // Subsequent receipt
                await connection.execute(
                    `UPDATE drug_inventory 
                     SET quantity = ?, 
                         status = ?, 
                         dateExhausted = ?,
                         updatedAt = NOW()
                     WHERE drugInventoryId = ?`,
                    [newQuantity, batchStatus, dateExhausted, actualDrugInventoryId]
                );
            }
        } else {
            // For other adjustments
            await connection.execute(
                `UPDATE drug_inventory 
                 SET quantity = ?, 
                     status = ?, 
                     dateExhausted = ?,
                     updatedAt = NOW()
                 WHERE drugInventoryId = ?`,
                [newQuantity, batchStatus, dateExhausted, actualDrugInventoryId]
            );
        }
        
        // Create stock adjustment record
        const adjustmentDateValue = adjustmentDate || new Date().toISOString().split('T')[0];
        const [adjustmentResult] = await connection.execute(
            `INSERT INTO drug_stock_adjustments 
             (drugInventoryId, medicationId, adjustmentType, adjustmentDate, quantity, batchNumber, unitPrice, sellPrice,
              manufactureDate, expiryDate, minPrice, location, referenceType, referenceId, referenceNumber, performedBy, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                actualDrugInventoryId,
                medicationId,
                adjustmentType,
                adjustmentDateValue,
                quantity,
                batchNumber || drugInventory.batchNumber,
                unitPrice || drugInventory.unitPrice || 0,
                sellPrice || drugInventory.sellPrice || 0,
                manufactureDate || drugInventory.manufactureDate || null,
                expiryDate || drugInventory.expiryDate || null,
                minPrice || drugInventory.minPrice || null,
                location || drugInventory.location || null,
                referenceType || null,
                referenceId || null,
                referenceNumber || null,
                userId,
                notes || null
            ]
        );
        
        const adjustmentId = adjustmentResult.insertId;
        
        // Create transaction record for history
        try {
            const transactionDate = adjustmentDateValue;
            const oldQuantity = isNewBatch ? 0 : drugInventory.quantity;
            const quantityChange = adjustmentType === 'RECEIPT' ? Math.abs(quantity) : quantity; // Positive for receipts
            const quantityBefore = oldQuantity;
            const quantityAfter = newQuantity;
            const balanceAfter = newQuantity;
            const unitPriceForTransaction = unitPrice || drugInventory.unitPrice || 0;
            const sellPriceForTransaction = sellPrice || drugInventory.sellPrice || 0;
            const totalValue = quantityChange * unitPriceForTransaction;
            const totalSellValue = quantityChange * sellPriceForTransaction;
            
            await connection.execute(
                `INSERT INTO drug_inventory_transactions 
                 (drugInventoryId, transactionType, transactionDate, quantityChange, quantityBefore, quantityAfter, balanceAfter,
                  unitPrice, sellPrice, totalValue, totalSellValue, referenceType, referenceId, referenceNumber, performedBy, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    actualDrugInventoryId,
                    adjustmentType,
                    transactionDate,
                    quantityChange,
                    quantityBefore,
                    quantityAfter,
                    balanceAfter,
                    unitPriceForTransaction,
                    sellPriceForTransaction,
                    totalValue,
                    totalSellValue,
                    referenceType || null,
                    referenceId || null,
                    referenceNumber || null,
                    userId,
                    notes || `Stock adjustment: ${adjustmentType}. ${notes || ''}`
                ]
            );
        } catch (transactionError) {
            console.error('Error recording stock adjustment transaction:', transactionError);
            // Don't fail if transaction logging fails
        }
        
        await connection.commit();
        
        // Get created adjustment with details
        const [createdAdjustment] = await connection.execute(
            `SELECT 
                dsa.*,
                m.name as medicationName,
                m.medicationCode,
                u.firstName as performedByFirstName,
                u.lastName as performedByLastName
             FROM drug_stock_adjustments dsa
             LEFT JOIN medications m ON dsa.medicationId = m.medicationId
             LEFT JOIN users u ON dsa.performedBy = u.userId
             WHERE dsa.adjustmentId = ?`,
            [adjustmentId]
        );
        
        res.status(201).json(createdAdjustment[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating stock adjustment:', error);
        res.status(500).json({ message: 'Error creating stock adjustment', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
