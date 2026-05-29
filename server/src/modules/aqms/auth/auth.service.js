'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prismaAqms } = require('../../../db/prisma');
const { hashPassword, comparePassword } = require('../../shared/auth/password');
const { signAccess, signRefresh, verifyRefresh } = require('../../shared/auth/tokens');
const { generateUserName } = require('../../shared/auth/username');
const { generateOtp, storeOtp, verifyOtp } = require('../../shared/auth/otp.service');
const { sendOtp } = require('../../shared/auth/mailer.nodemailer');
const { writeAdminAcrossModules } = require('../../shared/auth/admin-fanout');
const { logger } = require('../../../lib/logger');
const env = require('../../../config/env');

const MODULE = 'AQMS';

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName ?? null,
    phoneNumber: user.phoneNumber ?? null,
    emiratesId: user.emiratesId ?? null,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}

async function issueTokenPair(user, req) {
  const familyId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const accessPayload = {
    sub: user.id,
    role: user.role,
    module: MODULE,
    accountStatus: user.accountStatus,
    email: user.email,
  };
  const accessToken = signAccess(accessPayload);

  const rawRefresh = crypto.randomBytes(40).toString('hex');
  const tokenHash = await bcrypt.hash(rawRefresh, env.BCRYPT_COST);
  const refreshToken = signRefresh({ sub: user.id, jti: rawRefresh, familyId });

  await prismaAqms.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: req?.headers?.['user-agent'] ?? null,
      ipAddress: req?.ip ?? null,
    },
  });

  return { accessToken, refreshToken };
}

async function signup({ email, password, firstName, lastName, middleName, phoneNumber, emiratesId }) {
  const existing = await prismaAqms.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already taken');
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const userName = await generateUserName(prismaAqms, email);

  const user = await prismaAqms.user.create({
    data: {
      email,
      passwordHash,
      userName,
      firstName,
      lastName,
      middleName: middleName ?? null,
      phoneNumber: phoneNumber ?? null,
      emiratesId: emiratesId ?? null,
      role: 'AQMS_MEMBER',
      accountStatus: 'PENDING',
    },
  });

  logger.info({ what: 'auth.signup', module: MODULE, userId: user.id, email });

  return { user: safeUser(user) };
}

async function login({ email, password }, req) {
  const user = await prismaAqms.user.findUnique({ where: { email } });

  if (!user) {
    logger.warn({ what: 'auth.login.fail', module: MODULE, email, reason: 'user_not_found' });
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    logger.warn({ what: 'auth.login.fail', module: MODULE, email, reason: 'bad_password' });
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (user.accountStatus !== 'ACTIVE') {
    logger.warn({ what: 'auth.login.fail', module: MODULE, email, reason: 'account_not_active', accountStatus: user.accountStatus });
    const err = new Error('Account is not active');
    err.code = 'ACCOUNT_NOT_ACTIVE';
    throw err;
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, req);
  logger.info({ what: 'auth.login.success', module: MODULE, userId: user.id, email });

  return { user: safeUser(user), accessToken, refreshToken };
}

async function logout({ refreshToken }) {
  let claims;
  try {
    claims = verifyRefresh(refreshToken);
  } catch {
    return;
  }

  const row = await prismaAqms.refreshToken.findFirst({
    where: { userId: claims.sub, revokedAt: null },
    orderBy: { issuedAt: 'desc' },
  });

  if (row) {
    await prismaAqms.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
  }
}

async function refresh({ refreshToken }, req) {
  let claims;
  try {
    claims = verifyRefresh(refreshToken);
  } catch {
    const err = new Error('Invalid refresh token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const rows = await prismaAqms.refreshToken.findMany({
    where: { userId: claims.sub, familyId: claims.familyId },
    orderBy: { issuedAt: 'desc' },
  });

  const activeRow = rows.find((r) => r.revokedAt === null);
  const revokedRow = rows.find((r) => r.revokedAt !== null);

  if (!activeRow && revokedRow) {
    // Reuse detection — revoke all tokens in this family
    await prismaAqms.refreshToken.updateMany({
      where: { userId: claims.sub, familyId: claims.familyId },
      data: { revokedAt: new Date() },
    });
    logger.warn({ what: 'auth.refresh.reuse_detected', module: MODULE, userId: claims.sub, familyId: claims.familyId });
    const err = new Error('Refresh token reuse detected');
    err.code = 'REFRESH_REUSE_DETECTED';
    throw err;
  }

  if (!activeRow) {
    const err = new Error('Invalid or expired refresh token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const tokenMatch = await bcrypt.compare(claims.jti, activeRow.tokenHash);
  if (!tokenMatch) {
    const err = new Error('Invalid refresh token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  if (activeRow.expiresAt < new Date()) {
    const err = new Error('Refresh token expired');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const user = await prismaAqms.user.findUnique({ where: { id: claims.sub } });
  if (!user || user.accountStatus !== 'ACTIVE') {
    const err = new Error('Account not active');
    err.code = 'ACCOUNT_NOT_ACTIVE';
    throw err;
  }

  // Rotate: revoke old, issue new (same familyId)
  const newRawRefresh = crypto.randomBytes(40).toString('hex');
  const newTokenHash = await bcrypt.hash(newRawRefresh, env.BCRYPT_COST);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const accessPayload = {
    sub: user.id,
    role: user.role,
    module: MODULE,
    accountStatus: user.accountStatus,
    email: user.email,
  };
  const newAccessToken = signAccess(accessPayload);
  const newRefreshToken = signRefresh({ sub: user.id, jti: newRawRefresh, familyId: claims.familyId });

  const newRow = await prismaAqms.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: claims.familyId,
      expiresAt: newExpiresAt,
      userAgent: req?.headers?.['user-agent'] ?? null,
      ipAddress: req?.ip ?? null,
    },
  });

  await prismaAqms.refreshToken.update({
    where: { id: activeRow.id },
    data: { revokedAt: new Date(), rotatedToId: newRow.id },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function forgotPassword({ email }, req) {
  const user = await prismaAqms.user.findUnique({ where: { email } });
  if (!user) return; // no enumeration

  const code = generateOtp();
  const moduleEmail = `${MODULE}:${email}`;
  await storeOtp(prismaAqms, user.id, code, 'EMAIL', req?.ip ?? null, moduleEmail);
  await sendOtp({ to: email, code, purpose: 'password reset' });
  logger.info({ what: 'auth.forgot_password', module: MODULE, userId: user.id });
}

async function verifyOtpHandler({ email, code }) {
  const user = await prismaAqms.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid OTP');
    err.code = 'OTP_INVALID';
    throw err;
  }

  const result = await verifyOtp(prismaAqms, user.id, code);
  if (!result.ok) {
    const err = new Error(result.code);
    err.code = result.code;
    err.attemptsRemaining = result.attemptsRemaining;
    throw err;
  }

  // Issue a short-lived JWT reset token (no DB write needed)
  const resetToken = jwt.sign(
    { sub: user.id, purpose: 'password_reset' },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  logger.info({ what: 'auth.verify_otp', module: MODULE, userId: user.id });
  return { resetToken };
}

async function resetPassword({ email, resetToken, newPassword }) {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, env.JWT_SECRET);
  } catch (_) {
    const err = new Error('Invalid reset token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  if (decoded.purpose !== 'password_reset') {
    const err = new Error('Invalid token purpose');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const user = await prismaAqms.user.findUnique({ where: { email } });
  if (!user || user.id !== decoded.sub) {
    const err = new Error('Invalid reset token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);

  await prismaAqms.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Fan-out to MWQ DB if this user is an admin
  if (user.role === 'ADMIN') {
    await writeAdminAcrossModules('passwordHash', passwordHash, email);
  }

  logger.info({ what: 'auth.reset_password', module: MODULE, userId: user.id });
}

module.exports = { signup, login, logout, refresh, forgotPassword, verifyOtpHandler, resetPassword };
