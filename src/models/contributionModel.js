const db = require('../config/db');

const Contribution = {
    create: async (userId, groupId, amount) => {
        const query = `
            INSERT INTO contributions (user_id, group_id, amount)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [userId, groupId, amount];
        const res = await db.query(query, values);
        return res.rows[0];
    },

    getByUser: async (userId, groupId) => {
        const query = `
            SELECT c.*, g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.user_id = $1 AND c.group_id = $2
            ORDER BY c.date DESC
        `;
        const res = await db.query(query, [userId, groupId]);
        return res.rows;
    },

    getByGroup: async (groupId) => {
        const query = `
            SELECT c.*, u.first_name, u.last_name
            FROM contributions c
            JOIN users u ON c.user_id = u.id
            WHERE c.group_id = $1
            ORDER BY c.date DESC
        `;
        const res = await db.query(query, [groupId]);
        return res.rows;
    },

    getById: async (id) => {
        const query = 'SELECT * FROM contributions WHERE id = $1';
        const res = await db.query(query, [id]);
        return res.rows[0];
    },

    update: async (id, amount, status) => {
        const query = 'UPDATE contributions SET amount = $1, status = $2 WHERE id = $3 RETURNING *';
        const res = await db.query(query, [amount, status, id]);
        return res.rows[0];
    },

    markPaid: async (id, receiptNumber, method) => {
        const query = `
            UPDATE contributions
            SET status = 'completed',
                mpesa_receipt_number = $1,
                payment_method = $2,
                paid_at = NOW()
            WHERE id = $3
            RETURNING *
        `;
        const res = await db.query(query, [receiptNumber, method, id]);
        return res.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM contributions WHERE id = $1 RETURNING id';
        const res = await db.query(query, [id]);
        return res.rows[0];
    }
};

module.exports = Contribution;
