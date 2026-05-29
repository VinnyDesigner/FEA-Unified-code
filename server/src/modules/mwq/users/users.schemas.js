'use strict';

const { z } = require('zod');

const ROLES = ['ADMIN', 'MWQ_MEMBER'];
const ACCOUNT_STATUSES = ['ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING'];

const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  role: z.enum(ROLES).optional(),
});

const patchUserBody = z.object({
  role: z.enum(ROLES).optional(),
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
}).strict().refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

const createUserBody = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  emiratesId: z.string().optional(),
  role: z.enum(ROLES).default('MWQ_MEMBER'),
  accountStatus: z.enum(ACCOUNT_STATUSES).default('ACTIVE'),
});

const patchMeBody = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
}).strict();

module.exports = { listUsersQuery, patchUserBody, createUserBody, patchMeBody };
