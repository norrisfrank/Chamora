const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
const allowedOrigins = ['null', 'http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Fallback to allow for local dev if origin isn't matched
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test DB Connection
const db = require('./config/db');
db.query('SELECT NOW()')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection failed:', err));

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Basic Route
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const memberRoutes = require('./routes/memberRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const groupRoutes = require('./routes/groupRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/groups', groupRoutes);

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true);
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Make io accessible to our routers
app.set('io', io);

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
