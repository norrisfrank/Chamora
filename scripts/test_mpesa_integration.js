const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testMpesaIntegration() {
    console.log('--- Testing M-Pesa Integration ---');

    try {
        // 1. Test STK Push Endpoint (Subscription)
        console.log('\nTesting Subscription STK Push...');
        // Note: This will fail without valid credentials, but we can check if it reaches the M-Pesa auth step
        const subResponse = await axios.post(`${API_URL}/billing/stkpush`, {
            phone: '254712345678',
            amount: 1
        }).catch(err => err.response);

        console.log('Status:', subResponse?.status);
        console.log('Data:', subResponse?.data);

        // 2. Test Contribution STK Push
        console.log('\nTesting Contribution STK Push...');
        // This requires a login token, so we'll just check if the route exists
        const contribResponse = await axios.post(`${API_URL}/contributions/mpesa`, {
            phone: '254712345678',
            amount: 1,
            groupId: 1
        }).catch(err => err.response);

        console.log('Status:', contribResponse?.status);
        // Expecting 403 or 401 if not logged in, which confirms the route is protected but exists

        console.log('\n--- Test Completed ---');
        console.log('Note: Full verification requires valid Daraja API credentials in .env');
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testMpesaIntegration();
