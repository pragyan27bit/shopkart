const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_shopkart2026';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'shopkart_razorpay_secret_test_key';

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

module.exports = razorpay;