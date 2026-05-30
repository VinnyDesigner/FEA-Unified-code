'use strict';

// Unified user-management service (Phase 3).
//
// ONE HL-backed implementation, ONE signature, serving both /mwq/users and
// /aqms/users. Identity (users) and access (user_application_access) live in
// the higher-level DB; there is no per-module user DB any more. The caller
// supplies the application code (derived from the URL mount) so list/create/
// update operate on the grant for THAT application. The legacy User.role /
// User.accountStatus columns are mirrored from the edited grant for FE
// back-compat; the authoritative per-app value is the grant.

const crypto = require('crypto');
const { prismaHigherLevel } = require('../../../db/prisma');
const { hashPassword } = require('../auth/password');
const { generateUserName } = require('../auth/username');
const { ApiError } = require('../../../lib/api-error');

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

const ACCESS_SELECT = {
  status: true,
  application: { select: { code: true } },
  role: { select: { code: true } },
};

const WITH_ACCESS = { ...USER_SELECT, applicationAccess: { select: ACCESS_SELECT } };

function defaultMemberRole(appCode) {
  return appCode === 'AQMS' ? 'AQMS_MEMBER' : 'MWQ_MEMBER';
}

function shapeUser(u) {
  if (!u) return u;
  const { applicationAccess, ...rest } = u;
  return {
    ...rest,
    access: (applicationAccess || []).map((a) => ({ app: a.application.code, role: a.role.code, status: a.status })),
  };
}

async function resolveApp(appCode) {
  const application = await prismaHigherLevel.application.findUnique({ where: { code: appCode } });
  if (!application) throw new ApiError(500, 'RBAC_NOT_SEEDED', `Application ${appCode} is not provisioned`);
  return application;
}

async function resolveRole(roleCode) {
  const role = await prismaHigherLevel.rbacRole.findUnique({ where: { code: roleCode } });
  if (!role) throw new ApiError(400, 'INVALID_ROLE', `Role ${roleCode} is not a known role`);
  return role;
}

async function countActiveAdminGrants() {
  return prismaHigherLevel.userApplicationAccess.count({
    where: { status: 'ACTIVE', revokedAt: null, role: { code: 'ADMIN' } },
  });
}

async function getMe(userId) {
  const user = await prismaHigherLevel.user.findUnique({ where: { id: userId }, select: WITH_ACCESS });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  return shapeUser(user);
}

async function updateMe(userId, patch) {
  const existing = await prismaHigherLevel.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  const user = await prismaHigherLevel.user.update({ where: { id: userId }, data: patch, select: WITH_ACCESS });
  return shapeUser(user);
}

// List users who hold a grant for the calling application.
async function listUsers(appCode, { page, limit, accountStatus, role }) {
  const where = { applicationAccess: { some: { application: { code: appCode } } } };
  if (accountStatus) where.accountStatus = accountStatus;
  if (role) where.role = role;

  const skip = (page - 1) * limit;
  const [total, users] = await Promise.all([
    prismaHigherLevel.user.count({ where }),
    prismaHigherLevel.user.findMany({ where, select: WITH_ACCESS, skip, take: limit, orderBy: { createdAt: 'desc' } }),
  ]);

  return { users: users.map(shapeUser), total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function createUser(appCode, body, tempPassword) {
  const existing = await prismaHigherLevel.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');

  const roleCode = body.role || defaultMemberRole(appCode);
  const application = await resolveApp(appCode);
  const role = await resolveRole(roleCode);
  const status = body.accountStatus || 'ACTIVE';

  const rawPassword = tempPassword || crypto.randomBytes(12).toString('hex');
  const passwordHash = await hashPassword(rawPassword);
  const userName = await generateUserName(prismaHigherLevel, body.email);

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
      role: roleCode,
      accountStatus: status,
      applicationAccess: { create: { applicationId: application.id, roleId: role.id, status } },
    },
    select: WITH_ACCESS,
  });

  return { user: shapeUser(user), tempPassword: rawPassword };
}

// Admin update of a user's grant FOR the calling application (+ legacy mirror).
// opts.ifUnmodifiedSince (Date) enables optimistic concurrency.
async function updateUser(appCode, id, patch, opts = {}) {
  const application = await resolveApp(appCode);

  const user = await prismaHigherLevel.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

  if (opts.ifUnmodifiedSince instanceof Date && !isNaN(opts.ifUnmodifiedSince.getTime())) {
    if (user.updatedAt.getTime() > opts.ifUnmodifiedSince.getTime()) {
      throw new ApiError(409, 'OPTIMISTIC_LOCK', 'Resource was modified since your last read; re-fetch and retry');
    }
  }

  const grant = await prismaHigherLevel.userApplicationAccess.findUnique({
    where: { userId_applicationId: { userId: id, applicationId: application.id } },
    include: { role: { select: { code: true } } },
  });
  if (!grant) throw new ApiError(404, 'USER_NOT_FOUND', `User has no ${appCode} access grant`);

  // LAST_ADMIN guard: don't strip the final ACTIVE admin grant in the system.
  const wasActiveAdmin = grant.role.code === 'ADMIN' && grant.status === 'ACTIVE';
  const isDemotion =
    (patch.role && patch.role !== 'ADMIN') ||
    (patch.accountStatus && ['SUSPENDED', 'REJECTED', 'PENDING'].includes(patch.accountStatus));
  if (wasActiveAdmin && isDemotion) {
    const activeAdmins = await countActiveAdminGrants();
    if (activeAdmins <= 1) {
      throw new ApiError(400, 'LAST_ADMIN', 'Cannot demote or deactivate the last active admin');
    }
  }

  // Update the grant for this application.
  const grantData = {};
  if (patch.role) grantData.roleId = (await resolveRole(patch.role)).id;
  if (patch.accountStatus) grantData.status = patch.accountStatus;
  if (Object.keys(grantData).length > 0) {
    await prismaHigherLevel.userApplicationAccess.update({ where: { id: grant.id }, data: grantData });
  }

  // Mirror to the legacy User columns (FE reads user.role / user.accountStatus).
  const userData = {};
  if (patch.role) userData.role = patch.role;
  if (patch.accountStatus) userData.accountStatus = patch.accountStatus;
  const after = await prismaHigherLevel.user.update({
    where: { id },
    data: userData,
    select: WITH_ACCESS,
  });

  return { before: user, after: shapeUser(after) };
}

module.exports = { getMe, updateMe, listUsers, createUser, updateUser };
