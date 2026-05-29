'use strict';

const { prismaMwq: prisma } = require('../../../db/prisma');
const { Prisma } = require('../../../../node_modules/.prisma/client-mwq');

async function listBatteryHealth({ buoyIds, from, to }) {
  const fromDt = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDt   = to   ? new Date(to)   : new Date();

  const buoyFilter = buoyIds.length > 0
    ? Prisma.sql`AND o."BuoyID" = ANY(${Prisma.sql`ARRAY[${Prisma.join(buoyIds.map(id => Prisma.sql`${id}::int`))}]`})`
    : Prisma.empty;

  // Fetch all battery observations in range, partition-pruned by ObservationTime
  const rows = await prisma.$queryRaw`
    SELECT
      o."BuoyID"          AS "BuoyID",
      b."BuoyName"        AS "BuoyName",
      o."ObservationTime" AS "ObservationTime",
      o."Value"           AS "Value"
    FROM mwq_battery_observations o
    JOIN mwq_buoys b ON b."BuoyID" = o."BuoyID"
    WHERE o."ObservationTime" >= ${fromDt}
      AND o."ObservationTime" <  ${toDt}
      ${buoyFilter}
    ORDER BY o."BuoyID" ASC, o."ObservationTime" ASC
  `;

  // Group by buoy and build series + currentVoltage (latest reading)
  const buoyMap = new Map();
  for (const row of rows) {
    const id = Number(row.BuoyID);
    if (!buoyMap.has(id)) {
      buoyMap.set(id, { buoyId: id, buoyName: row.BuoyName, currentVoltage: null, series: [] });
    }
    const entry = buoyMap.get(id);
    entry.series.push({
      observationTime: row.ObservationTime instanceof Date
        ? row.ObservationTime.toISOString()
        : new Date(row.ObservationTime).toISOString(),
      volt: row.Value !== null ? Number(row.Value) : null,
    });
    // Last row in ascending order = most recent
    entry.currentVoltage = row.Value !== null ? Number(row.Value) : entry.currentVoltage;
  }

  return { data: Array.from(buoyMap.values()) };
}

module.exports = { listBatteryHealth };
