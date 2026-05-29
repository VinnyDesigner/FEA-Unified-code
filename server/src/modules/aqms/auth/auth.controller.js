'use strict';

const { signup, login, logout, refresh, forgotPassword, verifyOtpHandler, resetPassword } = require('./auth.service');
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require('./auth.schemas');

function validationError(res, error) {
  return res.status(400).json({
    error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: error.flatten() },
  });
}

function serviceError(res, err) {
  const statusMap = {
    EMAIL_TAKEN: 409,
    INVALID_CREDENTIALS: 401,
    ACCOUNT_NOT_ACTIVE: 401,
    OTP_EXPIRED: 401,
    OTP_INVALID: 401,
    OTP_MAX_ATTEMPTS: 429,
    UNAUTHORIZED: 401,
    REFRESH_REUSE_DETECTED: 401,
    FORBIDDEN: 403,
  };
  const status = statusMap[err.code] || 500;
  const body = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message } };
  if (err.attemptsRemaining !== undefined) body.error.details = { attemptsRemaining: err.attemptsRemaining };
  return res.status(status).json(body);
}

async function handleSignup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await signup(parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleLogin(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await login(parsed.data, req);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleLogout(req, res) {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    await logout(parsed.data);
    return res.status(204).send();
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleRefresh(req, res) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await refresh(parsed.data, req);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleForgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    await forgotPassword(parsed.data, req);
    return res.status(204).send();
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleVerifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await verifyOtpHandler(parsed.data);
    return res.status(200).json(result);
  } catch (err) {
    return serviceError(res, err);
  }
}

async function handleResetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    await resetPassword(parsed.data);
    return res.status(204).send();
  } catch (err) {
    return serviceError(res, err);
  }
}

module.exports = {
  handleSignup,
  handleLogin,
  handleLogout,
  handleRefresh,
  handleForgotPassword,
  handleVerifyOtp,
  handleResetPassword,
};
