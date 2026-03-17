const db = require('../config/db');

const Meeting = {
    create: async (groupId, title, date, location, description, meetingLink) => {
        const query = `
            INSERT INTO meetings (group_id, title, date, location, description, meeting_link)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [groupId, title, date, location, description, meetingLink];
        const res = await db.query(query, values);
        return res.rows[0];
    },

    getAll: async (groupId) => {
        const query = 'SELECT * FROM meetings WHERE group_id = $1 ORDER BY date DESC';
        const res = await db.query(query, [groupId]);
        return res.rows;
    },

    getById: async (id, groupId) => {
        const query = 'SELECT * FROM meetings WHERE id = $1 AND group_id = $2';
        const res = await db.query(query, [id, groupId]);
        return res.rows[0];
    },

    update: async (id, data) => {
        const { title, date, location, description, meetingLink } = data;
        const query = `
            UPDATE meetings 
            SET title = $1, date = $2, location = $3, description = $4, meeting_link = $5
            WHERE id = $6
            RETURNING *
        `;
        const res = await db.query(query, [title, date, location, description, meetingLink, id]);
        return res.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM meetings WHERE id = $1 RETURNING id';
        const res = await db.query(query, [id]);
        return res.rows[0];
    }
};

module.exports = Meeting;
