'use strict';
const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { validate } = require('../../../middleware/validate');
const { requirePermission } = require('../../../middleware/requirePermission');
const { generateBodySchema, idParamSchema, downloadQuerySchema } = require('./reports.schemas');
const { generateHandler, getHandler, downloadHandler } = require('./reports.controller');

const router = Router();

router.post('/generate',         requirePermission('reports:generate'), validate({ body: generateBodySchema }),  asyncHandler(generateHandler));
router.get('/:id',               validate({ params: idParamSchema }),                             asyncHandler(getHandler));
router.get('/:id/download',      requirePermission('reports:download'), validate({ params: idParamSchema, query: downloadQuerySchema }), asyncHandler(downloadHandler));

module.exports = router;
