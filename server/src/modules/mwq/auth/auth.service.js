'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../../shared/auth/password');
const { signAccess, signRefresh, verifyRefresh } = require('../../shared/auth/tokens');
const { generateUserName } = require('../../shared/auth/username');
const { generateOtp, storeOtp, verifyOtp: verifyOtpCode } = require('../../shared/auth/otp.service');
const { sendOtp } = require('../../shared/auth/mailer.nodemailer');
const { writeAdminAcrossModules } = require('../../shared/auth/admin-fanout');
const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');
const env = require('../../../config/env');

async function signup(prismaMwq, body) {
  const existing = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');

  const passwordHash = await hashPassword(body.password);
  const userName = await generateUserName(prismaMwq, body.email);

  const user = await prismaMwq.user.create({
    data: {
      email: body.email,
      passwordHash,
      userName,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName || null,
      phoneNumber: body.phoneNumber || null,
      emiratesId: body.emiratesId || null,
      role: 'MWQ_MEMBER',
      accountStatus: 'PENDING',
    },
  });

  return sanitizeUser(user);
}

async function login(prismaMwq, body, meta) {
  const user = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const valid = await comparePassword(body.password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  if (user.accountStatus !== 'ACTIVE') {
    throw new ApiError(401, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
  }

  const familyId = crypto.randomUUID();
  const rawJti = crypto.randomBytes(40).toString('hex');

  const accessToken = signAccess({ sub: user.id, role: user.role, module: 'MWQ', accountStatus: user.accountStatus, email: user.email });
  const refreshToken = signRefresh({ sub: user.id, jti: rawJti, familyId });

  const tokenHash = await bcrypt.hash(rawJti, env.BCRYPT_COST);

  await prismaMwq.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ip || null,
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });

  await auditLog(prismaMwq, user.id, 'auth.login', { ip: meta.ip });

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

async function logout(prismaMwq, body) {
  let decoded;
  try {
    decoded = verifyRefresh(body.refreshToken);
  } catch (_) {
    return;
  }

  const rows = await prismaMwq.refreshToken.findMany({
    where: { userId: decoded.sub, familyId: decoded.familyId, revokedAt: null },
    orderBy: { issuedAt: 'desc' },
  });

  const activeRow = rows.find((r) => r.revokedAt === null);
  if (!activeRow) return;

  const tokenMatch = await bcrypt.compare(decoded.jti, activeRow.tokenHash);
  if (!tokenMatch) return;

  await prismaMwq.refreshToken.update({
    where: { id: activeRow.id },
    data: { revokedAt: new Date() },
  });
}

async function refresh(prismaMwq, body, meta) {
  let decoded;
  try {
    decoded = verifyRefresh(body.refreshToken);
  } catch (_) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  }

  const { sub: userId, jti: rawJti, familyId } = decoded;

  const rows = await prismaMwq.refreshToken.findMany({
    where: { userId, familyId },
    orderBy: { issuedAt: 'desc' },
  });

  const activeRow = rows.find((r) => r.revokedAt === null);
  const revokedRow = rows.find((r) => r.revokedAt !== null);

  if (!activeRow && revokedRow) {
    await prismaMwq.refreshToken.updateMany({
      where: { userId, familyId },
      data: { revokedAt: new Date() },
    });
    await auditLog(prismaMwq, userId, 'auth.refresh.reuse_detected', { familyId });
    throw new ApiError(401, 'REUSE_DETECTED', 'Refresh token reuse detected; all sessions revoked');
  }

  if (!activeRow) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token not found');
  }

  const hashValid = await bcrypt.compare(rawJti, activeRow.tokenHash);
  if (!hashValid) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token hash mismatch');
  }

  const user = await prismaMwq.user.findUnique({ where: { id: userId } });
  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new ApiError(401, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
  }

  const newRawJti = crypto.randomBytes(40).toString('hex');
  const newTokenHash = await bcrypt.hash(newRawJti, env.BCRYPT_COST);

  const accessToken = signAccess({ sub: user.id, role: user.role, module: 'MWQ', accountStatus: user.accountStatus, email: user.email });
  const newRefreshToken = signRefresh({ sub: user.id, jti: newRawJti, familyId });

  const newRow = await prismaMwq.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      familyId,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ip || null,
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });

  await prismaMwq.refreshToken.update({
    where: { id: activeRow.id },
    data: { revokedAt: new Date(), rotatedToId: newRow.id },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

async function forgotPassword(prismaMwq, body, meta) {
  const user = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (!user) return;

  const code = generateOtp();
  await storeOtp(prismaMwq, user.id, code, 'EMAIL', meta.ip || null, `mwq:${body.email}`);
  await sendOtp({ to: body.email, code, purpose: 'password reset' });
}

async function verifyOtp(prismaMwq, body) {
  const user = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (!user) throw new ApiError(401, 'INVALID_OTP', 'Invalid OTP code', { attemptsRemaining: 0 });

  const result = await verifyOtpCode(prismaMwq, user.id, body.code);

  if (!result.ok) {
    const status = result.code === 'OTP_EXPIRED' ? 'OTP_EXPIRED' : 'INVALID_OTP';
    throw new ApiError(401, status, 'OTP verification failed', { attemptsRemaining: result.attemptsRemaining ?? 0 });
  }

  const resetToken = jwt.sign(
    { sub: user.id, purpose: 'password_reset' },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  return { resetToken };
}

async function resetPassword(prismaMwq, body) {
  let decoded;
  try {
    decoded = jwt.verify(body.resetToken, env.JWT_SECRET);
  } catch (_) {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired');
  }

  if (decoded.purpose !== 'password_reset') {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Invalid token purpose');
  }

  const user = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (!user || user.id !== decoded.sub) {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Token does not match email');
  }

  const newHash = await hashPassword(body.newPassword);

  await prismaMwq.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await auditLog(prismaMwq, user.id, 'auth.password_reset', {});

  if (user.role === 'ADMIN') {
    await writeAdminAcrossModules('passwordHash', newHash, user.email);
  }
}

// --- helpers ---

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function auditLog(prisma, userId, action, changes) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, changes },
    });
  } catch (err) {
    logger.warn({ what: 'audit_log_failed', action, userId, error: err });
  }
}

function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = /^(\d+)([smhd])$/.exec(str);
  if (!match) return 7 * 86400000;
  return parseInt(match[1], 10) * units[match[2]];
}

module.exports = { signup, login, logout, refresh, forgotPassword, verifyOtp, resetPassword };
