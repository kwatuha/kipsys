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

        // Insert prescription items
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
                
                await connection.execute(
                    `INSERT INTO prescription_items (prescriptionId, medicationId, medicationName, dosage, frequency, duration, quantity, instructions)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    insertData
                );
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
                        // Get the minimum sellPrice from drug_inventory for this medication
                        const [pricing] = await connection.execute(
                            `SELECT MIN(di.sellPrice) as minSellPrice
                             FROM drug_inventory di
                             WHERE di.medicationId = ? AND di.quantity > 0
                             GROUP BY di.medicationId`,
                            [item.medicationId]
                        );

                        if (pricing.length > 0 && pricing[0].minSellPrice) {
                            const unitPrice = parseFloat(pricing[0].minSellPrice);
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
                                description: medicationName,
                                quantity: quantity,
                                unitPrice: unitPrice,
                                totalPrice: itemTotal
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching pricing for medication ${item.medicationId}:`, error);
                    }
                }
            }

            // Create invoice if we have items with pricing
            if (invoiceItems.length > 0 && totalAmount > 0) {
                // Generate invoice number
                const [invoiceCount] = await connection.execute(
                    'SELECT COUNT(*) as count FROM invoices WHERE DATE(invoiceDate) = CURDATE()'
                );
                const invoiceNum = invoiceCount[0].count + 1;
                const invoiceNumber = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(invoiceNum).padStart(4, '0')}`;

                // Create invoice
                const [invoiceResult] = await connection.execute(
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

                const invoiceId = invoiceResult.insertId;

                // Create invoice items
                for (const invoiceItem of invoiceItems) {
                    await connection.execute(
                        `INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, totalPrice)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            invoiceId,
                            invoiceItem.description,
                            invoiceItem.quantity,
                            invoiceItem.unitPrice,
                            invoiceItem.totalPrice
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

        const [result] = await pool.execute(
            `INSERT INTO drug_inventory 
             (medicationId, batchNumber, quantity, unitPrice, manufactureDate, expiryDate, minPrice, sellPrice, location, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                medicationId,
                batchNumber,
                quantity || 0,
                unitPrice || 0,
                manufactureDate || null,
                expiryDate,
                minPrice || null,
                sellPrice,
                location || null,
                notes || null
            ]
        );

        const [newItem] = await pool.execute(
            `SELECT di.*, 
                    m.name as medicationName, 
                    m.medicationCode, 
                    m.genericName,
                    m.dosageForm,
                    m.strength
             FROM drug_inventory di
             LEFT JOIN medications m ON di.medicationId = m.medicationId
             WHERE di.drugInventoryId = ?`,
            [result.insertId]
        );

        res.status(201).json(newItem[0]);
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
            'SELECT drugInventoryId FROM drug_inventory WHERE drugInventoryId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Drug inventory item not found' });
        }

        await pool.execute('DELETE FROM drug_inventory WHERE drugInventoryId = ?', [id]);

        res.status(200).json({ 
            message: 'Drug inventory item deleted successfully',
            drugInventoryId: id
        });
    } catch (error) {
        console.error('Error deleting drug inventory item:', error);
        res.status(500).json({ message: 'Error deleting drug inventory item', error: error.message });
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

module.exports = router;
