'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const env = require('../../../config/env');

// Dev-only in-memory map: bare `email` -> raw OTP code
const devOtpStore = new Map();

function generateOtp(length) {
  const len = length || env.OTP_LENGTH;
  let code = '';
  for (let i = 0; i < len; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

async function storeOtp(prisma, userId, code, channel, ipAddress, email) {
  const codeHash = await bcrypt.hash(code, env.BCRYPT_COST);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

  await prisma.otp.create({
    data: { userId, codeHash, channel, ipAddress, expiresAt },
  });

  // Dev-only: write raw code so dev-otp endpoint can return it (keyed by bare email)
  if (env.NODE_ENV === 'development' && email) {
    devOtpStore.set(email, code);
  }
}

async function verifyOtp(prisma, userId, code) {
  const otp = await prisma.otp.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return { ok: false, code: 'OTP_INVALID' };

  if (otp.expiresAt < new Date()) return { ok: false, code: 'OTP_EXPIRED' };

  if (otp.attemptCount >= env.OTP_MAX_ATTEMPTS) {
    return { ok: false, code: 'OTP_MAX_ATTEMPTS' };
  }

  const match = await bcrypt.compare(code, otp.codeHash);

  if (match) {
    await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return { ok: true };
  }

  await prisma.otp.update({ where: { id: otp.id }, data: { attemptCount: { increment: 1 } } });
  const attemptsRemaining = env.OTP_MAX_ATTEMPTS - otp.attemptCount - 1;
  return { ok: false, code: 'OTP_INVALID', attemptsRemaining };
}

module.exports = { generateOtp, storeOtp, verifyOtp, devOtpStore };
