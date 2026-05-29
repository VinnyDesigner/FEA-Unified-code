'use strict';

const { prismaMwq: prisma } = require('../../../db/prisma');
const { Prisma } = require('../../../../node_modules/.prisma/client-mwq');

// Parameter name → FE field key mapping.
const PARAM_KEY_MAP = {
  'Wind Speed':           'windSpeed',
  'Wind Direction':       'windDirection',
  'Air Temperature':      'airTemp',
  'Relative Humidity':    'humidity',
  'Wind Gust':            'windGust',
  'Atmospheric Pressure': 'pressure',
};

// Build a pivoted row: { buoyId, station, dateTime, windSpeed, windDirection }
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

async function listWeather({ buoyIds, from, to, limit, offset }) {
  const fromDt = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const toDt   = to   ? new Date(to)   : new Date();

  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  const countRows = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT (o."BuoyID", o."ObservationTime"))::int AS total
    FROM mwq_weather_observations o
    WHERE o."ObservationTime" >= ${fromDt}
      AND o."ObservationTime" <  ${toDt}
      ${buoyFilter}
  `;
  const total = Number(countRows[0]?.total ?? 0);

  const rows = await prisma.$queryRaw`
    SELECT
      o."BuoyID"          AS "BuoyID",
      b."BuoyName"        AS "BuoyName",
      o."ObservationTime" AS "ObservationTime",
      p."ParameterName"   AS "ParameterName",
      o."Value"           AS "Value"
    FROM mwq_weather_observations o
    JOIN mwq_buoys             b ON b."BuoyID"       = o."BuoyID"
    JOIN mwq_parameter_masters p ON p."ParameterID"  = o."ParameterID"
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

async function latestWeather({ buoyIds }) {
  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  // 7-day window as partition-pruned lookback for "latest".
  const fromDt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (o."BuoyID", p."ParameterID")
      o."BuoyID"          AS "BuoyID",
      b."BuoyName"        AS "BuoyName",
      o."ObservationTime" AS "ObservationTime",
      p."ParameterName"   AS "ParameterName",
      o."Value"           AS "Value"
    FROM mwq_weather_observations o
    JOIN mwq_buoys             b ON b."BuoyID"       = o."BuoyID"
    JOIN mwq_parameter_masters p ON p."ParameterID"  = o."ParameterID"
    WHERE o."ObservationTime" >= ${fromDt}
      ${buoyFilter}
    ORDER BY o."BuoyID" ASC, p."ParameterID" ASC, o."ObservationTime" DESC
  `;

  // Merge by BUOY (not by timestamp): each parameter's latest reading may carry a
  // different ObservationTime (wind is seeded on a different cadence than the other
  // weather params), so a timestamp-keyed pivot would split them across rows.
  const byBuoy = new Map();
  for (const row of rows) {
    const id = Number(row.BuoyID);
    if (!byBuoy.has(id)) byBuoy.set(id, { buoyId: id, station: row.BuoyName, dateTime: null });
    const o = byBuoy.get(id);
    const ts = row.ObservationTime instanceof Date ? row.ObservationTime.toISOString() : new Date(row.ObservationTime).toISOString();
    if (!o.dateTime || ts > o.dateTime) o.dateTime = ts; // most recent across params
    const feKey = PARAM_KEY_MAP[row.ParameterName];
    if (feKey) o[feKey] = row.Value !== null ? String(row.Value) : null;
  }
  return { data: Array.from(byBuoy.values()) };
}

module.exports = { listWeather, latestWeather };
