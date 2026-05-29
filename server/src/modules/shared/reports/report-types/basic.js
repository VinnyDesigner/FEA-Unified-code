'use strict';

// Average Reports category — reference implementation + average data trend.
// (Kept in this file because "Basic Data Export" is the canonical reference the
//  other report-type modules are patterned after.)
const { runAqms, fmt, iso, defaultTitle } = require('./helpers');

// ── basic_data_export ────────────────────────────────────────────────────────
// Raw ambient observations (the original/only report shape pre-Option-B).
const basic_data_export = {
  key: 'basic_data_export',
  label: 'Basic Data Export',
  modules: ['AQMS', 'MWQ'],
  columns: [
    { header: 'Station',   key: 'station',   width: 24 },
    { header: 'Parameter', key: 'parameter', width: 18 },
    { header: 'Time',      key: 'time',      width: 24 },
    { header: 'Value',     key: 'value',     width: 14 },
    { header: 'Unit',      key: 'unit',      width: 12 },
  ],
  title: (body) => defaultTitle('Basic Data Export', body),
  async fetchRows(prisma, { module, stationIds, parameterIds, startDate, endDate }) {
    // MWQ stores raw sonde readings in a different schema than AQMS; branch on module.
    const sql = module === 'MWQ'
      ? `
        SELECT b."BuoyName" station, p."ParameterName" parameter,
               o."ObservationTime" t, o."Value" value, u."UnitName" unit
        FROM mwq_sonde_observations o
        JOIN mwq_buoys             b ON b."BuoyID"      = o."BuoyID"
        JOIN mwq_parameter_masters p ON p."ParameterID" = o."ParameterID"
        JOIN mwq_parameter_units   u ON u."UnitID"      = p."UnitID"
        WHERE o."BuoyID" = ANY($1::int[]) AND o."ParameterID" = ANY($2::int[])
          AND o."ObservationTime" >= $3 AND o."ObservationTime" <= $4
        ORDER BY b."BuoyName", p."ParameterName", o."ObservationTime" ASC
      `
      : `
        SELECT s."StationName" station, p."ParameterName" parameter,
               o."DateTime" t, o."Value" value, u."UnitName" unit
        FROM aqms_ambient_air_quality_observations o
        JOIN aqms_monitoring_sites s   ON s."StationID"   = o."StationID"
        JOIN aqms_parameter_masters p  ON p."ParameterID" = o."ParameterID"
        JOIN aqms_measurement_units u  ON u."UnitID"      = o."UnitID"
        WHERE o."StationID" = ANY($1::int[]) AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime" >= $3 AND o."DateTime" <= $4
        ORDER BY s."StationName", p."ParameterName", o."DateTime" ASC
      `;
    const rows = await runAqms(prisma, sql, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station: r.station, parameter: r.parameter,
      time: iso(r.t), value: fmt(r.value), unit: r.unit,
    }));
  },
};

// ── average_data_trend ───────────────────────────────────────────────────────
// Hourly mean per station/parameter — the smoothed trend line.
const average_data_trend = {
  key: 'average_data_trend',
  label: 'Average Data Trend Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',    key: 'station',   width: 24 },
    { header: 'Parameter',  key: 'parameter', width: 18 },
    { header: 'Hour (UTC)', key: 'hour',      width: 24 },
    { header: 'Avg Value',  key: 'avg',       width: 14 },
    { header: 'Samples',    key: 'samples',   width: 10 },
    { header: 'Unit',       key: 'unit',      width: 12 },
  ],
  title: (body) => defaultTitle('Average Data Trend Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const rows = await runAqms(prisma, `
      SELECT s."StationName" station, p."ParameterName" parameter,
             date_trunc('hour', o."DateTime") AS bucket,
             AVG(o."Value")::float8 avg, COUNT(*)::int samples,
             MAX(u."UnitName") unit
      FROM aqms_ambient_air_quality_observations o
      JOIN aqms_monitoring_sites s   ON s."StationID"   = o."StationID"
      JOIN aqms_parameter_masters p  ON p."ParameterID" = o."ParameterID"
      JOIN aqms_measurement_units u  ON u."UnitID"      = o."UnitID"
      WHERE o."StationID" = ANY($1::int[]) AND o."ParameterID" = ANY($2::int[])
        AND o."DateTime" >= $3 AND o."DateTime" <= $4
      GROUP BY s."StationName", p."ParameterName", date_trunc('hour', o."DateTime")
      ORDER BY s."StationName", p."ParameterName", bucket ASC
    `, [stationIds, parameterIds, startDate, endDate]);
    return rows.map(r => ({
      station: r.station, parameter: r.parameter,
      hour: iso(r.bucket), avg: fmt(r.avg), samples: r.samples, unit: r.unit,
    }));
  },
};

module.exports = { basic_data_export, average_data_trend };
