'use strict';

const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { ok } = require('../../../utils/response');
const { getOverview } = require('./public.service');

const router = Router();

// PUBLIC (no auth): read-only AQMS overview for the pre-auth landing page.
router.get('/overview', asyncHandler(async (req, res) => {
  const data = await getOverview();
  ok(res, data);
}));

module.exports = router;
