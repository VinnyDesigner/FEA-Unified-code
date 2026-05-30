'use strict';

// Unified auth controller. ONE set of handlers serving both /mwq/auth/* and
// /aqms/auth/*. The requested app is inferred from the mount path segment
// (req.baseUrl ends in '/mwq/auth' or '/aqms/auth') and passed to the service so
// JWT `module` claims + signup grants reflect the requested application.

const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');
const schemas = require('./auth.schemas');
const service = require('./auth.service');

function parseMeta(req) {
  return {
    ip: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

// Derive 'mwq' | 'aqms' from the module-prefixed alias mount
// (e.g. '/api/v1/aqms/auth'), or null for the collapsed '/api/v1/auth' mount —
// in which case the app is taken from the request body / the user's grants.
function segmentOf(req) {
  const base = (req.baseUrl || '').toLowerCase();
  if (base.includes('/aqms/')) return 'aqms';
  if (base.includes('/mwq/')) return 'mwq';
  return null;
}

function handleError(err, res) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  logger.error({ what: 'unhandled_error', err });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

async function signup(req, res) {
  const parsed = schemas.signupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const user = await service.signup(segmentOf(req), parsed.data);
    return res.status(201).json({ user });
  } catch (err) {
    return handleError(err, res);
  }
}

async function login(req, res) {
  const parsed = schemas.loginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const result = await service.login(segmentOf(req), parsed.data, parseMeta(req));
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

async function logout(req, res) {
  const parsed = schemas.logoutBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    await service.logout(segmentOf(req), parsed.data);
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
}

async function refresh(req, res) {
  const parsed = schemas.refreshBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const result = await service.refresh(segmentOf(req), parsed.data, parseMeta(req));
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

async function forgotPassword(req, res) {
  const parsed = schemas.forgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    await service.forgotPassword(segmentOf(req), parsed.data, parseMeta(req));
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
}

async function verifyOtp(req, res) {
  const parsed = schemas.verifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const result = await service.verifyOtp(segmentOf(req), parsed.data);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

async function resetPassword(req, res) {
  const parsed = schemas.resetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    await service.resetPassword(segmentOf(req), parsed.data);
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
}

module.exports = { signup, login, logout, refresh, forgotPassword, verifyOtp, resetPassword };
