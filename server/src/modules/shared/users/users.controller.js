'use strict';

// Unified user-management controller (Phase 3). Serves both /mwq/users and
// /aqms/users via the same handlers; the application is derived from the mount
// path (req.baseUrl) and passed to the HL-backed service.

const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');
const schemas = require('./users.schemas');
const service = require('./users.service');

// '/api/v1/aqms/users' | '/api/v1/aqms/auth/me' -> 'AQMS', else 'MWQ'.
function appOf(req) {
  return (req.baseUrl || '').toLowerCase().includes('/aqms/') ? 'AQMS' : 'MWQ';
}

function handleError(err, res) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  logger.error({ what: 'users.unhandled_error', err });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

function validationError(res, error) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.flatten() } });
}

async function getMe(req, res) {
  try {
    const user = await service.getMe(req.user.id);
    return res.json({ user });
  } catch (err) {
    return handleError(err, res);
  }
}

async function updateMe(req, res) {
  const parsed = schemas.patchMeBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No updatable fields provided' } });
  }
  try {
    const user = await service.updateMe(req.user.id, parsed.data);
    return res.json({ user });
  } catch (err) {
    return handleError(err, res);
  }
}

async function listUsers(req, res) {
  const parsed = schemas.listUsersQuery.safeParse(req.query);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await service.listUsers(appOf(req), parsed.data);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

async function createUser(req, res) {
  const parsed = schemas.createUserBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const { user, tempPassword } = await service.createUser(appOf(req), parsed.data);
    return res.status(201).json({ user, tempPassword });
  } catch (err) {
    return handleError(err, res);
  }
}

async function updateUser(req, res) {
  const parsed = schemas.patchUserBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid user id' } });
  }

  let ifUnmodifiedSince;
  const header = req.headers['if-unmodified-since'];
  if (header) {
    ifUnmodifiedSince = new Date(header);
    if (isNaN(ifUnmodifiedSince.getTime())) {
      return res.status(400).json({ error: { code: 'INVALID_HEADER', message: 'If-Unmodified-Since must be a valid date' } });
    }
  }

  try {
    const { after } = await service.updateUser(appOf(req), id, parsed.data, { ifUnmodifiedSince });
    logger.info({ what: 'users.updateUser', app: appOf(req), actorId: req.user.id, targetId: id, patch: parsed.data });
    return res.json({ user: after });
  } catch (err) {
    return handleError(err, res);
  }
}

module.exports = { getMe, updateMe, listUsers, createUser, updateUser };
