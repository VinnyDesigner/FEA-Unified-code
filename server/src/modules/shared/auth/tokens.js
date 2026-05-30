'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');

// Refresh-token jti is a 40-byte (80 hex char) high-entropy random value. SHA-256
// is the correct store for it: bcrypt silently truncates input past 72 bytes (so
// it would only hash the first 72 of the 80 chars), and a fast hash is fine for a
// value with this much entropy. We store the hex digest and compare in constant time.
function hashRefreshJti(rawJti) {
  return crypto.createHash('sha256').update(rawJti).digest('hex');
}

function verifyRefreshJti(rawJti, storedHash) {
  const computed = hashRefreshJti(rawJti);
  if (typeof storedHash !== 'string' || storedHash.length !== computed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}

function signAccess(payload) {
  // v2 payload: additive RBAC claims (access[]/perms[]) alongside the legacy
  // role/module claims (kept for FE + requireModule back-compat).
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      module: payload.module,
      accountStatus: payload.accountStatus,
      email: payload.email,
      access: payload.access || [],
      perms: payload.perms || [],
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, audience: 'access' }
  );
}

function signRefresh(payload) {
  return jwt.sign(
    { sub: payload.sub, jti: payload.jti, familyId: payload.familyId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function verifyAccess(token) {
  return jwt.verify(token, env.JWT_SECRET, { audience: 'access' });
}

function verifyRefresh(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, hashRefreshJti, verifyRefreshJti };
