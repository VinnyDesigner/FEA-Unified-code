'use strict';

const { z } = require('zod');
const { listWeather, latestWeather } = require('./weather.service');
const { ok, list } = require('../../../utils/response');
const { parsePagination } = require('../../../utils/pagination');
const { ApiError } = require('../../../lib/api-error');

const querySchema = z.object({
  buoyId: z.union([
    z.coerce.number().int().positive(),
    z.array(z.coerce.number().int().positive()),
  ]).optional().transform(v => v === undefined ? [] : Array.isArray(v) ? v : [v]),
  from: z.string().datetime({ offset: true }).optional(),
  to:   z.string().datetime({ offset: true }).optional(),
});

async function historyHandler(req, res, next) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid query parameters', parsed.error.flatten().fieldErrors));
  }
  const { buoyId: buoyIds, from, to } = parsed.data;
  const { limit, offset } = parsePagination(req.query);

  const { data, total } = await listWeather({ buoyIds, from, to, limit, offset });
  list(res, data, { total, limit, offset });
}

async function latestHandler(req, res, next) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid query parameters', parsed.error.flatten().fieldErrors));
  }
  const { buoyId: buoyIds } = parsed.data;
  const result = await latestWeather({ buoyIds });
  ok(res, result);
}

module.exports = { historyHandler, latestHandler };
