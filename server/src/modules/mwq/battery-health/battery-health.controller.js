'use strict';

const { z } = require('zod');
const { listBatteryHealth } = require('./battery-health.service');
const { ok } = require('../../../utils/response');
const { ApiError } = require('../../../lib/api-error');

const querySchema = z.object({
  buoyId: z.union([
    z.coerce.number().int().positive(),
    z.array(z.coerce.number().int().positive()),
  ]).optional().transform(v => v === undefined ? [] : Array.isArray(v) ? v : [v]),
  from: z.string().datetime({ offset: true }).optional(),
  to:   z.string().datetime({ offset: true }).optional(),
});

async function listHandler(req, res, next) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ApiError(400, 'VALIDATION_FAILED', 'Invalid query parameters', parsed.error.flatten().fieldErrors));
  }
  const { buoyId: buoyIds, from, to } = parsed.data;
  const result = await listBatteryHealth({ buoyIds, from, to });
  ok(res, result);
}

module.exports = { listHandler };
