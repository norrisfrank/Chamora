const GroupMember = require('../models/groupMemberModel');

const requireGroup = async (req, res, next) => {
    const rawGroupId = req.headers['x-group-id'] || req.query.groupId || req.body.groupId;
    const groupId = parseInt(rawGroupId, 10);
    if (!groupId) {
        return res.status(400).json({ message: 'Group is required' });
    }
    const isMember = await GroupMember.isMember(req.user.id, groupId);
    if (!isMember) {
        return res.status(403).json({ message: 'Not a member of this group' });
    }
    req.groupId = groupId;
    next();
};

module.exports = { requireGroup };
