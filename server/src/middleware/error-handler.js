'use strict';

const { ApiError } = require('../lib/api-error');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const payload = { error: { code: err.code, message: err.message } };
    if (err.details != null) payload.error.details = err.details;
    if (err.status === 429 && err.retryAfter) res.setHeader('Retry-After', String(err.retryAfter));
    return res.status(err.status).json(payload);
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    req.log ? req.log.error(err) : console.error(err);
  }

  res.status(status).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
}

module.exports = { errorHandler };
