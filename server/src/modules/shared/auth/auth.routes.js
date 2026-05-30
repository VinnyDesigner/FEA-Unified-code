'use strict';

// Unified auth router. Mounted under BOTH /mwq/auth and /aqms/auth in
// src/routes/index.js. The controller infers the requested app from req.baseUrl,
// so a single router instance serves both aliases.

const { Router } = require('express');
const { authLimiter, otpVerifyLimiter } = require('../../../middleware/rateLimit');
const { requireAuth } = require('../../../middleware/requireAuth');
const ctrl = require('./auth.controller');

const router = Router();

router.post('/signup', authLimiter, ctrl.signup);
router.post('/login', authLimiter, ctrl.login);
router.post('/logout', requireAuth, ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/verify-otp', otpVerifyLimiter, ctrl.verifyOtp);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
