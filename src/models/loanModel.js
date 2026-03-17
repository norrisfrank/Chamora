const db = require('../config/db');

const Loan = {
    create: async (userId, groupId, amount, interest, dueDate) => {
        const query = `
            INSERT INTO loans (user_id, group_id, amount, interest, due_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId, groupId, amount, interest, dueDate];
        const res = await db.query(query, values);
        return res.rows[0];
    },

    getByUser: async (userId, groupId) => {
        const query = 'SELECT * FROM loans WHERE user_id = $1 AND group_id = $2 ORDER BY due_date ASC';
        const res = await db.query(query, [userId, groupId]);
        return res.rows;
    },

    getById: async (id, groupId) => {
        const query = 'SELECT * FROM loans WHERE id = $1 AND group_id = $2';
        const res = await db.query(query, [id, groupId]);
        return res.rows[0];
    },

    updateStatus: async (id, status) => {
        const query = 'UPDATE loans SET status = $1 WHERE id = $2 RETURNING *';
        const res = await db.query(query, [status, id]);
        return res.rows[0];
    },

    update: async (id, data) => {
        const { amount, interest, status, dueDate } = data;
        const query = `
            UPDATE loans 
            SET amount = $1, interest = $2, status = $3, due_date = $4
            WHERE id = $5
            RETURNING *
        `;
        const res = await db.query(query, [amount, interest, status, dueDate, id]);
        return res.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM loans WHERE id = $1 RETURNING id';
        const res = await db.query(query, [id]);
        return res.rows[0];
    }
};

module.exports = Loan;
