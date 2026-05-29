'use strict';

const { Router } = require('express');
const { validate } = require('../../../middleware/validate');
const asyncHandler = require('../../../utils/asyncHandler');
const { handleLatest, handleHistory } = require('./weather.controller');
const { latestSchema, historySchema } = require('./weather.schemas');

const router = Router();

router.get('/latest',  validate({ query: latestSchema }),  asyncHandler(handleLatest));
router.get('/history', validate({ query: historySchema }), asyncHandler(handleHistory));

module.exports = router;
