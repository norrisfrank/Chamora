const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        let role = String(user.role || 'member').toLowerCase();
        const adminCount = await User.countAdmins();
        if (adminCount === 0) {
            const updated = await User.updateRole(user.id, 'admin');
            role = String(updated?.role || 'admin').toLowerCase();
        }
        req.user = {
            id: user.id,
            role,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const requireRoles = (...roles) => {
    const allowed = roles.flat().map(r => String(r || '').toLowerCase());
    return (req, res, next) => {
        const role = String(req.user?.role || '').toLowerCase();
        if (!allowed.includes(role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRoles };
