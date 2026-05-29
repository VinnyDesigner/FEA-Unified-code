'use strict';

const { Router } = require('express');
const { authLimiter, otpVerifyLimiter } = require('../../../middleware/rateLimit');
const { requireAuth } = require('../../../middleware/requireAuth');
const {
  handleSignup,
  handleLogin,
  handleLogout,
  handleRefresh,
  handleForgotPassword,
  handleVerifyOtp,
  handleResetPassword,
} = require('./auth.controller');

const router = Router();

// Public routes
router.post('/signup', authLimiter, handleSignup);
router.post('/login', authLimiter, handleLogin);
router.post('/refresh', handleRefresh);
router.post('/forgot-password', authLimiter, handleForgotPassword);
router.post('/verify-otp', otpVerifyLimiter, handleVerifyOtp);
router.post('/reset-password', handleResetPassword);

// Authenticated routes
router.post('/logout', requireAuth, handleLogout);

module.exports = router;
