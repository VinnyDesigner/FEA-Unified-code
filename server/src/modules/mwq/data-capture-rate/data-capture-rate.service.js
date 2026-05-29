'use strict';

const { prismaMwq: prisma } = require('../../../db/prisma');
const { Prisma } = require('../../../../node_modules/.prisma/client-mwq');

// Parameter name → FE field key (matches DataCaptureRateTable columns)
const PARAM_KEY_MAP = {
  'Specific Conductivity': 'conductivity',
  'Water Temperature':     'temp',
  'Salinity':              'salinity',
  'Chlorophyll':           'chlorophyll',
  'Oxygen Saturation':     'oxygenSat',
  'Dissolved Oxygen':      'dissolvedOxygen',
  'Turbidity':             'turbidity',
  'pH':                    'ph',
  'Depth':                 'depth',
  'Blue-Green Algae':      'algae',
  'Bluegreen Algae':       'algae',
};

async function listDataCaptureRate({ buoyIds, from, to, limit, offset }) {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate   = to   ? new Date(to)   : new Date();

  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND d."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  // Count distinct buoys for pagination
  const countRows = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT d."BuoyID")::int AS total
    FROM mwq_data_capture_rates d
    WHERE d."Date" >= ${fromDate}
      AND d."Date" <  ${toDate}
      ${buoyFilter}
  `;
  const total = Number(countRows[0]?.total ?? 0);

  // Aggregate per-buoy: sum expected/received/valid, avg capture rates
  const aggRows = await prisma.$queryRaw`
    SELECT
      d."BuoyID"                                              AS "BuoyID",
      b."BuoyName"                                            AS "BuoyName",
      MIN(d."Date")                                           AS "PeriodStart",
      MAX(d."Date")                                           AS "PeriodEnd",
      SUM(d."ExpectedRecords")::int                           AS "ExpectedRecords",
      SUM(d."ReceivedRecords")::int                           AS "ReceivedRecords",
      SUM(d."ValidRecords")::int                              AS "ValidRecords",
      ROUND(AVG(d."CaptureRatePercentage"), 2)                AS "CaptureRatePct",
      ROUND(AVG(d."ValidCaptureRatePercentage"), 2)           AS "ValidCaptureRatePct"
    FROM mwq_data_capture_rates d
    JOIN mwq_buoys b ON b."BuoyID" = d."BuoyID"
    WHERE d."Date" >= ${fromDate}
      AND d."Date" <  ${toDate}
      ${buoyFilter}
    GROUP BY d."BuoyID", b."BuoyName"
    ORDER BY d."BuoyID" ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // For each buoy, fetch latest sonde observation values for each parameter (context columns)
  const buoyIds2 = aggRows.map(r => Number(r.BuoyID));
  let latestObs = [];
  if (buoyIds2.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    latestObs = await prisma.$queryRaw`
      SELECT DISTINCT ON (o."BuoyID", p."ParameterID")
        o."BuoyID"          AS "BuoyID",
        p."ParameterName"   AS "ParameterName",
        o."Value"           AS "Value"
      FROM mwq_sonde_observations o
      JOIN mwq_parameter_masters p ON p."ParameterID" = o."ParameterID"
      WHERE o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds2.map(id => Prisma.sql`${id}::int`))}]`})
        AND o."ObservationTime" >= ${sevenDaysAgo}
      ORDER BY o."BuoyID" ASC, p."ParameterID" ASC, o."ObservationTime" DESC
    `;
  }

  // Build observation lookup: buoyId → { conductivity, temp, ... }
  const obsMap = new Map();
  for (const obs of latestObs) {
    const id = Number(obs.BuoyID);
    if (!obsMap.has(id)) obsMap.set(id, {});
    const feKey = PARAM_KEY_MAP[obs.ParameterName];
    if (feKey) obsMap.get(id)[feKey] = obs.Value !== null ? String(obs.Value) : null;
  }

  const data = aggRows.map(row => {
    const id = Number(row.BuoyID);
    const obs = obsMap.get(id) ?? {};
    return {
      buoyId:          id,
      // FE DataCaptureRateTable uses `station` key for the display name column
      station:         row.BuoyName,
      periodStart:     row.PeriodStart instanceof Date ? row.PeriodStart.toISOString().slice(0, 10) : String(row.PeriodStart),
      periodEnd:       row.PeriodEnd   instanceof Date ? row.PeriodEnd.toISOString().slice(0, 10)   : String(row.PeriodEnd),
      expectedRecords: Number(row.ExpectedRecords),
      receivedRecords: Number(row.ReceivedRecords),
      validRecords:    Number(row.ValidRecords),
      captureRatePct:  String(row.CaptureRatePct),
      validCaptureRatePct: String(row.ValidCaptureRatePct),
      // Latest observation values per parameter (context columns)
      conductivity:    obs.conductivity    ?? null,
      temp:            obs.temp            ?? null,
      salinity:        obs.salinity        ?? null,
      chlorophyll:     obs.chlorophyll     ?? null,
      oxygenSat:       obs.oxygenSat       ?? null,
      dissolvedOxygen: obs.dissolvedOxygen ?? null,
      turbidity:       obs.turbidity       ?? null,
      ph:              obs.ph              ?? null,
      depth:           obs.depth           ?? null,
      algae:           obs.algae           ?? null,
    };
  });

  return { data, total };
}

module.exports = { listDataCaptureRate };
