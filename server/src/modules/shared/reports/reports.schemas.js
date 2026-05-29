'use strict';
const { z } = require('zod');
const { REPORT_TYPE_KEYS, DEFAULT_TYPE } = require('./report-types');

const moduleEnum = z.enum(['AQMS', 'MWQ']);
const formatEnum = z.enum(['XLSX', 'DOCX', 'PDF']);
const reportTypeEnum = z.enum(REPORT_TYPE_KEYS);

const generateBodySchema = z.object({
  module: moduleEnum,
  reportType: reportTypeEnum.default(DEFAULT_TYPE),
  parameterIds: z.array(z.coerce.number().int().positive()).min(1).max(50),
  stationIds: z.array(z.coerce.number().int().positive()).min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  formats: z.array(formatEnum).min(1).max(3),
}).refine(d => d.endDate >= d.startDate, { message: 'endDate must be >= startDate' });

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const downloadQuerySchema = z.object({ format: formatEnum });

module.exports = { generateBodySchema, idParamSchema, downloadQuerySchema };
