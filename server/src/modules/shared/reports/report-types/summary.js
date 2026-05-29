'use strict';

// Summary Reports category — 24h avg, 8h rolling avg, daily summary, monthly report.
const { runAqms, num, fmt, iso, defaultTitle } = require('./helpers');

// ── summary_24h_avg ──────────────────────────────────────────────────────────
// Daily 24-hour mean per station × parameter.
const summary_24h_avg = {
  key: 'summary_24h_avg',
  label: '24 Hour Avg Summary Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',   key: 'station',   width: 24 },
    { header: 'Parameter', key: 'parameter', width: 18 },
    { header: 'Day',       key: 'day',       width: 14 },
    { header: 'Avg 24h',   key: 'avg_24h',   width: 14 },
    { header: 'Samples',   key: 'samples',   width: 10 },
    { header: 'Unit',      key: 'unit',      width: 12 },
  ],
  title: (body) => defaultTitle('24 Hour Avg Summary Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"             AS station,
             p."ParameterName"           AS parameter,
             date_trunc('day', o."DateTime") AS bucket,
             AVG(o."Value")::float8      AS avg_24h,
             COUNT(*)::int               AS samples,
             MAX(u."UnitName")           AS unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites   s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters  p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units  u ON u."UnitID"      = o."UnitID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3
        AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName", date_trunc('day', o."DateTime")
      ORDER BY s."StationName", p."ParameterName", bucket ASC
    `, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station:   r.station,
      parameter: r.parameter,
      day:       iso(r.bucket).slice(0, 10),
      avg_24h:   fmt(r.avg_24h),
      samples:   num(r.samples),
      unit:      r.unit,
    }));
  },
};

// ── rolling_8h_avg ───────────────────────────────────────────────────────────
// Non-overlapping 8-hour block mean per station × parameter.
// Bucket = floor(epoch / 28800) * 28800  →  00:00, 08:00, 16:00 UTC blocks.
const rolling_8h_avg = {
  key: 'rolling_8h_avg',
  label: '8 Hour Rolling Avg Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',      key: 'station',       width: 24 },
    { header: 'Parameter',    key: 'parameter',     width: 18 },
    { header: 'Window Start', key: 'window_start',  width: 24 },
    { header: 'Avg 8h',       key: 'avg_8h',        width: 14 },
    { header: 'Samples',      key: 'samples',       width: 10 },
    { header: 'Unit',         key: 'unit',          width: 12 },
  ],
  title: (body) => defaultTitle('8 Hour Rolling Avg Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"                                                        AS station,
             p."ParameterName"                                                      AS parameter,
             to_timestamp(floor(extract(epoch from o."DateTime") / 28800) * 28800) AS bucket,
             AVG(o."Value")::float8                                                 AS avg_8h,
             COUNT(*)::int                                                          AS samples,
             MAX(u."UnitName")                                                      AS unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites   s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters  p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units  u ON u."UnitID"      = o."UnitID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3
        AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName",
               to_timestamp(floor(extract(epoch from o."DateTime") / 28800) * 28800)
      ORDER BY s."StationName", p."ParameterName", bucket ASC
    `, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station:      r.station,
      parameter:    r.parameter,
      window_start: iso(r.bucket),
      avg_8h:       fmt(r.avg_8h),
      samples:      num(r.samples),
      unit:         r.unit,
    }));
  },
};

// ── daily_summary ────────────────────────────────────────────────────────────
// Min, max, avg per station × parameter × day.
const daily_summary = {
  key: 'daily_summary',
  label: 'Daily Summary Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',   key: 'station',    width: 24 },
    { header: 'Parameter', key: 'parameter',  width: 18 },
    { header: 'Day',       key: 'day',        width: 14 },
    { header: 'Min',       key: 'min_value',  width: 14 },
    { header: 'Max',       key: 'max_value',  width: 14 },
    { header: 'Avg',       key: 'avg_value',  width: 14 },
    { header: 'Count',     key: 'count',      width: 10 },
    { header: 'Unit',      key: 'unit',       width: 12 },
  ],
  title: (body) => defaultTitle('Daily Summary Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"              AS station,
             p."ParameterName"            AS parameter,
             date_trunc('day', o."DateTime") AS bucket,
             MIN(o."Value")::float8       AS lo,
             MAX(o."Value")::float8       AS hi,
             AVG(o."Value")::float8       AS av,
             COUNT(*)::int                AS cnt,
             MAX(u."UnitName")            AS unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites   s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters  p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units  u ON u."UnitID"      = o."UnitID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3
        AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName", date_trunc('day', o."DateTime")
      ORDER BY s."StationName", p."ParameterName", bucket ASC
    `, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station:   r.station,
      parameter: r.parameter,
      day:       iso(r.bucket).slice(0, 10),
      min_value: fmt(r.lo),
      max_value: fmt(r.hi),
      avg_value: fmt(r.av),
      count:     num(r.cnt),
      unit:      r.unit,
    }));
  },
};

// ── monthly_report ───────────────────────────────────────────────────────────
// Min, max, avg per station × parameter × calendar month.
const monthly_report = {
  key: 'monthly_report',
  label: 'Monthly Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',   key: 'station',    width: 24 },
    { header: 'Parameter', key: 'parameter',  width: 18 },
    { header: 'Month',     key: 'month',      width: 10 },
    { header: 'Min',       key: 'min_value',  width: 14 },
    { header: 'Max',       key: 'max_value',  width: 14 },
    { header: 'Avg',       key: 'avg_value',  width: 14 },
    { header: 'Count',     key: 'count',      width: 10 },
    { header: 'Unit',      key: 'unit',       width: 12 },
  ],
  title: (body) => defaultTitle('Monthly Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"                      AS station,
             p."ParameterName"                    AS parameter,
             to_char(o."DateTime", 'YYYY-MM')     AS ym,
             MIN(o."Value")::float8               AS lo,
             MAX(o."Value")::float8               AS hi,
             AVG(o."Value")::float8               AS av,
             COUNT(*)::int                        AS cnt,
             MAX(u."UnitName")                    AS unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites   s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters  p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units  u ON u."UnitID"      = o."UnitID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3
        AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName", to_char(o."DateTime", 'YYYY-MM')
      ORDER BY s."StationName", p."ParameterName", ym ASC
    `, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station:   r.station,
      parameter: r.parameter,
      month:     r.ym,
      min_value: fmt(r.lo),
      max_value: fmt(r.hi),
      avg_value: fmt(r.av),
      count:     num(r.cnt),
      unit:      r.unit,
    }));
  },
};

module.exports = { summary_24h_avg, rolling_8h_avg, daily_summary, monthly_report };
