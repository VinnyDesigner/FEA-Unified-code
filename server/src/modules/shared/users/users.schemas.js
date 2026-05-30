'use strict';

const { z } = require('zod');

// Grant-model roles: a user may be ADMIN on one app and a member on another,
// so every role code is valid in a PATCH/create body (the route's application
// decides which grant it applies to).
const ROLES = ['ADMIN', 'MWQ_MEMBER', 'AQMS_MEMBER'];
const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];

const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  role: z.enum(ROLES).optional(),
});

const patchMeBody = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    middleName: z.string().max(100).optional(),
    phoneNumber: z.string().max(30).optional(),
    emiratesId: z.string().regex(/^\d{15}$/).optional(),
  })
  .strict();

const patchUserBody = z
  .object({
    role: z.enum(ROLES).optional(),
    accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const createUserBody = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  emiratesId: z.string().optional(),
  role: z.enum(ROLES).optional(),
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
});

module.exports = { listUsersQuery, patchMeBody, patchUserBody, createUserBody };
