'use strict';

const { z } = require('zod');
const { paginationSchema } = require('../../../utils/pagination');

const listStationsSchema = paginationSchema.extend({
  operationalState: z.string().optional(),
  stationType: z.string().optional(),
});

module.exports = { listStationsSchema };
