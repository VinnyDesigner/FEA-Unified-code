'use strict';

const { prismaAqms: prisma } = require('../../../db/prisma');

async function listStations({ operationalState, stationType, limit, offset }) {
  const where = {};
  if (operationalState) where.operationalState = operationalState;
  if (stationType) where.stationType = stationType;

  const [rows, total] = await Promise.all([
    prisma.aqmsMonitoringSite.findMany({
      where,
      select: {
        id: true,
        stationCode: true,
        stationName: true,
        description: true,
        stationType: true,
        latitude: true,
        longitude: true,
        areaType: true,
        operationalState: true,
        status: true,
      },
      orderBy: { stationName: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.aqmsMonitoringSite.count({ where }),
  ]);

  // Attach assignedParameters per station via aqms_site_parameters → parameter master.
  const stationIds = rows.map(r => r.id);
  if (stationIds.length > 0) {
    const assigned = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT
         sp."StationID"   AS "stationId",
         p."ParameterID"  AS id,
         p."ParameterName" AS name
       FROM aqms_site_parameters sp
       JOIN aqms_parameter_masters p ON p."ParameterID" = sp."ParameterID"
       WHERE sp."StationID" = ANY($1::int[])
       ORDER BY sp."StationID", p."ParameterID"`,
      stationIds
    );
    const byStation = new Map();
    for (const a of assigned) {
      const sid = Number(a.stationId);
      if (!byStation.has(sid)) byStation.set(sid, []);
      byStation.get(sid).push({ id: Number(a.id), name: a.name });
    }
    for (const row of rows) {
      row.assignedParameters = byStation.get(row.id) ?? [];
    }
  } else {
    for (const row of rows) row.assignedParameters = [];
  }

  return { rows, total };
}

module.exports = { listStations };
