'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { listHandler, latestHandler } = require('./sensor-data.controller');

const router = Router();

router.get('/latest', asyncHandler(latestHandler));
router.get('/',       asyncHandler(listHandler));

module.exports = router;
