'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 0 — 7-day back-date + coverage top-up (idempotent + self-rollback)
//
//   node prisma/backfill-7day.js
//
// Primary job: the main seed places the AQMS AQI-hourly series at now+6d..now+7d
// (the seed anchor is now+7d), so past-window history queries return empty. This
// script DELETEs the AQI-hourly rows in [now-7d, now] for every station and
// re-INSERTs one row/hour for the past 7 days (168 rows/station). The
// DELETE-then-INSERT is both idempotent (rerun-safe) and its own rollback: to
// revert, run the DELETE step alone (see rollbackAqiBackfill below).
//
// Secondary job: verify each required series has >=1 row/day across the last 7
// days ending >= now for all 4 AQMS stations + 4 MWQ buoys, and top-up ONLY the
// missing days (same delete-then-insert-by-DateTime-range approach). Also ensure
// the threshold tables have rows; seed sensible defaults if empty.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const { PrismaClient: PrismaClientMwq } = require('../node_modules/.prisma/client-mwq');
const { PrismaClient: PrismaClientAqms } = require('../node_modules/.prisma/client-aqms');

const prismaMwq = new PrismaClientMwq();
const prismaAqms = new PrismaClientAqms();

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function log(msg) { console.log(`[backfill] ${msg}`); }

function randomBetween(min, max) { return min + Math.random() * (max - min); }

// Smooth-ish wave so AQI values look realistic across the window.
function waveValue(i, min, max, period = 48) {
  const base = (min + max) / 2;
  const amp = (max - min) / 2 * 0.7;
  return base + amp * Math.sin((2 * Math.PI * i) / period) + randomBetween(-amp * 0.15, amp * 0.15);
}

// ─── Window: [now-7d, now]; AQI re-insert spans the full past 7 days ──────────
const nowMs = Date.now();
const windowStart = new Date(nowMs - 7 * DAY_MS);
const windowEnd = new Date(nowMs);

// =============================================================================
// AQMS AQI-hourly back-date (DELETE target window → INSERT 168 rows/station)
// =============================================================================
async function backfillAqiHourly() {
  const sites = await prismaAqms.$queryRawUnsafe(
    `SELECT "StationID" AS id, "StationName" AS name FROM aqms_monitoring_sites ORDER BY "StationID" ASC`
  );
  const indexMasters = await prismaAqms.$queryRawUnsafe(
    `SELECT "IndexID" AS id, "IndexMin" AS "indexMin", "IndexMax" AS "indexMax" FROM aqms_aq_index_masters ORDER BY "IndexMin" ASC`
  );
  if (indexMasters.length === 0) {
    throw new Error('aqms_aq_index_masters is empty — run the main seed first');
  }
  // DominantPollutantID is NOT NULL → resolve PM2.5 (fallback to first parameter).
  const pmRows = await prismaAqms.$queryRawUnsafe(
    `SELECT "ParameterID" AS id FROM aqms_parameter_masters WHERE "ParameterName" = 'PM2.5' LIMIT 1`
  );
  const anyParam = await prismaAqms.$queryRawUnsafe(
    `SELECT "ParameterID" AS id FROM aqms_parameter_masters ORDER BY "ParameterID" ASC LIMIT 1`
  );
  const dominantPollutantId = Number((pmRows[0] ?? anyParam[0]).id);

  function indexIdFor(avg) {
    const rec = indexMasters.find(m => avg >= Number(m.indexMin) && avg <= Number(m.indexMax)) ?? indexMasters[indexMasters.length - 1];
    return Number(rec.id);
  }

  let totalInserted = 0;
  for (const site of sites) {
    const stationId = Number(site.id);
    // DELETE target window (idempotent + rollback step).
    await prismaAqms.$executeRawUnsafe(
      `DELETE FROM aqms_air_quality_index_hourly_stats WHERE "StationID" = $1 AND "DateTime" >= $2 AND "DateTime" <= $3`,
      stationId, windowStart, windowEnd
    );

    // INSERT 1 row/hour for the past 7 days (168 rows). DateTime descends from now.
    const rows = [];
    for (let h = 0; h < 7 * 24; h++) {
      const dt = new Date(nowMs - h * HOUR_MS);
      const avg = Math.round(waveValue(h, 20, 180));
      const max = avg + Math.round(randomBetween(5, 20));
      const min = Math.max(0, avg - Math.round(randomBetween(5, 20)));
      rows.push({ stationId, dt, avg, max, min, indexId: indexIdFor(avg) });
    }

    // Bulk insert via a single multi-VALUES statement (autoincrement PK).
    const params = [];
    const tuples = rows.map((r, i) => {
      const base = i * 7;
      params.push(r.stationId, r.dt, r.avg, r.max, r.min, dominantPollutantId, r.indexId);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    });
    const sql = `
      INSERT INTO aqms_air_quality_index_hourly_stats
        ("StationID", "DateTime", "AvgValue", "MaxValue", "MinValue", "DominantPollutantID", "IndexID")
      VALUES ${tuples.join(', ')}
    `;
    await prismaAqms.$executeRawUnsafe(sql, ...params);
    totalInserted += rows.length;
    log(`  AQI back-date station ${stationId} (${site.name}): inserted ${rows.length} rows`);
  }
  log(`AQMS AQI-hourly back-date complete: ${totalInserted} rows across ${sites.length} stations`);
}

// Rollback helper (not invoked by default). Run manually to revert the back-date.
async function rollbackAqiBackfill() {
  const n = await prismaAqms.$executeRawUnsafe(
    `DELETE FROM aqms_air_quality_index_hourly_stats WHERE "DateTime" >= $1 AND "DateTime" <= $2`,
    windowStart, windowEnd
  );
  log(`Rollback: deleted ${n} AQI-hourly rows in [now-7d, now]`);
}

// =============================================================================
// Generic per-day coverage check + top-up (delete-the-day → insert-the-day)
// =============================================================================
// Returns the set of day-offsets (0..6, where 0 = today) that have >=1 row.
async function daysCovered(prisma, table, idCol, idVal, timeCol, extraWhere) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT date_trunc('day', ${timeCol}) AS d
       FROM ${table}
      WHERE ${idCol} = $1 AND ${timeCol} >= $2 AND ${timeCol} <= $3 ${extraWhere ? 'AND ' + extraWhere : ''}`,
    idVal, windowStart, windowEnd
  );
  const set = new Set();
  for (const r of rows) {
    const offset = Math.floor((nowMs - new Date(r.d).getTime()) / DAY_MS);
    if (offset >= 0 && offset <= 7) set.add(offset);
  }
  return set;
}

// Insert one row at noon for each missing day-offset. The caller supplies the
// row-builder. The delete-then-insert is scoped to the missing day only.
async function topUpDays({ prisma, table, idCol, idVal, timeCol, missingOffsets, buildRow, columns, extraWhere }) {
  let inserted = 0;
  for (const offset of missingOffsets) {
    const dayStart = new Date(nowMs - offset * DAY_MS);
    dayStart.setHours(12, 0, 0, 0);
    // Delete any partial rows for this id+day (scoped rollback), then insert one.
    await prisma.$executeRawUnsafe(
      `DELETE FROM ${table} WHERE ${idCol} = $1 AND date_trunc('day', ${timeCol}) = date_trunc('day', $2::timestamptz) ${extraWhere ? 'AND ' + extraWhere : ''}`,
      idVal, dayStart
    );
    const row = buildRow(dayStart, offset);
    const cols = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    // Coerce numeric-string values (e.g. from .toFixed()) to JS numbers so raw
    // inserts bind to numeric columns instead of failing with a text-type error.
    const values = columns.map(c => {
      const v = row[c];
      return (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) ? Number(v) : v;
    });
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
      ...values
    );
    inserted++;
  }
  return inserted;
}

// =============================================================================
// Coverage verification + top-up for the 5 required series
// =============================================================================
async function verifyAndTopUp() {
  const summary = [];

  // ── AQMS stations + relevant param/unit ids ──
  const aqmsSites = await prismaAqms.$queryRawUnsafe(
    `SELECT "StationID" AS id, "StationName" AS name FROM aqms_monitoring_sites ORDER BY "StationID" ASC`
  );

  // Resolve one ambient param (PM2.5) and one met param (Temperature) + their units.
  async function aqmsParam(name) {
    const r = await prismaAqms.$queryRawUnsafe(
      `SELECT p."ParameterID" AS id, p."UnitID" AS "unitId" FROM aqms_parameter_masters p WHERE p."ParameterName" = $1 LIMIT 1`,
      name
    );
    return r[0] ? { id: Number(r[0].id), unitId: Number(r[0].unitId) } : null;
  }
  const pm25 = await aqmsParam('PM2.5');
  const temp = await aqmsParam('Temperature');

  // AQMS ambient coverage
  for (const site of aqmsSites) {
    const stationId = Number(site.id);
    const covered = await daysCovered(
      prismaAqms, 'aqms_ambient_air_quality_observations',
      '"StationID"', stationId, '"DateTime"',
      pm25 ? `"ParameterID" = ${pm25.id}` : null
    );
    const missing = [];
    for (let d = 0; d <= 7; d++) if (!covered.has(d)) missing.push(d);
    let added = 0;
    if (missing.length && pm25) {
      added = await topUpDays({
        prisma: prismaAqms, table: 'aqms_ambient_air_quality_observations',
        idCol: '"StationID"', idVal: stationId, timeCol: '"DateTime"',
        missingOffsets: missing, columns: ['StationID', 'ParameterID', 'DateTime', 'Value', 'UnitID'],
        extraWhere: `"ParameterID" = ${pm25.id}`,
        buildRow: (dt) => ({ StationID: stationId, ParameterID: pm25.id, DateTime: dt, Value: randomBetween(20, 120).toFixed(4), UnitID: pm25.unitId }),
      });
    }
    summary.push(`AQMS ambient station ${stationId}: covered ${covered.size}/8 days, topped-up ${added}`);
  }

  // AQMS met coverage
  for (const site of aqmsSites) {
    const stationId = Number(site.id);
    const covered = await daysCovered(
      prismaAqms, 'aqms_meteorological_observations',
      '"StationID"', stationId, '"DateTime"',
      temp ? `"ParameterID" = ${temp.id}` : null
    );
    const missing = [];
    for (let d = 0; d <= 7; d++) if (!covered.has(d)) missing.push(d);
    let added = 0;
    if (missing.length && temp) {
      added = await topUpDays({
        prisma: prismaAqms, table: 'aqms_meteorological_observations',
        idCol: '"StationID"', idVal: stationId, timeCol: '"DateTime"',
        missingOffsets: missing, columns: ['StationID', 'ParameterID', 'DateTime', 'Value', 'UnitID'],
        extraWhere: `"ParameterID" = ${temp.id}`,
        buildRow: (dt) => ({ StationID: stationId, ParameterID: temp.id, DateTime: dt, Value: randomBetween(20, 45).toFixed(4), UnitID: temp.unitId }),
      });
    }
    summary.push(`AQMS met station ${stationId}: covered ${covered.size}/8 days, topped-up ${added}`);
  }

  // ── MWQ buoys + sensor/param ids ──
  const buoys = await prismaMwq.$queryRawUnsafe(
    `SELECT "BuoyID" AS id, "BuoyName" AS name FROM mwq_buoys ORDER BY "BuoyID" ASC`
  );

  async function mwqParamId(name) {
    const r = await prismaMwq.$queryRawUnsafe(
      `SELECT "ParameterID" AS id FROM mwq_parameter_masters WHERE "ParameterName" = $1 LIMIT 1`, name
    );
    return r[0] ? Number(r[0].id) : null;
  }
  // Resolve buoy → sensor junctions for sonde/weather/battery (NOT NULL FK columns).
  async function buoySensor(buoyId, sensorType) {
    const r = await prismaMwq.$queryRawUnsafe(
      `SELECT bs."BuoySensorID" AS id, bs."SensorID" AS "sensorId"
         FROM mwq_buoy_sensors bs
         JOIN mwq_sensor_catalog sc ON sc."SensorID" = bs."SensorID"
        WHERE bs."BuoyID" = $1 AND sc."SensorType" = $2
        LIMIT 1`,
      buoyId, sensorType
    );
    return r[0] ? { id: Number(r[0].id), sensorId: Number(r[0].sensorId) } : null;
  }

  const tempPid = await mwqParamId('Temperature');
  const windSpeedPid = await mwqParamId('Wind Speed');
  const windDirPid = await mwqParamId('Wind Direction');
  const battPid = await mwqParamId('Battery Voltage');

  // MWQ sonde coverage
  for (const buoy of buoys) {
    const buoyId = Number(buoy.id);
    const bs = await buoySensor(buoyId, 'Sonde');
    const covered = await daysCovered(
      prismaMwq, 'mwq_sonde_observations', '"BuoyID"', buoyId, '"ObservationTime"',
      tempPid ? `"ParameterID" = ${tempPid}` : null
    );
    const missing = [];
    for (let d = 0; d <= 7; d++) if (!covered.has(d)) missing.push(d);
    let added = 0;
    if (missing.length && bs && tempPid) {
      added = await topUpDays({
        prisma: prismaMwq, table: 'mwq_sonde_observations',
        idCol: '"BuoyID"', idVal: buoyId, timeCol: '"ObservationTime"',
        missingOffsets: missing, columns: ['BuoySensorID', 'ObservationTime', 'ParameterID', 'Value', 'BuoyID', 'SensorID'],
        extraWhere: `"ParameterID" = ${tempPid}`,
        buildRow: (dt) => ({ BuoySensorID: bs.id, ObservationTime: dt, ParameterID: tempPid, Value: randomBetween(18, 35).toFixed(4), BuoyID: buoyId, SensorID: bs.sensorId }),
      });
    }
    summary.push(`MWQ sonde buoy ${buoyId}: covered ${covered.size}/8 days, topped-up ${added}`);
  }

  // MWQ weather coverage (wind-only — intended). Check Wind Speed series.
  for (const buoy of buoys) {
    const buoyId = Number(buoy.id);
    const bs = await buoySensor(buoyId, 'Weather');
    const covered = await daysCovered(
      prismaMwq, 'mwq_weather_observations', '"BuoyID"', buoyId, '"ObservationTime"',
      windSpeedPid ? `"ParameterID" = ${windSpeedPid}` : null
    );
    const missing = [];
    for (let d = 0; d <= 7; d++) if (!covered.has(d)) missing.push(d);
    let added = 0;
    if (missing.length && bs && windSpeedPid && windDirPid) {
      // Insert BOTH wind params for each missing day so latest/history pivot is whole.
      for (const [pid, range] of [[windSpeedPid, [0, 15]], [windDirPid, [0, 360]]]) {
        added += await topUpDays({
          prisma: prismaMwq, table: 'mwq_weather_observations',
          idCol: '"BuoyID"', idVal: buoyId, timeCol: '"ObservationTime"',
          missingOffsets: missing, columns: ['BuoySensorID', 'ObservationTime', 'ParameterID', 'Value', 'BuoyID', 'SensorID'],
          extraWhere: `"ParameterID" = ${pid}`,
          buildRow: (dt) => ({ BuoySensorID: bs.id, ObservationTime: dt, ParameterID: pid, Value: randomBetween(range[0], range[1]).toFixed(4), BuoyID: buoyId, SensorID: bs.sensorId }),
        });
      }
    }
    summary.push(`MWQ weather buoy ${buoyId}: covered ${covered.size}/8 days (wind-only), topped-up ${added}`);
  }

  // MWQ battery coverage
  for (const buoy of buoys) {
    const buoyId = Number(buoy.id);
    const bs = await buoySensor(buoyId, 'Battery');
    const covered = await daysCovered(
      prismaMwq, 'mwq_battery_observations', '"BuoyID"', buoyId, '"ObservationTime"', null
    );
    const missing = [];
    for (let d = 0; d <= 7; d++) if (!covered.has(d)) missing.push(d);
    let added = 0;
    if (missing.length && bs && battPid) {
      added = await topUpDays({
        prisma: prismaMwq, table: 'mwq_battery_observations',
        idCol: '"BuoyID"', idVal: buoyId, timeCol: '"ObservationTime"',
        missingOffsets: missing, columns: ['BuoySensorID', 'ObservationTime', 'ParameterID', 'Value', 'BuoyID', 'SensorID'],
        buildRow: (dt) => ({ BuoySensorID: bs.id, ObservationTime: dt, ParameterID: battPid, Value: randomBetween(11.5, 13.5).toFixed(4), BuoyID: buoyId, SensorID: bs.sensorId }),
      });
    }
    summary.push(`MWQ battery buoy ${buoyId}: covered ${covered.size}/8 days, topped-up ${added}`);
  }

  // ── Threshold tables: seed defaults if empty ──
  const aqmsThrCount = Number((await prismaAqms.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM aqms_aq_parameters_thresholds`))[0].c);
  if (aqmsThrCount === 0) {
    const defs = [
      ['PM2.5', 'WHO_24H', 0, 15], ['PM10', 'WHO_24H', 0, 45], ['NO2', 'WHO_ANNUAL', 0, 10],
      ['SO2', 'WHO_24H', 0, 40], ['O3', 'WHO_PEAK8H', 0, 100], ['CO', 'WHO_24H', 0, 4],
    ];
    let n = 0;
    for (const [name, std, mn, mx] of defs) {
      const p = await aqmsParam(name);
      if (!p) continue;
      await prismaAqms.$executeRawUnsafe(
        `INSERT INTO aqms_aq_parameters_thresholds ("ParameterID", "StandardType", "MinValue", "MaxValue") VALUES ($1, $2, $3, $4)`,
        p.id, std, mn, mx
      );
      n++;
    }
    summary.push(`AQMS thresholds were empty: seeded ${n} default rows`);
  } else {
    summary.push(`AQMS thresholds: ${aqmsThrCount} rows present (no change)`);
  }

  const mwqThrCount = Number((await prismaMwq.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM mwq_parameter_thresholds`))[0].c);
  if (mwqThrCount === 0) {
    const defs = [
      ['Temperature', 18, 35], ['pH', 7.5, 8.5], ['Dissolved Oxygen', 4, 10],
      ['Turbidity', 0, 50], ['Salinity', 35, 42],
    ];
    let n = 0;
    for (const [name, mn, mx] of defs) {
      const pid = await mwqParamId(name);
      if (!pid) continue;
      await prismaMwq.$executeRawUnsafe(
        `INSERT INTO mwq_parameter_thresholds ("ParameterID", "MinValue", "MaxValue") VALUES ($1, $2, $3)`,
        pid, mn, mx
      );
      n++;
    }
    summary.push(`MWQ thresholds were empty: seeded ${n} default rows`);
  } else {
    summary.push(`MWQ thresholds: ${mwqThrCount} rows present (no change)`);
  }

  return summary;
}

// =============================================================================
// Final row-count summary per series over [now-7d, now]
// =============================================================================
async function rowCountSummary() {
  const out = [];

  const aqi = await prismaAqms.$queryRawUnsafe(
    `SELECT "StationID" AS id, COUNT(*)::int AS c
       FROM aqms_air_quality_index_hourly_stats
      WHERE "DateTime" >= $1 AND "DateTime" <= $2
      GROUP BY "StationID" ORDER BY "StationID"`,
    windowStart, windowEnd
  );
  out.push(`AQMS AQI-hourly (last 7d): ${aqi.map(r => `st${r.id}=${r.c}`).join(', ')}`);

  const amb = await prismaAqms.$queryRawUnsafe(
    `SELECT "StationID" AS id, COUNT(*)::int AS c
       FROM aqms_ambient_air_quality_observations
      WHERE "DateTime" >= $1 AND "DateTime" <= $2
      GROUP BY "StationID" ORDER BY "StationID"`,
    windowStart, windowEnd
  );
  out.push(`AQMS ambient (last 7d): ${amb.map(r => `st${r.id}=${r.c}`).join(', ')}`);

  const met = await prismaAqms.$queryRawUnsafe(
    `SELECT "StationID" AS id, COUNT(*)::int AS c
       FROM aqms_meteorological_observations
      WHERE "DateTime" >= $1 AND "DateTime" <= $2
      GROUP BY "StationID" ORDER BY "StationID"`,
    windowStart, windowEnd
  );
  out.push(`AQMS met (last 7d): ${met.map(r => `st${r.id}=${r.c}`).join(', ')}`);

  const sonde = await prismaMwq.$queryRawUnsafe(
    `SELECT "BuoyID" AS id, COUNT(*)::int AS c
       FROM mwq_sonde_observations
      WHERE "ObservationTime" >= $1 AND "ObservationTime" <= $2
      GROUP BY "BuoyID" ORDER BY "BuoyID"`,
    windowStart, windowEnd
  );
  out.push(`MWQ sonde (last 7d): ${sonde.map(r => `b${r.id}=${r.c}`).join(', ')}`);

  const weather = await prismaMwq.$queryRawUnsafe(
    `SELECT "BuoyID" AS id, COUNT(*)::int AS c
       FROM mwq_weather_observations
      WHERE "ObservationTime" >= $1 AND "ObservationTime" <= $2
      GROUP BY "BuoyID" ORDER BY "BuoyID"`,
    windowStart, windowEnd
  );
  out.push(`MWQ weather (last 7d, wind-only): ${weather.map(r => `b${r.id}=${r.c}`).join(', ')}`);

  const batt = await prismaMwq.$queryRawUnsafe(
    `SELECT "BuoyID" AS id, COUNT(*)::int AS c
       FROM mwq_battery_observations
      WHERE "ObservationTime" >= $1 AND "ObservationTime" <= $2
      GROUP BY "BuoyID" ORDER BY "BuoyID"`,
    windowStart, windowEnd
  );
  out.push(`MWQ battery (last 7d): ${batt.map(r => `b${r.id}=${r.c}`).join(', ')}`);

  return out;
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--rollback') {
    await rollbackAqiBackfill();
    return;
  }

  log(`Window: ${windowStart.toISOString()} .. ${windowEnd.toISOString()}`);
  log('Step 1: AQMS AQI-hourly back-date (delete-then-insert)...');
  await backfillAqiHourly();

  log('Step 2: verify coverage + top-up missing days...');
  const topUp = await verifyAndTopUp();
  topUp.forEach(s => log('  ' + s));

  log('Step 3: final row-count summary (last 7 days)...');
  const counts = await rowCountSummary();
  console.log('\n===== BACKFILL SUMMARY =====');
  counts.forEach(s => console.log('  ' + s));
  console.log('============================\n');
}

main()
  .catch((e) => { console.error('[backfill] FAILED:', e); process.exitCode = 1; })
  .finally(async () => {
    await prismaMwq.$disconnect();
    await prismaAqms.$disconnect();
  });
