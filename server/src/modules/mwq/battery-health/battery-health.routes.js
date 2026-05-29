'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { listHandler } = require('./battery-health.controller');

const router = Router();

router.get('/', asyncHandler(listHandler));

module.exports = router;
