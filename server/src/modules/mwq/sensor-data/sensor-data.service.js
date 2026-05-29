'use strict';

const { prismaMwq: prisma } = require('../../../db/prisma');
const { Prisma } = require('../../../../node_modules/.prisma/client-mwq');

// Parameter name → FE field key mapping (matches SensorDataTable paramDefs)
const PARAM_KEY_MAP = {
  'Specific Conductivity': 'conductivity',
  'Conductivity':          'conductivity', // seed/DB parameter name
  'Water Temperature':     'temp',
  'Temperature':           'temp',         // seed/DB parameter name
  'Salinity':              'salinity',
  'Chlorophyll':           'chlorophyll',
  'Oxygen Saturation':     'oxygenSat',
  'Dissolved Oxygen':      'dissolvedOxygen',
  'Turbidity':             'turbidity',
  'pH':                    'ph',
  'Depth':                 'depth',
  'Blue-Green Algae':      'algae',
  'Bluegreen Algae':       'algae',
  'Algae':                 'algae',         // seed/DB parameter name
};

// Build a pivoted row: { buoyId, station, dateTime, conductivity, temp, ... }
function pivotRows(rawRows) {
  const buckets = new Map(); // key = `${buoyId}|${observationTime.toISOString()}`

  for (const row of rawRows) {
    const ts = row.ObservationTime instanceof Date
      ? row.ObservationTime.toISOString()
      : new Date(row.ObservationTime).toISOString();
    const key = `${row.BuoyID}|${ts}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        buoyId:   Number(row.BuoyID),
        station:  row.BuoyName,
        dateTime: ts,
      });
    }
    const feKey = PARAM_KEY_MAP[row.ParameterName];
    if (feKey) {
      buckets.get(key)[feKey] = row.Value !== null ? String(row.Value) : null;
    }
  }

  return Array.from(buckets.values());
}

async function listSensorData({ buoyIds, from, to, limit, offset }) {
  // Build WHERE clauses — always include time range for partition pruning
  const fromDt = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const toDt   = to   ? new Date(to)   : new Date();

  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  // Count for pagination
  const countRows = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT (o."BuoyID", o."ObservationTime"))::int AS total
    FROM mwq_sonde_observations o
    WHERE o."ObservationTime" >= ${fromDt}
      AND o."ObservationTime" <  ${toDt}
      ${buoyFilter}
  `;
  const total = Number(countRows[0]?.total ?? 0);

  // Fetch raw (buoyId, time, parameterName, value) rows with partition-pruned WHERE
  const rows = await prisma.$queryRaw`
    SELECT
      o."BuoyID"        AS "BuoyID",
      b."BuoyName"      AS "BuoyName",
      o."ObservationTime" AS "ObservationTime",
      p."ParameterName" AS "ParameterName",
      o."Value"         AS "Value"
    FROM mwq_sonde_observations o
    JOIN mwq_buoys            b ON b."BuoyID"      = o."BuoyID"
    JOIN mwq_parameter_masters p ON p."ParameterID" = o."ParameterID"
    WHERE o."ObservationTime" >= ${fromDt}
      AND o."ObservationTime" <  ${toDt}
      ${buoyFilter}
    ORDER BY o."BuoyID" ASC, o."ObservationTime" DESC
    LIMIT ${limit * 20}
    OFFSET ${offset * 20}
  `;

  const pivoted = pivotRows(rows);
  return { data: pivoted.slice(0, limit), total };
}

async function latestSensorData({ buoyIds }) {
  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  // Use a 7-day window as partition-pruned lookback for "latest"
  const fromDt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (o."BuoyID", p."ParameterID")
      o."BuoyID"          AS "BuoyID",
      b."BuoyName"        AS "BuoyName",
      o."ObservationTime" AS "ObservationTime",
      p."ParameterName"   AS "ParameterName",
      o."Value"           AS "Value"
    FROM mwq_sonde_observations o
    JOIN mwq_buoys             b ON b."BuoyID"       = o."BuoyID"
    JOIN mwq_parameter_masters p ON p."ParameterID"  = o."ParameterID"
    WHERE o."ObservationTime" >= ${fromDt}
      ${buoyFilter}
    ORDER BY o."BuoyID" ASC, p."ParameterID" ASC, o."ObservationTime" DESC
  `;

  return { data: pivotRows(rows) };
}

module.exports = { listSensorData, latestSensorData };
