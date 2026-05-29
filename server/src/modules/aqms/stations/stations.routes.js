'use strict';

const { Router } = require('express');
const { validate } = require('../../../middleware/validate');
const asyncHandler = require('../../../utils/asyncHandler');
const { handleList } = require('./stations.controller');
const { listStationsSchema } = require('./stations.schemas');

const router = Router();

router.get('/', validate({ query: listStationsSchema }), asyncHandler(handleList));

module.exports = router;
