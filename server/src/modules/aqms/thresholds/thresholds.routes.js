'use strict';
const { Router } = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { prismaAqms: prisma } = require('../../../db/prisma');

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const rows = await prisma.$queryRaw`
    SELECT
      t."ParameterID"   AS "parameterId",
      p."ParameterName" AS "parameterName",
      t."MinValue"      AS min,
      t."MaxValue"      AS max,
      t."StandardType"  AS "standardType"
    FROM aqms_aq_parameters_thresholds t
    JOIN aqms_parameter_masters p ON p."ParameterID" = t."ParameterID"
    ORDER BY t."ParameterID" ASC
  `;
  res.json({
    data: rows.map(r => ({
      parameterId: Number(r.parameterId),
      parameterName: r.parameterName,
      min: r.min != null ? Number(r.min) : null,
      max: r.max != null ? Number(r.max) : null,
      standardType: r.standardType ?? null,
    })),
  });
}));

module.exports = router;
