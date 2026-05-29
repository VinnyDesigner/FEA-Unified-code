'use strict';

const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

const noopMiddleware = (_req, _res, next) => next();

const authLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
    });

const otpVerifyLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 5,
      keyGenerator: (req) => req.body && req.body.email ? req.body.email : req.ip,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many OTP attempts, please try again later' } },
    });

module.exports = { authLimiter, otpVerifyLimiter };
