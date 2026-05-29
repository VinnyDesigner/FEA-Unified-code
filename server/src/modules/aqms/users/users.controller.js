'use strict';

const { prismaAqms } = require('../../../db/prisma');
const { getMe, updateMe, listUsers, updateUser, createUser } = require('./users.service');
const { listUsersSchema, updateMeSchema, updateUserSchema, createUserSchema } = require('./users.schemas');
const { logger } = require('../../../lib/logger');

function validationError(res, error) {
  return res.status(400).json({
    error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: error.flatten() },
  });
}

function serviceError(res, err) {
  const statusMap = {
    EMAIL_TAKEN: 409,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    LAST_ADMIN: 400,
    OPTIMISTIC_LOCK: 409,
  };
  const status = statusMap[err.code] || 500;
  return res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
}

async function handleGetMe(req, res) {
  try {
    const result = await getMe(req.user.id, req.user.module);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleUpdateMe(req, res) {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'No updatable fields provided' } });
  }
  try {
    const result = await updateMe(req.user.id, req.user.module, parsed.data);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleListUsers(req, res) {
  const parsed = listUsersSchema.safeParse(req.query);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await listUsers(parsed.data);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleUpdateUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid user id' } });
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'No updatable fields provided' } });
  }

  try {
    const target = await prismaAqms.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // OPTIMISTIC_LOCK — check If-Unmodified-Since header against row's updatedAt
    const ifUnmodifiedSince = req.headers['if-unmodified-since'];
    if (ifUnmodifiedSince) {
      const clientTs = new Date(ifUnmodifiedSince);
      const rowTs = new Date(target.updatedAt);
      if (Math.abs(rowTs - clientTs) > 999) {
        return res.status(409).json({ error: { code: 'OPTIMISTIC_LOCK', message: 'Resource was modified since you last read it' } });
      }
    }

    // LAST_ADMIN guard — prevent demotion of the last active admin
    const isDemotion =
      (parsed.data.role && parsed.data.role !== 'ADMIN') ||
      (parsed.data.accountStatus && ['SUSPENDED', 'REJECTED', 'PENDING'].includes(parsed.data.accountStatus));

    if (isDemotion && target.role === 'ADMIN') {
      const activeAdminCount = await prismaAqms.user.count({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: { code: 'LAST_ADMIN', message: 'Cannot demote or deactivate the last active admin' } });
      }
    }

    logger.info({ what: 'users.updateUser.audit', module: 'AQMS', actorId: req.user.id, targetId: id, patch: parsed.data });

    const result = await updateUser(id, parsed.data);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleCreateUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await createUser(parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

module.exports = { handleGetMe, handleUpdateMe, handleListUsers, handleUpdateUser, handleCreateUser };
