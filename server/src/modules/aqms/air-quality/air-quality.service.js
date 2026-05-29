'use strict';

const { prismaAqms: prisma } = require('../../../db/prisma');

async function getLatest({ stationId, parameterId }) {
  const sql = `
    SELECT
      o."AmbientObservationID" AS id,
      o."StationID"            AS "stationId",
      s."StationName"          AS "stationName",
      o."ParameterID"          AS "parameterId",
      p."ParameterName"        AS "parameterName",
      o."DateTime"             AS "observationTime",
      o."Value"                AS value,
      u."UnitName"             AS unit
    FROM aqms_monitoring_sites s
    CROSS JOIN aqms_parameter_masters p
    JOIN LATERAL (
      SELECT * FROM aqms_ambient_air_quality_observations o2
      WHERE o2."StationID" = s."StationID" AND o2."ParameterID" = p."ParameterID"
      ORDER BY o2."DateTime" DESC
      LIMIT 1
    ) o ON true
    JOIN aqms_measurement_units u ON u."UnitID" = o."UnitID"
    WHERE ($1::int IS NULL OR s."StationID" = $1)
      AND ($2::int IS NULL OR p."ParameterID" = $2)
  `;

  return prisma.$queryRawUnsafe(sql, stationId ?? null, parameterId ?? null);
}

async function getIndexLatest({ stationId }) {
  const sql = `
    SELECT DISTINCT ON (a."StationID")
      a."StationID"   AS "stationId",
      s."StationName"  AS "stationName",
      a."AvgValue"     AS aqi,
      a."DateTime"     AS "observationTime",
      m."Category"     AS category,
      m."Color"        AS color
    FROM aqms_air_quality_index_hourly_stats a
    JOIN aqms_monitoring_sites s ON s."StationID" = a."StationID"
    JOIN aqms_aq_index_masters m ON m."IndexID"   = a."IndexID"
    WHERE ($1::int IS NULL OR a."StationID" = $1)
    ORDER BY a."StationID", a."DateTime" DESC
  `;

  return prisma.$queryRawUnsafe(sql, stationId ?? null);
}

async function getIndexHistory({ stationId, startTime, endTime, limit, offset }) {
  const conditions = [
    `a."DateTime" >= $1`,
    `a."DateTime" <= $2`,
  ];
  const values = [new Date(startTime), new Date(endTime)];
  let idx = 3;

  if (stationId != null) {
    conditions.push(`a."StationID" = $${idx++}`);
    values.push(stationId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT
      a."StationID"   AS "stationId",
      s."StationName"  AS "stationName",
      a."AvgValue"     AS aqi,
      m."Category"     AS category,
      m."Color"        AS color,
      a."DateTime"     AS "observationTime"
    FROM aqms_air_quality_index_hourly_stats a
    JOIN aqms_monitoring_sites s ON s."StationID" = a."StationID"
    JOIN aqms_aq_index_masters m ON m."IndexID"   = a."IndexID"
    ${where}
    ORDER BY a."DateTime" DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(limit, offset);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM aqms_air_quality_index_hourly_stats a
    ${where}
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(sql, ...values),
    prisma.$queryRawUnsafe(countSql, ...values.slice(0, idx - 3)),
  ]);

  const data = rows.map(r => ({
    stationId: Number(r.stationId),
    stationName: r.stationName,
    aqi: r.aqi != null ? Number(r.aqi) : null,
    category: r.category,
    color: r.color,
    observationTime: r.observationTime,
  }));

  return { rows: data, total: Number(countResult[0].total) };
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
      o."AmbientObservationID" AS id,
      o."StationID"            AS "stationId",
      s."StationName"          AS "stationName",
      o."ParameterID"          AS "parameterId",
      p."ParameterName"        AS "parameterName",
      o."DateTime"             AS "observationTime",
      o."Value"                AS value,
      u."UnitName"             AS unit
    FROM aqms_ambient_air_quality_observations o
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
    FROM aqms_ambient_air_quality_observations o
    ${where}
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(sql, ...values),
    prisma.$queryRawUnsafe(countSql, ...values.slice(0, idx - 3)),
  ]);

  return { rows, total: Number(countResult[0].total) };
}

module.exports = { getLatest, getIndexLatest, getIndexHistory, getHistory };
