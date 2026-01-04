// Insurance management routes
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================
// INSURANCE PROVIDERS
// ============================================

/**
 * @route GET /api/insurance/providers
 * @description Get all insurance providers with optional filters
 */
router.get('/providers', async (req, res) => {
    try {
        const { status, providerType, search } = req.query;
        
        let query = `
            SELECT *
            FROM insurance_providers
            WHERE 1=1
        `;
        const params = [];

        if (status === 'active') {
            query += ' AND isActive = 1';
        } else if (status === 'inactive') {
            query += ' AND isActive = 0';
        }

        if (providerType) {
            query += ' AND providerType = ?';
            params.push(providerType);
        }

        if (search) {
            query += ' AND (providerName LIKE ? OR providerCode LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY providerName ASC';
        
        const [rows] = await pool.execute(query, params);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching insurance providers:', error);
        res.status(500).json({ message: 'Error fetching insurance providers', error: error.message });
    }
});

/**
 * @route GET /api/insurance/providers/:id
 * @description Get a single insurance provider by ID
 */
router.get('/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM insurance_providers WHERE providerId = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Insurance provider not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching insurance provider:', error);
        res.status(500).json({ message: 'Error fetching insurance provider', error: error.message });
    }
});

/**
 * @route POST /api/insurance/providers
 * @description Create a new insurance provider
 */
router.post('/providers', async (req, res) => {
    try {
        const {
            providerCode,
            providerName,
            contactPerson,
            phone,
            email,
            address,
            claimsAddress,
            website,
            isActive = true,
            notes
        } = req.body;

        if (!providerName) {
            return res.status(400).json({ error: 'Provider name is required' });
        }

        // Generate provider code if not provided
        let finalProviderCode = providerCode;
        if (!finalProviderCode) {
            const [count] = await pool.execute('SELECT COUNT(*) as count FROM insurance_providers');
            const providerNum = count[0].count + 1;
            finalProviderCode = `INS-${String(providerNum).padStart(4, '0')}`;
        } else {
            // Check if code already exists
            const [existing] = await pool.execute('SELECT providerId FROM insurance_providers WHERE providerCode = ?', [finalProviderCode]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Provider code already exists' });
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO insurance_providers (
                providerCode, providerName, contactPerson, phone, email, address, claimsAddress, website, isActive, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalProviderCode,
                providerName,
                contactPerson || null,
                phone || null,
                email || null,
                address || null,
                claimsAddress || null,
                website || null,
                isActive,
                notes || null
            ]
        );
        
        const [newProvider] = await pool.execute(
            'SELECT * FROM insurance_providers WHERE providerId = ?',
            [result.insertId]
        );
        
        res.status(201).json(newProvider[0]);
    } catch (error) {
        console.error('Error creating insurance provider:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Provider code already exists' });
        }
        res.status(500).json({ message: 'Error creating insurance provider', error: error.message });
    }
});

/**
 * @route PUT /api/insurance/providers/:id
 * @description Update an insurance provider
 */
router.put('/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            providerCode,
            providerName,
            contactPerson,
            phone,
            email,
            address,
            claimsAddress,
            website,
            isActive,
            notes
        } = req.body;

        // Check if provider exists
        const [existing] = await pool.execute('SELECT providerId FROM insurance_providers WHERE providerId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Insurance provider not found' });
        }

        // Check for duplicate provider code if it's being changed
        if (providerCode) {
            const [duplicate] = await pool.execute(
                'SELECT providerId FROM insurance_providers WHERE providerCode = ? AND providerId != ?',
                [providerCode, id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ error: 'Provider code already exists' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (providerCode !== undefined) { updates.push('providerCode = ?'); values.push(providerCode); }
        if (providerName !== undefined) { updates.push('providerName = ?'); values.push(providerName); }
        if (contactPerson !== undefined) { updates.push('contactPerson = ?'); values.push(contactPerson); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (claimsAddress !== undefined) { updates.push('claimsAddress = ?'); values.push(claimsAddress); }
        if (website !== undefined) { updates.push('website = ?'); values.push(website); }
        if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.execute(
            `UPDATE insurance_providers SET ${updates.join(', ')}, updatedAt = NOW() WHERE providerId = ?`,
            values
        );

        const [updated] = await pool.execute(
            'SELECT * FROM insurance_providers WHERE providerId = ?',
            [id]
        );
        
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating insurance provider:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Provider code already exists' });
        }
        res.status(500).json({ message: 'Error updating insurance provider', error: error.message });
    }
});

/**
 * @route DELETE /api/insurance/providers/:id
 * @description Delete an insurance provider
 */
router.delete('/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if provider exists
        const [existing] = await pool.execute('SELECT providerId FROM insurance_providers WHERE providerId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Insurance provider not found' });
        }

        // Check if provider has active policies
        const [policies] = await pool.execute(
            'SELECT COUNT(*) as count FROM patient_insurance WHERE providerId = ? AND isActive = 1 AND (coverageEndDate IS NULL OR coverageEndDate >= CURDATE())',
            [id]
        );
        if (policies[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete provider with active policies. Deactivate the provider instead.' });
        }

        await pool.execute('DELETE FROM insurance_providers WHERE providerId = ?', [id]);
        
        res.status(200).json({ message: 'Insurance provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting insurance provider:', error);
        res.status(500).json({ message: 'Error deleting insurance provider', error: error.message });
    }
});

// ============================================
// PATIENT INSURANCE POLICIES
// ============================================

/**
 * @route GET /api/insurance/policies
 * @description Get all patient insurance policies with optional filters
 */
router.get('/policies', async (req, res) => {
    try {
        const { patientId, providerId, status, search } = req.query;
        
        let query = `
            SELECT pi.*,
                   p.patientNumber, p.firstName, p.lastName, p.phone as patientPhone,
                   ip.providerName, ip.providerCode
            FROM patient_insurance pi
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE 1=1
        `;
        const params = [];

        if (patientId) {
            query += ' AND pi.patientId = ?';
            params.push(patientId);
        }

        if (providerId) {
            query += ' AND pi.providerId = ?';
            params.push(providerId);
        }

        if (status === 'active') {
            query += ' AND pi.isActive = 1 AND (pi.coverageEndDate IS NULL OR pi.coverageEndDate >= CURDATE())';
        } else if (status === 'inactive') {
            query += ' AND (pi.isActive = 0 OR pi.coverageEndDate < CURDATE())';
        }

        if (search) {
            query += ' AND (pi.policyNumber LIKE ? OR pi.memberId LIKE ? OR p.firstName LIKE ? OR p.lastName LIKE ? OR ip.providerName LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY pi.coverageStartDate DESC, pi.createdAt DESC';
        
        const [rows] = await pool.execute(query, params);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching insurance policies:', error);
        res.status(500).json({ message: 'Error fetching insurance policies', error: error.message });
    }
});

/**
 * @route GET /api/insurance/policies/:id
 * @description Get a single insurance policy by ID
 */
router.get('/policies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(`
            SELECT pi.*,
                   p.patientNumber, p.firstName, p.lastName, p.phone as patientPhone,
                   ip.providerName, ip.providerCode
            FROM patient_insurance pi
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE pi.patientInsuranceId = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Insurance policy not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching insurance policy:', error);
        res.status(500).json({ message: 'Error fetching insurance policy', error: error.message });
    }
});

/**
 * @route POST /api/insurance/policies
 * @description Create a new patient insurance policy
 */
router.post('/policies', async (req, res) => {
    try {
        const {
            patientId,
            providerId,
            packageId,
            policyNumber,
            memberId,
            memberName,
            relationship,
            coverageStartDate,
            coverageEndDate,
            isActive = true,
            notes
        } = req.body;

        if (!patientId || !providerId || !policyNumber || !coverageStartDate) {
            return res.status(400).json({ error: 'Patient ID, provider ID, policy number, and coverage start date are required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO patient_insurance (
                patientId, providerId, packageId, policyNumber, memberId, memberName, relationship,
                coverageStartDate, coverageEndDate, isActive, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                providerId,
                packageId || null,
                policyNumber,
                memberId || null,
                memberName || null,
                relationship || 'self',
                coverageStartDate,
                coverageEndDate || null,
                isActive,
                notes || null
            ]
        );
        
        const [newPolicy] = await pool.execute(`
            SELECT pi.*,
                   p.patientNumber, p.firstName, p.lastName,
                   ip.providerName, ip.providerCode
            FROM patient_insurance pi
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE pi.patientInsuranceId = ?
        `, [result.insertId]);
        
        res.status(201).json(newPolicy[0]);
    } catch (error) {
        console.error('Error creating insurance policy:', error);
        res.status(500).json({ message: 'Error creating insurance policy', error: error.message });
    }
});

/**
 * @route PUT /api/insurance/policies/:id
 * @description Update an insurance policy
 */
router.put('/policies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if policy exists
        const [existing] = await pool.execute('SELECT patientInsuranceId FROM patient_insurance WHERE patientInsuranceId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Insurance policy not found' });
        }

        const {
            providerId,
            packageId,
            policyNumber,
            memberId,
            memberName,
            relationship,
            coverageStartDate,
            coverageEndDate,
            isActive,
            notes
        } = req.body;

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (providerId !== undefined) { updates.push('providerId = ?'); values.push(providerId); }
        if (packageId !== undefined) { updates.push('packageId = ?'); values.push(packageId); }
        if (policyNumber !== undefined) { updates.push('policyNumber = ?'); values.push(policyNumber); }
        if (memberId !== undefined) { updates.push('memberId = ?'); values.push(memberId); }
        if (memberName !== undefined) { updates.push('memberName = ?'); values.push(memberName); }
        if (relationship !== undefined) { updates.push('relationship = ?'); values.push(relationship); }
        if (coverageStartDate !== undefined) { updates.push('coverageStartDate = ?'); values.push(coverageStartDate); }
        if (coverageEndDate !== undefined) { updates.push('coverageEndDate = ?'); values.push(coverageEndDate); }
        if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.execute(
            `UPDATE patient_insurance SET ${updates.join(', ')}, updatedAt = NOW() WHERE patientInsuranceId = ?`,
            values
        );

        const [updated] = await pool.execute(`
            SELECT pi.*,
                   p.patientNumber, p.firstName, p.lastName,
                   ip.providerName, ip.providerCode
            FROM patient_insurance pi
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE pi.patientInsuranceId = ?
        `, [id]);
        
        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating insurance policy:', error);
        res.status(500).json({ message: 'Error updating insurance policy', error: error.message });
    }
});

/**
 * @route DELETE /api/insurance/policies/:id
 * @description Delete an insurance policy
 */
router.delete('/policies/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if policy exists
        const [existing] = await pool.execute('SELECT patientInsuranceId FROM patient_insurance WHERE patientInsuranceId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Insurance policy not found' });
        }

        await pool.execute('DELETE FROM patient_insurance WHERE patientInsuranceId = ?', [id]);
        
        res.status(200).json({ message: 'Insurance policy deleted successfully' });
    } catch (error) {
        console.error('Error deleting insurance policy:', error);
        res.status(500).json({ message: 'Error deleting insurance policy', error: error.message });
    }
});

/**
 * @route GET /api/insurance/stats/summary
 * @description Get summary statistics for insurance
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM insurance_providers WHERE isActive = 1) as activeProviders,
                (SELECT COUNT(*) FROM patient_insurance WHERE isActive = 1 AND (coverageEndDate IS NULL OR coverageEndDate >= CURDATE())) as activePolicies,
                (SELECT COUNT(*) FROM insurance_claims WHERE status IN ('draft', 'submitted', 'under_review')) as pendingClaims,
                (SELECT COUNT(*) FROM insurance_claims WHERE status IN ('approved', 'partially_approved', 'paid')) as approvedClaims,
                (SELECT COALESCE(SUM(claimAmount), 0) FROM insurance_claims WHERE status IN ('approved', 'partially_approved', 'paid')) as totalClaimedAmount,
                (SELECT COALESCE(SUM(approvedAmount), 0) FROM insurance_claims WHERE status IN ('approved', 'partially_approved', 'paid')) as totalApprovedAmount
            FROM dual
        `);
        
        res.status(200).json(stats[0] || {
            activeProviders: 0,
            activePolicies: 0,
            pendingClaims: 0,
            approvedClaims: 0,
            totalClaimedAmount: 0,
            totalApprovedAmount: 0
        });
    } catch (error) {
        console.error('Error fetching insurance stats:', error);
        res.status(500).json({ message: 'Error fetching insurance stats', error: error.message });
    }
});

module.exports = router;

