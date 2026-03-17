try {
    console.log('Loading express...');
    require('express');
    console.log('Loading dotenv...');
    require('dotenv').config();
    console.log('Loading db...');
    require('./src/config/db');
    console.log('Loading User model...');
    require('./src/models/userModel');
    console.log('Loading Member model...');
    require('./src/models/memberModel');
    console.log('Loading authController...');
    require('./src/controllers/authController');
    console.log('Loading memberController...');
    require('./src/controllers/memberController');
    console.log('Loading billingController...');
    require('./src/controllers/billingController');
    console.log('Loading Routes...');
    require('./src/routes/authRoutes');
    require('./src/routes/memberRoutes');
    require('./src/routes/contributionRoutes');
    require('./src/routes/loanRoutes');
    require('./src/routes/meetingRoutes');
    require('./src/routes/billingRoutes');
    console.log('All modules loaded successfully!');
} catch (error) {
    console.error('CRASH DETECTED:');
    console.error(error);
    process.exit(1);
}
