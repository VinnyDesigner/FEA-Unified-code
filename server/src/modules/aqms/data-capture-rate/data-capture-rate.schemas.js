'use strict';

const { z } = require('zod');

const listSchema = z.object({
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  stationId: z.coerce.number().int().positive().optional(),
});

module.exports = { listSchema };
