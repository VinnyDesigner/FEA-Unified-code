'use strict';

const { prismaAqms: prisma } = require('../../../db/prisma');

async function getLatest({ stationId, parameterId }) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (stationId != null) {
    conditions.push(`o."StationID" = $${idx++}`);
    values.push(stationId);
  }
  if (parameterId != null) {
    conditions.push(`o."ParameterID" = $${idx++}`);
    values.push(parameterId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT DISTINCT ON (o."StationID", o."ParameterID")
      o."MetObservationID"  AS id,
      o."StationID"         AS "stationId",
      s."StationName"       AS "stationName",
      o."ParameterID"       AS "parameterId",
      p."ParameterName"     AS "parameterName",
      o."DateTime"          AS "observationTime",
      o."Value"             AS value,
      u."UnitName"          AS unit
    FROM aqms_meteorological_observations o
    JOIN aqms_monitoring_sites    s ON s."StationID"    = o."StationID"
    JOIN aqms_parameter_masters   p ON p."ParameterID"  = o."ParameterID"
    JOIN aqms_measurement_units   u ON u."UnitID"       = o."UnitID"
    ${where}
    ORDER BY o."StationID", o."ParameterID", o."DateTime" DESC
  `;

  return prisma.$queryRawUnsafe(sql, ...values);
}

async function getHistory({ stationId, parameterId, startTime, endTime, limit, offset }) {
  const conditions = [
    `o."StationID" = $1`,
    `o."DateTime" >= $2`,
    `o."DateTime" <= $3`,
  ];
  const values = [stationId, new Date(startTime), new Date(endTime)];
  let idx = 4;

  if (parameterId != null) {
    conditions.push(`o."ParameterID" = $${idx++}`);
    values.push(parameterId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT
      o."MetObservationID"  AS id,
      o."StationID"         AS "stationId",
      s."StationName"       AS "stationName",
      o."ParameterID"       AS "parameterId",
      p."ParameterName"     AS "parameterName",
      o."DateTime"          AS "observationTime",
      o."Value"             AS value,
      u."UnitName"          AS unit
    FROM aqms_meteorological_observations o
    JOIN aqms_monitoring_sites    s ON s."StationID"    = o."StationID"
    JOIN aqms_parameter_masters   p ON p."ParameterID"  = o."ParameterID"
    JOIN aqms_measurement_units   u ON u."UnitID"       = o."UnitID"
    ${where}
    ORDER BY o."DateTime" DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(limit, offset);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM aqms_meteorological_observations o
    ${where}
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(sql, ...values),
    prisma.$queryRawUnsafe(countSql, ...values.slice(0, idx - 3)),
  ]);

  return { rows, total: Number(countResult[0].total) };
}

module.exports = { getLatest, getHistory };
