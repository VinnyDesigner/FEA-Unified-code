'use strict';

const crypto = require('crypto');
const { hashPassword } = require('../../shared/auth/password');
const { generateUserName } = require('../../shared/auth/username');
const { ApiError } = require('../../../lib/api-error');
const { logger } = require('../../../lib/logger');

const USER_SELECT = {
  id: true,
  email: true,
  userName: true,
  firstName: true,
  lastName: true,
  middleName: true,
  phoneNumber: true,
  emiratesId: true,
  role: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
};

async function getMe(prismaMwq, userId) {
  const user = await prismaMwq.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  return user;
}

async function updateMe(prismaMwq, userId, patch) {
  const user = await prismaMwq.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

  const updated = await prismaMwq.user.update({
    where: { id: userId },
    data: patch,
    select: USER_SELECT,
  });

  return updated;
}

async function listUsers(prismaMwq, filters, paging) {
  const where = {};
  if (filters.accountStatus) where.accountStatus = filters.accountStatus;
  if (filters.role) where.role = filters.role;

  const { page, limit } = paging;
  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prismaMwq.user.count({ where }),
    prismaMwq.user.findMany({ where, select: USER_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function updateUser(prismaMwq, id, patch) {
  const user = await prismaMwq.user.findUnique({ where: { id }, select: { ...USER_SELECT, passwordHash: false } });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

  const updated = await prismaMwq.user.update({
    where: { id },
    data: patch,
    select: USER_SELECT,
  });

  return { before: user, after: updated };
}

async function createUser(prismaMwq, body, tempPassword) {
  const existing = await prismaMwq.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');

  const rawPassword = tempPassword || crypto.randomBytes(12).toString('hex');
  const passwordHash = await hashPassword(rawPassword);
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
      role: body.role || 'MWQ_MEMBER',
      accountStatus: body.accountStatus || 'ACTIVE',
    },
    select: USER_SELECT,
  });

  return { user, tempPassword: rawPassword };
}

module.exports = { getMe, updateMe, listUsers, updateUser, createUser };
