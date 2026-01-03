// Department routes - Full CRUD operations
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/departments
 * @description Get all departments
 */
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        // Use DISTINCT and filter by isActive to avoid duplicates
        let query = `
            SELECT DISTINCT 
                d.departmentId,
                d.departmentCode,
                d.departmentName,
                d.description,
                d.location,
                d.headOfDepartmentId,
                d.isActive,
                d.createdAt,
                d.updatedAt,
                CONCAT(u.firstName, ' ', u.lastName) as headOfDepartmentName
            FROM departments d
            LEFT JOIN users u ON d.headOfDepartmentId = u.userId
            WHERE d.isActive = TRUE
        `;
        const params = [];

        if (search) {
            query += ` AND (d.departmentName LIKE ? OR d.description LIKE ? OR d.departmentCode LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY d.departmentName`;

        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Error fetching departments', error: error.message });
    }
});

/**
 * @route GET /api/departments/:id
 * @description Get a single department
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM departments WHERE departmentId = ?',
            [req.params.id]
        );
        
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Department not found' });
        }
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ message: 'Error fetching department', error: error.message });
    }
});

/**
 * @route POST /api/departments
 * @description Create a new department
 */
router.post('/', async (req, res) => {
    try {
        const deptData = req.body;
        const [result] = await pool.execute(
            `INSERT INTO departments (departmentName, description, location, headOfDepartmentId)
             VALUES (?, ?, ?, ?)`,
            [
                deptData.departmentName,
                deptData.description,
                deptData.location,
                deptData.headOfDepartmentId || null
            ]
        );

        const [newDept] = await pool.execute(
            'SELECT * FROM departments WHERE departmentId = ?',
            [result.insertId]
        );

        res.status(201).json(newDept[0]);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Error creating department', error: error.message });
    }
});

/**
 * @route PUT /api/departments/:id
 * @description Update a department
 */
router.put('/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];

        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'departmentId') {
                updates.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);

        await pool.execute(
            `UPDATE departments SET ${updates.join(', ')} WHERE departmentId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM departments WHERE departmentId = ?',
            [req.params.id]
        );

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ message: 'Error updating department', error: error.message });
    }
});

/**
 * @route DELETE /api/departments/:id
 * @description Delete (deactivate) a department
 */
router.delete('/:id', async (req, res) => {
    try {
        // Soft delete by setting isActive to FALSE
        await pool.execute(
            'UPDATE departments SET isActive = FALSE WHERE departmentId = ?',
            [req.params.id]
        );

        res.status(200).json({ message: 'Department deactivated successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ message: 'Error deleting department', error: error.message });
    }
});

module.exports = router;

