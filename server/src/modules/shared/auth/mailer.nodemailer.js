'use strict';

const nodemailer = require('nodemailer');
const env = require('../../../config/env');
const { logger } = require('../../../lib/logger');

let transport;

if (!env.SMTP_HOST) {
  transport = nodemailer.createTransport({ jsonTransport: true });
} else {
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

async function sendOtp({ to, code, purpose }) {
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: `Your ${purpose || 'OTP'} code`,
    text: `Your verification code is: ${code}`,
  });
  if (!env.SMTP_HOST) {
    logger.info({ msg: 'OTP email (json transport)', envelope: info.envelope, message: info.message });
  }
}

async function sendPasswordResetEmail({ to, token, purpose }) {
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: `Password reset`,
    text: `Use this token to reset your password: ${token}`,
  });
  if (!env.SMTP_HOST) {
    logger.info({ msg: 'Password reset email (json transport)', envelope: info.envelope, message: info.message });
  }
}

module.exports = { sendOtp, sendPasswordResetEmail };
