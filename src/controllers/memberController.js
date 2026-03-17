const bcrypt = require('bcryptjs');
const Member = require('../models/memberModel');

const normalizeRole = (role) => {
    const value = String(role || 'member').toLowerCase();
    if (value === 'admin') return 'admin';
    if (value === 'treasurer') return 'treasurer';
    return 'member';
};

const memberController = {
    getMembers: async (req, res) => {
        try {
            const members = await Member.getAll(req.groupId);
            res.json(members);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    addMember: async (req, res) => {
        try {
            const { firstName, lastName, phoneNumber, role, email } = req.body;
            // For a newly added member, we generate a temporary password and HASH it
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('12345678', salt);

            const newMember = await Member.create({
                firstName,
                lastName,
                phoneNumber,
                role: normalizeRole(role),
                email,
                passwordHash
            });
            await Member.addToGroup(newMember.id, req.groupId, normalizeRole(role));

            // Emit real-time event
            const io = req.app.get('io');
            if (io) io.emit('memberAdded', newMember);

            res.status(201).json(newMember);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getMemberProfile: async (req, res) => {
        try {
            const member = await Member.getById(req.params.id, req.groupId);
            if (!member) {
                return res.status(404).json({ message: 'Member not found' });
            }
            res.json(member);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateMember: async (req, res) => {
        try {
            const existing = await Member.getById(req.params.id, req.groupId);
            if (!existing) {
                return res.status(404).json({ message: 'Member not found' });
            }
            const role = req.body.role ? normalizeRole(req.body.role) : existing.role;
            const member = await Member.update(req.params.id, {
                firstName: req.body.firstName ?? existing.first_name,
                lastName: req.body.lastName ?? existing.last_name,
                email: req.body.email ?? existing.email,
                phoneNumber: req.body.phoneNumber ?? existing.phone_number,
                role
            });
            if (!member) {
                return res.status(404).json({ message: 'Member not found' });
            }

            // Emit real-time event
            req.app.get('io').emit('memberUpdated', member);

            res.json(member);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteMember: async (req, res) => {
        try {
            const deleted = await Member.removeFromGroup(req.params.id, req.groupId);
            if (!deleted) {
                return res.status(404).json({ message: 'Member not found' });
            }

            // Emit real-time event
            req.app.get('io').emit('memberDeleted', req.params.id);

            res.json({ message: 'Member deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = memberController;
