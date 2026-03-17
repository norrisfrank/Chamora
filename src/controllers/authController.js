const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authController = {
    signup: async (req, res) => {
        try {
            const { firstName, lastName, email, phoneNumber, password, planType } = req.body;

            // Check if user exists by email or phone
            const userByEmail = await User.findByEmail(email);
            if (userByEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            if (phoneNumber) {
                const userByPhone = await User.findByPhone(phoneNumber);
                if (userByPhone) {
                    return res.status(400).json({ message: 'Phone number already exists' });
                }
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Create user
            const newUser = await User.create(firstName, lastName, email, phoneNumber, passwordHash, planType || 'starter');

            // Generate JWT
            const token = jwt.sign(
                { id: newUser.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            res.status(201).json({
                message: 'User created successfully',
                user: newUser
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    login: async (req, res) => {
        try {
            const { identifier, password } = req.body;
            console.log(`Login attempt for identifier: ${identifier}`);

            // Find user by email or phone
            let user = await User.findByEmail(identifier);
            if (!user) {
                user = await User.findByPhone(identifier);
            }

            if (!user) {
                console.log(`Login failed: User with identifier ${identifier} not found`);
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                console.log(`Login failed: Password mismatch for ${identifier}`);
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            console.log(`Login successful: ${identifier}`);

            // Generate JWT
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            res.json({
                message: 'Logged in successfully',
                token,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phoneNumber: user.phone_number,
                    role: user.role,
                    planType: user.plan_type
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    logout: (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    },

    getMe: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Find user to get current password hash
            const db = require('../config/db'); // Ensure db is available
            const userQuery = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            const user = userQuery.rows[0];

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // Update password
            const User = require('../models/userModel');
            await User.updatePassword(userId, newPasswordHash);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = authController;
