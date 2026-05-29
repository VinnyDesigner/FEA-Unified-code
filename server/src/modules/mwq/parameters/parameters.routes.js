'use strict';
const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { prismaMwq: prisma } = require('../../../db/prisma');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const params = await prisma.$queryRaw`
    SELECT "ParameterID" AS id, "ParameterName" AS name
    FROM mwq_parameter_masters
    ORDER BY "ParameterID" ASC
  `;
  res.json({ data: params.map(p => ({ id: Number(p.id), name: p.name })) });
}));

module.exports = router;
