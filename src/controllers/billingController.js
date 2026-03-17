const axios = require('axios');
require('dotenv').config();
const db = require('../config/db');
const Contribution = require('../models/contributionModel');

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

const billingController = {
    getMpesaToken: async () => {
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        try {
            const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
                headers: { Authorization: `Basic ${auth}` }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Error fetching M-Pesa token:', error.response?.data || error.message);
            throw new Error('M-Pesa auth failed');
        }
    },

    stkPush: async (req, res) => {
        try {
            const { amount, phone, accountReference, transactionDesc } = req.body;

            if (!amount || !phone) {
                return res.status(400).json({ message: 'Amount and phone number are required' });
            }

            console.log(`Initiating M-Pesa STK Push for ${phone} amount ${amount}`);

            // 1. Get Token
            const token = await billingController.getMpesaToken();

            // 2. Prepare STK Push Request
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const password = Buffer.from(process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp).toString('base64');

            const stkData = {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone, // Customer phone number
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: process.env.MPESA_CALLBACK_URL,
                AccountReference: accountReference || "ChamoraPayment",
                TransactionDesc: transactionDesc || "Payment for Chamora Services"
            };

            const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const responseData = response.data || {};
            const reference = String(accountReference || '');
            if (reference.startsWith('CONTRIB-') && responseData.CheckoutRequestID) {
                const contributionId = parseInt(reference.replace('CONTRIB-', ''), 10);
                if (!Number.isNaN(contributionId)) {
                    await db.query(
                        `INSERT INTO mpesa_transactions
                        (contribution_id, checkout_request_id, merchant_request_id, phone_number, amount, status)
                        VALUES ($1, $2, $3, $4, $5, 'pending')`,
                        [contributionId, responseData.CheckoutRequestID, responseData.MerchantRequestID, phone, amount]
                    );
                }
            }

            res.json({ message: 'STK Push initiated successfully', data: response.data });
        } catch (error) {
            console.error('M-Pesa STK Push error:', error.response?.data || error.message);
            res.status(500).json({
                message: 'M-Pesa integration error',
                details: error.response?.data || error.message
            });
        }
    },

    cardPayment: async (req, res) => {
        try {
            const { amount, cardDetails } = req.body;
            console.log(`Processing Card Payment for amount ${amount}`);

            // Simulation of a card payment (e.g., via Stripe)
            setTimeout(() => {
                res.json({ message: 'Card payment successful', transactionId: 'ch_0000000000' });
            }, 1000);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Card payment error' });
        }
    },

    getSubscriptionStatus: async (req, res) => {
        try {
            const user = await require('../models/userModel').findById(req.user.id);
            res.json({ active: true, plan: user.plan_type || 'starter', expiry: '2025-12-31' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error checking subscription' });
        }
    },

    mpesaCallback: async (req, res) => {
        const { Body } = req.body || {};
        console.log('Received M-Pesa Callback:', JSON.stringify(Body));

        if (!Body || !Body.stkCallback) {
            return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        const stkCallback = Body.stkCallback;
        const resultCodes = {
            SUCCESS: 0,
            CANCELLED: 1032
        };

        const checkoutRequestId = stkCallback.CheckoutRequestID;

        if (stkCallback.ResultCode === resultCodes.SUCCESS) {
            const metadata = stkCallback.CallbackMetadata?.Item || [];
            const amount = metadata.find(i => i.Name === 'Amount')?.Value;
            const mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
            const phoneNumber = metadata.find(i => i.Name === 'PhoneNumber')?.Value;

            console.log(`Payment SUCCESS: ${mpesaReceiptNumber} from ${phoneNumber} for KSh ${amount}`);

            if (checkoutRequestId) {
                const trxRes = await db.query(
                    'SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1',
                    [checkoutRequestId]
                );
                const trx = trxRes.rows[0];
                if (trx) {
                    await db.query(
                        `UPDATE mpesa_transactions
                         SET status = 'completed', mpesa_receipt_number = $1, updated_at = NOW()
                         WHERE id = $2`,
                        [mpesaReceiptNumber || null, trx.id]
                    );
                    if (trx.contribution_id) {
                        await Contribution.markPaid(trx.contribution_id, mpesaReceiptNumber || null, 'mpesa');
                        await logAudit(null, 'payment_received_mpesa', 'contribution', trx.contribution_id, {
                            amount,
                            phoneNumber,
                            receipt: mpesaReceiptNumber
                        });
                    }
                }
            }
        } else {
            console.warn(`Payment FAILED: ${stkCallback.ResultDesc}`);
            if (checkoutRequestId) {
                const trxRes = await db.query(
                    'SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1',
                    [checkoutRequestId]
                );
                const trx = trxRes.rows[0];
                if (trx) {
                    await db.query(
                        `UPDATE mpesa_transactions
                         SET status = 'failed', updated_at = NOW()
                         WHERE id = $1`,
                        [trx.id]
                    );
                    if (trx.contribution_id) {
                        const contribution = await Contribution.getById(trx.contribution_id);
                        if (contribution) {
                            await Contribution.update(trx.contribution_id, contribution.amount, 'failed');
                        }
                    }
                }
            }
        }

        res.json({ ResultCode: 0, ResultDesc: "Success" });
    }
};

module.exports = billingController;
