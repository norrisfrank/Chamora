const Contribution = require('../models/contributionModel');
const billingController = require('./billingController');
const db = require('../config/db');

const logAudit = async (actorId, action, entityType, entityId, metadata = {}) => {
    try {
        await db.query(
            'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [actorId, action, entityType, entityId, metadata]
        );
    } catch (error) {
        console.warn('Audit log write failed', error.message);
    }
};

const contributionController = {
    addContribution: async (req, res) => {
        try {
            const { amount } = req.body;
            const userId = req.user.id;
            const groupId = req.groupId;
            const created = await Contribution.create(userId, groupId, amount);
            let contribution;
            try {
                contribution = await Contribution.markPaid(created.id, null, 'cash');
            } catch (error) {
                contribution = await Contribution.update(created.id, amount, 'completed');
            }

            // Emit real-time event
            const io = req.app.get('io');
            if (io) io.emit('contributionAdded', contribution);

            await logAudit(userId, 'payment_recorded', 'contribution', contribution.id, {
                amount,
                method: 'cash',
                groupId
            });

            res.status(201).json(contribution);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    initiateMpesaContribution: async (req, res) => {
        try {
            const { amount, phone } = req.body;
            const userId = req.user.id;
            const groupId = req.groupId;

            if (!amount || !phone) {
                return res.status(400).json({ message: 'Amount and phone number are required' });
            }

            // 1. Create a pending contribution record
            const contribution = await Contribution.create(userId, groupId, amount);
            // Update status to pending explicitly if model doesn't default to it
            await Contribution.update(contribution.id, amount, 'pending');

            // 2. Trigger STK Push via billingController logic
            // We'll call the internal logic or just reuse the method
            // For simplicity, let's inject the necessary info into a mock req for stkPush or just call it

            req.body.accountReference = `CONTRIB-${contribution.id}`;
            req.body.transactionDesc = `Contribution to Group ${groupId || 1}`;

            return billingController.stkPush(req, res);
        } catch (error) {
            console.error('M-Pesa Contribution Error:', error);
            res.status(500).json({ message: 'Failed to initiate M-Pesa payment' });
        }
    },

    getUserContributions: async (req, res) => {
        try {
            const userId = req.user.id;
            const contributions = await Contribution.getByUser(userId, req.groupId);
            res.json(contributions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateContribution: async (req, res) => {
        try {
            const { amount, status } = req.body;
            const existing = await Contribution.getById(req.params.id);
            if (!existing || existing.group_id !== req.groupId) {
                return res.status(404).json({ message: 'Contribution not found' });
            }
            const contribution = await Contribution.update(req.params.id, amount ?? existing.amount, status ?? existing.status);
            if (!contribution) {
                return res.status(404).json({ message: 'Contribution not found' });
            }

            req.app.get('io').emit('contributionUpdated', contribution);
            await logAudit(req.user.id, 'contribution_updated', 'contribution', contribution.id, {
                amount,
                status
            });
            res.json(contribution);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteContribution: async (req, res) => {
        try {
            const existing = await Contribution.getById(req.params.id);
            if (!existing || existing.group_id !== req.groupId) {
                return res.status(404).json({ message: 'Contribution not found' });
            }
            const deleted = await Contribution.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Contribution not found' });
            }

            req.app.get('io').emit('contributionDeleted', req.params.id);
            res.json({ message: 'Contribution deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = contributionController;
