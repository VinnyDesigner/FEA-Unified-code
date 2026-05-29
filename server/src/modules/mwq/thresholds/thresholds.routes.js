'use strict';
const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { prismaMwq: prisma } = require('../../../db/prisma');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const rows = await prisma.$queryRaw`
    SELECT
      t."ParameterID"   AS "parameterId",
      p."ParameterName" AS "parameterName",
      t."MinValue"      AS min,
      t."MaxValue"      AS max
    FROM mwq_parameter_thresholds t
    JOIN mwq_parameter_masters p ON p."ParameterID" = t."ParameterID"
    ORDER BY t."ParameterID" ASC
  `;
  res.json({
    data: rows.map(r => ({
      parameterId: Number(r.parameterId),
      parameterName: r.parameterName,
      min: r.min != null ? Number(r.min) : null,
      max: r.max != null ? Number(r.max) : null,
    })),
  });
}));

module.exports = router;
