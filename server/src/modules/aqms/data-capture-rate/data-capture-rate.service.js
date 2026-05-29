'use strict';

const { prismaAqms: prisma } = require('../../../db/prisma');

// Per-station-per-parameter capture rate derived from ambient observation counts.
// Expected = FLOOR(range_seconds / 3600) — hourly interval assumed (matches FE mockup 24/day).
// aqms_monitoring_sites has no interval column; 3600s is the standard reporting cadence.
async function listDataCaptureRate({ startDate, endDate, stationId }) {
  const conditions = [
    `o."DateTime" >= $1`,
    `o."DateTime" <= $2`,
  ];
  const values = [new Date(startDate), new Date(endDate)];
  let idx = 3;

  if (stationId != null) {
    conditions.push(`o."StationID" = $${idx++}`);
    values.push(stationId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT
      s."StationID"      AS "stationId",
      s."StationName"    AS "stationName",
      p."ParameterName"  AS parameter,
      COUNT(o."AmbientObservationID")::int AS "validRecords",
      GREATEST(
        1,
        FLOOR(EXTRACT(EPOCH FROM ($2::timestamptz - $1::timestamptz)) / 3600)
      )::int AS "totalExpected",
      ROUND(
        COUNT(o."AmbientObservationID") * 100.0
        / GREATEST(
            1,
            FLOOR(EXTRACT(EPOCH FROM ($2::timestamptz - $1::timestamptz)) / 3600)
          ),
        2
      ) AS "captureRatePct",
      $1::timestamptz AS "periodStart",
      $2::timestamptz AS "periodEnd"
    FROM aqms_ambient_air_quality_observations o
    JOIN aqms_monitoring_sites  s ON s."StationID"   = o."StationID"
    JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
    ${where}
    GROUP BY s."StationID", s."StationName", p."ParameterName"
    ORDER BY s."StationName", p."ParameterName"
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...values);
  return rows.map(r => ({
    stationId: r.stationId,
    stationName: r.stationName,
    parameter: r.parameter,
    captureRatePct: Number(r.captureRatePct),
    validRecords: Number(r.validRecords),
    totalExpected: Number(r.totalExpected),
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
  }));
}

module.exports = { listDataCaptureRate };
