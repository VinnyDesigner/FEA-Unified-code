'use strict';

// Shared helpers for AQMS report-type definitions.
// Each report-type module exports a map { <key>: definition } where a definition is:
//   {
//     key: 'snake_case',                 // matches reportType enum + /data-capture menu slug
//     label: 'Human Readable Name',      // matches the /data-capture report menu label
//     modules: ['AQMS'],                 // supported modules
//     columns: [{ header, key, width }], // passed verbatim to the xlsx/docx/pdf formatters
//     title: (body) => 'string',         // report heading
//     async fetchRows(prisma, body) -> [ { <columns[].key>: value, ... } ]  // plain serializable rows
//   }
// `body` is { module, reportType, stationIds, parameterIds, startDate, endDate, formats }.

// Run a parameterized raw query against the AQMS datasource.
function runAqms(prisma, sql, params) {
  return prisma.$queryRawUnsafe(sql, ...params);
}

// Coerce pg/Prisma numeric (string|Decimal|number|bigint) to a JS number, or null.
function num(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// Fixed-precision string for display columns ('' when null).
function fmt(v, dp = 4) {
  const n = num(v);
  return n === null ? '' : n.toFixed(dp);
}

// ISO string for a Date/timestamp value ('' when null).
function iso(v) {
  if (!v) return '';
  return new Date(v).toISOString();
}

// 16-point compass sectors (centered) used by windrose / pollutionrose reports.
const SECTORS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

// SQL CASE expression mapping a degrees column (0..360) to a 16-point sector label.
// Each sector spans 22.5°, centered on its compass bearing (N = [348.75,360)∪[0,11.25)).
function sectorCaseSql(degCol) {
  const cases = SECTORS.map((s, i) => {
    const lo = (i * 22.5 - 11.25 + 360) % 360;
    const hi = (i * 22.5 + 11.25) % 360;
    const cond = lo < hi
      ? `${degCol} >= ${lo} AND ${degCol} < ${hi}`
      : `${degCol} >= ${lo} OR ${degCol} < ${hi}`; // wraps past 360 (N)
    return `WHEN ${cond} THEN '${s}'`;
  }).join(' ');
  return `CASE ${cases} ELSE 'N' END`;
}

// Wind-speed Beaufort-ish classes used by the windrose report.
const SPEED_CLASSES = [
  { label: 'Calm (0-1 m/s)',   min: 0,  max: 1 },
  { label: 'Light (1-3 m/s)',  min: 1,  max: 3 },
  { label: 'Gentle (3-5 m/s)', min: 3,  max: 5 },
  { label: 'Mod (5-8 m/s)',    min: 5,  max: 8 },
  { label: 'Fresh (8+ m/s)',   min: 8,  max: Infinity },
];

function defaultTitle(label, { module, startDate, endDate }) {
  const s = new Date(startDate).toISOString().slice(0, 10);
  const e = new Date(endDate).toISOString().slice(0, 10);
  return `${module} ${label} — ${s} to ${e}`;
}

module.exports = { runAqms, num, fmt, iso, SECTORS, sectorCaseSql, SPEED_CLASSES, defaultTitle };
