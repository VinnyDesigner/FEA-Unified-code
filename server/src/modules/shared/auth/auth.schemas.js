'use strict';

const { z } = require('zod');

const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  emiratesId: z.string().optional(),
  // Which application to request access to. Required on the collapsed `/auth/signup`
  // mount (no module in the path); optional on the `/{mwq,aqms}/auth/signup` aliases
  // where the path segment supplies it.
  application: z.enum(['MWQ', 'AQMS']).optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const logoutBody = z.object({
  refreshToken: z.string().min(1),
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordBody = z.object({
  email: z.string().email(),
});

const verifyOtpBody = z.object({
  email: z.string().email(),
  code: z.string().min(1),
});

const resetPasswordBody = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1),
  newPassword: z.string().min(8),
});

const patchMeBody = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
}).strict();

module.exports = {
  signupBody,
  loginBody,
  logoutBody,
  refreshBody,
  forgotPasswordBody,
  verifyOtpBody,
  resetPasswordBody,
  patchMeBody,
};
