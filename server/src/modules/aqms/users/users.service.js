'use strict';

const { prismaAqms, prismaMwq } = require('../../../db/prisma');
const { hashPassword } = require('../../shared/auth/password');
const { generateUserName } = require('../../shared/auth/username');
const { writeAdminAcrossModules } = require('../../shared/auth/admin-fanout');
const { logger } = require('../../../lib/logger');

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
    updatedAt: user.updatedAt,
  };
}

function pickPrisma(module) {
  return module === 'MWQ' ? prismaMwq : prismaAqms;
}

async function getMe(userId, module) {
  const prisma = pickPrisma(module);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return { user: safeUser(user) };
}

async function updateMe(userId, module, patch) {
  const prisma = pickPrisma(module);
  const user = await prisma.user.update({
    where: { id: userId },
    data: patch,
  });

  if (user.role === 'ADMIN') {
    for (const [field, value] of Object.entries(patch)) {
      await writeAdminAcrossModules(field, value, user.email);
    }
  }

  logger.info({ what: 'users.updateMe', module, userId });
  return { user: safeUser(user) };
}

async function listUsers({ page, limit, accountStatus, role }) {
  const where = {};
  if (accountStatus) where.accountStatus = accountStatus;
  if (role) where.role = role;

  const [data, total] = await Promise.all([
    prismaAqms.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prismaAqms.user.count({ where }),
  ]);

  return { data: data.map(safeUser), total, page, limit };
}

async function updateUser(targetId, patch) {
  const user = await prismaAqms.user.update({
    where: { id: targetId },
    data: patch,
  });

  if (patch.role || patch.accountStatus) {
    const isAdminTarget = user.role === 'ADMIN';
    const promotingToAdmin = patch.role === 'ADMIN';
    if (isAdminTarget || promotingToAdmin) {
      for (const [field, value] of Object.entries(patch)) {
        if (field === 'role' || field === 'accountStatus') {
          await writeAdminAcrossModules(field, value, user.email);
        }
      }
    }
  }

  logger.info({ what: 'users.updateUser', module: 'AQMS', targetId, patch });
  return { user: safeUser(user) };
}

async function createUser({ email, password, firstName, lastName, middleName, phoneNumber, emiratesId, role }) {
  const existing = await prismaAqms.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already taken');
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const username = await generateUserName(prismaAqms, email);

  const user = await prismaAqms.user.create({
    data: {
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      middleName: middleName ?? null,
      phoneNumber: phoneNumber ?? null,
      emiratesId: emiratesId ?? null,
      role: role ?? 'AQMS_MEMBER',
      accountStatus: 'ACTIVE',
    },
  });

  logger.info({ what: 'users.createUser', module: 'AQMS', userId: user.id, email });
  return { user: safeUser(user) };
}

module.exports = { getMe, updateMe, listUsers, updateUser, createUser };
