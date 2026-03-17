const db = require('../config/db');

const Group = {
    create: async (name, description, creatorId, groupCode) => {
        const query = `
            INSERT INTO groups (name, description, creator_id, group_code)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, description, creator_id, group_code, created_at
        `;
        const res = await db.query(query, [name, description || null, creatorId, groupCode]);
        return res.rows[0];
    },

    findByCode: async (groupCode) => {
        const query = 'SELECT id, name, description, creator_id, group_code, created_at FROM groups WHERE group_code = $1';
        const res = await db.query(query, [groupCode]);
        return res.rows[0];
    },

    findById: async (groupId) => {
        const query = 'SELECT id, name, description, creator_id, group_code, created_at FROM groups WHERE id = $1';
        const res = await db.query(query, [groupId]);
        return res.rows[0];
    },

    listByUser: async (userId) => {
        const query = `
            SELECT g.id, g.name, g.description, g.creator_id, g.group_code, g.created_at
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = $1
            ORDER BY g.created_at DESC
        `;
        const res = await db.query(query, [userId]);
        return res.rows;
    }
};

module.exports = Group;
