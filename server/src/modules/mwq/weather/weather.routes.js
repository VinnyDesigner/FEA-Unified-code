'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { historyHandler, latestHandler } = require('./weather.controller');

const router = Router();

router.get('/latest',  asyncHandler(latestHandler));
router.get('/history', asyncHandler(historyHandler));

module.exports = router;
