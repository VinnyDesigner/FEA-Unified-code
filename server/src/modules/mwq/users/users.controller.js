'use strict';

const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');
const schemas = require('./users.schemas');
const service = require('./users.service');
const { prismaMwq, prismaAqms } = require('../../../db/prisma');
const { writeAdminAcrossModules } = require('../../shared/auth/admin-fanout');

function handleError(err, res) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  logger.error({ what: 'unhandled_error', err });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}

// GET /auth/me — cross-DB: use req.user.module to pick correct prisma
async function getMe(req, res) {
  try {
    const prisma = req.user.module === 'AQMS' ? prismaAqms : prismaMwq;
    const user = await service.getMe(prisma, req.user.id);
    return res.json({ user });
  } catch (err) {
    return handleError(err, res);
  }
}

// PATCH /auth/me — cross-DB
async function updateMe(req, res) {
  const parsed = schemas.patchMeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const prisma = req.user.module === 'AQMS' ? prismaAqms : prismaMwq;
    const user = await service.updateMe(prisma, req.user.id, parsed.data);
    return res.json({ user });
  } catch (err) {
    return handleError(err, res);
  }
}

// GET /users
async function listUsers(req, res) {
  const parsed = schemas.listUsersQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: parsed.error.flatten() } });
  }
  try {
    const { page, limit, accountStatus, role } = parsed.data;
    const result = await service.listUsers(prismaMwq, { accountStatus, role }, { page, limit });
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// POST /users
async function createUser(req, res) {
  const parsed = schemas.createUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }
  try {
    const { user, tempPassword } = await service.createUser(prismaMwq, parsed.data);
    return res.status(201).json({ user, tempPassword });
  } catch (err) {
    return handleError(err, res);
  }
}

// PATCH /users/:id
async function updateUser(req, res) {
  const parsed = schemas.patchUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } });
  }

  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid user id' } });
  }
  const patch = parsed.data;

  try {
    // Fetch the target user first (needed for guards + optimistic lock)
    const target = await prismaMwq.user.findUnique({ where: { id } });
    if (!target) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

    // Optimistic concurrency: If-Unmodified-Since header
    const ifUnmodifiedSince = req.headers['if-unmodified-since'];
    if (ifUnmodifiedSince) {
      const clientDate = new Date(ifUnmodifiedSince);
      if (isNaN(clientDate.getTime())) {
        return res.status(400).json({ error: { code: 'INVALID_HEADER', message: 'If-Unmodified-Since must be a valid date' } });
      }
      // Compare at second granularity (HTTP dates have no sub-second precision)
      if (target.updatedAt.getTime() > clientDate.getTime()) {
        return res.status(409).json({ error: { code: 'OPTIMISTIC_LOCK', message: 'Resource was modified since your last read; re-fetch and retry' } });
      }
    }

    // LAST_ADMIN guard: prevent demoting or deactivating the last active admin
    const isDemotion = (patch.role && patch.role !== 'ADMIN') ||
      (patch.accountStatus && ['SUSPENDED', 'REJECTED', 'PENDING'].includes(patch.accountStatus));

    if (target.role === 'ADMIN' && isDemotion) {
      const activeAdminCount = await prismaMwq.user.count({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' },
      });
      if (activeAdminCount <= 1) {
        throw new ApiError(400, 'LAST_ADMIN', 'Cannot demote or deactivate the last active admin');
      }
    }

    const { after } = await service.updateUser(prismaMwq, id, patch);

    // Admin fan-out: sync across modules when admin role is involved
    if (target.role === 'ADMIN' || patch.role === 'ADMIN') {
      if (patch.role) {
        await writeAdminAcrossModules('role', patch.role, target.email);
      }
    }

    return res.json({ user: after });
  } catch (err) {
    return handleError(err, res);
  }
}

module.exports = { getMe, updateMe, listUsers, createUser, updateUser };
