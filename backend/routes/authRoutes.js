const express = require('express');
const router = express.Router();
const { signup, login, sendOtp, verifyOtp, forgotPassword, resetPassword } = require('../controllers/authController');

// Existing routes (signup might be kept for backward compatibility or direct test)
router.post('/signup', signup);
router.post('/login', login);

// New OTP Flow routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
