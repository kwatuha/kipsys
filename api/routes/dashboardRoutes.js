// Dashboard statistics routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route GET /api/dashboard/stats
 * @description Get comprehensive dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Get total patients
        const [patientCount] = await pool.query('SELECT COUNT(*) as total FROM patients WHERE voided = 0');
        const totalPatients = patientCount[0]?.total || 0;

        // Get today's appointments
        const today = new Date().toISOString().split('T')[0];
        const [appointmentCount] = await pool.query(
            'SELECT COUNT(*) as total FROM appointments WHERE appointmentDate = ?',
            [today]
        );
        const todayAppointments = appointmentCount[0]?.total || 0;

        // Get active queue entries
        const [queueCount] = await pool.query(
            'SELECT COUNT(*) as total FROM queue_entries WHERE status IN (?, ?, ?)',
            ['waiting', 'called', 'serving']
        ).catch(() => [[{ total: 0 }]]);
        const activeQueue = queueCount[0]?.total || 0;

        // Get total employees
        const [employeeCount] = await pool.query(
            'SELECT COUNT(*) as total FROM employees WHERE status = ?',
            ['active']
        );
        const totalEmployees = employeeCount[0]?.total || 0;

        // Get total departments
        const [deptCount] = await pool.query(
            'SELECT COUNT(*) as total FROM departments WHERE isActive = TRUE'
        );
        const totalDepartments = deptCount[0]?.total || 0;

        // Get monthly revenue (from invoices)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const [revenueData] = await pool.query(`
            SELECT COALESCE(SUM(totalAmount), 0) as total
            FROM invoices
            WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ? AND status = 'paid'
        `, [currentMonth, currentYear]);
        const monthlyRevenue = parseFloat(revenueData[0]?.total || 0);

        // Get pending invoices
        const [pendingInvoices] = await pool.query(
            'SELECT COUNT(*) as total FROM invoices WHERE status = ?',
            ['pending']
        );
        const pendingInvoicesCount = pendingInvoices[0]?.total || 0;

        // Get low stock items
        const [lowStock] = await pool.query(`
            SELECT COUNT(*) as total
            FROM inventory_items
            WHERE quantityOnHand <= reorderLevel AND isActive = TRUE
        `);
        const lowStockItems = lowStock[0]?.total || 0;

        // Get inpatients
        const [inpatients] = await pool.query(`
            SELECT COUNT(*) as total
            FROM inpatient_admissions
            WHERE dischargeDate IS NULL
        `);
        const inpatientsCount = inpatients[0]?.total || 0;

        // Get ICU patients
        const [icuPatients] = await pool.query(`
            SELECT COUNT(*) as total
            FROM icu_admissions
            WHERE dischargeDate IS NULL
        `);
        const icuPatientsCount = icuPatients[0]?.total || 0;

        // Get maternity patients
        const [maternityPatients] = await pool.query(`
            SELECT COUNT(*) as total
            FROM maternity_admissions
            WHERE dischargeDate IS NULL
        `);
        const maternityPatientsCount = maternityPatients[0]?.total || 0;

        res.status(200).json({
            totalPatients,
            todayAppointments,
            activeQueue,
            totalEmployees,
            totalDepartments,
            monthlyRevenue,
            pendingInvoices: pendingInvoicesCount,
            lowStockItems,
            inpatients: inpatientsCount,
            icuPatients: icuPatientsCount,
            maternityPatients: maternityPatientsCount,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
    }
});

/**
 * @route GET /api/dashboard/recent-activities
 * @description Get recent system activities
 */
router.get('/recent-activities', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get recent appointments
        const [recentAppointments] = await pool.query(`
            SELECT 
                a.*,
                CONCAT(p.firstName, ' ', p.lastName) as patientName,
                p.patientNumber
            FROM appointments a
            LEFT JOIN patients p ON a.patientId = p.patientId
            ORDER BY a.createdAt DESC
            LIMIT ?
        `, [limit]);

        // Get recent patients
        const [recentPatients] = await pool.query(`
            SELECT 
                patientId,
                firstName,
                lastName,
                patientNumber,
                createdAt
            FROM patients
            WHERE voided = 0
            ORDER BY createdAt DESC
            LIMIT ?
        `, [limit]);

        res.status(200).json({
            appointments: recentAppointments,
            patients: recentPatients,
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
    }
});

module.exports = router;

