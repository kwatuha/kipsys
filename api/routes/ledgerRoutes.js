// Ledger routes - Chart of Accounts and Journal Entries
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================
// CHART OF ACCOUNTS
// ============================================

/**
 * @route GET /api/ledger/accounts
 * @description Get all accounts (chart of accounts)
 */
router.get('/accounts', async (req, res) => {
    try {
        const { search, accountType, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                a.*,
                COALESCE(SUM(CASE WHEN t.debitAccountId = a.accountId THEN t.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN t.creditAccountId = a.accountId THEN t.amount ELSE 0 END), 0) as balance,
                MAX(t.transactionDate) as lastTransaction
            FROM accounts a
            LEFT JOIN transactions t ON (t.debitAccountId = a.accountId OR t.creditAccountId = a.accountId)
            WHERE a.isActive = 1
        `;
        const params = [];

        if (search) {
            query += ` AND (
                a.accountCode LIKE ? OR 
                a.accountName LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (accountType) {
            query += ` AND a.accountType = ?`;
            params.push(accountType);
        }

        query += ` GROUP BY a.accountId ORDER BY a.accountCode LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ message: 'Error fetching accounts', error: error.message });
    }
});

/**
 * @route GET /api/ledger/accounts/:id
 * @description Get a single account
 */
router.get('/accounts/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                a.*,
                COALESCE(SUM(CASE WHEN t.debitAccountId = a.accountId THEN t.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN t.creditAccountId = a.accountId THEN t.amount ELSE 0 END), 0) as balance,
                MAX(t.transactionDate) as lastTransaction
            FROM accounts a
            LEFT JOIN transactions t ON (t.debitAccountId = a.accountId OR t.creditAccountId = a.accountId)
            WHERE a.accountId = ? AND a.isActive = 1
            GROUP BY a.accountId`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Error fetching account', error: error.message });
    }
});

/**
 * @route POST /api/ledger/accounts
 * @description Create a new account
 */
router.post('/accounts', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            accountCode,
            accountName,
            accountType,
            parentAccountId,
            description
        } = req.body;

        if (!accountCode || !accountName || !accountType) {
            return res.status(400).json({ message: 'Account code, name, and type are required' });
        }

        const [result] = await connection.execute(
            `INSERT INTO accounts (
                accountCode, accountName, accountType, parentAccountId, description
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                accountCode,
                accountName,
                accountType,
                parentAccountId || null,
                description || null
            ]
        );

        const [newAccount] = await connection.execute(
            'SELECT * FROM accounts WHERE accountId = ?',
            [result.insertId]
        );

        await connection.commit();
        res.status(201).json(newAccount[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Error creating account', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/ledger/accounts/:id
 * @description Update an account
 */
router.put('/accounts/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            accountCode,
            accountName,
            accountType,
            parentAccountId,
            description,
            isActive
        } = req.body;

        // Check if account exists
        const [existing] = await connection.execute(
            'SELECT * FROM accounts WHERE accountId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Account not found' });
        }

        await connection.execute(
            `UPDATE accounts SET
                accountCode = ?,
                accountName = ?,
                accountType = ?,
                parentAccountId = ?,
                description = ?,
                isActive = ?
            WHERE accountId = ?`,
            [
                accountCode !== undefined ? accountCode : existing[0].accountCode,
                accountName !== undefined ? accountName : existing[0].accountName,
                accountType !== undefined ? accountType : existing[0].accountType,
                parentAccountId !== undefined ? parentAccountId : existing[0].parentAccountId,
                description !== undefined ? description : existing[0].description,
                isActive !== undefined ? isActive : existing[0].isActive,
                req.params.id
            ]
        );

        const [updatedAccount] = await connection.execute(
            'SELECT * FROM accounts WHERE accountId = ?',
            [req.params.id]
        );

        await connection.commit();
        res.status(200).json(updatedAccount[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating account:', error);
        res.status(500).json({ message: 'Error updating account', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/ledger/accounts/:id
 * @description Soft delete an account
 */
router.delete('/accounts/:id', async (req, res) => {
    try {
        // Check if account exists
        const [existing] = await pool.execute(
            'SELECT * FROM accounts WHERE accountId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Soft delete
        await pool.execute(
            'UPDATE accounts SET isActive = 0 WHERE accountId = ?',
            [req.params.id]
        );

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
});

// ============================================
// JOURNAL ENTRIES (TRANSACTIONS)
// ============================================

/**
 * @route GET /api/ledger/transactions
 * @description Get all transactions (journal entries)
 */
router.get('/transactions', async (req, res) => {
    try {
        const { search, startDate, endDate, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                t.*,
                da.accountCode as debitAccountCode,
                da.accountName as debitAccountName,
                ca.accountCode as creditAccountCode,
                ca.accountName as creditAccountName,
                u.firstName as postedByFirstName,
                u.lastName as postedByLastName
            FROM transactions t
            LEFT JOIN accounts da ON t.debitAccountId = da.accountId
            LEFT JOIN accounts ca ON t.creditAccountId = ca.accountId
            LEFT JOIN users u ON t.postedBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (
                t.transactionNumber LIKE ? OR 
                t.description LIKE ? OR
                t.referenceNumber LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (startDate) {
            query += ` AND t.transactionDate >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND t.transactionDate <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY t.transactionDate DESC, t.createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
});

/**
 * @route GET /api/ledger/transactions/:id
 * @description Get a single transaction
 */
router.get('/transactions/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                t.*,
                da.accountCode as debitAccountCode,
                da.accountName as debitAccountName,
                ca.accountCode as creditAccountCode,
                ca.accountName as creditAccountName,
                u.firstName as postedByFirstName,
                u.lastName as postedByLastName
            FROM transactions t
            LEFT JOIN accounts da ON t.debitAccountId = da.accountId
            LEFT JOIN accounts ca ON t.creditAccountId = ca.accountId
            LEFT JOIN users u ON t.postedBy = u.userId
            WHERE t.transactionId = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Error fetching transaction', error: error.message });
    }
});

/**
 * @route POST /api/ledger/transactions
 * @description Create a new transaction (journal entry)
 */
router.post('/transactions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            transactionDate,
            description,
            referenceNumber,
            referenceType,
            debitAccountId,
            creditAccountId,
            amount,
            notes,
            postedBy
        } = req.body;

        if (!transactionDate || !description || !debitAccountId || !creditAccountId || !amount) {
            return res.status(400).json({ message: 'Transaction date, description, accounts, and amount are required' });
        }

        if (debitAccountId === creditAccountId) {
            return res.status(400).json({ message: 'Debit and credit accounts cannot be the same' });
        }

        // Generate transaction number
        const [lastTrans] = await connection.execute(
            'SELECT transactionNumber FROM transactions ORDER BY transactionId DESC LIMIT 1'
        );
        let transactionNumber = 'TRX-000001';
        if (lastTrans.length > 0) {
            const lastNum = parseInt(lastTrans[0].transactionNumber.split('-')[1]);
            transactionNumber = `TRX-${String(lastNum + 1).padStart(6, '0')}`;
        }

        const [result] = await connection.execute(
            `INSERT INTO transactions (
                transactionNumber, transactionDate, description, referenceNumber, referenceType,
                debitAccountId, creditAccountId, amount, notes, postedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionNumber,
                transactionDate,
                description,
                referenceNumber || null,
                referenceType || null,
                debitAccountId,
                creditAccountId,
                amount,
                notes || null,
                postedBy || null
            ]
        );

        const [newTransaction] = await connection.execute(
            `SELECT 
                t.*,
                da.accountCode as debitAccountCode,
                da.accountName as debitAccountName,
                ca.accountCode as creditAccountCode,
                ca.accountName as creditAccountName
            FROM transactions t
            LEFT JOIN accounts da ON t.debitAccountId = da.accountId
            LEFT JOIN accounts ca ON t.creditAccountId = ca.accountId
            WHERE t.transactionId = ?`,
            [result.insertId]
        );

        await connection.commit();
        res.status(201).json(newTransaction[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Error creating transaction', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/ledger/transactions/:id
 * @description Update a transaction
 */
router.put('/transactions/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            transactionDate,
            description,
            referenceNumber,
            referenceType,
            debitAccountId,
            creditAccountId,
            amount,
            notes
        } = req.body;

        // Check if transaction exists
        const [existing] = await connection.execute(
            'SELECT * FROM transactions WHERE transactionId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (debitAccountId === creditAccountId) {
            await connection.rollback();
            return res.status(400).json({ message: 'Debit and credit accounts cannot be the same' });
        }

        await connection.execute(
            `UPDATE transactions SET
                transactionDate = ?,
                description = ?,
                referenceNumber = ?,
                referenceType = ?,
                debitAccountId = ?,
                creditAccountId = ?,
                amount = ?,
                notes = ?
            WHERE transactionId = ?`,
            [
                transactionDate !== undefined ? transactionDate : existing[0].transactionDate,
                description !== undefined ? description : existing[0].description,
                referenceNumber !== undefined ? referenceNumber : existing[0].referenceNumber,
                referenceType !== undefined ? referenceType : existing[0].referenceType,
                debitAccountId !== undefined ? debitAccountId : existing[0].debitAccountId,
                creditAccountId !== undefined ? creditAccountId : existing[0].creditAccountId,
                amount !== undefined ? amount : existing[0].amount,
                notes !== undefined ? notes : existing[0].notes,
                req.params.id
            ]
        );

        const [updatedTransaction] = await connection.execute(
            `SELECT 
                t.*,
                da.accountCode as debitAccountCode,
                da.accountName as debitAccountName,
                ca.accountCode as creditAccountCode,
                ca.accountName as creditAccountName
            FROM transactions t
            LEFT JOIN accounts da ON t.debitAccountId = da.accountId
            LEFT JOIN accounts ca ON t.creditAccountId = ca.accountId
            WHERE t.transactionId = ?`,
            [req.params.id]
        );

        await connection.commit();
        res.status(200).json(updatedTransaction[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Error updating transaction', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route DELETE /api/ledger/transactions/:id
 * @description Delete a transaction
 */
router.delete('/transactions/:id', async (req, res) => {
    try {
        // Check if transaction exists
        const [existing] = await pool.execute(
            'SELECT * FROM transactions WHERE transactionId = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Hard delete (transactions are typically not deleted, but we'll allow it)
        await pool.execute(
            'DELETE FROM transactions WHERE transactionId = ?',
            [req.params.id]
        );

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction', error: error.message });
    }
});

module.exports = router;

