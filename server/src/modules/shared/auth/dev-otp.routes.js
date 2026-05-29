'use strict';

// DEV ONLY — never mount this router in production
const express = require('express');
const router = express.Router();

if (process.env.NODE_ENV !== 'development') {
  module.exports = router;
} else {
  const { devOtpStore } = require('./otp.service');

  // GET /_internal/last-otp/:email?module=MWQ|AQMS
  router.get('/_internal/last-otp/:email', (req, res) => {
    const { email } = req.params;
    const mod = req.query.module;

    if (!mod || !email) {
      return res.status(400).json({ error: { code: 'MISSING_PARAMS', message: 'email and module query param required' } });
    }

    const key = `${mod}:${email}`;
    const code = devOtpStore.get(key);

    if (!code) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No OTP found for this email/module' } });
    }

    return res.json({ email, module: mod, code });
  });

  module.exports = router;
}
