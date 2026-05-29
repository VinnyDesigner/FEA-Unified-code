'use strict';

const { z } = require('zod');

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(8)
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
const emiratesIdSchema = z.string().regex(/^\d{15}$/, 'Emirates ID must be 15 digits');

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  emiratesId: emiratesIdSchema.optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().length(4),
});

const resetPasswordSchema = z.object({
  email: emailSchema,
  resetToken: z.string().min(1),
  newPassword: passwordSchema,
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
