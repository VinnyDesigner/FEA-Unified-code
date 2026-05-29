'use strict';

const { z } = require('zod');

const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

function parsePagination(query) {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    return { limit: 100, offset: 0 };
  }
  return result.data;
}

module.exports = { parsePagination, paginationSchema };
