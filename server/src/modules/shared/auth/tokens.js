'use strict';

const jwt = require('jsonwebtoken');
const env = require('../../../config/env');

function signAccess(payload) {
  return jwt.sign(
    { sub: payload.sub, role: payload.role, module: payload.module, accountStatus: payload.accountStatus, email: payload.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
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
  return jwt.verify(token, env.JWT_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
