'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Seed one AQMS report per report-type × station for 21–28 May 2026.
//
// Drives the production reporting service (src/modules/shared/reports), which now
// dispatches on `reportType` — so every report listed in the /data-capture
// "Generate Report" menu is produced as a real Report row + downloadable files.
//
// Idempotent: deletes prior AQMS reports for this window whose reportType is one
// of the known types (and their on-disk folders) before regenerating.
//
//   node prisma/seed-aqms-reports.js          (run from the server/ directory)
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const path = require('path');
const fs = require('node:fs');
const { prismaAqms } = require('../src/db/prisma');
const { generate } = require('../src/modules/shared/reports/reports.service');
const { REPORT_TYPE_KEYS, getReportType } = require('../src/modules/shared/reports/report-types');
const { LOCAL_ROOT } = require('../src/lib/storage');

const START = new Date('2026-05-21T00:00:00.000Z');
const END   = new Date('2026-05-28T23:59:59.999Z');
const ALL_FORMATS = ['PDF', 'XLSX', 'DOCX'];

function log(msg) { console.log(`[seed-aqms-reports] ${msg}`); }

// Pollutant parameter IDs that actually have ambient data for a station in window.
async function pollutantIds(stationId) {
  const rows = await prismaAqms.$queryRawUnsafe(`
    SELECT DISTINCT o."ParameterID" pid
    FROM aqms_ambient_air_quality_observations o
    JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
    WHERE o."StationID" = $1 AND p."ParameterTypeCode" = 'POLLUTANT'
      AND o."DateTime" >= $2 AND o."DateTime" <= $3
    ORDER BY pid`, stationId, START, END);
  return rows.map(r => r.pid);
}

// Generate one report; fall back to XLSX-only if PDF/DOCX exceed the row limit.
async function generateWithFallback(userId, body) {
  try {
    return await generate(userId, body);
  } catch (e) {
    if (e.code === 'ROW_LIMIT_EXCEEDED' && body.formats.length > 1) {
      const retry = { ...body, formats: ['XLSX'] };
      const r = await generate(userId, retry);
      r._fallback = 'XLSX-only (row limit)';
      return r;
    }
    throw e;
  }
}

async function cleanupPrior() {
  const prior = await prismaAqms.report.findMany({
    where: { module: 'AQMS', reportType: { in: REPORT_TYPE_KEYS }, startDate: START },
    select: { id: true },
  });
  if (!prior.length) return 0;
  for (const { id } of prior) {
    const dir = path.join(LOCAL_ROOT, String(id));
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  await prismaAqms.report.deleteMany({ where: { id: { in: prior.map(p => p.id) } } });
  return prior.length;
}

async function main() {
  const owner = await prismaAqms.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
  if (!owner) throw new Error('No AQMS ADMIN user — run the base seed first.');
  log(`Owner: ${owner.email} (id=${owner.id})  window ${START.toISOString().slice(0,10)}..${END.toISOString().slice(0,10)}`);

  const removed = await cleanupPrior();
  if (removed) log(`Idempotent cleanup: removed ${removed} prior typed report(s) + folders.`);

  const stations = await prismaAqms.aqmsMonitoringSite.findMany({
    select: { id: true, stationName: true }, orderBy: { id: 'asc' },
  });

  const results = [];
  for (const rtKey of REPORT_TYPE_KEYS) {
    const def = getReportType(rtKey);
    if (!def || !def.modules.includes('AQMS')) { log(`SKIP ${rtKey}: not an AQMS type`); continue; }
    for (const st of stations) {
      const pids = await pollutantIds(st.id);
      if (pids.length === 0) { log(`SKIP ${rtKey}/${st.stationName}: no pollutant data`); continue; }
      try {
        const report = await generateWithFallback(owner.id, {
          module: 'AQMS', reportType: rtKey,
          stationIds: [st.id], parameterIds: pids,
          startDate: START, endDate: END, formats: ALL_FORMATS,
        });
        results.push({ id: report.id, rtKey, station: st.stationName, status: report.status,
                       formats: report.formats, fallback: report._fallback || '' });
      } catch (e) {
        log(`FAIL ${rtKey}/${st.stationName}: ${e.code || ''} ${e.message}`);
        results.push({ id: null, rtKey, station: st.stationName, status: 'FAILED', formats: [], error: e.message });
      }
    }
  }

  log('───────────────────────────────────────────────────────────');
  log(`Generated ${results.filter(r => r.status === 'READY').length}/${results.length} reports across ${REPORT_TYPE_KEYS.length} types × ${stations.length} stations:`);
  let lastType = '';
  for (const r of results) {
    if (r.rtKey !== lastType) { log(`• ${r.rtKey}`); lastType = r.rtKey; }
    log(`    #${r.id ?? '—'}  ${String(r.status).padEnd(7)} [${r.formats.join('+') || '-'}] ${r.station}${r.fallback ? '  ('+r.fallback+')' : ''}${r.error ? '  ERR: '+r.error : ''}`);
  }
  const failed = results.filter(r => r.status !== 'READY');
  if (failed.length) { log(`FAILURES: ${failed.length}`); process.exitCode = 3; }
  else log('All reports READY. ✔');
}

main()
  .catch(err => { console.error('[seed-aqms-reports] Fatal:', err); process.exit(1); })
  .finally(async () => { await prismaAqms.$disconnect(); });
