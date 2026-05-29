'use strict';

const { z } = require('zod');

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  accountStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  role: z.enum(['ADMIN', 'AQMS_MEMBER']).optional(),
});

const updateMeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  phoneNumber: z.string().max(30).optional(),
  emiratesId: z.string().regex(/^\d{15}$/).optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'AQMS_MEMBER']).optional(),
  accountStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  phoneNumber: z.string().max(30).optional(),
  emiratesId: z.string().regex(/^\d{15}$/).optional(),
  role: z.enum(['ADMIN', 'AQMS_MEMBER']).default('AQMS_MEMBER'),
});

module.exports = { listUsersSchema, updateMeSchema, updateUserSchema, createUserSchema };
