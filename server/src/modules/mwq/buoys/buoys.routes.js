'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { list } = require('./buoys.controller');

const router = Router();

router.get('/', asyncHandler(list));

module.exports = router;
