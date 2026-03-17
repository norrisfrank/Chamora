const db = require('../config/db');

const User = {
    create: async (firstName, lastName, email, phoneNumber, passwordHash, planType = 'starter') => {
        const query = `
            INSERT INTO users (first_name, last_name, email, phone_number, password_hash, plan_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, first_name, last_name, email, phone_number, plan_type, created_at
        `;
        const values = [firstName, lastName, email, phoneNumber, passwordHash, planType];
        const res = await db.query(query, values);
        return res.rows[0];
    },

    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1';
        const res = await db.query(query, [email]);
        return res.rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT id, first_name, last_name, email, phone_number, role, plan_type, created_at FROM users WHERE id = $1';
        const res = await db.query(query, [id]);
        return res.rows[0];
    },

    updateRole: async (id, role) => {
        const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role';
        const res = await db.query(query, [role, id]);
        return res.rows[0];
    },

    countAdmins: async () => {
        const query = "SELECT COUNT(*)::int as count FROM users WHERE LOWER(role) = 'admin'";
        const res = await db.query(query);
        return res.rows[0]?.count || 0;
    },

    findByPhone: async (phoneNumber) => {
        const query = 'SELECT * FROM users WHERE phone_number = $1';
        const res = await db.query(query, [phoneNumber]);
        return res.rows[0];
    },

    updatePassword: async (id, newPasswordHash) => {
        const query = 'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id';
        const res = await db.query(query, [newPasswordHash, id]);
        return res.rows[0];
    }
};

module.exports = User;
