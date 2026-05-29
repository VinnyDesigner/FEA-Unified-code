'use strict';

const { Router } = require('express');
const { requireRole } = require('../../../middleware/requireRole');
const {
  handleGetMe,
  handleUpdateMe,
  handleListUsers,
  handleUpdateUser,
  handleCreateUser,
} = require('./users.controller');

// Admin-only: GET /users, POST /users, PATCH /users/:id
const usersRouter = Router();
usersRouter.use(requireRole('ADMIN'));
usersRouter.get('/', handleListUsers);
usersRouter.post('/', handleCreateUser);
usersRouter.patch('/:id', handleUpdateUser);

// Self-service: GET /auth/me, PATCH /auth/me (requireAuth runs upstream)
const meRouter = Router();
meRouter.get('/', handleGetMe);
meRouter.patch('/', handleUpdateMe);

module.exports = { usersRouter, meRouter };
