'use strict';

const { ApiError } = require('../lib/api-error');

function validate({ query, params, body } = {}) {
  return (req, res, next) => {
    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid query parameters', result.error.flatten().fieldErrors));
      }
      // req.query is a getter-only property in some Express/router versions
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    }
    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) {
        return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid path parameters', result.error.flatten().fieldErrors));
      }
      Object.defineProperty(req, 'params', { value: result.data, writable: true, configurable: true });
    }
    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid request body', result.error.flatten().fieldErrors));
      }
      req.body = result.data;
    }
    next();
  };
}

module.exports = { validate };
