'use strict';

require('dotenv').config();
const { PrismaClient: PrismaClientMwq } = require('../node_modules/.prisma/client-mwq');
const { PrismaClient: PrismaClientAqms } = require('../node_modules/.prisma/client-aqms');
const { PrismaClient: PrismaClientHl } = require('../node_modules/.prisma/client-higher-level');
const bcrypt = require('bcrypt');

const prismaMwq = new PrismaClientMwq();
const prismaAqms = new PrismaClientAqms();
const prismaHl = new PrismaClientHl();

// ─── Config from env ─────────────────────────────────────────────────────────
const SEED_SENSOR_ROWS     = parseInt(process.env.SEED_SENSOR_ROWS     || '50000', 10);
const SEED_DAYS            = parseInt(process.env.SEED_DAYS            || '30',    10);
const SEED_BUOYS           = parseInt(process.env.SEED_BUOYS           || '4',     10);
const SEED_STATIONS        = parseInt(process.env.SEED_STATIONS        || '3',     10);
const SEED_END_OFFSET_DAYS = parseInt(process.env.SEED_END_OFFSET_DAYS || '7',     10);
const BCRYPT_COST          = parseInt(process.env.BCRYPT_COST          || '12',    10);
const BATCH_SIZE           = 1000;

// Anchor for the latest timestamp in time-series data. Shifted forward by
// SEED_END_OFFSET_DAYS so FE dashboards show data through next week instead
// of stopping at the seed run instant.
function anchorNow() { return Date.now() + SEED_END_OFFSET_DAYS * 86400 * 1000; }

function log(msg) { console.log(`[seed] ${msg}`); }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function waveValue(i, min, max, period = 100) {
  const base = (min + max) / 2;
  const amp  = (max - min) / 2 * 0.7;
  return parseFloat((base + amp * Math.sin((2 * Math.PI * i) / period) + randomBetween(-amp * 0.15, amp * 0.15)).toFixed(4));
}

function spreadDates(n, daysBack) {
  const now = anchorNow();
  const spanMs = daysBack * 24 * 60 * 60 * 1000;
  return Array.from({ length: n }, (_, i) => new Date(now - spanMs + (i / n) * spanMs));
}

async function batchInsert(label, rows, insertFn) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertFn(batch);
    inserted += batch.length;
    if (inserted % 10000 === 0 || inserted === rows.length) {
      log(`  ${label}: ${inserted}/${rows.length} rows`);
    }
  }
}

// Seed users + per-application access grants into the higher-level (identity) DB.
// Identity moved out of the module DBs during the auth split, so users and RBAC
// grants now live here. The RBAC baseline (applications/roles/permissions) is
// owned by seed-higher-level.js — run `npm run seed:hl` before this seed.
//
// Returns the shared admin plus the two per-app members. Idempotent: users are
// upserted by email and each grant by its unique (user, application) pair.
async function seedHigherLevelUsers(prisma) {
  const hash = await bcrypt.hash('ChangeMe123!', BCRYPT_COST);

  const apps = await prisma.application.findMany();
  const roles = await prisma.rbacRole.findMany();
  const appId = Object.fromEntries(apps.map((a) => [a.code, a.id]));
  const roleId = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  if (!appId.MWQ || !appId.AQMS || !roleId.ADMIN || !roleId.MWQ_MEMBER || !roleId.AQMS_MEMBER) {
    throw new Error('RBAC baseline missing in higher-level DB — run `npm run seed:hl` before `npm run seed`.');
  }

  // Upsert a user, then assert one access grant per application.
  async function upsertUser(data, grants) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { passwordHash: hash, ...data },
    });
    for (const g of grants) {
      await prisma.userApplicationAccess.upsert({
        where: { userId_applicationId: { userId: user.id, applicationId: g.applicationId } },
        update: { roleId: g.roleId, status: g.status },
        create: { userId: user.id, applicationId: g.applicationId, roleId: g.roleId, status: g.status },
      });
    }
    return user;
  }

  // ADMIN spans both applications.
  const admin = await upsertUser(
    { userName: 'admin', email: 'admin@fea.local', firstName: 'System', lastName: 'Admin', role: 'ADMIN', accountStatus: 'ACTIVE' },
    [
      { applicationId: appId.MWQ, roleId: roleId.ADMIN, status: 'ACTIVE' },
      { applicationId: appId.AQMS, roleId: roleId.ADMIN, status: 'ACTIVE' },
    ]
  );
  const mwqMember = await upsertUser(
    { userName: 'mwq_member', email: 'mwq.member@fea.local', firstName: 'MWQ', lastName: 'Member', role: 'MWQ_MEMBER', accountStatus: 'ACTIVE' },
    [{ applicationId: appId.MWQ, roleId: roleId.MWQ_MEMBER, status: 'ACTIVE' }]
  );
  const aqmsMember = await upsertUser(
    { userName: 'aqms_member', email: 'aqms.member@fea.local', firstName: 'AQMS', lastName: 'Member', role: 'AQMS_MEMBER', accountStatus: 'ACTIVE' },
    [{ applicationId: appId.AQMS, roleId: roleId.AQMS_MEMBER, status: 'ACTIVE' }]
  );

  // Extra users per app (varied statuses) for the Users-management UI. The grant
  // status mirrors the account status so the admin grant list shows each state.
  const extraDefs = [
    { suffix: 'pending1', status: 'PENDING' },
    { suffix: 'pending2', status: 'PENDING' },
    { suffix: 'pending3', status: 'PENDING' },
    { suffix: 'active2', status: 'ACTIVE' },
    { suffix: 'active3', status: 'ACTIVE' },
    { suffix: 'active4', status: 'ACTIVE' },
    { suffix: 'suspended1', status: 'SUSPENDED' },
    { suffix: 'rejected1', status: 'REJECTED' },
  ];
  let extraCount = 0;
  for (const [appCode, memberRole] of [['MWQ', 'MWQ_MEMBER'], ['AQMS', 'AQMS_MEMBER']]) {
    const prefix = appCode.toLowerCase();
    for (const e of extraDefs) {
      const label = e.status[0] + e.status.slice(1).toLowerCase();
      await upsertUser(
        { userName: `${prefix}_${e.suffix}`, email: `${prefix}.${e.suffix}@fea.local`, firstName: label, lastName: 'User', role: memberRole, accountStatus: e.status },
        [{ applicationId: appId[appCode], roleId: roleId[memberRole], status: e.status }]
      );
      extraCount++;
    }
  }

  return { admin, mwqMember, aqmsMember, extraCount };
}

// Generate real, DOWNLOADABLE AQMS reports by driving the production report
// service — one per report-type × station for a fixed window. Folded in from the
// former standalone seed-aqms-reports.js. Unlike the mock report rows (which have
// empty storagePaths), these produce real Report rows + files under
// tmp/reports/<id>, so the /data-capture "Generate Report" menu has live
// downloads. Heavier than the mock rows; runs last. Idempotent: prior typed
// reports in the window (and their folders) are removed before regenerating.
async function seedAqmsRealReports(ownerId) {
  const path = require('node:path');
  const fs = require('node:fs');
  const { generate } = require('../src/modules/shared/reports/reports.service');
  const { REPORT_TYPE_KEYS, getReportType } = require('../src/modules/shared/reports/report-types');
  const { LOCAL_ROOT } = require('../src/lib/storage');

  const START = new Date('2026-05-21T00:00:00.000Z');
  const END = new Date('2026-05-28T23:59:59.999Z');
  const ALL_FORMATS = ['PDF', 'XLSX', 'DOCX'];

  log('Seeding AQMS downloadable reports (via report service)...');

  // The mock rows above were inserted with explicit ids (1..N) which does NOT
  // advance the SERIAL sequence; bump it so the service's autoincrement create()
  // does not collide on id=1.
  await prismaAqms.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('reports', 'id'), (SELECT COALESCE(MAX(id), 1) FROM reports))`
  );

  // Owner is the higher-level ADMIN id (passed in); module DBs no longer hold users.
  if (!ownerId) { log('  aqms downloadable reports: no owner id — skipped'); return; }

  // Idempotent cleanup: drop prior typed reports for this window + their folders.
  const prior = await prismaAqms.report.findMany({
    where: { module: 'AQMS', reportType: { in: REPORT_TYPE_KEYS }, startDate: START },
    select: { id: true },
  });
  for (const { id } of prior) {
    try { fs.rmSync(path.join(LOCAL_ROOT, String(id)), { recursive: true, force: true }); } catch { /* ignore */ }
  }
  if (prior.length) await prismaAqms.report.deleteMany({ where: { id: { in: prior.map((p) => p.id) } } });

  // Pollutant parameter ids that actually have ambient data for a station in window.
  const pollutantIds = async (stationId) => {
    const rows = await prismaAqms.$queryRawUnsafe(`
      SELECT DISTINCT o."ParameterID" pid
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
      WHERE o."StationID" = $1 AND p."ParameterTypeCode" = 'POLLUTANT'
        AND o."DateTime" >= $2 AND o."DateTime" <= $3
      ORDER BY pid`, stationId, START, END);
    return rows.map((r) => r.pid);
  };

  const stations = await prismaAqms.aqmsMonitoringSite.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  let ready = 0, total = 0;
  for (const rtKey of REPORT_TYPE_KEYS) {
    const def = getReportType(rtKey);
    if (!def || !def.modules.includes('AQMS')) continue;
    for (const st of stations) {
      const pids = await pollutantIds(st.id);
      if (pids.length === 0) continue;
      total++;
      const body = { module: 'AQMS', reportType: rtKey, stationIds: [st.id], parameterIds: pids, startDate: START, endDate: END, formats: ALL_FORMATS };
      try {
        let report;
        try {
          report = await generate(ownerId, body);
        } catch (e) {
          // DOCX/PDF have a row cap; fall back to XLSX-only for big windows.
          if (e.code === 'ROW_LIMIT_EXCEEDED') report = await generate(ownerId, { ...body, formats: ['XLSX'] });
          else throw e;
        }
        if (report.status === 'READY') ready++;
      } catch (e) {
        log(`  aqms report FAIL ${rtKey}/station ${st.id}: ${e.code || e.message}`);
      }
    }
  }
  log(`  aqms downloadable reports: ${ready}/${total} generated`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`Starting seed (SEED_SENSOR_ROWS=${SEED_SENSOR_ROWS}, SEED_DAYS=${SEED_DAYS})`);

  // =========================================================================
  // SHARED: Users — live in the higher-level (identity) DB after the auth split.
  // Module report/notification rows are FK-less, so their userId is just an int
  // pointing at these HL user ids. ADMIN is a single user spanning both apps.
  // =========================================================================
  log('Seeding users into higher-level (identity) DB...');
  const { admin, mwqMember, aqmsMember, extraCount } = await seedHigherLevelUsers(prismaHl);
  const mwqAdmin = admin;   // single shared ADMIN identity across both modules
  const aqmsAdmin = admin;
  log(`  HL users: admin id=${admin.id}, mwq_member id=${mwqMember.id}, aqms_member id=${aqmsMember.id}, +${extraCount} extra`);

  // =========================================================================
  // MWQ: Reference data
  // =========================================================================
  log('Seeding MWQ reference data...');

  const unitDefs = [
    { unitName: 'Parts Per Thousand', unit: 'ppt' },
    { unitName: 'Milligrams Per Litre', unit: 'mg/l' },
    { unitName: 'Microsiemens Per Centimetre', unit: 'uS/cm' },
    { unitName: 'Nephelometric Turbidity Units', unit: 'NTU' },
    { unitName: 'pH Units', unit: 'pH' },
    { unitName: 'Metres', unit: 'm' },
    { unitName: 'Micrograms Per Litre', unit: 'ug/l' },
    { unitName: 'Degrees Celsius', unit: 'degC' },
    { unitName: 'Percent Saturation', unit: '%' },
    { unitName: 'Millivolts', unit: 'mV' },
    { unitName: 'Metres Per Second', unit: 'm/s' },
    { unitName: 'Degrees', unit: 'deg' },
    { unitName: 'Millibars', unit: 'mbar' },
  ];

  const createdUnits = [];
  for (const u of unitDefs) {
    const rec = await prismaMwq.mwqParameterUnit.upsert({
      where: { id: createdUnits.length + 1 },
      update: {},
      create: u,
    });
    createdUnits.push(rec);
  }

  function mwqUnitId(sym) {
    return createdUnits.find(u => u.unit === sym)?.id ?? createdUnits[0].id;
  }

  const paramDefs = [
    { sensorType: 'Sonde', parameterName: 'Conductivity',       unitId: mwqUnitId('uS/cm') },
    { sensorType: 'Sonde', parameterName: 'Temperature',        unitId: mwqUnitId('degC')  },
    { sensorType: 'Sonde', parameterName: 'Salinity',           unitId: mwqUnitId('ppt')   },
    { sensorType: 'Sonde', parameterName: 'Chlorophyll',        unitId: mwqUnitId('ug/l')  },
    { sensorType: 'Sonde', parameterName: 'Oxygen Saturation',  unitId: mwqUnitId('%')     },
    { sensorType: 'Sonde', parameterName: 'Dissolved Oxygen',   unitId: mwqUnitId('mg/l')  },
    { sensorType: 'Sonde', parameterName: 'Turbidity',          unitId: mwqUnitId('NTU')   },
    { sensorType: 'Sonde', parameterName: 'pH',                 unitId: mwqUnitId('pH')    },
    { sensorType: 'Sonde', parameterName: 'Depth',              unitId: mwqUnitId('m')     },
    { sensorType: 'Sonde', parameterName: 'Algae',              unitId: mwqUnitId('ug/l')  },
    { sensorType: 'Weather', parameterName: 'Wind Speed',       unitId: mwqUnitId('m/s')   },
    { sensorType: 'Weather', parameterName: 'Wind Direction',   unitId: mwqUnitId('deg')   },
    { sensorType: 'Weather', parameterName: 'Air Temperature',      unitId: mwqUnitId('degC') },
    { sensorType: 'Weather', parameterName: 'Relative Humidity',    unitId: mwqUnitId('%')    },
    { sensorType: 'Weather', parameterName: 'Wind Gust',            unitId: mwqUnitId('m/s')  },
    { sensorType: 'Weather', parameterName: 'Atmospheric Pressure', unitId: mwqUnitId('mbar') },
    { sensorType: 'Battery', parameterName: 'Battery Voltage',  unitId: mwqUnitId('mV')    },
    { sensorType: 'GPS',     parameterName: 'GPS Latitude',     unitId: mwqUnitId('deg')   },
    { sensorType: 'Door',    parameterName: 'Door Status',      unitId: mwqUnitId('mV')    },
  ];

  const createdParams = [];
  for (const p of paramDefs) {
    const rec = await prismaMwq.mwqParameterMaster.upsert({
      where: { id: createdParams.length + 1 },
      update: {},
      create: p,
    });
    createdParams.push(rec);
  }

  function mwqParamId(name) {
    return createdParams.find(p => p.parameterName === name)?.id ?? createdParams[0].id;
  }

  const sensorDefs = [
    { sensorName: 'YSI EXO2 Sonde A',    sensorType: 'Sonde',   model: 'EXO2',    manufacturer: 'YSI' },
    { sensorName: 'YSI EXO2 Sonde B',    sensorType: 'Sonde',   model: 'EXO2',    manufacturer: 'YSI' },
    { sensorName: 'Vaisala WXT530 A',     sensorType: 'Weather', model: 'WXT530',  manufacturer: 'Vaisala' },
    { sensorName: 'Vaisala WXT530 B',     sensorType: 'Weather', model: 'WXT530',  manufacturer: 'Vaisala' },
    { sensorName: 'Trimble GPS A',        sensorType: 'GPS',     model: 'R10',     manufacturer: 'Trimble' },
    { sensorName: 'Trimble GPS B',        sensorType: 'GPS',     model: 'R10',     manufacturer: 'Trimble' },
    { sensorName: 'Battery Monitor A',    sensorType: 'Battery', model: 'BM100',   manufacturer: 'FEA' },
    { sensorName: 'Battery Monitor B',    sensorType: 'Battery', model: 'BM100',   manufacturer: 'FEA' },
    { sensorName: 'Door Sensor A',        sensorType: 'Door',    model: 'DS200',   manufacturer: 'FEA' },
    { sensorName: 'Door Sensor B',        sensorType: 'Door',    model: 'DS200',   manufacturer: 'FEA' },
  ];

  const createdSensors = [];
  for (const s of sensorDefs) {
    const rec = await prismaMwq.mwqSensorCatalog.upsert({
      where: { id: createdSensors.length + 1 },
      update: {},
      create: s,
    });
    createdSensors.push(rec);
  }

  function mwqSensorId(type, variant = 'A') {
    return createdSensors.find(s => s.sensorType === type && s.sensorName.endsWith(variant))?.id
      ?? createdSensors.find(s => s.sensorType === type)?.id
      ?? createdSensors[0].id;
  }

  const alertCodes = [
    { alertCode: 'COMM_LOST',          alertType: 'Communication', alertMessage: 'Communication lost with buoy',          alertLevel: 'CRITICAL', alertCategory: 'System' },
    { alertCode: 'DOOR_OPEN',          alertType: 'Physical',      alertMessage: 'Enclosure door opened',                 alertLevel: 'WARN',     alertCategory: 'Security' },
    { alertCode: 'GPS_LOST',           alertType: 'Navigation',    alertMessage: 'GPS signal lost',                       alertLevel: 'WARN',     alertCategory: 'System' },
    { alertCode: 'BATTERY_LOW',        alertType: 'Power',         alertMessage: 'Battery voltage below threshold',       alertLevel: 'WARN',     alertCategory: 'Power' },
    { alertCode: 'SENSOR_FAULT',       alertType: 'Sensor',        alertMessage: 'Sensor reading out of valid range',     alertLevel: 'CRITICAL', alertCategory: 'Sensor' },
    { alertCode: 'POWER_FAULT',        alertType: 'Power',         alertMessage: 'Power supply fault detected',           alertLevel: 'CRITICAL', alertCategory: 'Power' },
    { alertCode: 'THRESHOLD_EXCEEDED', alertType: 'Data Quality',  alertMessage: 'Parameter threshold exceeded',         alertLevel: 'WARN',     alertCategory: 'Quality' },
    { alertCode: 'OFFLINE',            alertType: 'Communication', alertMessage: 'Buoy offline - no data received',       alertLevel: 'CRITICAL', alertCategory: 'System' },
  ];

  const createdAlertMasters = [];
  for (const a of alertCodes) {
    const rec = await prismaMwq.mwqAlertMaster.upsert({
      where: { alertCode: a.alertCode },
      update: {},
      create: a,
    });
    createdAlertMasters.push(rec);
  }

  // =========================================================================
  // MWQ: Buoys
  // =========================================================================
  log('Seeding MWQ buoys...');
  const buoyDefs = [
    { buoyName: 'AL Aqah Buoy',    latitude: 25.4725, longitude: 56.4162 },
    { buoyName: 'Fujairah Buoy 1', latitude: 25.1288, longitude: 56.3572 },
    { buoyName: 'Fujairah Buoy 2', latitude: 25.2041, longitude: 56.3738 },
    { buoyName: 'Coastal Buoy A',  latitude: 25.3100, longitude: 56.3950 },
  ];

  const buoys = [];
  for (const b of buoyDefs.slice(0, SEED_BUOYS)) {
    const rec = await prismaMwq.mwqBuoy.upsert({
      where: { id: buoys.length + 1 },
      update: {},
      create: b,
    });
    buoys.push(rec);
  }

  log('Seeding MWQ buoy sensors...');
  const buoySensorMap = {};
  for (const buoy of buoys) {
    const junctions = {
      sonde:   await prismaMwq.mwqBuoySensor.upsert({ where: { id: (buoy.id - 1) * 5 + 1 }, update: {}, create: { buoyId: buoy.id, sensorId: mwqSensorId('Sonde', 'A'),   dataFrequency: '15min', status: 'ACTIVE' } }),
      weather: await prismaMwq.mwqBuoySensor.upsert({ where: { id: (buoy.id - 1) * 5 + 2 }, update: {}, create: { buoyId: buoy.id, sensorId: mwqSensorId('Weather', 'A'), dataFrequency: '15min', status: 'ACTIVE' } }),
      gps:     await prismaMwq.mwqBuoySensor.upsert({ where: { id: (buoy.id - 1) * 5 + 3 }, update: {}, create: { buoyId: buoy.id, sensorId: mwqSensorId('GPS', 'A'),     dataFrequency: '1hr',   status: 'ACTIVE' } }),
      battery: await prismaMwq.mwqBuoySensor.upsert({ where: { id: (buoy.id - 1) * 5 + 4 }, update: {}, create: { buoyId: buoy.id, sensorId: mwqSensorId('Battery', 'A'), dataFrequency: '1hr',   status: 'ACTIVE' } }),
      door:    await prismaMwq.mwqBuoySensor.upsert({ where: { id: (buoy.id - 1) * 5 + 5 }, update: {}, create: { buoyId: buoy.id, sensorId: mwqSensorId('Door', 'A'),    dataFrequency: 'event', status: 'ACTIVE' } }),
    };
    buoySensorMap[buoy.id] = junctions;
  }

  // =========================================================================
  // MWQ: SondeObservations
  // =========================================================================
  log('Seeding MWQ sonde observations...');
  const sondeParamNames = ['Conductivity', 'Temperature', 'Salinity', 'Chlorophyll', 'Oxygen Saturation', 'Dissolved Oxygen', 'Turbidity', 'pH', 'Depth', 'Algae'];
  const sondeRanges = {
    'Conductivity':      [40000, 56000],
    'Temperature':       [18, 35],
    'Salinity':          [35, 42],
    'Chlorophyll':       [0.1, 20],
    'Oxygen Saturation': [60, 110],
    'Dissolved Oxygen':  [4, 10],
    'Turbidity':         [0.5, 50],
    'pH':                [7.5, 8.5],
    'Depth':             [0.5, 15],
    'Algae':             [0, 5],
  };

  const sondeRowsPerCombo = Math.max(1, Math.floor(SEED_SENSOR_ROWS / (buoys.length * sondeParamNames.length)));
  const allSondeDates = spreadDates(sondeRowsPerCombo, SEED_DAYS);

  for (const buoy of buoys) {
    const bs = buoySensorMap[buoy.id].sonde;
    for (const pName of sondeParamNames) {
      const pid = mwqParamId(pName);
      const [min, max] = sondeRanges[pName] || [0, 100];
      const rows = allSondeDates.map((dt, i) => ({
        buoySensorId:    bs.id,
        observationTime: dt,
        parameterId:     pid,
        value:           waveValue(i, min, max),
        buoyId:          buoy.id,
        sensorId:        bs.sensorId,
      }));
      await batchInsert(`sonde ${buoy.buoyName}/${pName}`, rows, batch =>
        prismaMwq.mwqSondeObservation.createMany({ data: batch, skipDuplicates: true })
      );
    }
  }

  // =========================================================================
  // MWQ: WeatherObservations
  // =========================================================================
  log('Seeding MWQ weather observations...');
  const weatherParamNames = ['Wind Speed', 'Wind Direction', 'Air Temperature', 'Relative Humidity', 'Wind Gust', 'Atmospheric Pressure'];
  const weatherRanges = {
    'Wind Speed': [0, 15], 'Wind Direction': [0, 360],
    'Air Temperature': [22, 38], 'Relative Humidity': [40, 85],
    'Wind Gust': [2, 22], 'Atmospheric Pressure': [1000, 1015],
  };
  const weatherRowsPerCombo = Math.max(1, Math.floor(SEED_SENSOR_ROWS / 10 / (buoys.length * weatherParamNames.length)));
  const allWeatherDates = spreadDates(weatherRowsPerCombo, SEED_DAYS);

  for (const buoy of buoys) {
    const bs = buoySensorMap[buoy.id].weather;
    for (const pName of weatherParamNames) {
      const pid = mwqParamId(pName);
      const [min, max] = weatherRanges[pName];
      const rows = allWeatherDates.map((dt, i) => ({
        buoySensorId:    bs.id,
        observationTime: dt,
        parameterId:     pid,
        value:           waveValue(i, min, max),
        buoyId:          buoy.id,
        sensorId:        bs.sensorId,
      }));
      await batchInsert(`weather ${buoy.buoyName}/${pName}`, rows, batch =>
        prismaMwq.mwqWeatherObservation.createMany({ data: batch, skipDuplicates: true })
      );
    }
  }

  // =========================================================================
  // MWQ: BatteryObservations
  // =========================================================================
  log('Seeding MWQ battery observations...');
  const battParamId = mwqParamId('Battery Voltage');
  const battHours = 7 * 24;
  for (const buoy of buoys) {
    const bs = buoySensorMap[buoy.id].battery;
    const now = anchorNow();
    const rows = Array.from({ length: battHours }, (_, i) => ({
      buoySensorId:    bs.id,
      observationTime: new Date(now - (battHours - i) * 3600 * 1000),
      parameterId:     battParamId,
      value:           waveValue(i, 11.5, 13.5, 24),
      buoyId:          buoy.id,
      sensorId:        bs.sensorId,
    }));
    await batchInsert(`battery ${buoy.buoyName}`, rows, batch =>
      prismaMwq.mwqBatteryObservation.createMany({ data: batch, skipDuplicates: true })
    );
  }

  // =========================================================================
  // MWQ: StationAlerts
  // =========================================================================
  log('Seeding MWQ station alerts...');
  const alertStatuses = ['OPEN', 'RESOLVED', 'ACKNOWLEDGED'];
  const alertRows = [];
  const now = anchorNow();
  // Guarantee at least 2 rows per AlertCode (8 codes × 2 = 16), then add 8 more for variety
  for (let round = 0; round < 3; round++) {
    for (let ci = 0; ci < createdAlertMasters.length; ci++) {
      const am       = createdAlertMasters[ci];
      const buoy     = buoys[(ci + round) % buoys.length];
      const alertTime = new Date(now - randomBetween(1, SEED_DAYS) * 86400 * 1000);
      const status   = alertStatuses[(ci + round) % alertStatuses.length];
      alertRows.push({
        buoyId:        buoy.id,
        sensorId:      buoySensorMap[buoy.id].sonde.sensorId,
        alertMasterId: am.id,
        alertTime,
        alertStatus:   status,
        resolvedTime:  status === 'RESOLVED' ? new Date(alertTime.getTime() + randomBetween(300, 3600) * 1000) : null,
        alertValue:    parseFloat(randomBetween(0, 100).toFixed(2)),
      });
    }
  }
  await prismaMwq.mwqStationAlert.createMany({ data: alertRows, skipDuplicates: true });
  log(`  station alerts: ${alertRows.length} rows attempted (skipDuplicates)`);

  // =========================================================================
  // MWQ: DataCaptureRates
  // =========================================================================
  log('Seeding MWQ data capture rates...');
  const captureParamNames = ['Conductivity', 'Temperature', 'Salinity', 'Chlorophyll', 'Oxygen Saturation', 'Dissolved Oxygen', 'Turbidity', 'pH', 'Depth', 'Algae'];
  const captureRows = [];
  const captureNow = anchorNow();
  for (const buoy of buoys) {
    const bs = buoySensorMap[buoy.id].sonde;
    for (const pName of captureParamNames) {
      const pid = mwqParamId(pName);
      for (let d = 0; d < 10; d++) {
        const date = new Date(captureNow - d * 86400 * 1000);
        date.setUTCHours(0, 0, 0, 0);
        const received = Math.floor(randomBetween(42, 49));
        const valid    = Math.floor(randomBetween(Math.max(40, received - 3), received));
        const capRate  = parseFloat(((received / 48) * 100).toFixed(2));
        const valRate  = parseFloat(((valid    / 48) * 100).toFixed(2));
        captureRows.push({
          buoySensorId:               bs.id,
          parameterId:                pid,
          date,
          expectedRecords:            48,
          receivedRecords:            received,
          validRecords:               valid,
          captureRatePercentage:      capRate,
          validCaptureRatePercentage: valRate,
          buoyId:                     buoy.id,
          sensorId:                   bs.sensorId,
        });
      }
    }
  }
  await prismaMwq.mwqDataCaptureRate.createMany({ data: captureRows, skipDuplicates: true });
  log(`  mwq_data_capture_rates: ${captureRows.length} rows attempted (skipDuplicates)`);

  // =========================================================================
  // AQMS: Reference data
  // =========================================================================
  log('Seeding AQMS reference data...');

  const aqmsParamDefs = [
    { parameterName: 'PM2.5',           parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Micrograms Per Cubic Metre' },
    { parameterName: 'PM10',            parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Micrograms Per Cubic Metre' },
    { parameterName: 'CO',              parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Milligrams Per Cubic Metre' },
    { parameterName: 'O3',              parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Billion' },
    { parameterName: 'NO2',             parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Billion' },
    { parameterName: 'SO2',             parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Billion' },
    { parameterName: 'CO2',             parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Million' },
    { parameterName: 'CH4',             parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Million' },
    { parameterName: 'H2S',             parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Billion' },
    { parameterName: 'NMHC',            parameterTypeCode: 'POLLUTANT', defaultUnitName: 'Parts Per Million' },
    { parameterName: 'Temperature',     parameterTypeCode: 'MET',       defaultUnitName: 'Degrees Celsius' },
    { parameterName: 'Pressure',        parameterTypeCode: 'MET',       defaultUnitName: 'Hectopascals' },
    { parameterName: 'Solar Radiation', parameterTypeCode: 'MET',       defaultUnitName: 'Watts Per Square Metre' },
    { parameterName: 'Humidity',        parameterTypeCode: 'MET',       defaultUnitName: 'Percent Relative Humidity' },
    { parameterName: 'Wind Speed',      parameterTypeCode: 'MET',       defaultUnitName: 'Metres Per Second' },
    { parameterName: 'Wind Direction',  parameterTypeCode: 'MET',       defaultUnitName: 'Degrees True' },
  ];

  const aqmsParams = [];
  for (let i = 0; i < aqmsParamDefs.length; i++) {
    const { defaultUnitName, ...paramData } = aqmsParamDefs[i];
    const rec = await prismaAqms.aqmsParameterMaster.upsert({
      where: { id: i + 1 },
      update: {},
      create: paramData,
    });
    aqmsParams.push({ ...rec, defaultUnitName });
  }

  function aqmsParamId(name) {
    return aqmsParams.find(p => p.parameterName === name)?.id ?? aqmsParams[0].id;
  }

  const aqmsUnitDefs = [
    { unitType: 'Concentration', unitName: 'Micrograms Per Cubic Metre', description: 'ug/m3 - standard AQ concentration unit', defaultParamName: 'PM2.5' },
    { unitType: 'Concentration', unitName: 'Milligrams Per Cubic Metre', description: 'mg/m3',                                   defaultParamName: 'CO' },
    { unitType: 'Concentration', unitName: 'Parts Per Million',           description: 'ppm',                                    defaultParamName: 'CO2' },
    { unitType: 'Concentration', unitName: 'Parts Per Billion',           description: 'ppb',                                    defaultParamName: 'O3' },
    { unitType: 'Temperature',   unitName: 'Degrees Celsius',             description: 'degC',                                   defaultParamName: 'Temperature' },
    { unitType: 'Pressure',      unitName: 'Hectopascals',                description: 'hPa',                                    defaultParamName: 'Pressure' },
    { unitType: 'Solar',         unitName: 'Watts Per Square Metre',      description: 'W/m2',                                   defaultParamName: 'Solar Radiation' },
    { unitType: 'Humidity',      unitName: 'Percent Relative Humidity',   description: '%RH',                                    defaultParamName: 'Humidity' },
    { unitType: 'Wind',          unitName: 'Metres Per Second',           description: 'm/s',                                    defaultParamName: 'Wind Speed' },
    { unitType: 'Wind',          unitName: 'Degrees True',                description: 'deg',                                    defaultParamName: 'Wind Direction' },
    { unitType: 'Index',         unitName: 'AQI Points',                  description: 'AQI',                                    defaultParamName: 'PM2.5' },
    { unitType: 'Concentration', unitName: 'Parts Per Trillion',          description: 'ppt',                                    defaultParamName: 'CH4' },
  ];

  const aqmsUnits = [];
  for (let i = 0; i < aqmsUnitDefs.length; i++) {
    const { defaultParamName, ...unitData } = aqmsUnitDefs[i];
    const rec = await prismaAqms.aqmsMeasurementUnit.upsert({
      where: { id: i + 1 },
      update: {},
      create: { ...unitData, parameterId: aqmsParamId(defaultParamName) },
    });
    aqmsUnits.push(rec);
  }

  function aqmsUnitId(name) {
    return aqmsUnits.find(u => u.unitName === name)?.id ?? aqmsUnits[0].id;
  }

  for (const p of aqmsParams) {
    const resolvedUnitId = aqmsUnitId(p.defaultUnitName);
    await prismaAqms.aqmsParameterMaster.update({
      where: { id: p.id },
      data:  { unitId: resolvedUnitId },
    });
    p.unitId = resolvedUnitId;
  }

  const freq = await prismaAqms.aqmsSamplingFrequency.upsert({
    where: { id: 1 },
    update: {},
    create: { frequencyName: '1 Hour', timeInterval: 'hour', intervalValue: 3600 },
  });

  const aqiDefs = [
    { indexMin: 0,   indexMax: 50,  category: 'Good',            color: '#00E400', categoryDescription: 'Air quality is satisfactory and poses little or no risk.' },
    { indexMin: 51,  indexMax: 100, category: 'Moderate',        color: '#FFFF00', categoryDescription: 'Air quality is acceptable; some pollutants may be a concern for a small number of sensitive people.' },
    { indexMin: 101, indexMax: 150, category: 'Unhealthy for Sensitive Groups', color: '#FF7E00', categoryDescription: 'Members of sensitive groups may experience health effects.' },
    { indexMin: 151, indexMax: 200, category: 'Unhealthy',       color: '#FF0000', categoryDescription: 'Everyone may begin to experience health effects.' },
    { indexMin: 201, indexMax: 300, category: 'Very Unhealthy',  color: '#8F3F97', categoryDescription: 'Health alert: everyone may experience more serious health effects.' },
    { indexMin: 301, indexMax: 500, category: 'Hazardous',       color: '#7E0023', categoryDescription: 'Health warning of emergency conditions; everyone is more likely to be affected.' },
  ];

  const aqiMasters = [];
  for (let i = 0; i < aqiDefs.length; i++) {
    const rec = await prismaAqms.aqmsAQIndexMaster.upsert({
      where: { id: i + 1 },
      update: {},
      create: aqiDefs[i],
    });
    aqiMasters.push(rec);
  }

  // =========================================================================
  // AQMS: Monitoring sites
  // =========================================================================
  log('Seeding AQMS monitoring sites...');
  const siteDefs = [
    { stationCode: 'FUJ-CC-01',  stationName: 'City Centre',    description: 'Urban background station in Fujairah city centre', stationType: 'Urban',    latitude: 25.1288, longitude: 56.3572, areaType: 'Urban',    operationalState: 'OPERATIONAL', status: 'Active' },
    { stationCode: 'FUJ-MOB-01', stationName: 'Mobile Station', description: 'Mobile monitoring unit for temporary deployment',   stationType: 'Mobile',   latitude: 25.2041, longitude: 56.3738, areaType: 'Suburban', operationalState: 'OPERATIONAL', status: 'Active' },
    { stationCode: 'FUJ-QID-01', stationName: 'Qidfa',          description: 'Industrial monitoring station near Qidfa',          stationType: 'Industrial', latitude: 25.3750, longitude: 56.3450, areaType: 'Industrial', operationalState: 'OPERATIONAL', status: 'Active' },
    { stationCode: 'FUJ-LAF-01', stationName: 'Lafarge CEMS',   description: 'Continuous emission monitoring - Lafarge cement',    stationType: 'CEMS',     latitude: 25.4100, longitude: 56.3200, areaType: 'Industrial', operationalState: 'OPERATIONAL', status: 'Active' },
  ];

  const sites = [];
  for (const s of siteDefs.slice(0, Math.max(SEED_STATIONS, 4))) {
    const rec = await prismaAqms.aqmsMonitoringSite.upsert({
      where: { stationCode: s.stationCode },
      update: {},
      create: s,
    });
    sites.push(rec);
  }

  log('Seeding AQMS site parameters...');
  const pollutantParams = aqmsParams.filter(p => p.parameterTypeCode === 'POLLUTANT');
  const metParams       = aqmsParams.filter(p => p.parameterTypeCode === 'MET');

  let spId = 0;
  for (const site of sites) {
    const assignedParams = site.stationType === 'CEMS'
      ? [...aqmsParams.filter(p => ['CO', 'SO2', 'NO2'].includes(p.parameterName)), ...metParams]
      : [...pollutantParams, ...metParams];

    for (const param of assignedParams) {
      spId++;
      await prismaAqms.aqmsSiteParameter.upsert({
        where: { id: spId },
        update: {},
        create: { stationId: site.id, parameterId: param.id, frequencyId: freq.id },
      });
    }
  }

  // =========================================================================
  // AQMS: AmbientObservations
  // =========================================================================
  log('Seeding AQMS ambient observations...');
  const ambientRanges = {
    'PM2.5': [2, 150], 'PM10': [5, 200], 'CO': [0.1, 5], 'O3': [5, 120],
    'NO2': [5, 100], 'SO2': [2, 80], 'CO2': [380, 420], 'CH4': [1.7, 2.0],
    'H2S': [0.1, 10], 'NMHC': [0.05, 2],
  };

  const ambientRowsPerCombo = Math.max(1, Math.floor(SEED_SENSOR_ROWS / (sites.length * pollutantParams.length)));
  const allAmbientDates = spreadDates(ambientRowsPerCombo, SEED_DAYS);

  for (const site of sites) {
    const siteParams = site.stationType === 'CEMS'
      ? aqmsParams.filter(p => ['CO', 'SO2', 'NO2'].includes(p.parameterName))
      : pollutantParams;

    for (const param of siteParams) {
      const [min, max] = ambientRanges[param.parameterName] || [0, 100];
      const rows = allAmbientDates.map((dt, i) => ({
        stationId:   site.id,
        parameterId: param.id,
        dateTime:    dt,
        value:       waveValue(i, min, max),
        unitId:      param.unitId,
      }));
      await batchInsert(`ambient ${site.stationName}/${param.parameterName}`, rows, batch =>
        prismaAqms.aqmsAmbientAirQualityObservation.createMany({ data: batch, skipDuplicates: true })
      );
    }
  }

  // =========================================================================
  // AQMS: MeteorologicalObservations
  // =========================================================================
  log('Seeding AQMS met observations...');
  const metRanges = {
    'Temperature': [20, 45], 'Pressure': [990, 1015], 'Solar Radiation': [0, 1000],
    'Humidity': [20, 80], 'Wind Speed': [0, 12], 'Wind Direction': [0, 360],
  };
  const metRowsPerCombo = Math.max(1, Math.floor(SEED_SENSOR_ROWS / 10 / (sites.length * metParams.length)));
  const allMetDates = spreadDates(metRowsPerCombo, SEED_DAYS);

  for (const site of sites) {
    for (const param of metParams) {
      const [min, max] = metRanges[param.parameterName] || [0, 100];
      const rows = allMetDates.map((dt, i) => ({
        stationId:   site.id,
        parameterId: param.id,
        dateTime:    dt,
        value:       waveValue(i, min, max),
        unitId:      param.unitId,
      }));
      await batchInsert(`met ${site.stationName}/${param.parameterName}`, rows, batch =>
        prismaAqms.aqmsMeteorologicalObservation.createMany({ data: batch, skipDuplicates: true })
      );
    }
  }

  // =========================================================================
  // AQMS: AirQualityIndexHourlyStats
  // =========================================================================
  log('Seeding AQMS AQI hourly stats...');
  const aqiRows = [];
  const nowMs = anchorNow();
  for (const site of sites) {
    for (let h = 0; h < 24; h++) {
      const dt     = new Date(nowMs - h * 3600 * 1000);
      const avgVal = Math.floor(randomBetween(20, 180));
      const idxRec = aqiMasters.find(a => avgVal >= a.indexMin && avgVal <= a.indexMax) ?? aqiMasters[0];
      aqiRows.push({
        stationId:           site.id,
        dateTime:            dt,
        avgValue:            avgVal,
        maxValue:            avgVal + Math.floor(randomBetween(5, 20)),
        minValue:            Math.max(0, avgVal - Math.floor(randomBetween(5, 20))),
        dominantPollutantId: aqmsParamId('PM2.5'),
        indexId:             idxRec.id,
      });
    }
  }
  await prismaAqms.aqmsAirQualityIndexHourlyStats.createMany({ data: aqiRows, skipDuplicates: true });
  log(`  AQI hourly stats: ${aqiRows.length} rows`);

  // =========================================================================
  // AQMS: DataViolationLogs
  // =========================================================================
  log('Seeding AQMS data violation logs...');
  const violationParamNames = ['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'];
  const thresholdDefs = [
    { parameterName: 'PM2.5', standardType: 'WHO_24H',    minValue: 0, maxValue: 15  },
    { parameterName: 'PM10',  standardType: 'WHO_24H',    minValue: 0, maxValue: 45  },
    { parameterName: 'NO2',   standardType: 'WHO_ANNUAL', minValue: 0, maxValue: 10  },
    { parameterName: 'SO2',   standardType: 'WHO_24H',    minValue: 0, maxValue: 40  },
    { parameterName: 'O3',    standardType: 'WHO_PEAK8H', minValue: 0, maxValue: 100 },
    { parameterName: 'CO',    standardType: 'WHO_24H',    minValue: 0, maxValue: 4   },
  ];

  const createdThresholds = [];
  for (let i = 0; i < thresholdDefs.length; i++) {
    const { parameterName, ...tData } = thresholdDefs[i];
    const rec = await prismaAqms.aqmsAQParametersThreshold.upsert({
      where: { id: i + 1 },
      update: {},
      create: { ...tData, parameterId: aqmsParamId(parameterName) },
    });
    createdThresholds.push({ ...rec, parameterName });
  }

  function aqmsThresholdId(paramName) {
    return createdThresholds.find(t => t.parameterName === paramName)?.id ?? createdThresholds[0].id;
  }

  const ambientObsSample = await prismaAqms.aqmsAmbientAirQualityObservation.findMany({
    select: { id: true, stationId: true, parameterId: true },
    distinct: ['stationId', 'parameterId'],
    take: 20,
  });

  // 3 rows per param × 6 params = 18, plus extra rows spread across sites = 24+ total
  const violationStatuses = ['OPEN', 'RESOLVED', 'ACKNOWLEDGED'];
  const violationRows = [];
  for (let round = 0; round < 4; round++) {
    for (let pi = 0; pi < violationParamNames.length; pi++) {
      const pName = violationParamNames[pi];
      const pid   = aqmsParamId(pName);
      const tid   = aqmsThresholdId(pName);
      const obs   = ambientObsSample[(pi + round * violationParamNames.length) % ambientObsSample.length];
      const daysAgo = Math.floor(randomBetween(0, 30));
      violationRows.push({
        ambientObservationId: obs.id,
        stationId:            obs.stationId,
        parameterId:          pid,
        thresholdId:          tid,
        status:               violationStatuses[(pi + round) % violationStatuses.length],
        remarks:              `${pName} threshold exceeded (${daysAgo}d ago) round ${round}`,
      });
    }
  }
  await prismaAqms.aqmsDataViolationLog.createMany({ data: violationRows, skipDuplicates: true });
  log(`  aqms_data_violation_logs: ${violationRows.length} rows attempted (skipDuplicates)`);

  // =========================================================================
  // AQMS: Extra AQParametersThreshold rows (CO2, CH4, H2S, NMHC)
  // =========================================================================
  log('Seeding extra AQMS thresholds...');
  const extraThresholdDefs = [
    { parameterName: 'CO2',  standardType: 'WHO_ANNUAL', minValue: 0, maxValue: 1000 },
    { parameterName: 'CH4',  standardType: 'WHO_ANNUAL', minValue: 0, maxValue: 2    },
    { parameterName: 'H2S',  standardType: 'WHO_24H',    minValue: 0, maxValue: 0.1  },
    { parameterName: 'NMHC', standardType: 'WHO_ANNUAL', minValue: 0, maxValue: 0.3  },
  ];
  for (let i = 0; i < extraThresholdDefs.length; i++) {
    const { parameterName, ...tData } = extraThresholdDefs[i];
    await prismaAqms.aqmsAQParametersThreshold.upsert({
      where: { id: createdThresholds.length + i + 1 },
      update: {},
      create: { ...tData, parameterId: aqmsParamId(parameterName) },
    });
  }
  log(`  extra thresholds: ${extraThresholdDefs.length} rows`);

  // =========================================================================
  // AQMS: NotificationMaster + NotificationLog
  // =========================================================================
  log('Seeding AQMS notification masters...');
  const notifMasterDefs = [
    { notificationCode: 'NOTIF_PM25_HIGH',  notificationName: 'PM2.5 High Alert',      severityLevel: 'CRITICAL', description: 'PM2.5 concentration exceeded safe threshold' },
    { notificationCode: 'NOTIF_PM10_HIGH',  notificationName: 'PM10 High Alert',        severityLevel: 'WARN',     description: 'PM10 concentration exceeded safe threshold' },
    { notificationCode: 'NOTIF_NO2_HIGH',   notificationName: 'NO2 High Alert',         severityLevel: 'WARN',     description: 'NO2 concentration exceeded safe threshold' },
    { notificationCode: 'NOTIF_SO2_HIGH',   notificationName: 'SO2 High Alert',         severityLevel: 'CRITICAL', description: 'SO2 concentration exceeded safe threshold' },
    { notificationCode: 'NOTIF_O3_HIGH',    notificationName: 'Ozone High Alert',       severityLevel: 'INFO',     description: 'O3 concentration exceeded peak 8-hour threshold' },
  ];

  const createdNotifMasters = [];
  for (const nm of notifMasterDefs) {
    const rec = await prismaAqms.aqmsNotificationMaster.upsert({
      where: { notificationCode: nm.notificationCode },
      update: {},
      create: nm,
    });
    createdNotifMasters.push(rec);
  }
  log(`  notification masters: ${createdNotifMasters.length} rows`);

  log('Seeding AQMS notification logs...');
  const notifStatuses  = ['SENT', 'PENDING', 'FAILED'];
  const notifPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  const aqmsUserIds = [aqmsAdmin.id, aqmsMember.id];
  const notifLogRows = [];
  for (let i = 0; i < 10; i++) {
    const master = createdNotifMasters[i % createdNotifMasters.length];
    const userId = aqmsUserIds[i % aqmsUserIds.length];
    notifLogRows.push({
      notificationTypeId: master.id,
      userId,
      priority:           notifPriorities[i % notifPriorities.length],
      subject:            `${master.notificationName} - Station Alert #${i + 1}`,
      message:            `Automated alert: ${master.description}. Please review station data immediately.`,
      notificationStatus: notifStatuses[i % notifStatuses.length],
    });
  }
  await prismaAqms.aqmsNotificationLog.createMany({ data: notifLogRows, skipDuplicates: true });
  log(`  notification logs: ${notifLogRows.length} rows`);

  // =========================================================================
  // MWQ: Reports
  // =========================================================================
  log('Seeding MWQ reports...');
  const mwqReportDefs = [
    { formats: ['PDF'],        status: 'READY',      userId: mwqAdmin.id,  module: 'MWQ', completedAt: new Date(anchorNow() - 2 * 86400 * 1000) },
    { formats: ['XLSX'],       status: 'READY',      userId: mwqMember.id, module: 'MWQ', completedAt: new Date(anchorNow() - 1 * 86400 * 1000) },
    { formats: ['DOCX'],       status: 'PROCESSING', userId: mwqAdmin.id,  module: 'MWQ', completedAt: null },
    { formats: ['PDF', 'XLSX'], status: 'PENDING',   userId: mwqMember.id, module: 'MWQ', completedAt: null },
    { formats: ['XLSX'],       status: 'FAILED',     userId: mwqAdmin.id,  module: 'MWQ', completedAt: null },
  ];
  const mwqNowMs = anchorNow();
  for (let i = 0; i < mwqReportDefs.length; i++) {
    const def = mwqReportDefs[i];
    await prismaMwq.report.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        userId:      def.userId,
        module:      def.module,
        parameterIds: [1, 2, 3],
        stationIds:   [1],
        startDate:   new Date(mwqNowMs - 30 * 86400 * 1000),
        endDate:     new Date(mwqNowMs),
        formats:     def.formats,
        storagePaths: {},
        status:      def.status,
        completedAt: def.completedAt,
      },
    });
  }
  log(`  mwq reports: ${mwqReportDefs.length} rows`);

  // =========================================================================
  // AQMS: Reports
  // =========================================================================
  log('Seeding AQMS reports...');
  const aqmsReportDefs = [
    { formats: ['PDF'],        status: 'READY',      userId: aqmsAdmin.id,  module: 'AQMS', completedAt: new Date(anchorNow() - 2 * 86400 * 1000) },
    { formats: ['XLSX'],       status: 'READY',      userId: aqmsMember.id, module: 'AQMS', completedAt: new Date(anchorNow() - 1 * 86400 * 1000) },
    { formats: ['DOCX'],       status: 'PROCESSING', userId: aqmsAdmin.id,  module: 'AQMS', completedAt: null },
    { formats: ['PDF', 'XLSX'], status: 'PENDING',   userId: aqmsMember.id, module: 'AQMS', completedAt: null },
    { formats: ['XLSX'],       status: 'FAILED',     userId: aqmsAdmin.id,  module: 'AQMS', completedAt: null },
  ];
  const aqmsNowMs = anchorNow();
  for (let i = 0; i < aqmsReportDefs.length; i++) {
    const def = aqmsReportDefs[i];
    await prismaAqms.report.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        userId:      def.userId,
        module:      def.module,
        parameterIds: [1, 2, 3],
        stationIds:   [1],
        startDate:   new Date(aqmsNowMs - 30 * 86400 * 1000),
        endDate:     new Date(aqmsNowMs),
        formats:     def.formats,
        storagePaths: {},
        status:      def.status,
        completedAt: def.completedAt,
      },
    });
  }
  log(`  aqms reports: ${aqmsReportDefs.length} rows`);

  // Real downloadable AQMS reports (folded in from seed-aqms-reports.js).
  await seedAqmsRealReports(aqmsAdmin.id);

  log(`Seed complete. Sensor rows target: ${SEED_SENSOR_ROWS}.`);
}

main()
  .catch(err => { console.error('[seed] Fatal error:', err); process.exit(1); })
  .finally(async () => {
    await prismaMwq.$disconnect();
    await prismaAqms.$disconnect();
    await prismaHl.$disconnect();
  });
