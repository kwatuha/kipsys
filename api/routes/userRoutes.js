// User management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * @route GET /api/users
 * @description Get all users
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.userId, u.username, u.email, u.firstName, u.lastName, 
                u.phone, u.department, u.isActive, u.roleId, u.createdAt, u.updatedAt,
                r.roleName AS role
            FROM users u
            LEFT JOIN roles r ON u.roleId = r.roleId
            WHERE u.voided = 0
            ORDER BY u.createdAt DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

/**
 * @route GET /api/users/:id
 * @description Get a single user by ID
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.userId, u.username, u.email, u.firstName, u.lastName, 
                u.phone, u.department, u.isActive, u.roleId, u.createdAt, u.updatedAt,
                r.roleName AS role
            FROM users u
            LEFT JOIN roles r ON u.roleId = r.roleId
            WHERE u.userId = ? AND u.voided = 0
        `, [id]);
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

/**
 * @route POST /api/users
 * @description Create a new user
 */
router.post('/', async (req, res) => {
    const { username, email, password, firstName, lastName, phone, roleId, department } = req.body;

    if (!username || !email || !password || !firstName || !lastName || !roleId) {
        return res.status(400).json({ error: 'Please enter all required fields' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT userId FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User with that username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, passwordHash, firstName, lastName, phone, roleId, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, firstName, lastName, phone || null, roleId, department || null]
        );

        const insertedUserId = result.insertId;

        // Get the created user
        const [rows] = await pool.query(`
            SELECT 
                u.userId, u.username, u.email, u.firstName, u.lastName, 
                u.phone, u.department, u.isActive, u.roleId, u.createdAt, u.updatedAt,
                r.roleName AS role
            FROM users u
            LEFT JOIN roles r ON u.roleId = r.roleId
            WHERE u.userId = ?
        `, [insertedUserId]);

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'User with that username or email already exists' });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

/**
 * @route PUT /api/users/:id
 * @description Update a user
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email, firstName, lastName, phone, roleId, department, isActive } = req.body;

    try {
        // Check if user exists
        const [existing] = await pool.execute(
            'SELECT userId FROM users WHERE userId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (username !== undefined) { updates.push('username = ?'); values.push(username); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (firstName !== undefined) { updates.push('firstName = ?'); values.push(firstName); }
        if (lastName !== undefined) { updates.push('lastName = ?'); values.push(lastName); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (roleId !== undefined) { updates.push('roleId = ?'); values.push(roleId); }
        if (department !== undefined) { updates.push('department = ?'); values.push(department); }
        if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE users SET ${updates.join(', ')}, updatedAt = NOW() WHERE userId = ?`,
            values
        );

        // Get updated user
        const [rows] = await pool.query(`
            SELECT 
                u.userId, u.username, u.email, u.firstName, u.lastName, 
                u.phone, u.department, u.isActive, u.roleId, u.createdAt, u.updatedAt,
                r.roleName AS role
            FROM users u
            LEFT JOIN roles r ON u.roleId = r.roleId
            WHERE u.userId = ?
        `, [id]);

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

/**
 * @route DELETE /api/users/:id
 * @description Soft delete a user (set voided = true)
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.execute(
            'UPDATE users SET voided = 1, updatedAt = NOW() WHERE userId = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

/**
 * @route PUT /api/users/:id/password
 * @description Change user password
 */
router.put('/:id/password', async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Please provide current and new password' });
    }

    try {
        // Get current user
        const [users] = await pool.execute(
            'SELECT passwordHash FROM users WHERE userId = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.execute(
            'UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE userId = ?',
            [passwordHash, id]
        );

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
});

module.exports = router;

