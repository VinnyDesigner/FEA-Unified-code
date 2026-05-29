'use strict';
const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { prismaAqms: prisma } = require('../../../db/prisma');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const params = await prisma.$queryRaw`
    SELECT
      p."ParameterID"        AS id,
      p."ParameterName"      AS name,
      p."ParameterTypeCode"  AS type,
      u."UnitName"           AS unit
    FROM aqms_parameter_masters p
    LEFT JOIN aqms_measurement_units u ON u."UnitID" = p."UnitID"
    ORDER BY p."ParameterID" ASC
  `;
  res.json({
    data: params.map(p => ({
      id: Number(p.id),
      name: p.name,
      type: p.type,
      unit: p.unit ?? null,
    })),
  });
}));

module.exports = router;
