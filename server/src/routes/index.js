'use strict';

const { Router } = require('express');
const { prismaMwq, prismaAqms } = require('../db/prisma');
const { requireAuth } = require('../middleware/requireAuth');
const { requireModule } = require('../middleware/requireModule');

const mwqAuthRouter  = require('../modules/mwq/auth/auth.routes');
const aqmsAuthRouter = require('../modules/aqms/auth/auth.routes');

// Users module exports { meRouter, usersRouter }
const mwqUsersModule  = require('../modules/mwq/users/users.routes');
const aqmsUsersModule = require('../modules/aqms/users/users.routes');

const mwqRouter     = require('../modules/mwq');
const aqmsRouter    = require('../modules/aqms/index');
const aqmsPublicRouter = require('../modules/aqms/public/public.routes');
const alarmsRouter  = require('../modules/shared/alarms/alarms.routes');
const reportsRouter = require('../modules/shared/reports/reports.routes');

const router = Router();

router.get('/healthz', async (req, res) => {
  try {
    await Promise.all([prismaMwq.$queryRaw`SELECT 1`, prismaAqms.$queryRaw`SELECT 1`]);
    res.json({ ok: true, db: { mwq: 'ok', aqms: 'ok' }, uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'error', error: err.message });
  }
});

// PUBLIC: auth endpoints (signup, login, refresh, forgot-password, verify-otp, reset-password)
router.use('/mwq/auth',  mwqAuthRouter);
router.use('/aqms/auth', aqmsAuthRouter);

// PROTECTED: /auth/me — cross-DB handler picks DB from req.user.module (§2.4)
router.use('/mwq/auth/me',  requireAuth, mwqUsersModule.meRouter);
router.use('/aqms/auth/me', requireAuth, aqmsUsersModule.meRouter);

// PROTECTED: users admin CRUD (requireRole layered inside each router)
router.use('/mwq/users',  requireAuth, mwqUsersModule.usersRouter);
router.use('/aqms/users', requireAuth, aqmsUsersModule.usersRouter);

// PUBLIC: AQMS landing-page overview (read-only) — MUST register before the
// protected /aqms mount so it is NOT behind requireAuth.
router.use('/aqms/public', aqmsPublicRouter);

// PROTECTED: data — module-gated
router.use('/mwq',  requireAuth, requireModule('MWQ'),  mwqRouter);
router.use('/aqms', requireAuth, requireModule('AQMS'), aqmsRouter);

// PROTECTED: shared (no module gate; handlers enforce module via query/body per §2.2)
router.use('/alarms',  requireAuth, alarmsRouter);
router.use('/reports', requireAuth, reportsRouter);

module.exports = { router };
