const db = require('../config/db');

const GroupMember = {
    add: async (userId, groupId, role = 'member') => {
        const query = `
            INSERT INTO group_members (user_id, group_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, group_id) DO NOTHING
            RETURNING user_id, group_id, role
        `;
        const res = await db.query(query, [userId, groupId, role]);
        return res.rows[0];
    },

    remove: async (userId, groupId) => {
        const query = 'DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING user_id';
        const res = await db.query(query, [userId, groupId]);
        return res.rows[0];
    },

    isMember: async (userId, groupId) => {
        const query = 'SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2';
        const res = await db.query(query, [userId, groupId]);
        return res.rowCount > 0;
    },

    countByUser: async (userId) => {
        const query = 'SELECT COUNT(*)::int as count FROM group_members WHERE user_id = $1';
        const res = await db.query(query, [userId]);
        return res.rows[0]?.count || 0;
    },

    listMembers: async (groupId) => {
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role, u.created_at
            FROM users u
            JOIN group_members gm ON gm.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY u.created_at DESC
        `;
        const res = await db.query(query, [groupId]);
        return res.rows;
    }
};

module.exports = GroupMember;
