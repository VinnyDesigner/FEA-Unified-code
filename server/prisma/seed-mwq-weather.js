'use strict';
// Seed the missing MWQ weather parameters (Air Temperature, Relative Humidity,
// Wind Gust, Atmospheric Pressure). The base seed only created Wind Speed /
// Wind Direction, so the Dashboard Weather tab had no data for the rest.
//
// IMPORTANT: we insert the new params at the SAME ObservationTime values as the
// existing Wind Speed rows for each buoy. The weather history endpoint pivots by
// (buoyId, timestamp) and slices the most-recent N rows; wind is seeded into the
// future (now+~7d), so params seeded on a different time grid would be sliced out
// of the recent window. Co-locating timestamps merges all 6 params into the same
// pivot rows, so every history row carries the full weather set.
//
// Idempotent: delete-all-then-insert per buoy/param (re-runnable; delete = rollback).
require('dotenv').config();
const { PrismaClient } = require('../node_modules/.prisma/client-mwq');
const prisma = new PrismaClient();

function wave(min, max, i, period = 48) {
  const base = (min + max) / 2;
  const amp = ((max - min) / 2) * 0.7;
  return Number((base + amp * Math.sin((2 * Math.PI * i) / period) + (Math.random() - 0.5) * amp * 0.3).toFixed(4));
}

async function ensureUnit(unitName, unit) {
  const found = await prisma.mwqParameterUnit.findFirst({ where: { unit } });
  if (found) return found.id;
  return (await prisma.mwqParameterUnit.create({ data: { unitName, unit } })).id;
}
async function ensureParam(parameterName, unitId) {
  const found = await prisma.mwqParameterMaster.findFirst({ where: { parameterName, sensorType: 'Weather' } });
  if (found) return found.id;
  return (await prisma.mwqParameterMaster.create({ data: { sensorType: 'Weather', parameterName, unitId } })).id;
}

async function main() {
  const degC = await ensureUnit('Degrees Celsius', 'degC');
  const pct = await ensureUnit('Percent', '%');
  const ms = await ensureUnit('Metres Per Second', 'm/s');
  const mbar = await ensureUnit('Millibars', 'mbar');

  const defs = [
    { name: 'Air Temperature', unitId: degC, range: [22, 38] },
    { name: 'Relative Humidity', unitId: pct, range: [40, 85] },
    { name: 'Wind Gust', unitId: ms, range: [2, 22] },
    { name: 'Atmospheric Pressure', unitId: mbar, range: [1000, 1015] },
  ];
  for (const d of defs) d.id = await ensureParam(d.name, d.unitId);

  const windSpeed = await prisma.mwqParameterMaster.findFirst({ where: { parameterName: 'Wind Speed', sensorType: 'Weather' } });
  if (!windSpeed) throw new Error('Wind Speed param not found — run the base seed first');

  const buoys = await prisma.mwqBuoy.findMany({ select: { id: true, buoyName: true } });
  const summary = [];
  for (const b of buoys) {
    // Use the existing Wind Speed observation grid (timestamps + sensor linkage).
    const windRows = await prisma.mwqWeatherObservation.findMany({
      where: { buoyId: b.id, parameterId: windSpeed.id },
      select: { observationTime: true, buoySensorId: true, sensorId: true },
      orderBy: { observationTime: 'asc' },
    });
    if (windRows.length === 0) { summary.push(`buoy ${b.id} (${b.buoyName}): no wind grid — skipped`); continue; }
    const { buoySensorId, sensorId } = windRows[0];

    let inserted = 0;
    for (const d of defs) {
      await prisma.mwqWeatherObservation.deleteMany({ where: { buoyId: b.id, parameterId: d.id } });
      const data = windRows.map((w, i) => ({
        buoySensorId, sensorId, buoyId: b.id, parameterId: d.id,
        observationTime: w.observationTime,
        value: wave(d.range[0], d.range[1], i),
      }));
      // chunked insert to stay well within parameter limits
      for (let k = 0; k < data.length; k += 1000) {
        await prisma.mwqWeatherObservation.createMany({ data: data.slice(k, k + 1000) });
      }
      inserted += data.length;
    }
    summary.push(`buoy ${b.id} (${b.buoyName}): +${inserted} rows across ${defs.length} params, aligned to ${windRows.length} wind timestamps`);
  }

  console.log('[seed-mwq-weather] params:', defs.map((d) => `${d.name}#${d.id}`).join(', '));
  summary.forEach((s) => console.log('  ' + s));
  console.log('[seed-mwq-weather] done');
}

main()
  .catch((e) => { console.error('[seed-mwq-weather] FAILED:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
