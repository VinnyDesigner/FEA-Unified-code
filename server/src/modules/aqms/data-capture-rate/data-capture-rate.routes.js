'use strict';

const { Router } = require('express');
const { validate } = require('../../../middleware/validate');
const asyncHandler = require('../../../utils/asyncHandler');
const { handleList } = require('./data-capture-rate.controller');
const { listSchema } = require('./data-capture-rate.schemas');

const router = Router();

router.get('/', validate({ query: listSchema }), asyncHandler(handleList));

module.exports = router;
