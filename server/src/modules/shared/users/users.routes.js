'use strict';

// Unified user-management routers (Phase 3). Mounted under BOTH /mwq/* and
// /aqms/* (requireAuth applied at the mount in src/routes/index.js).
//   meRouter    : self-service profile (any authenticated user)
//   usersRouter : admin CRUD, gated by the 'users:manage' permission (RBAC)

const { Router } = require('express');
const { requirePermission } = require('../../../middleware/requirePermission');
const ctrl = require('./users.controller');

const meRouter = Router();
meRouter.get('/', ctrl.getMe);
meRouter.patch('/', ctrl.updateMe);

const usersRouter = Router();
usersRouter.use(requirePermission('users:manage'));
usersRouter.get('/', ctrl.listUsers);
usersRouter.post('/', ctrl.createUser);
usersRouter.patch('/:id', ctrl.updateUser);

module.exports = { meRouter, usersRouter };
