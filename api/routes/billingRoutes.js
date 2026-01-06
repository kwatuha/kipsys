// Billing routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Service charges
/**
 * @route GET /api/billing/charges
 * @description Get all service charges (optionally filtered by status)
 */
router.get('/charges', async (req, res) => {
    try {
        const { status, category, department, search } = req.query;
        let query = 'SELECT * FROM service_charges WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        } else {
            // Default: show all (both Active and Inactive)
            query += ' AND (status = "Active" OR status = "Inactive")';
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (department) {
            query += ' AND department = ?';
            params.push(department);
        }

        if (search) {
            query += ' AND (name LIKE ? OR chargeCode LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY name ASC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching charges:', error);
        res.status(500).json({ message: 'Error fetching charges', error: error.message });
    }
});

/**
 * @route GET /api/billing/charges/:id
 * @description Get a single service charge by ID
 */
router.get('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching charge:', error);
        res.status(500).json({ message: 'Error fetching charge', error: error.message });
    }
});

/**
 * @route POST /api/billing/charges
 * @description Create a new service charge
 */
router.post('/charges', async (req, res) => {
    try {
        const { chargeCode, name, category, department, cost, description, status = 'Active' } = req.body;
        
        if (!name || !cost) {
            return res.status(400).json({ error: 'Name and cost are required' });
        }

        // Generate charge code if not provided
        let finalChargeCode = chargeCode;
        if (!finalChargeCode) {
            // Generate code from name (e.g., "General Consultation" -> "GEN-CONS")
            const codeParts = name.toUpperCase().split(' ').slice(0, 2).map(part => part.substring(0, 3));
            finalChargeCode = codeParts.join('-');
            
            // Ensure uniqueness
            let counter = 1;
            let [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
            while (existing.length > 0) {
                finalChargeCode = `${codeParts.join('-')}-${counter}`;
                [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
                counter++;
            }
        } else {
            // Check if code already exists
            const [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeCode = ?', [finalChargeCode]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Charge code already exists' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO service_charges (chargeCode, name, category, department, cost, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [finalChargeCode, name, category || null, department || null, cost, description || null, status]
        );
        
        const [newCharge] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [result.insertId]);
        res.status(201).json(newCharge[0]);
    } catch (error) {
        console.error('Error creating charge:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Charge code already exists' });
        }
        res.status(500).json({ message: 'Error creating charge', error: error.message });
    }
});

/**
 * @route PUT /api/billing/charges/:id
 * @description Update a service charge
 */
router.put('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chargeCode, name, category, department, cost, description, status } = req.body;

        // Check if charge exists
        const [existing] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }

        // Check for duplicate charge code if it's being changed
        if (chargeCode) {
            const [duplicate] = await pool.query(
                'SELECT chargeId FROM service_charges WHERE chargeCode = ? AND chargeId != ?',
                [chargeCode, id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ error: 'Charge code already exists' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (chargeCode !== undefined) { updates.push('chargeCode = ?'); values.push(chargeCode); }
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (department !== undefined) { updates.push('department = ?'); values.push(department); }
        if (cost !== undefined) { updates.push('cost = ?'); values.push(cost); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.query(
            `UPDATE service_charges SET ${updates.join(', ')}, updatedAt = NOW() WHERE chargeId = ?`,
            values
        );

        const [updated] = await pool.query('SELECT * FROM service_charges WHERE chargeId = ?', [id]);
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating charge:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Charge code already exists' });
        }
        res.status(500).json({ message: 'Error updating charge', error: error.message });
    }
});

/**
 * @route DELETE /api/billing/charges/:id
 * @description Delete (deactivate) a service charge
 */
router.delete('/charges/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if charge is used in any invoices
        const [invoices] = await pool.query(
            'SELECT COUNT(*) as count FROM invoice_items WHERE chargeId = ?',
            [id]
        );

        if (invoices[0].count > 0) {
            // Soft delete by setting status to Inactive
            await pool.query(
                'UPDATE service_charges SET status = "Inactive", updatedAt = NOW() WHERE chargeId = ?',
                [id]
            );
            return res.status(200).json({ message: 'Service charge deactivated (used in invoices)' });
        }

        // Hard delete if not used
        const [result] = await pool.query('DELETE FROM service_charges WHERE chargeId = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service charge not found' });
        }

        res.status(200).json({ message: 'Service charge deleted successfully' });
    } catch (error) {
        console.error('Error deleting charge:', error);
        res.status(500).json({ message: 'Error deleting charge', error: error.message });
    }
});

// Invoices
router.get('/invoices', async (req, res) => {
    try {
        const { patientId, status } = req.query;
        let query = 'SELECT * FROM invoices WHERE 1=1';
        const params = [];
        if (patientId) {
            query += ' AND patientId = ?';
            params.push(patientId);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        query += ' ORDER BY invoiceDate DESC';
        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});

/**
 * @route GET /api/billing/invoices/:id
 * @description Get a single invoice by ID with items
 */
router.get('/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get invoice
        const [invoices] = await pool.execute(
            `SELECT i.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber, p.phone as patientPhone
             FROM invoices i
             LEFT JOIN patients p ON i.patientId = p.patientId
             WHERE i.invoiceId = ?`,
            [id]
        );
        
        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // Get invoice items
        const [items] = await pool.execute(
            `SELECT ii.*, sc.name as chargeName, sc.chargeCode
             FROM invoice_items ii
             LEFT JOIN service_charges sc ON ii.chargeId = sc.chargeId
             WHERE ii.invoiceId = ?
             ORDER BY ii.itemId`,
            [id]
        );
        
        res.status(200).json({
            ...invoices[0],
            items: items
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
});

/**
 * @route GET /api/billing/invoices/patient/:patientId/pending
 * @description Get pending invoices for a patient
 */
router.get('/invoices/patient/:patientId/pending', async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [invoices] = await pool.execute(
            `SELECT i.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber
             FROM invoices i
             LEFT JOIN patients p ON i.patientId = p.patientId
             WHERE i.patientId = ? AND i.status IN ('pending', 'partial')
             ORDER BY i.invoiceDate DESC`,
            [patientId]
        );
        
        // Get items for each invoice
        const invoicesWithItems = await Promise.all(invoices.map(async (invoice) => {
            const [items] = await pool.execute(
                `SELECT ii.*, sc.name as chargeName, sc.chargeCode
                 FROM invoice_items ii
                 LEFT JOIN service_charges sc ON ii.chargeId = sc.chargeId
                 WHERE ii.invoiceId = ?
                 ORDER BY ii.itemId`,
                [invoice.invoiceId]
            );
            return {
                ...invoice,
                items: items
            };
        }));
        
        res.status(200).json(invoicesWithItems);
    } catch (error) {
        console.error('Error fetching pending invoices:', error);
        res.status(500).json({ message: 'Error fetching pending invoices', error: error.message });
    }
});

/**
 * @route POST /api/billing/invoices
 * @description Create a new invoice
 */
router.post('/invoices', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { invoiceNumber, patientId, invoiceDate, dueDate, items, notes, status = 'pending' } = req.body;
        const userId = req.user?.id;

        if (!patientId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Patient and items are required' });
        }

        // Generate invoice number if not provided
        let finalInvoiceNumber = invoiceNumber;
        if (!finalInvoiceNumber) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM invoices WHERE DATE(createdAt) = CURDATE()');
            const invoiceNum = count[0].count + 1;
            finalInvoiceNumber = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(invoiceNum).padStart(4, '0')}`;
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);

        // Insert invoice
        const [result] = await connection.execute(
            `INSERT INTO invoices (invoiceNumber, patientId, invoiceDate, dueDate, totalAmount, balance, status, notes, createdBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalInvoiceNumber,
                patientId,
                invoiceDate || new Date().toISOString().split('T')[0],
                dueDate || null,
                totalAmount,
                totalAmount, // balance = totalAmount initially
                status,
                notes || null,
                userId || null
            ]
        );

        const invoiceId = result.insertId;

        // Insert invoice items
        for (const item of items) {
            await connection.execute(
                `INSERT INTO invoice_items (invoiceId, chargeId, description, quantity, unitPrice, totalPrice)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    invoiceId,
                    item.chargeId || null,
                    item.description || '',
                    item.quantity || 1,
                    item.unitPrice || 0,
                    item.totalPrice || 0
                ]
            );
        }

        await connection.commit();

        // Get the created invoice with items
        const [invoices] = await connection.execute(
            `SELECT i.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber, p.phone as patientPhone
             FROM invoices i
             LEFT JOIN patients p ON i.patientId = p.patientId
             WHERE i.invoiceId = ?`,
            [invoiceId]
        );

        const [itemsData] = await connection.execute(
            `SELECT ii.*, sc.name as chargeName, sc.chargeCode
             FROM invoice_items ii
             LEFT JOIN service_charges sc ON ii.chargeId = sc.chargeId
             WHERE ii.invoiceId = ?
             ORDER BY ii.itemId`,
            [invoiceId]
        );

        res.status(201).json({
            ...invoices[0],
            items: itemsData
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating invoice:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Invoice number already exists' });
        }
        res.status(500).json({ message: 'Error creating invoice', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/billing/invoices/:id
 * @description Update an invoice
 */
router.put('/invoices/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { invoiceDate, dueDate, items, notes, status } = req.body;

        // Check if invoice exists
        const [existing] = await connection.execute('SELECT invoiceId FROM invoices WHERE invoiceId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (invoiceDate !== undefined) { updates.push('invoiceDate = ?'); values.push(invoiceDate); }
        if (dueDate !== undefined) { updates.push('dueDate = ?'); values.push(dueDate); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }

        // If items are provided, update them
        if (items && items.length > 0) {
            // Calculate new total
            const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
            
            // Get current paid amount
            const [current] = await connection.execute('SELECT paidAmount FROM invoices WHERE invoiceId = ?', [id]);
            const paidAmount = parseFloat(current[0]?.paidAmount || 0);
            const balance = totalAmount - paidAmount;

            updates.push('totalAmount = ?');
            values.push(totalAmount);
            updates.push('balance = ?');
            values.push(balance);

            // Delete existing items
            await connection.execute('DELETE FROM invoice_items WHERE invoiceId = ?', [id]);

            // Insert new items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO invoice_items (invoiceId, chargeId, description, quantity, unitPrice, totalPrice)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        item.chargeId || null,
                        item.description || '',
                        item.quantity || 1,
                        item.unitPrice || 0,
                        item.totalPrice || 0
                    ]
                );
            }
        }

        if (updates.length > 0) {
            values.push(id);
            await connection.execute(
                `UPDATE invoices SET ${updates.join(', ')}, updatedAt = NOW() WHERE invoiceId = ?`,
                values
            );
        }

        await connection.commit();

        // Get updated invoice
        const [invoices] = await connection.execute(
            `SELECT i.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber, p.phone as patientPhone
             FROM invoices i
             LEFT JOIN patients p ON i.patientId = p.patientId
             WHERE i.invoiceId = ?`,
            [id]
        );

        const [itemsData] = await connection.execute(
            `SELECT ii.*, sc.name as chargeName, sc.chargeCode
             FROM invoice_items ii
             LEFT JOIN service_charges sc ON ii.chargeId = sc.chargeId
             WHERE ii.invoiceId = ?
             ORDER BY ii.itemId`,
            [id]
        );

        res.status(200).json({
            ...invoices[0],
            items: itemsData
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Error updating invoice', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/billing/invoices/:id
 * @description Delete (cancel) an invoice
 */
router.delete('/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if invoice exists
        const [existing] = await pool.execute('SELECT invoiceId, status FROM invoices WHERE invoiceId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // If invoice is paid, don't allow deletion - mark as cancelled instead
        if (existing[0].status === 'paid') {
            await pool.execute('UPDATE invoices SET status = "cancelled", updatedAt = NOW() WHERE invoiceId = ?', [id]);
            return res.status(200).json({ message: 'Invoice cancelled (was already paid)' });
        }

        // Otherwise, delete it (items will be deleted via CASCADE)
        await pool.execute('DELETE FROM invoices WHERE invoiceId = ?', [id]);
        
        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
});

/**
 * @route POST /api/billing/invoices/:id/payment
 * @description Record a payment against an invoice
 */
router.post('/invoices/:id/payment', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { paymentAmount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;
        const userId = req.user?.id;

        if (!paymentAmount || paymentAmount <= 0) {
            return res.status(400).json({ error: 'Payment amount is required and must be greater than 0' });
        }

        // Get current invoice
        const [invoices] = await connection.execute('SELECT * FROM invoices WHERE invoiceId = ?', [id]);
        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invoices[0];
        const currentPaid = parseFloat(invoice.paidAmount || 0);
        const newPaid = currentPaid + parseFloat(paymentAmount);
        const outstanding = parseFloat(invoice.totalAmount) - newPaid;

        // Determine new status
        let newStatus = invoice.status;
        if (outstanding <= 0) {
            newStatus = 'paid';
        } else if (newPaid > 0 && newPaid < parseFloat(invoice.totalAmount)) {
            newStatus = 'partial';
        }

        // Update invoice
        await connection.execute(
            `UPDATE invoices 
            SET paidAmount = ?, balance = ?, status = ?, paymentMethod = ?, updatedAt = NOW()
            WHERE invoiceId = ?`,
            [newPaid, outstanding, newStatus, paymentMethod || invoice.paymentMethod, id]
        );

        // If invoice is fully paid, check if we need to create queue entries
        if (newStatus === 'paid') {
            // Check if it's a prescription invoice - create pharmacy queue entry
            if (invoice.notes && invoice.notes.includes('Drug payment - Prescription:')) {
                try {
                    // Extract prescription number from notes (format: "Drug payment - Prescription: PRESC-XXXXX")
                    const prescMatch = invoice.notes.match(/Prescription:\s*([A-Z0-9-]+)/);
                    if (prescMatch && prescMatch[1]) {
                        const prescriptionNumber = prescMatch[1].trim();
                        
                        // Find the prescription
                        const [prescriptions] = await connection.execute(
                            'SELECT prescriptionId, patientId FROM prescriptions WHERE prescriptionNumber = ?',
                            [prescriptionNumber]
                        );
                        
                        if (prescriptions.length > 0) {
                            const prescription = prescriptions[0];
                            
                            // Check if pharmacy queue entry already exists for this prescription
                            const [existingQueue] = await connection.execute(
                                `SELECT queueId FROM queue_entries 
                                 WHERE patientId = ? AND servicePoint = 'pharmacy' 
                                 AND notes LIKE ? AND status NOT IN ('completed', 'cancelled')`,
                                [prescription.patientId, `%Prescription: ${prescriptionNumber}%`]
                            );
                            
                            if (existingQueue.length === 0) {
                                // Generate ticket number for pharmacy queue
                                const [pharmacyCount] = await connection.execute(
                                    'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "pharmacy"'
                                );
                                const pharmacyTicketNum = pharmacyCount[0].count + 1;
                                const pharmacyTicketNumber = `P-${String(pharmacyTicketNum).padStart(3, '0')}`;
                                
                                // Create pharmacy queue entry
                                await connection.execute(
                                    `INSERT INTO queue_entries 
                                    (patientId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                                    VALUES (?, ?, 'pharmacy', 'normal', 'waiting', ?, ?)`,
                                    [
                                        prescription.patientId,
                                        pharmacyTicketNumber,
                                        `Prescription: ${prescriptionNumber}`,
                                        userId || null
                                    ]
                                );
                            }
                        }
                    }
                } catch (pharmacyQueueError) {
                    console.error('Error creating pharmacy queue entry:', pharmacyQueueError);
                    // Don't fail the payment if pharmacy queue creation fails
                }
            }
            
            // Check if it's a consultation fee invoice from triage - create consultation queue entry
            if (invoice.notes && invoice.notes.includes('Consultation charge from triage')) {
                try {
                    // Extract triage number from notes (format: "Consultation charge from triage TRI-XXXXXX")
                    const triageMatch = invoice.notes.match(/triage\s+([A-Z0-9-]+)/i);
                    if (triageMatch && triageMatch[1]) {
                        const triageNumber = triageMatch[1].trim();
                        
                        // Find the triage assessment to get assigned doctor and priority
                        const [triageAssessments] = await connection.execute(
                            `SELECT triageId, patientId, assignedToDoctorId, assignedToDepartment, 
                             triageCategory, triagedBy 
                             FROM triage_assessments 
                             WHERE triageNumber = ?`,
                            [triageNumber]
                        );
                        
                        if (triageAssessments.length > 0) {
                            const triage = triageAssessments[0];
                            
                            // Determine queue priority based on triage category
                            let queuePriority = 'normal';
                            if (triage.triageCategory === 'red') queuePriority = 'emergency';
                            else if (triage.triageCategory === 'yellow') queuePriority = 'urgent';
                            
                            // Check if consultation queue entry already exists for this patient today
                            const [existingConsultation] = await connection.execute(
                                `SELECT queueId FROM queue_entries 
                                 WHERE patientId = ? AND servicePoint = 'consultation' 
                                 AND DATE(arrivalTime) = CURDATE() 
                                 AND status NOT IN ('completed', 'cancelled')`,
                                [triage.patientId]
                            );
                            
                            if (existingConsultation.length === 0) {
                                // Generate ticket number for consultation queue
                                const [consultationCount] = await connection.execute(
                                    'SELECT COUNT(*) as count FROM queue_entries WHERE DATE(arrivalTime) = CURDATE() AND servicePoint = "consultation"'
                                );
                                const consultationTicketNum = consultationCount[0].count + 1;
                                const consultationTicketNumber = `CON-${String(consultationTicketNum).padStart(3, '0')}`;
                                
                                // Create consultation queue entry
                                await connection.execute(
                                    `INSERT INTO queue_entries 
                                    (patientId, doctorId, ticketNumber, servicePoint, priority, status, notes, createdBy)
                                    VALUES (?, ?, ?, 'consultation', ?, 'waiting', ?, ?)`,
                                    [
                                        triage.patientId,
                                        triage.assignedToDoctorId || null,
                                        consultationTicketNumber,
                                        queuePriority,
                                        `Triage: ${triageNumber}${triage.assignedToDepartment ? ` - ${triage.assignedToDepartment}` : ''}`,
                                        userId || triage.triagedBy || null
                                    ]
                                );
                            }
                        }
                    }
                } catch (consultationQueueError) {
                    console.error('Error creating consultation queue entry:', consultationQueueError);
                    // Don't fail the payment if consultation queue creation fails
                }
            }
        }

        await connection.commit();

        // Get updated invoice
        const [updated] = await connection.execute(
            `SELECT i.*, 
                    p.firstName as patientFirstName, p.lastName as patientLastName,
                    p.patientNumber, p.phone as patientPhone
             FROM invoices i
             LEFT JOIN patients p ON i.patientId = p.patientId
             WHERE i.invoiceId = ?`,
            [id]
        );

        const [items] = await connection.execute(
            `SELECT ii.*, sc.name as chargeName, sc.chargeCode
             FROM invoice_items ii
             LEFT JOIN service_charges sc ON ii.chargeId = sc.chargeId
             WHERE ii.invoiceId = ?
             ORDER BY ii.itemId`,
            [id]
        );

        res.status(200).json({
            ...updated[0],
            items: items
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Error recording payment', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route GET /api/billing/invoices/stats/summary
 * @description Get summary statistics for invoices
 */
router.get('/invoices/stats/summary', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalInvoices,
                SUM(CASE WHEN status = 'pending' THEN totalAmount ELSE 0 END) as pendingAmount,
                SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END) as paidAmount,
                SUM(CASE WHEN status = 'partial' THEN balance ELSE 0 END) as partialAmount,
                SUM(CASE WHEN status = 'pending' AND dueDate IS NOT NULL AND dueDate < CURDATE() THEN balance ELSE 0 END) as overdueAmount,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
                SUM(CASE WHEN status = 'paid' AND MONTH(invoiceDate) = MONTH(CURDATE()) AND YEAR(invoiceDate) = YEAR(CURDATE()) THEN totalAmount ELSE 0 END) as paidThisMonthAmount,
                COUNT(CASE WHEN status = 'paid' AND MONTH(invoiceDate) = MONTH(CURDATE()) AND YEAR(invoiceDate) = YEAR(CURDATE()) THEN 1 END) as paidThisMonthCount
            FROM invoices
            WHERE status != 'cancelled'
        `);
        
        res.status(200).json(stats[0] || {
            totalInvoices: 0,
            pendingAmount: 0,
            paidAmount: 0,
            partialAmount: 0,
            overdueAmount: 0,
            pendingCount: 0,
            paidCount: 0,
            paidThisMonthAmount: 0,
            paidThisMonthCount: 0,
        });
    } catch (error) {
        console.error('Error fetching invoice stats:', error);
        res.status(500).json({ message: 'Error fetching invoice stats', error: error.message });
    }
});

// Mobile Payment Logs Routes
/**
 * @route GET /api/billing/mobile-payment-logs
 * @description Get all mobile payment logs (optionally filtered)
 */
router.get('/mobile-payment-logs', async (req, res) => {
    try {
        const { search, mobileProvider, startDate, endDate, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT mpl.*, 
                   u.firstName as createdByFirstName, 
                   u.lastName as createdByLastName
            FROM mobile_payment_logs mpl
            LEFT JOIN users u ON mpl.createdBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (mpl.name LIKE ? OR mpl.refNo LIKE ? OR mpl.phoneNumber LIKE ? OR mpl.accountNumber LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (mobileProvider) {
            query += ` AND mpl.mobileProvider = ?`;
            params.push(mobileProvider);
        }

        if (startDate) {
            query += ` AND DATE(mpl.transactionDate) >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND DATE(mpl.transactionDate) <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY mpl.transactionDate DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM mobile_payment_logs mpl WHERE 1=1`;
        const countParams = [];

        if (search) {
            countQuery += ` AND (mpl.name LIKE ? OR mpl.refNo LIKE ? OR mpl.phoneNumber LIKE ? OR mpl.accountNumber LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (mobileProvider) {
            countQuery += ` AND mpl.mobileProvider = ?`;
            countParams.push(mobileProvider);
        }

        if (startDate) {
            countQuery += ` AND DATE(mpl.transactionDate) >= ?`;
            countParams.push(startDate);
        }

        if (endDate) {
            countQuery += ` AND DATE(mpl.transactionDate) <= ?`;
            countParams.push(endDate);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching mobile payment logs:', error);
        res.status(500).json({ message: 'Error fetching mobile payment logs', error: error.message });
    }
});

/**
 * @route GET /api/billing/mobile-payment-logs/:id
 * @description Get a single mobile payment log by ID
 */
router.get('/mobile-payment-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `SELECT mpl.*, 
                    u.firstName as createdByFirstName, 
                    u.lastName as createdByLastName
             FROM mobile_payment_logs mpl
             LEFT JOIN users u ON mpl.createdBy = u.userId
             WHERE mpl.logId = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Mobile payment log not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching mobile payment log:', error);
        res.status(500).json({ message: 'Error fetching mobile payment log', error: error.message });
    }
});

/**
 * @route POST /api/billing/mobile-payment-logs
 * @description Create a new mobile payment log
 */
router.post('/mobile-payment-logs', async (req, res) => {
    try {
        const { name, amount, refNo, phoneNumber, mobileProvider, accountNumber, transactionDate, notes } = req.body;
        const userId = req.user?.id;

        if (!name || !amount || !refNo || !phoneNumber || !mobileProvider || !transactionDate) {
            return res.status(400).json({ error: 'Name, amount, refNo, phoneNumber, mobileProvider, and transactionDate are required' });
        }

        // Check if refNo already exists
        const [existing] = await pool.execute(
            'SELECT logId FROM mobile_payment_logs WHERE refNo = ?',
            [refNo]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Reference number already exists' });
        }

        const [result] = await pool.execute(
            `INSERT INTO mobile_payment_logs 
             (name, amount, refNo, phoneNumber, mobileProvider, accountNumber, transactionDate, notes, createdBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                parseFloat(amount),
                refNo,
                phoneNumber,
                mobileProvider,
                accountNumber || null,
                transactionDate,
                notes || null,
                userId || null
            ]
        );

        const [newLog] = await pool.execute(
            `SELECT mpl.*, 
                    u.firstName as createdByFirstName, 
                    u.lastName as createdByLastName
             FROM mobile_payment_logs mpl
             LEFT JOIN users u ON mpl.createdBy = u.userId
             WHERE mpl.logId = ?`,
            [result.insertId]
        );

        res.status(201).json(newLog[0]);
    } catch (error) {
        console.error('Error creating mobile payment log:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Reference number already exists' });
        }
        res.status(500).json({ message: 'Error creating mobile payment log', error: error.message });
    }
});

/**
 * @route PUT /api/billing/mobile-payment-logs/:id
 * @description Update a mobile payment log
 */
router.put('/mobile-payment-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, refNo, phoneNumber, mobileProvider, accountNumber, transactionDate, notes } = req.body;

        // Check if log exists
        const [existing] = await pool.execute(
            'SELECT logId FROM mobile_payment_logs WHERE logId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Mobile payment log not found' });
        }

        // Check if refNo already exists (excluding current record)
        if (refNo) {
            const [refCheck] = await pool.execute(
                'SELECT logId FROM mobile_payment_logs WHERE refNo = ? AND logId != ?',
                [refNo, id]
            );

            if (refCheck.length > 0) {
                return res.status(400).json({ error: 'Reference number already exists' });
            }
        }

        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(parseFloat(amount)); }
        if (refNo !== undefined) { updates.push('refNo = ?'); values.push(refNo); }
        if (phoneNumber !== undefined) { updates.push('phoneNumber = ?'); values.push(phoneNumber); }
        if (mobileProvider !== undefined) { updates.push('mobileProvider = ?'); values.push(mobileProvider); }
        if (accountNumber !== undefined) { updates.push('accountNumber = ?'); values.push(accountNumber || null); }
        if (transactionDate !== undefined) { updates.push('transactionDate = ?'); values.push(transactionDate); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE mobile_payment_logs SET ${updates.join(', ')}, updatedAt = NOW() WHERE logId = ?`,
            values
        );

        const [updated] = await pool.execute(
            `SELECT mpl.*, 
                    u.firstName as createdByFirstName, 
                    u.lastName as createdByLastName
             FROM mobile_payment_logs mpl
             LEFT JOIN users u ON mpl.createdBy = u.userId
             WHERE mpl.logId = ?`,
            [id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating mobile payment log:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Reference number already exists' });
        }
        res.status(500).json({ message: 'Error updating mobile payment log', error: error.message });
    }
});

/**
 * @route DELETE /api/billing/mobile-payment-logs/:id
 * @description Delete a mobile payment log
 */
router.delete('/mobile-payment-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if log exists
        const [existing] = await pool.execute(
            'SELECT logId FROM mobile_payment_logs WHERE logId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Mobile payment log not found' });
        }

        await pool.execute('DELETE FROM mobile_payment_logs WHERE logId = ?', [id]);

        res.status(200).json({ 
            message: 'Mobile payment log deleted successfully',
            logId: id
        });
    } catch (error) {
        console.error('Error deleting mobile payment log:', error);
        res.status(500).json({ message: 'Error deleting mobile payment log', error: error.message });
    }
});

// Specialist Charges Routes
/**
 * @route GET /api/billing/specialist-charges
 * @description Get all specialist charges (optionally filtered)
 */
router.get('/specialist-charges', async (req, res) => {
    try {
        const { chargeId, doctorId, search } = req.query;
        let query = `
            SELECT sc.*,
                   ch.chargeCode, ch.name as chargeName,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM specialist_charges sc
            LEFT JOIN service_charges ch ON sc.chargeId = ch.chargeId
            LEFT JOIN users u ON sc.doctorId = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (chargeId) {
            query += ' AND sc.chargeId = ?';
            params.push(chargeId);
        }

        if (doctorId) {
            query += ' AND sc.doctorId = ?';
            params.push(doctorId);
        }

        if (search) {
            query += ' AND (ch.name LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY sc.effectiveFrom DESC, sc.createdAt DESC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching specialist charges:', error);
        res.status(500).json({ message: 'Error fetching specialist charges', error: error.message });
    }
});

/**
 * @route GET /api/billing/specialist-charges/:id
 * @description Get a single specialist charge by ID
 */
router.get('/specialist-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT sc.*,
                   ch.chargeCode, ch.name as chargeName,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM specialist_charges sc
            LEFT JOIN service_charges ch ON sc.chargeId = ch.chargeId
            LEFT JOIN users u ON sc.doctorId = u.userId
            WHERE sc.specialistChargeId = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Specialist charge not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching specialist charge:', error);
        res.status(500).json({ message: 'Error fetching specialist charge', error: error.message });
    }
});

/**
 * @route POST /api/billing/specialist-charges
 * @description Create a new specialist charge
 */
router.post('/specialist-charges', async (req, res) => {
    try {
        const { chargeId, doctorId, amount, effectiveFrom, effectiveTo } = req.body;
        
        if (!chargeId || !doctorId || !amount || !effectiveFrom) {
            return res.status(400).json({ error: 'Charge, doctor, amount, and effectiveFrom date are required' });
        }

        // Check if charge exists
        const [chargeCheck] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [chargeId]);
        if (chargeCheck.length === 0) {
            return res.status(400).json({ error: 'Service charge not found' });
        }

        // Check if doctor exists
        const [doctorCheck] = await pool.query('SELECT userId FROM users WHERE userId = ?', [doctorId]);
        if (doctorCheck.length === 0) {
            return res.status(400).json({ error: 'Doctor not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO specialist_charges (chargeId, doctorId, amount, effectiveFrom, effectiveTo) VALUES (?, ?, ?, ?, ?)',
            [chargeId, doctorId, amount, effectiveFrom, effectiveTo || null]
        );
        
        const [newCharge] = await pool.query(`
            SELECT sc.*,
                   ch.chargeCode, ch.name as chargeName,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM specialist_charges sc
            LEFT JOIN service_charges ch ON sc.chargeId = ch.chargeId
            LEFT JOIN users u ON sc.doctorId = u.userId
            WHERE sc.specialistChargeId = ?
        `, [result.insertId]);
        
        res.status(201).json(newCharge[0]);
    } catch (error) {
        console.error('Error creating specialist charge:', error);
        res.status(500).json({ message: 'Error creating specialist charge', error: error.message });
    }
});

/**
 * @route PUT /api/billing/specialist-charges/:id
 * @description Update a specialist charge
 */
router.put('/specialist-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chargeId, doctorId, amount, effectiveFrom, effectiveTo } = req.body;

        // Check if specialist charge exists
        const [existing] = await pool.query('SELECT specialistChargeId FROM specialist_charges WHERE specialistChargeId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Specialist charge not found' });
        }

        // Check if charge exists (if being updated)
        if (chargeId) {
            const [chargeCheck] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [chargeId]);
            if (chargeCheck.length === 0) {
                return res.status(400).json({ error: 'Service charge not found' });
            }
        }

        // Check if doctor exists (if being updated)
        if (doctorId) {
            const [doctorCheck] = await pool.query('SELECT userId FROM users WHERE userId = ?', [doctorId]);
            if (doctorCheck.length === 0) {
                return res.status(400).json({ error: 'Doctor not found' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (chargeId !== undefined) { updates.push('chargeId = ?'); values.push(chargeId); }
        if (doctorId !== undefined) { updates.push('doctorId = ?'); values.push(doctorId); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (effectiveFrom !== undefined) { updates.push('effectiveFrom = ?'); values.push(effectiveFrom); }
        if (effectiveTo !== undefined) { updates.push('effectiveTo = ?'); values.push(effectiveTo || null); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.query(
            `UPDATE specialist_charges SET ${updates.join(', ')}, updatedAt = NOW() WHERE specialistChargeId = ?`,
            values
        );

        const [updated] = await pool.query(`
            SELECT sc.*,
                   ch.chargeCode, ch.name as chargeName,
                   u.firstName as doctorFirstName, u.lastName as doctorLastName
            FROM specialist_charges sc
            LEFT JOIN service_charges ch ON sc.chargeId = ch.chargeId
            LEFT JOIN users u ON sc.doctorId = u.userId
            WHERE sc.specialistChargeId = ?
        `, [id]);
        
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating specialist charge:', error);
        res.status(500).json({ message: 'Error updating specialist charge', error: error.message });
    }
});

/**
 * @route DELETE /api/billing/specialist-charges/:id
 * @description Delete a specialist charge
 */
router.delete('/specialist-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM specialist_charges WHERE specialistChargeId = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Specialist charge not found' });
        }

        res.status(200).json({ message: 'Specialist charge deleted successfully' });
    } catch (error) {
        console.error('Error deleting specialist charge:', error);
        res.status(500).json({ message: 'Error deleting specialist charge', error: error.message });
    }
});

// Consumables Charges Routes
/**
 * @route GET /api/billing/consumables-charges
 * @description Get all consumables charges (optionally filtered)
 */
router.get('/consumables-charges', async (req, res) => {
    try {
        const { chargeId, search } = req.query;
        let query = `
            SELECT cc.*,
                   ch.chargeCode, ch.name as chargeName
            FROM consumables_charges cc
            LEFT JOIN service_charges ch ON cc.chargeId = ch.chargeId
            WHERE 1=1
        `;
        const params = [];

        if (chargeId) {
            query += ' AND cc.chargeId = ?';
            params.push(chargeId);
        }

        if (search) {
            query += ' AND (ch.name LIKE ? OR ch.chargeCode LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY cc.effectiveFrom DESC, cc.createdAt DESC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching consumables charges:', error);
        res.status(500).json({ message: 'Error fetching consumables charges', error: error.message });
    }
});

/**
 * @route GET /api/billing/consumables-charges/:id
 * @description Get a single consumables charge by ID
 */
router.get('/consumables-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT cc.*,
                   ch.chargeCode, ch.name as chargeName
            FROM consumables_charges cc
            LEFT JOIN service_charges ch ON cc.chargeId = ch.chargeId
            WHERE cc.consumableChargeId = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Consumables charge not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching consumables charge:', error);
        res.status(500).json({ message: 'Error fetching consumables charge', error: error.message });
    }
});

/**
 * @route POST /api/billing/consumables-charges
 * @description Create a new consumables charge
 */
router.post('/consumables-charges', async (req, res) => {
    try {
        const { chargeId, amount, effectiveFrom, effectiveTo } = req.body;
        
        if (!chargeId || !amount || !effectiveFrom) {
            return res.status(400).json({ error: 'Charge, amount, and effectiveFrom date are required' });
        }

        // Check if charge exists
        const [chargeCheck] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [chargeId]);
        if (chargeCheck.length === 0) {
            return res.status(400).json({ error: 'Service charge not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO consumables_charges (chargeId, amount, effectiveFrom, effectiveTo) VALUES (?, ?, ?, ?)',
            [chargeId, amount, effectiveFrom, effectiveTo || null]
        );
        
        const [newCharge] = await pool.query(`
            SELECT cc.*,
                   ch.chargeCode, ch.name as chargeName
            FROM consumables_charges cc
            LEFT JOIN service_charges ch ON cc.chargeId = ch.chargeId
            WHERE cc.consumableChargeId = ?
        `, [result.insertId]);
        
        res.status(201).json(newCharge[0]);
    } catch (error) {
        console.error('Error creating consumables charge:', error);
        res.status(500).json({ message: 'Error creating consumables charge', error: error.message });
    }
});

/**
 * @route PUT /api/billing/consumables-charges/:id
 * @description Update a consumables charge
 */
router.put('/consumables-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { chargeId, amount, effectiveFrom, effectiveTo } = req.body;

        // Check if consumables charge exists
        const [existing] = await pool.query('SELECT consumableChargeId FROM consumables_charges WHERE consumableChargeId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Consumables charge not found' });
        }

        // Check if charge exists (if being updated)
        if (chargeId) {
            const [chargeCheck] = await pool.query('SELECT chargeId FROM service_charges WHERE chargeId = ?', [chargeId]);
            if (chargeCheck.length === 0) {
                return res.status(400).json({ error: 'Service charge not found' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (chargeId !== undefined) { updates.push('chargeId = ?'); values.push(chargeId); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (effectiveFrom !== undefined) { updates.push('effectiveFrom = ?'); values.push(effectiveFrom); }
        if (effectiveTo !== undefined) { updates.push('effectiveTo = ?'); values.push(effectiveTo || null); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.query(
            `UPDATE consumables_charges SET ${updates.join(', ')}, updatedAt = NOW() WHERE consumableChargeId = ?`,
            values
        );

        const [updated] = await pool.query(`
            SELECT cc.*,
                   ch.chargeCode, ch.name as chargeName
            FROM consumables_charges cc
            LEFT JOIN service_charges ch ON cc.chargeId = ch.chargeId
            WHERE cc.consumableChargeId = ?
        `, [id]);
        
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating consumables charge:', error);
        res.status(500).json({ message: 'Error updating consumables charge', error: error.message });
    }
});

/**
 * @route DELETE /api/billing/consumables-charges/:id
 * @description Delete a consumables charge
 */
router.delete('/consumables-charges/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM consumables_charges WHERE consumableChargeId = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Consumables charge not found' });
        }

        res.status(200).json({ message: 'Consumables charge deleted successfully' });
    } catch (error) {
        console.error('Error deleting consumables charge:', error);
        res.status(500).json({ message: 'Error deleting consumables charge', error: error.message });
    }
});

module.exports = router;

