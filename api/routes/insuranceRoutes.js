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

// ============================================
// INSURANCE CLAIMS
// ============================================

/**
 * @route GET /api/insurance/claims
 * @description Get all insurance claims with optional filters
 */
router.get('/claims', async (req, res) => {
    try {
        const { status, providerId, patientId, search } = req.query;

        let query = `
            SELECT ic.*,
                   i.invoiceNumber, i.totalAmount as invoiceAmount,
                   pi.policyNumber, pi.memberId,
                   p.patientNumber, p.firstName, p.lastName,
                   ip.providerName, ip.providerCode,
                   u.firstName as createdByFirstName, u.lastName as createdByLastName
            FROM insurance_claims ic
            LEFT JOIN invoices i ON ic.invoiceId = i.invoiceId
            LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            LEFT JOIN users u ON ic.createdBy = u.userId
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND ic.status = ?';
            params.push(status);
        }

        if (providerId) {
            query += ' AND pi.providerId = ?';
            params.push(providerId);
        }

        if (patientId) {
            query += ' AND pi.patientId = ?';
            params.push(patientId);
        }

        if (search) {
            query += ' AND (ic.claimNumber LIKE ? OR p.firstName LIKE ? OR p.lastName LIKE ? OR i.invoiceNumber LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY ic.claimDate DESC, ic.createdAt DESC';

        const [rows] = await pool.execute(query, params);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching insurance claims:', error);
        res.status(500).json({ message: 'Error fetching insurance claims', error: error.message });
    }
});

/**
 * @route GET /api/insurance/claims/:id
 * @description Get a single insurance claim by ID with requirements
 */
router.get('/claims/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get claim details
        const [claims] = await pool.execute(`
            SELECT ic.*,
                   i.invoiceNumber, i.totalAmount as invoiceAmount, i.invoiceDate,
                   pi.policyNumber, pi.memberId, pi.memberName,
                   p.patientNumber, p.firstName, p.lastName, p.dateOfBirth, p.gender,
                   ip.providerName, ip.providerCode, ip.providerId,
                   u.firstName as createdByFirstName, u.lastName as createdByLastName
            FROM insurance_claims ic
            LEFT JOIN invoices i ON ic.invoiceId = i.invoiceId
            LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            LEFT JOIN users u ON ic.createdBy = u.userId
            WHERE ic.claimId = ?
        `, [id]);

        if (claims.length === 0) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        const claim = claims[0];

        // Get requirements for this claim's provider
        const [requirements] = await pool.execute(`
            SELECT cr.*, crc.completionId, crc.isCompleted, crc.completionDate,
                   crc.documentPath, crc.documentName, crc.notes as completionNotes,
                   crc.verificationStatus, crc.verifiedBy, crc.verifiedDate, crc.verificationNotes,
                   u1.firstName as completedByFirstName, u1.lastName as completedByLastName,
                   u2.firstName as verifiedByFirstName, u2.lastName as verifiedByLastName
            FROM claim_requirements cr
            INNER JOIN claim_requirement_templates crt ON cr.templateId = crt.templateId
            LEFT JOIN claim_requirement_completions crc ON cr.requirementId = crc.requirementId AND crc.claimId = ?
            LEFT JOIN users u1 ON crc.completedBy = u1.userId
            LEFT JOIN users u2 ON crc.verifiedBy = u2.userId
            WHERE crt.providerId = ? AND cr.isActive = 1 AND crt.isActive = 1
            ORDER BY cr.displayOrder ASC, cr.requirementId ASC
        `, [id, claim.providerId]);

        // Calculate requirements completion status
        const totalRequirements = requirements.length;
        const completedRequirements = requirements.filter(r => r.isCompleted).length;
        const requiredRequirements = requirements.filter(r => r.isRequired);
        const completedRequired = requiredRequirements.filter(r => r.isCompleted).length;
        const allRequiredMet = requiredRequirements.length === 0 || completedRequired === requiredRequirements.length;

        claim.requirements = requirements;
        claim.requirementsSummary = {
            total: totalRequirements,
            completed: completedRequirements,
            required: requiredRequirements.length,
            completedRequired: completedRequired,
            allRequiredMet: allRequiredMet,
            completionPercentage: totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 100
        };

        res.status(200).json(claim);
    } catch (error) {
        console.error('Error fetching insurance claim:', error);
        res.status(500).json({ message: 'Error fetching insurance claim', error: error.message });
    }
});

/**
 * @route POST /api/insurance/claims
 * @description Create a new insurance claim
 */
router.post('/claims', async (req, res) => {
    const connection = await pool.getConnection();
    const userId = req.user?.id;

    try {
        await connection.beginTransaction();

        const {
            invoiceId,
            patientInsuranceId,
            authorizationId,
            claimDate,
            claimAmount,
            notes
        } = req.body;

        if (!invoiceId || !patientInsuranceId || !claimDate || !claimAmount) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invoice ID, patient insurance ID, claim date, and claim amount are required' });
        }

        // Generate claim number
        const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
        let claimNumber = '';
        let attempts = 0;
        let foundAvailable = false;

        while (!foundAvailable && attempts < 100) {
            const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            claimNumber = `CLM-${datePrefix}-${num}`;

            const [existing] = await connection.execute(
                'SELECT claimId FROM insurance_claims WHERE claimNumber = ?',
                [claimNumber]
            );

            if (existing.length === 0) {
                foundAvailable = true;
            } else {
                attempts++;
            }
        }

        if (!foundAvailable) {
            await connection.rollback();
            return res.status(500).json({ error: 'Failed to generate unique claim number' });
        }

        const [result] = await connection.execute(
            `INSERT INTO insurance_claims (
                claimNumber, invoiceId, patientInsuranceId, authorizationId, claimDate, claimAmount, status, notes, createdBy
            )
            VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
            [
                claimNumber,
                invoiceId,
                patientInsuranceId,
                authorizationId || null,
                claimDate,
                claimAmount,
                notes || null,
                userId || null
            ]
        );

        const claimId = result.insertId;

        // Get provider ID for this claim
        const [patientInsurance] = await connection.execute(
            'SELECT providerId FROM patient_insurance WHERE patientInsuranceId = ?',
            [patientInsuranceId]
        );

        if (patientInsurance.length > 0) {
            const providerId = patientInsurance[0].providerId;

            // Get requirements template for this provider
            const [templates] = await connection.execute(
                'SELECT templateId FROM claim_requirement_templates WHERE providerId = ? AND isActive = 1',
                [providerId]
            );

            if (templates.length > 0) {
                const templateId = templates[0].templateId;

                // Get all requirements for this template
                const [requirements] = await connection.execute(
                    'SELECT requirementId FROM claim_requirements WHERE templateId = ? AND isActive = 1',
                    [templateId]
                );

                // Initialize requirement completions (all false)
                for (const req of requirements) {
                    await connection.execute(
                        `INSERT INTO claim_requirement_completions (claimId, requirementId, isCompleted)
                         VALUES (?, ?, 0)`,
                        [claimId, req.requirementId]
                    );
                }
            }
        }

        await connection.commit();

        // Fetch the created claim with all details
        const [newClaim] = await pool.execute(`
            SELECT ic.*,
                   i.invoiceNumber, i.totalAmount as invoiceAmount,
                   pi.policyNumber, pi.memberId,
                   p.patientNumber, p.firstName, p.lastName,
                   ip.providerName, ip.providerCode
            FROM insurance_claims ic
            LEFT JOIN invoices i ON ic.invoiceId = i.invoiceId
            LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE ic.claimId = ?
        `, [claimId]);

        res.status(201).json(newClaim[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating insurance claim:', error);
        res.status(500).json({ message: 'Error creating insurance claim', error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * @route PUT /api/insurance/claims/:id
 * @description Update an insurance claim
 */
router.put('/claims/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            authorizationId,
            claimDate,
            claimAmount,
            status,
            submissionDate,
            responseDate,
            approvedAmount,
            rejectedAmount,
            rejectionReason,
            paymentDate,
            paymentReference,
            notes
        } = req.body;

        // Check if claim exists
        const [existing] = await pool.execute('SELECT claimId FROM insurance_claims WHERE claimId = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        const updates = [];
        const values = [];

        if (authorizationId !== undefined) { updates.push('authorizationId = ?'); values.push(authorizationId); }
        if (claimDate !== undefined) { updates.push('claimDate = ?'); values.push(claimDate); }
        if (claimAmount !== undefined) { updates.push('claimAmount = ?'); values.push(claimAmount); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (submissionDate !== undefined) { updates.push('submissionDate = ?'); values.push(submissionDate); }
        if (responseDate !== undefined) { updates.push('responseDate = ?'); values.push(responseDate); }
        if (approvedAmount !== undefined) { updates.push('approvedAmount = ?'); values.push(approvedAmount); }
        if (rejectedAmount !== undefined) { updates.push('rejectedAmount = ?'); values.push(rejectedAmount); }
        if (rejectionReason !== undefined) { updates.push('rejectionReason = ?'); values.push(rejectionReason); }
        if (paymentDate !== undefined) { updates.push('paymentDate = ?'); values.push(paymentDate); }
        if (paymentReference !== undefined) { updates.push('paymentReference = ?'); values.push(paymentReference); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        // Check requirements if submitting
        if (status === 'submitted') {
            const [claim] = await pool.execute(`
                SELECT ic.*, pi.providerId
                FROM insurance_claims ic
                LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
                WHERE ic.claimId = ?
            `, [id]);

            if (claim.length > 0) {
                const providerId = claim[0].providerId;
                const [requirements] = await pool.execute(`
                    SELECT cr.requirementId, cr.isRequired, crc.isCompleted
                    FROM claim_requirements cr
                    INNER JOIN claim_requirement_templates crt ON cr.templateId = crt.templateId
                    LEFT JOIN claim_requirement_completions crc ON cr.requirementId = crc.requirementId AND crc.claimId = ?
                    WHERE crt.providerId = ? AND cr.isActive = 1 AND crt.isActive = 1
                `, [id, providerId]);

                const incompleteRequired = requirements.filter(r => r.isRequired && !r.isCompleted);
                if (incompleteRequired.length > 0) {
                    return res.status(400).json({
                        error: 'Cannot submit claim: Required requirements are not completed',
                        incompleteRequirements: incompleteRequired.map(r => r.requirementId)
                    });
                }

                // Update requirementsMet flag
                updates.push('requirementsMet = 1');
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.execute(
            `UPDATE insurance_claims SET ${updates.join(', ')}, updatedAt = NOW() WHERE claimId = ?`,
            values
        );

        const [updated] = await pool.execute(`
            SELECT ic.*,
                   i.invoiceNumber, i.totalAmount as invoiceAmount,
                   pi.policyNumber, pi.memberId,
                   p.patientNumber, p.firstName, p.lastName,
                   ip.providerName, ip.providerCode
            FROM insurance_claims ic
            LEFT JOIN invoices i ON ic.invoiceId = i.invoiceId
            LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            LEFT JOIN patients p ON pi.patientId = p.patientId
            LEFT JOIN insurance_providers ip ON pi.providerId = ip.providerId
            WHERE ic.claimId = ?
        `, [id]);

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating insurance claim:', error);
        res.status(500).json({ message: 'Error updating insurance claim', error: error.message });
    }
});

// ============================================
// CLAIM REQUIREMENTS
// ============================================

/**
 * @route GET /api/insurance/claims/:id/requirements
 * @description Get requirements for a specific claim
 */
router.get('/claims/:id/requirements', async (req, res) => {
    try {
        const { id } = req.params;

        const [requirements] = await pool.execute(`
            SELECT cr.*, crc.completionId, crc.isCompleted, crc.completionDate,
                   crc.documentPath, crc.documentName, crc.notes as completionNotes,
                   crc.verificationStatus, crc.verifiedBy, crc.verifiedDate, crc.verificationNotes,
                   u1.firstName as completedByFirstName, u1.lastName as completedByLastName,
                   u2.firstName as verifiedByFirstName, u2.lastName as verifiedByLastName
            FROM claim_requirements cr
            INNER JOIN claim_requirement_templates crt ON cr.templateId = crt.templateId
            INNER JOIN insurance_claims ic ON ic.claimId = ?
            INNER JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            LEFT JOIN claim_requirement_completions crc ON cr.requirementId = crc.requirementId AND crc.claimId = ?
            LEFT JOIN users u1 ON crc.completedBy = u1.userId
            LEFT JOIN users u2 ON crc.verifiedBy = u2.userId
            WHERE crt.providerId = pi.providerId AND cr.isActive = 1 AND crt.isActive = 1
            ORDER BY cr.displayOrder ASC, cr.requirementId ASC
        `, [id, id]);

        res.status(200).json(requirements);
    } catch (error) {
        console.error('Error fetching claim requirements:', error);
        res.status(500).json({ message: 'Error fetching claim requirements', error: error.message });
    }
});

/**
 * @route PUT /api/insurance/claims/:id/requirements/:requirementId
 * @description Update requirement completion status for a claim
 */
router.put('/claims/:id/requirements/:requirementId', async (req, res) => {
    try {
        const { id, requirementId } = req.params;
        const userId = req.user?.id;
        const {
            isCompleted,
            documentPath,
            documentName,
            notes
        } = req.body;

        // Check if completion record exists
        const [existing] = await pool.execute(
            'SELECT completionId FROM claim_requirement_completions WHERE claimId = ? AND requirementId = ?',
            [id, requirementId]
        );

        if (existing.length > 0) {
            // Update existing
            await pool.execute(
                `UPDATE claim_requirement_completions
                 SET isCompleted = ?, completionDate = ?, completedBy = ?, documentPath = ?, documentName = ?, notes = ?, updatedAt = NOW()
                 WHERE claimId = ? AND requirementId = ?`,
                [
                    isCompleted ? 1 : 0,
                    isCompleted ? new Date() : null,
                    isCompleted ? userId : null,
                    documentPath || null,
                    documentName || null,
                    notes || null,
                    id,
                    requirementId
                ]
            );
        } else {
            // Create new
            await pool.execute(
                `INSERT INTO claim_requirement_completions (claimId, requirementId, isCompleted, completionDate, completedBy, documentPath, documentName, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    requirementId,
                    isCompleted ? 1 : 0,
                    isCompleted ? new Date() : null,
                    isCompleted ? userId : null,
                    documentPath || null,
                    documentName || null,
                    notes || null
                ]
            );
        }

        // Check if all required requirements are now met
        const [claim] = await pool.execute(`
            SELECT ic.*, pi.providerId
            FROM insurance_claims ic
            LEFT JOIN patient_insurance pi ON ic.patientInsuranceId = pi.patientInsuranceId
            WHERE ic.claimId = ?
        `, [id]);

        if (claim.length > 0) {
            const providerId = claim[0].providerId;
            const [requirements] = await pool.execute(`
                SELECT cr.requirementId, cr.isRequired, crc.isCompleted
                FROM claim_requirements cr
                INNER JOIN claim_requirement_templates crt ON cr.templateId = crt.templateId
                LEFT JOIN claim_requirement_completions crc ON cr.requirementId = crc.requirementId AND crc.claimId = ?
                WHERE crt.providerId = ? AND cr.isActive = 1 AND crt.isActive = 1
            `, [id, providerId]);

            const allRequiredMet = requirements
                .filter(r => r.isRequired)
                .every(r => r.isCompleted);

            // Update requirementsMet flag
            await pool.execute(
                'UPDATE insurance_claims SET requirementsMet = ? WHERE claimId = ?',
                [allRequiredMet ? 1 : 0, id]
            );
        }

        // Return updated requirement
        const [updated] = await pool.execute(`
            SELECT cr.*, crc.completionId, crc.isCompleted, crc.completionDate,
                   crc.documentPath, crc.documentName, crc.notes as completionNotes,
                   u1.firstName as completedByFirstName, u1.lastName as completedByLastName
            FROM claim_requirements cr
            LEFT JOIN claim_requirement_completions crc ON cr.requirementId = crc.requirementId AND crc.claimId = ?
            LEFT JOIN users u1 ON crc.completedBy = u1.userId
            WHERE cr.requirementId = ?
        `, [id, requirementId]);

        res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating claim requirement:', error);
        res.status(500).json({ message: 'Error updating claim requirement', error: error.message });
    }
});

/**
 * @route GET /api/insurance/providers/:id/requirements
 * @description Get requirement templates for a specific provider
 */
router.get('/providers/:id/requirements', async (req, res) => {
    try {
        const { id } = req.params;

        const [templates] = await pool.execute(
            'SELECT * FROM claim_requirement_templates WHERE providerId = ? AND isActive = 1',
            [id]
        );

        if (templates.length === 0) {
            return res.status(200).json([]);
        }

        const templateId = templates[0].templateId;

        const [requirements] = await pool.execute(
            'SELECT * FROM claim_requirements WHERE templateId = ? AND isActive = 1 ORDER BY displayOrder ASC',
            [templateId]
        );

        res.status(200).json({
            template: templates[0],
            requirements: requirements
        });
    } catch (error) {
        console.error('Error fetching provider requirements:', error);
        res.status(500).json({ message: 'Error fetching provider requirements', error: error.message });
    }
});

module.exports = router;

