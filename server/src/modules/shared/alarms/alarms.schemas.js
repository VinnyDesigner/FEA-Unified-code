'use strict';

const { z } = require('zod');
const { paginationSchema } = require('../../../utils/pagination');

const listAlarmsSchema = paginationSchema.extend({
  module:    z.enum(['AQMS', 'MWQ']).optional(),
  severity:  z.string().optional(),
  status:    z.string().optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime:   z.string().datetime({ offset: true }).optional(),
});

module.exports = { listAlarmsSchema };
