const Loan = require('../models/loanModel');
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

const loanController = {
    applyLoan: async (req, res) => {
        try {
            const { amount, interest, dueDate } = req.body;
            const userId = req.user.id;
            const loan = await Loan.create(userId, req.groupId, amount, interest, dueDate);

            // Emit real-time event
            const io = req.app.get('io');
            if (io) io.emit('loanAdded', loan);

            res.status(201).json(loan);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getUserLoans: async (req, res) => {
        try {
            const userId = req.user.id;
            const loans = await Loan.getByUser(userId, req.groupId);
            res.json(loans);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateLoan: async (req, res) => {
        try {
            const existing = await Loan.getById(req.params.id, req.groupId);
            if (!existing) {
                return res.status(404).json({ message: 'Loan not found' });
            }
            const { amount, interest, status, dueDate } = req.body;
            const loan = await Loan.update(req.params.id, {
                amount: amount ?? existing.amount,
                interest: interest ?? existing.interest,
                status: status ?? existing.status,
                dueDate: dueDate ?? existing.due_date
            });
            if (!loan) {
                return res.status(404).json({ message: 'Loan not found' });
            }

            req.app.get('io').emit('loanUpdated', loan);
            if (existing.status !== loan.status && ['approved', 'active'].includes(String(loan.status || '').toLowerCase())) {
                await logAudit(req.user.id, 'loan_approved', 'loan', loan.id, {
                    fromStatus: existing.status,
                    toStatus: loan.status,
                    amount: loan.amount
                });
            }
            res.json(loan);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteLoan: async (req, res) => {
        try {
            const deleted = await Loan.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Loan not found' });
            }

            req.app.get('io').emit('loanDeleted', req.params.id);
            res.json({ message: 'Loan deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = loanController;
