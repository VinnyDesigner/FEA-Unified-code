'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { listHandler } = require('./data-capture-rate.controller');

const router = Router();

router.get('/', asyncHandler(listHandler));

module.exports = router;
