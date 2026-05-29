'use strict';

const { Router } = require('express');
const { requireRole } = require('../../../middleware/requireRole');
const ctrl = require('./users.controller');

// meRouter: GET /auth/me, PATCH /auth/me (requireAuth applied at mount in routes/index.js)
const meRouter = Router();
meRouter.get('/', ctrl.getMe);
meRouter.patch('/', ctrl.updateMe);

// usersRouter: admin-only CRUD (requireAuth applied at mount; requireRole layered here)
const usersRouter = Router();
usersRouter.get('/', requireRole('ADMIN'), ctrl.listUsers);
usersRouter.post('/', requireRole('ADMIN'), ctrl.createUser);
usersRouter.patch('/:id', requireRole('ADMIN'), ctrl.updateUser);

module.exports = { meRouter, usersRouter };
