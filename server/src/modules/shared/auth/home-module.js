'use strict';

// home-module.js — resolve a user's "home" application/module deterministically.
//
// Users + UserApplicationAccess live in the higher-level DB, but otps and
// audit_logs still live in the per-module DBs (prismaMwq / prismaAqms). When an
// auth flow is email-first (forgot/verify/reset) there is no path segment to
// tell us which module DB to write/verify the OTP against, so we derive a stable
// "home module" from the user's application-access grants.
//
// Ordering (deterministic on userId):
//   1. lowest application_id among ACTIVE grants
//   2. else lowest application_id among PENDING grants
//   3. else fallback 'MWQ' (logged loudly — should not happen for a real user)

const { prismaMwq, prismaAqms, prismaHigherLevel } = require('../../../db/prisma');
const { logger } = require('../../../lib/logger');

const VALID_MODULES = ['MWQ', 'AQMS'];

// Return the module DB client for an application code.
function moduleClientFor(code) {
  if (code === 'AQMS') return prismaAqms;
  return prismaMwq; // default / 'MWQ'
}

async function resolveHomeModule(userId) {
  const grants = await prismaHigherLevel.userApplicationAccess.findMany({
    where: { userId },
    select: { applicationId: true, status: true },
  });

  let chosen = null;

  if (grants.length > 0) {
    const active = grants.filter((g) => g.status === 'ACTIVE');
    const pending = grants.filter((g) => g.status === 'PENDING');
    const pool = active.length > 0 ? active : pending;

    if (pool.length > 0) {
      const lowest = pool.reduce((a, b) => (a.applicationId <= b.applicationId ? a : b));
      const app = await prismaHigherLevel.application.findUnique({
        where: { id: lowest.applicationId },
        select: { code: true },
      });
      if (app && VALID_MODULES.includes(app.code)) {
        chosen = app.code;
      }
    }
  }

  if (!chosen) {
    logger.warn({
      what: 'resolve_home_module.fallback',
      userId,
      grantCount: grants.length,
      message: 'No resolvable ACTIVE/PENDING application grant; falling back to MWQ',
    });
    chosen = 'MWQ';
  }

  return { module: chosen, client: moduleClientFor(chosen) };
}

module.exports = { resolveHomeModule, moduleClientFor, VALID_MODULES };
