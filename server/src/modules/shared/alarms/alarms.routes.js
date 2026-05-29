'use strict';

const { Router } = require('express');
const { validate } = require('../../../middleware/validate');
const asyncHandler = require('../../../utils/asyncHandler');
const { handleList } = require('./alarms.controller');
const { listAlarmsSchema } = require('./alarms.schemas');

const router = Router();

router.get('/', validate({ query: listAlarmsSchema }), asyncHandler(handleList));

module.exports = router;
