'use strict';

const { prismaAqms: prisma } = require('../../../db/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;

// Public AQMS overview: latest AQI per station, station count, and a 24h trend
// for the headline (first) station. No auth — read-only aggregate only.
async function getOverview() {
  // Latest AQI per station (DISTINCT ON, mirrors getIndexLatest) over a window
  // padded forward to cover the seed anchor (now+7d).
  const fromDt = new Date(Date.now() - 7 * DAY_MS);
  const toDt = new Date(Date.now() + 8 * DAY_MS);

  const latest = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT ON (a."StationID")
       s."StationCode" AS "stationCode",
       s."StationName" AS name,
       a."AvgValue"    AS aqi,
       m."Category"    AS category,
       m."Color"       AS color,
       a."StationID"   AS "stationId",
       a."DateTime"    AS "observationTime"
     FROM aqms_air_quality_index_hourly_stats a
     JOIN aqms_monitoring_sites s ON s."StationID" = a."StationID"
     JOIN aqms_aq_index_masters m ON m."IndexID"   = a."IndexID"
     WHERE a."DateTime" >= $1 AND a."DateTime" <= $2
     ORDER BY a."StationID", a."DateTime" DESC`,
    fromDt, toDt
  );

  const latestAqiByStation = latest.map(r => ({
    stationCode: r.stationCode,
    name: r.name,
    aqi: r.aqi != null ? Number(r.aqi) : null,
    category: r.category,
    color: r.color,
  }));

  const countRows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS c FROM aqms_monitoring_sites`
  );
  const stationCount = Number(countRows[0]?.c ?? 0);

  // Trend = last 24h AQI for the headline (first) station.
  let trend = [];
  if (latest.length > 0) {
    const headlineId = Number(latest[0].stationId);
    const headlineTime = new Date(latest[0].observationTime);
    const trendFrom = new Date(headlineTime.getTime() - DAY_MS);
    const trendRows = await prisma.$queryRawUnsafe(
      `SELECT a."DateTime" AS "observationTime", a."AvgValue" AS aqi
         FROM aqms_air_quality_index_hourly_stats a
        WHERE a."StationID" = $1 AND a."DateTime" >= $2 AND a."DateTime" <= $3
        ORDER BY a."DateTime" ASC`,
      headlineId, trendFrom, headlineTime
    );
    trend = trendRows.map(r => ({
      observationTime: r.observationTime,
      aqi: r.aqi != null ? Number(r.aqi) : null,
    }));
  }

  return { latestAqiByStation, stationCount, trend };
}

module.exports = { getOverview };
