'use strict';

// Statistical Reports category — five aggregated report types.
// All follow the same contract as basic.js / helpers.js:
//   key, label, modules, columns, title(body), fetchRows(prisma, body)
const { runAqms, num, fmt, iso, defaultTitle } = require('./helpers');

// ── concentration_distribution ───────────────────────────────────────────────
// For each station×param, split the observed value range into 4 equal bands
// (quartile-width buckets) and count readings per band.
// Columns: station, parameter, band, cnt, percent
const concentration_distribution = {
  key: 'concentration_distribution',
  label: 'Concentration Distribution',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',    key: 'station',   width: 24 },
    { header: 'Parameter',  key: 'parameter', width: 18 },
    { header: 'Band',       key: 'band',      width: 22 },
    { header: 'Count',      key: 'cnt',       width: 10 },
    { header: 'Percent',    key: 'percent',   width: 12 },
  ],
  title: (body) => defaultTitle('Concentration Distribution', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    // Compute per-group min/max then bucket each reading into 4 equal-width bands.
    const rows = await runAqms(prisma, `
      WITH bounds AS (
        SELECT o."StationID", o."ParameterID",
               MIN(o."Value")::float8 AS lo,
               MAX(o."Value")::float8 AS hi,
               COUNT(*)::int          AS total
        FROM aqms_ambient_air_quality_observations o
        WHERE o."StationID"   = ANY($1::int[])
          AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime" >= $3 AND o."DateTime" <= $4
        GROUP BY o."StationID", o."ParameterID"
      ),
      bucketed AS (
        SELECT s."StationName"   AS station,
               p."ParameterName" AS parameter,
               b.lo, b.hi, b.total,
               CASE
                 WHEN b.hi = b.lo THEN 1
                 ELSE LEAST(
                   CEIL((o."Value" - b.lo) / NULLIF((b.hi - b.lo) / 4.0, 0))::int,
                   4
                 )
               END AS band_num,
               o."Value"::float8 AS val
        FROM aqms_ambient_air_quality_observations o
        JOIN aqms_monitoring_sites  s ON s."StationID"   = o."StationID"
        JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
        JOIN bounds b
          ON b."StationID"   = o."StationID"
         AND b."ParameterID" = o."ParameterID"
        WHERE o."StationID"   = ANY($1::int[])
          AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime" >= $3 AND o."DateTime" <= $4
      ),
      grouped AS (
        SELECT station, parameter, lo, hi, total, band_num,
               COUNT(*)::int AS band_cnt
        FROM bucketed
        GROUP BY station, parameter, lo, hi, total, band_num
      )
      SELECT station, parameter,
             band_num,
             lo + (band_num - 1) * (hi - lo) / 4.0 AS band_lo,
             lo + band_num       * (hi - lo) / 4.0 AS band_hi,
             band_cnt AS cnt,
             (band_cnt::float8 / NULLIF(total, 0) * 100.0)::float8 AS pct
      FROM grouped
      ORDER BY station, parameter, band_num
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => ({
      station:   r.station,
      parameter: r.parameter,
      band:      `Q${num(r.band_num)} ${fmt(r.band_lo, 2)}-${fmt(r.band_hi, 2)}`,
      cnt:       num(r.cnt),
      percent:   fmt(r.pct, 1),
    }));
  },
};

// ── frequency_distribution ───────────────────────────────────────────────────
// Per station×param histogram with 10 equal-width bins between min and max.
// Columns: station, parameter, bin_start, bin_end, frequency, cumulative_percent
const frequency_distribution = {
  key: 'frequency_distribution',
  label: 'Frequency Distribution',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',            key: 'station',            width: 24 },
    { header: 'Parameter',          key: 'parameter',          width: 18 },
    { header: 'Bin Start',          key: 'bin_start',          width: 14 },
    { header: 'Bin End',            key: 'bin_end',            width: 14 },
    { header: 'Frequency',          key: 'frequency',          width: 12 },
    { header: 'Cumulative %',       key: 'cumulative_percent', width: 14 },
  ],
  title: (body) => defaultTitle('Frequency Distribution', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      WITH bounds AS (
        SELECT o."StationID", o."ParameterID",
               MIN(o."Value")::float8 AS lo,
               MAX(o."Value")::float8 AS hi,
               COUNT(*)::int          AS total
        FROM aqms_ambient_air_quality_observations o
        WHERE o."StationID"   = ANY($1::int[])
          AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime" >= $3 AND o."DateTime" <= $4
        GROUP BY o."StationID", o."ParameterID"
      ),
      bucketed AS (
        SELECT s."StationName"   AS station,
               p."ParameterName" AS parameter,
               b.lo, b.hi, b.total,
               CASE
                 WHEN b.hi = b.lo THEN 1
                 ELSE LEAST(
                   CEIL((o."Value" - b.lo) / NULLIF((b.hi - b.lo) / 10.0, 0))::int,
                   10
                 )
               END AS bin_num
        FROM aqms_ambient_air_quality_observations o
        JOIN aqms_monitoring_sites  s ON s."StationID"   = o."StationID"
        JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
        JOIN bounds b
          ON b."StationID"   = o."StationID"
         AND b."ParameterID" = o."ParameterID"
        WHERE o."StationID"   = ANY($1::int[])
          AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime" >= $3 AND o."DateTime" <= $4
      ),
      grouped AS (
        SELECT station, parameter, lo, hi, total, bin_num,
               COUNT(*)::int AS freq
        FROM bucketed
        GROUP BY station, parameter, lo, hi, total, bin_num
      )
      SELECT station, parameter, bin_num,
             lo + (bin_num - 1) * (hi - lo) / 10.0 AS bin_lo,
             lo + bin_num       * (hi - lo) / 10.0 AS bin_hi,
             freq,
             total,
             SUM(freq) OVER (
               PARTITION BY station, parameter
               ORDER BY bin_num
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
             )::int AS running
      FROM grouped
      ORDER BY station, parameter, bin_num
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => ({
      station:            r.station,
      parameter:          r.parameter,
      bin_start:          fmt(r.bin_lo, 2),
      bin_end:            fmt(r.bin_hi, 2),
      frequency:          num(r.freq),
      cumulative_percent: fmt(num(r.running) / (num(r.total) || 1) * 100, 1),
    }));
  },
};

// ── max_hourly_values ────────────────────────────────────────────────────────
// MAX value per hour per station×param (mirrors average_data_trend but uses MAX).
// Columns: station, parameter, hour, max_value, unit
const max_hourly_values = {
  key: 'max_hourly_values',
  label: 'Max Hourly Values Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',    key: 'station',    width: 24 },
    { header: 'Parameter',  key: 'parameter',  width: 18 },
    { header: 'Hour (UTC)', key: 'hour',       width: 24 },
    { header: 'Max Value',  key: 'max_value',  width: 14 },
    { header: 'Unit',       key: 'unit',       width: 12 },
  ],
  title: (body) => defaultTitle('Max Hourly Values Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"   AS station,
             p."ParameterName" AS parameter,
             date_trunc('hour', o."DateTime") AS bucket,
             MAX(o."Value")::float8  AS max_val,
             MAX(u."UnitName")       AS unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites  s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units u ON u."UnitID"      = o."UnitID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3 AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName", date_trunc('hour', o."DateTime")
      ORDER BY s."StationName", p."ParameterName", bucket ASC
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => ({
      station:   r.station,
      parameter: r.parameter,
      hour:      iso(r.bucket),
      max_value: fmt(r.max_val),
      unit:      r.unit,
    }));
  },
};

// ── network_data_recovery ────────────────────────────────────────────────────
// Per station×param data completeness over the query window.
// expected_hours = span hours; received_hours = distinct hours with observations.
// Columns: station, parameter, expected_hours, received_hours, recovery_pct
const network_data_recovery = {
  key: 'network_data_recovery',
  label: 'Network Data Recovery Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',         key: 'station',         width: 24 },
    { header: 'Parameter',       key: 'parameter',       width: 18 },
    { header: 'Expected Hours',  key: 'expected_hours',  width: 16 },
    { header: 'Received Hours',  key: 'received_hours',  width: 16 },
    { header: 'Recovery %',      key: 'recovery_pct',    width: 14 },
  ],
  title: (body) => defaultTitle('Network Data Recovery Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    // expected = floor of epoch diff / 3600 + 1 (number of hour slots in the window)
    const rows = await runAqms(prisma, `
      SELECT s."StationName"   AS station,
             p."ParameterName" AS parameter,
             (FLOOR(EXTRACT(EPOCH FROM ($4::timestamptz - $3::timestamptz)) / 3600) + 1)::int AS expected,
             COUNT(DISTINCT date_trunc('hour', o."DateTime"))::int AS received
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites  s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters p ON p."ParameterID" = o."ParameterID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3 AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName"
      ORDER BY s."StationName", p."ParameterName"
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => {
      const expected = num(r.expected);
      const received = num(r.received);
      return {
        station:        r.station,
        parameter:      r.parameter,
        expected_hours: expected,
        received_hours: received,
        recovery_pct:   fmt((received / (expected || 1)) * 100, 1),
      };
    });
  },
};

// ── violation_of_standards ───────────────────────────────────────────────────
// AGGREGATED: join thresholds on ParameterID; a violation = Value > MaxValue.
// Group by station×param×standard — do NOT list every row.
// Columns: station, parameter, standard, limit, violations, max_value, avg_exceedance
const violation_of_standards = {
  key: 'violation_of_standards',
  label: 'Violation of Standards',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',         key: 'station',         width: 24 },
    { header: 'Parameter',       key: 'parameter',       width: 18 },
    { header: 'Standard',        key: 'standard',        width: 20 },
    { header: 'Limit',           key: 'limit',           width: 12 },
    { header: 'Violations',      key: 'violations',      width: 12 },
    { header: 'Max Value',       key: 'max_value',       width: 14 },
    { header: 'Avg Exceedance',  key: 'avg_exceedance',  width: 16 },
  ],
  title: (body) => defaultTitle('Violation of Standards', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName"                AS station,
             p."ParameterName"              AS parameter,
             t."StandardType"               AS standard,
             t."MaxValue"::float8           AS threshold,
             COUNT(*)::int                  AS violations,
             MAX(o."Value")::float8         AS max_val,
             AVG(o."Value" - t."MaxValue")::float8 AS avg_exc
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites         s ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters        p ON p."ParameterID" = o."ParameterID"
      JOIN aqms_aq_parameters_thresholds t ON t."ParameterID" = o."ParameterID"
      WHERE o."StationID"   = ANY($1::int[])
        AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3 AND o."DateTime" <= $4
        AND o."Value" > t."MaxValue"
      GROUP BY s."StationName", p."ParameterName", t."StandardType", t."MaxValue"
      ORDER BY s."StationName", p."ParameterName", t."StandardType"
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => ({
      station:        r.station,
      parameter:      r.parameter,
      standard:       r.standard,
      limit:          fmt(r.threshold),
      violations:     num(r.violations),
      max_value:      fmt(r.max_val),
      avg_exceedance: fmt(r.avg_exc),
    }));
  },
};

module.exports = {
  concentration_distribution,
  frequency_distribution,
  max_hourly_values,
  network_data_recovery,
  violation_of_standards,
};
