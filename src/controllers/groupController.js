const Group = require('../models/groupModel');
const GroupMember = require('../models/groupMemberModel');

const generateCode = () => {
    const value = Math.floor(100000 + Math.random() * 900000);
    return String(value);
};

const groupController = {
    listMyGroups: async (req, res) => {
        try {
            const groups = await Group.listByUser(req.user.id);
            res.json(groups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getGroup: async (req, res) => {
        try {
            const groupId = parseInt(req.params.id, 10);
            const isMember = await GroupMember.isMember(req.user.id, groupId);
            if (!isMember) {
                return res.status(403).json({ message: 'Not a member of this group' });
            }
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }
            res.json(group);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    createGroup: async (req, res) => {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Group name is required' });
            }
            const count = await GroupMember.countByUser(req.user.id);
            if (count >= 5) {
                return res.status(400).json({ message: 'Group limit reached' });
            }
            let code = generateCode();
            let existing = await Group.findByCode(code);
            let attempts = 0;
            while (existing && attempts < 5) {
                code = generateCode();
                existing = await Group.findByCode(code);
                attempts += 1;
            }
            if (existing) {
                return res.status(500).json({ message: 'Failed to generate group code' });
            }
            const group = await Group.create(name, description, req.user.id, code);
            await GroupMember.add(req.user.id, group.id, 'admin');
            res.status(201).json(group);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    joinGroup: async (req, res) => {
        try {
            const { groupCode } = req.body;
            if (!groupCode) {
                return res.status(400).json({ message: 'Group code is required' });
            }
            const group = await Group.findByCode(String(groupCode));
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }
            const count = await GroupMember.countByUser(req.user.id);
            if (count >= 5) {
                return res.status(400).json({ message: 'Group limit reached' });
            }
            await GroupMember.add(req.user.id, group.id, 'member');
            res.json(group);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = groupController;
