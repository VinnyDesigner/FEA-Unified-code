'use strict';

const { z } = require('zod');
const { paginationSchema } = require('../../../utils/pagination');

const latestSchema = z.object({
  stationId: z.coerce.number().int().positive().optional(),
  parameterId: z.coerce.number().int().positive().optional(),
});

const MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

const historySchema = paginationSchema.extend({
  stationId: z.coerce.number().int().positive(),
  parameterId: z.coerce.number().int().positive().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
}).superRefine((val, ctx) => {
  const diff = new Date(val.endTime) - new Date(val.startTime);
  if (diff <= 0) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'endTime must be after startTime' });
  }
  if (diff > MAX_RANGE_MS) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Time range cannot exceed 90 days' });
  }
});

module.exports = { latestSchema, historySchema };
