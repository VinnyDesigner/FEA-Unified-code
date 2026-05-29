'use strict';

const { Router } = require('express');
const { validate } = require('../../../middleware/validate');
const asyncHandler = require('../../../utils/asyncHandler');
const { handleLatest, handleIndexLatest, handleIndexHistory, handleHistory } = require('./air-quality.controller');
const { latestSchema, historySchema, indexHistorySchema } = require('./air-quality.schemas');

const router = Router();

router.get('/latest',        validate({ query: latestSchema }),       asyncHandler(handleLatest));
router.get('/index/latest',  validate({ query: latestSchema }),       asyncHandler(handleIndexLatest));
router.get('/index/history', validate({ query: indexHistorySchema }), asyncHandler(handleIndexHistory));
router.get('/history',       validate({ query: historySchema }),      asyncHandler(handleHistory));

module.exports = router;
