'use strict';

// grants.js — load a user's application-access grants + effective permissions
// from the higher-level DB. This is the single source for the RBAC claims that
// go into the v2 access token (`access[]` / `perms[]`) and for any live
// re-validation of authorization.
//
//   access : one entry per non-revoked grant -> { app, role, status }
//   perms  : union of permission codes from the user's ACTIVE grants only
//            (a PENDING/SUSPENDED grant carries no permissions)

const { prismaHigherLevel } = require('../../../db/prisma');

async function loadAccessAndPerms(userId) {
  const grants = await prismaHigherLevel.userApplicationAccess.findMany({
    where: { userId, revokedAt: null },
    select: {
      status: true,
      application: { select: { code: true } },
      role: {
        select: {
          code: true,
          permissions: { select: { permission: { select: { code: true } } } },
        },
      },
    },
  });

  const access = grants.map((g) => ({
    app: g.application.code,
    role: g.role.code,
    status: g.status,
  }));

  const permSet = new Set();
  for (const g of grants) {
    if (g.status !== 'ACTIVE') continue;
    for (const rp of g.role.permissions) permSet.add(rp.permission.code);
  }

  return { access, perms: [...permSet] };
}

module.exports = { loadAccessAndPerms };
