const db = require('../config/db');

const Minute = {
    create: async (meetingId, content, recordedBy) => {
        const query = `
            INSERT INTO minutes (meeting_id, content, recorded_by)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [meetingId, content, recordedBy];
        const res = await db.query(query, values);
        return res.rows[0];
    },

    getByMeeting: async (meetingId) => {
        const query = 'SELECT * FROM minutes WHERE meeting_id = $1';
        const res = await db.query(query, [meetingId]);
        return res.rows[0];
    },

    updateByMeeting: async (meetingId, content, recordedBy) => {
        const query = `
            UPDATE minutes
            SET content = $1, recorded_by = $2
            WHERE meeting_id = $3
            RETURNING *
        `;
        const res = await db.query(query, [content, recordedBy, meetingId]);
        return res.rows[0];
    }
};

module.exports = Minute;
