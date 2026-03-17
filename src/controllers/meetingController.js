const Meeting = require('../models/meetingModel');
const Minute = require('../models/minuteModel');
const db = require('../config/db');

const logAudit = async (actorId, action, entityType, entityId, metadata = {}) => {
    try {
        await db.query(
            'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
            [actorId, action, entityType, entityId, metadata]
        );
    } catch (error) {
        console.warn('Audit log write failed', error.message);
    }
};

const meetingController = {
    createMeeting: async (req, res) => {
        try {
            let { title, date, location, description, meetingLink } = req.body;
            const meeting = await Meeting.create(req.groupId, title, date, location, description || '', meetingLink);

            // Emit real-time event
            const io = req.app.get('io');
            if (io) io.emit('meetingAdded', meeting);

            res.status(201).json(meeting);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getMeetings: async (req, res) => {
        try {
            const meetings = await Meeting.getAll(req.groupId);
            res.json(meetings);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateMeeting: async (req, res) => {
        try {
            const existing = await Meeting.getById(req.params.id, req.groupId);
            if (!existing) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const meeting = await Meeting.update(req.params.id, req.body);
            if (!meeting) {
                return res.status(404).json({ message: 'Meeting not found' });
            }

            req.app.get('io').emit('meetingUpdated', meeting);
            res.json(meeting);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteMeeting: async (req, res) => {
        try {
            const existing = await Meeting.getById(req.params.id, req.groupId);
            if (!existing) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const deleted = await Meeting.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ message: 'Meeting not found' });
            }

            req.app.get('io').emit('meetingDeleted', req.params.id);
            res.json({ message: 'Meeting deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    createMinute: async (req, res) => {
        try {
            const { meetingId, content } = req.body;
            const meeting = await Meeting.getById(meetingId, req.groupId);
            if (!meeting) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const userId = req.user.id;
            const minute = await Minute.create(meetingId, content, userId);
            await logAudit(userId, 'minutes_created', 'minutes', minute.id, { meetingId });
            res.status(201).json(minute);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateMinute: async (req, res) => {
        try {
            const { meetingId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;
            const meeting = await Meeting.getById(meetingId, req.groupId);
            if (!meeting) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const existing = await Minute.getByMeeting(meetingId);
            if (!existing) {
                return res.status(404).json({ message: 'Minutes not found' });
            }
            const updated = await Minute.updateByMeeting(meetingId, content, userId);
            await logAudit(userId, 'minutes_edited', 'minutes', updated.id, { meetingId });
            res.json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getMinuteByMeeting: async (req, res) => {
        try {
            const { meetingId } = req.params;
            const meeting = await Meeting.getById(meetingId, req.groupId);
            if (!meeting) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const minute = await Minute.getByMeeting(meetingId);
            res.json(minute);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = meetingController;
