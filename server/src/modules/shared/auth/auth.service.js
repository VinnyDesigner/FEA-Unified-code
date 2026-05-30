'use strict';

// Unified auth service (Phase 2).
//
// ONE implementation backing BOTH /mwq/auth/* and /aqms/auth/*. Users and
// refresh_tokens live in the higher-level DB (prismaHigherLevel). The OTP store
// and auth audit_logs still live in the per-module DBs, so email-first flows
// (forgot/verify/reset) route those writes through resolveHomeModule(userId).
//
// The requested application is inferred from the URL path segment ('mwq'|'aqms')
// and passed in as `segment` — NOT hardcoded — so signup/login emit the correct
// `module` JWT claim and create the correct application-access grant.
//
// Refresh rotation + reuse-detection semantics are ported from the (more
// complete) MWQ implementation: on reuse, the whole token family is revoked.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prismaHigherLevel } = require('../../../db/prisma');
const { hashPassword, comparePassword } = require('./password');
const { signAccess, signRefresh, verifyRefresh, hashRefreshJti, verifyRefreshJti } = require('./tokens');
const { generateUserName } = require('./username');
const { loadAccessAndPerms } = require('./grants');
const { generateOtp, storeOtp, verifyOtp: verifyOtpCode } = require('./otp.service');
const { sendOtp } = require('./mailer.nodemailer');
const { resolveHomeModule } = require('./home-module');
const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');
const env = require('../../../config/env');

// Map the URL path segment to an application code + the user role to assign for
// signup. The path segment is the source of truth for the requested app.
const SEGMENT_TO_APP = {
  mwq: { code: 'MWQ', memberRole: 'MWQ_MEMBER' },
  aqms: { code: 'AQMS', memberRole: 'AQMS_MEMBER' },
};

// Resolve the app config from a path segment, or null if absent/unknown.
function appForSegment(segment) {
  return SEGMENT_TO_APP[String(segment || '').toLowerCase()] || null;
}

// The requested application for signup: from the path segment (alias mounts) or
// the body's `application` field (collapsed /auth mount). One must be present.
function requestedApp(segment, body) {
  return appForSegment(segment) || appForSegment(body && body.application);
}

async function signup(segment, body) {
  const app = requestedApp(segment, body);
  if (!app) {
    throw new ApiError(400, 'APPLICATION_REQUIRED', 'An application (MWQ or AQMS) is required to sign up');
  }

  const existing = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');

  const passwordHash = await hashPassword(body.password);
  const userName = await generateUserName(prismaHigherLevel, body.email);

  // Resolve the RbacRole row id for this app's member role (for the UAA grant).
  const rbacRole = await prismaHigherLevel.rbacRole.findUnique({ where: { code: app.memberRole } });
  const application = await prismaHigherLevel.application.findUnique({ where: { code: app.code } });

  if (!rbacRole || !application) {
    logger.error({ what: 'auth.signup.missing_rbac_seed', app: app.code, memberRole: app.memberRole });
    throw new ApiError(500, 'RBAC_NOT_SEEDED', 'Application/role baseline is not provisioned');
  }

  const user = await prismaHigherLevel.user.create({
    data: {
      email: body.email,
      passwordHash,
      userName,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName || null,
      phoneNumber: body.phoneNumber || null,
      emiratesId: body.emiratesId || null,
      role: app.memberRole, // legacy global role mirrors the requested app
      accountStatus: 'PENDING',
      applicationAccess: {
        create: {
          applicationId: application.id,
          roleId: rbacRole.id,
          status: 'PENDING',
        },
      },
    },
  });

  logger.info({ what: 'auth.signup', module: app.code, userId: user.id, email: body.email });
  return sanitizeUser(user);
}

async function login(segment, body, meta) {
  const user = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const valid = await comparePassword(body.password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  if (user.accountStatus !== 'ACTIVE') {
    throw new ApiError(401, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
  }

  const familyId = crypto.randomUUID();
  const rawJti = crypto.randomBytes(40).toString('hex');

  const { access, perms } = await loadAccessAndPerms(user.id);
  // Legacy `module` claim: the path segment (alias mounts) or the user's home app
  // (collapsed /auth mount). The client now reads access[]/perms[] for authz.
  const segApp = appForSegment(segment);
  const moduleClaim = segApp ? segApp.code : (await resolveHomeModule(user.id)).module;
  const accessToken = signAccess({ sub: user.id, role: user.role, module: moduleClaim, accountStatus: user.accountStatus, email: user.email, access, perms });
  const refreshToken = signRefresh({ sub: user.id, jti: rawJti, familyId });

  const tokenHash = hashRefreshJti(rawJti);

  await prismaHigherLevel.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ip || null,
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });

  await auditLog(user.id, 'auth.login', { ip: meta.ip, module: moduleClaim });

  return { accessToken, refreshToken, user: sanitizeUser(user), access, perms };
}

async function logout(segment, body) {
  let decoded;
  try {
    decoded = verifyRefresh(body.refreshToken);
  } catch (_) {
    return;
  }

  const rows = await prismaHigherLevel.refreshToken.findMany({
    where: { userId: decoded.sub, familyId: decoded.familyId, revokedAt: null },
    orderBy: { issuedAt: 'desc' },
  });

  const activeRow = rows.find((r) => r.revokedAt === null);
  if (!activeRow) return;

  const tokenMatch = verifyRefreshJti(decoded.jti, activeRow.tokenHash);
  if (!tokenMatch) return;

  await prismaHigherLevel.refreshToken.update({
    where: { id: activeRow.id },
    data: { revokedAt: new Date() },
  });
}

async function refresh(segment, body, meta) {
  let decoded;
  try {
    decoded = verifyRefresh(body.refreshToken);
  } catch (_) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
  }

  const { sub: userId, jti: rawJti, familyId } = decoded;

  const rows = await prismaHigherLevel.refreshToken.findMany({
    where: { userId, familyId },
    orderBy: { issuedAt: 'desc' },
  });

  const activeRow = rows.find((r) => r.revokedAt === null);
  const revokedRow = rows.find((r) => r.revokedAt !== null);

  if (!activeRow && revokedRow) {
    await prismaHigherLevel.refreshToken.updateMany({
      where: { userId, familyId },
      data: { revokedAt: new Date() },
    });
    await auditLog(userId, 'auth.refresh.reuse_detected', { familyId });
    throw new ApiError(401, 'REUSE_DETECTED', 'Refresh token reuse detected; all sessions revoked');
  }

  if (!activeRow) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token not found');
  }

  const hashValid = verifyRefreshJti(rawJti, activeRow.tokenHash);
  if (!hashValid) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token hash mismatch');
  }

  const user = await prismaHigherLevel.user.findUnique({ where: { id: userId } });
  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new ApiError(401, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
  }

  const newRawJti = crypto.randomBytes(40).toString('hex');
  const newTokenHash = hashRefreshJti(newRawJti);

  // Re-load grants on refresh so revoked/added access propagates within ≤1 TTL.
  const { access, perms } = await loadAccessAndPerms(user.id);
  const segApp = appForSegment(segment);
  const moduleClaim = segApp ? segApp.code : (await resolveHomeModule(user.id)).module;
  const accessToken = signAccess({ sub: user.id, role: user.role, module: moduleClaim, accountStatus: user.accountStatus, email: user.email, access, perms });
  const newRefreshToken = signRefresh({ sub: user.id, jti: newRawJti, familyId });

  const newRow = await prismaHigherLevel.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      familyId,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ip || null,
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });

  await prismaHigherLevel.refreshToken.update({
    where: { id: activeRow.id },
    data: { revokedAt: new Date(), rotatedToId: newRow.id },
  });

  return { accessToken, refreshToken: newRefreshToken, access, perms };
}

async function forgotPassword(segment, body, meta) {
  const user = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (!user) return; // no enumeration

  // OTP rows live in the module DB — route via the user's home module.
  const { module, client } = await resolveHomeModule(user.id);

  const code = generateOtp();
  await storeOtp(client, user.id, code, 'EMAIL', meta.ip || null, body.email);
  await auditLog(user.id, 'auth.forgot_password', { module }, client);
  await sendOtp({ to: body.email, code, purpose: 'password reset' });
}

async function verifyOtp(segment, body) {
  const user = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (!user) throw new ApiError(401, 'INVALID_OTP', 'Invalid OTP code', { attemptsRemaining: 0 });

  // Verify against the SAME module DB the OTP was written to.
  const { client } = await resolveHomeModule(user.id);

  const result = await verifyOtpCode(client, user.id, body.code);

  if (!result.ok) {
    if (result.code === 'OTP_MAX_ATTEMPTS') {
      throw new ApiError(429, 'OTP_MAX_ATTEMPTS', 'Too many OTP attempts', { attemptsRemaining: 0 });
    }
    const code = result.code === 'OTP_EXPIRED' ? 'OTP_EXPIRED' : 'INVALID_OTP';
    throw new ApiError(401, code, 'OTP verification failed', { attemptsRemaining: result.attemptsRemaining ?? 0 });
  }

  const resetToken = jwt.sign(
    { sub: user.id, purpose: 'password_reset' },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  return { resetToken };
}

async function resetPassword(segment, body) {
  let decoded;
  try {
    decoded = jwt.verify(body.resetToken, env.JWT_SECRET);
  } catch (_) {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired');
  }

  if (decoded.purpose !== 'password_reset') {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Invalid token purpose');
  }

  const user = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (!user || user.id !== decoded.sub) {
    throw new ApiError(401, 'INVALID_RESET_TOKEN', 'Token does not match email');
  }

  const newHash = await hashPassword(body.newPassword);

  await prismaHigherLevel.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // Single HL user record — no cross-module admin fanout needed (that was the
  // workaround for duplicated per-module user rows; Phase 2 unifies them).
  const { module, client } = await resolveHomeModule(user.id);
  await auditLog(user.id, 'auth.password_reset', { module }, client);
}

// --- helpers ---

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// Auth audit_logs live in the module DBs. Default to the home-module client when
// no explicit client is supplied (login/refresh resolve lazily here).
async function auditLog(userId, action, changes, client) {
  try {
    const target = client || (await resolveHomeModule(userId)).client;
    await target.auditLog.create({
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
