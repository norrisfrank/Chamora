const db = require('../config/db');

const Member = {
    getAll: async (groupId) => {
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role, u.created_at 
            FROM users u
            JOIN group_members gm ON gm.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY u.created_at DESC
        `;
        const res = await db.query(query, [groupId]);
        return res.rows;
    },

    getById: async (id, groupId) => {
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role, u.created_at
            FROM users u
            JOIN group_members gm ON gm.user_id = u.id
            WHERE u.id = $1 AND gm.group_id = $2
        `;
        const res = await db.query(query, [id, groupId]);
        return res.rows[0];
    },

    create: async (data) => {
        const { firstName, lastName, phoneNumber, role, email, passwordHash } = data;
        const query = `
            INSERT INTO users (first_name, last_name, phone_number, role, email, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, first_name, last_name, email, phone_number, role, created_at
        `;
        const res = await db.query(query, [firstName, lastName, phoneNumber, role, email || null, passwordHash || 'default_hash']);
        return res.rows[0];
    },

    update: async (id, data) => {
        const { firstName, lastName, email, phoneNumber, role } = data;
        const query = `
            UPDATE users 
            SET first_name = $1, last_name = $2, email = $3, phone_number = $4, role = $5
            WHERE id = $6
            RETURNING id, first_name, last_name, email, phone_number, role, created_at
        `;
        const res = await db.query(query, [firstName, lastName, email, phoneNumber, role, id]);
        return res.rows[0];
    },

    removeFromGroup: async (id, groupId) => {
        const query = 'DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 RETURNING user_id';
        const res = await db.query(query, [id, groupId]);
        return res.rows[0];
    },

    addToGroup: async (id, groupId, role = 'member') => {
        const query = `
            INSERT INTO group_members (user_id, group_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, group_id) DO NOTHING
            RETURNING user_id, group_id, role
        `;
        const res = await db.query(query, [id, groupId, role]);
        return res.rows[0];
    }
};

module.exports = Member;
