'use strict';

// DEV ONLY — never mount this router in production
const express = require('express');
const router = express.Router();

if (process.env.NODE_ENV !== 'development') {
  module.exports = router;
} else {
  const { devOtpStore } = require('./otp.service');

  // GET /_internal/last-otp/:email — keyed by bare email (module-agnostic)
  router.get('/_internal/last-otp/:email', (req, res) => {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: { code: 'MISSING_PARAMS', message: 'email param required' } });
    }

    const code = devOtpStore.get(email);

    if (!code) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No OTP found for this email' } });
    }

    return res.json({ email, code });
  });

  module.exports = router;
}
