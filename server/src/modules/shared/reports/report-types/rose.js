'use strict';

// Met / Pollutionrose Reports category — windrose and pollutionrose.
const { runAqms, num, fmt, iso, defaultTitle, SECTORS, sectorCaseSql, SPEED_CLASSES } = require('./helpers');

// ── windrose ─────────────────────────────────────────────────────────────────
// Wind speed × direction frequency by 16-sector and speed class.
// Joins met Wind Direction (ParameterID=16) with Wind Speed (ParameterID=15)
// on the same StationID + DateTime, then buckets by sector + speed class.
// stationIds filter is applied; parameterIds is ignored for this report.
const windrose = {
  key: 'windrose',
  label: 'Windrose Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',     key: 'station',     width: 24 },
    { header: 'Direction',   key: 'direction',   width: 10 },
    { header: 'Speed Class', key: 'speed_class', width: 20 },
    { header: 'Count',       key: 'count',       width: 10 },
    { header: 'Percent (%)', key: 'percent',     width: 12 },
  ],
  title: (body) => defaultTitle('Windrose Report', body),
  async fetchRows(prisma, { stationIds, startDate, endDate }) {
    // Build the CASE expression for speed classes from SPEED_CLASSES boundaries.
    const speedCaseFragments = SPEED_CLASSES.map(sc => {
      if (sc.max === Infinity) {
        return `WHEN spd."Value" >= ${sc.min} THEN '${sc.label}'`;
      }
      return `WHEN spd."Value" >= ${sc.min} AND spd."Value" < ${sc.max} THEN '${sc.label}'`;
    }).join(' ');
    const speedCaseSql = `CASE ${speedCaseFragments} ELSE '${SPEED_CLASSES[0].label}' END`;

    // sectorCaseSql needs the column expression for the direction value.
    const dirSector = sectorCaseSql('dir."Value"');

    const rows = await runAqms(prisma, `
      WITH paired AS (
        SELECT dir."StationID",
               ${dirSector}        AS sector,
               ${speedCaseSql}     AS spd_class
        FROM aqms_meteorological_observations dir
        JOIN aqms_meteorological_observations spd
          ON spd."StationID"   = dir."StationID"
         AND spd."DateTime"    = dir."DateTime"
         AND spd."ParameterID" = 15
        WHERE dir."ParameterID" = 16
          AND dir."StationID" = ANY($1::int[])
          AND dir."DateTime"  >= $2
          AND dir."DateTime"  <= $3
      ),
      totals AS (
        SELECT "StationID", COUNT(*)::int AS total
        FROM paired
        GROUP BY "StationID"
      )
      SELECT s."StationName"       AS station,
             p.sector              AS direction,
             p.spd_class           AS speed_class,
             COUNT(*)::int         AS cnt,
             totals.total
      FROM paired p
      JOIN totals           ON totals."StationID"  = p."StationID"
      JOIN aqms_monitoring_sites s ON s."StationID" = p."StationID"
      GROUP BY s."StationName", p.sector, p.spd_class, totals.total
      ORDER BY s."StationName", p.sector, p.spd_class
    `, [stationIds, startDate, endDate]);

    return rows.map(r => ({
      station:     r.station,
      direction:   r.direction,
      speed_class: r.speed_class,
      count:       num(r.cnt),
      percent:     fmt(num(r.cnt) / num(r.total) * 100, 2),
    }));
  },
};

// ── pollutionrose ─────────────────────────────────────────────────────────────
// Mean pollutant concentration by 16-sector wind direction.
// Because ambient obs and met obs are recorded at different sub-second timestamps,
// we bucket both series to the hour and join on station + hour bucket.
// The dominant wind direction sector in each hour is used for the pollutant readings
// in that same hour.
const pollutionrose = {
  key: 'pollutionrose',
  label: 'Pollutionrose Report',
  modules: ['AQMS'],
  columns: [
    { header: 'Station',         key: 'station',           width: 24 },
    { header: 'Parameter',       key: 'parameter',         width: 18 },
    { header: 'Direction',       key: 'direction',         width: 10 },
    { header: 'Avg Conc.',       key: 'avg_concentration', width: 14 },
    { header: 'Count',           key: 'count',             width: 10 },
    { header: 'Unit',            key: 'unit',              width: 12 },
  ],
  title: (body) => defaultTitle('Pollutionrose Report', body),
  async fetchRows(prisma, { stationIds, parameterIds, startDate, endDate }) {
    const dirSector = sectorCaseSql('d."Value"');

    const rows = await runAqms(prisma, `
      WITH wind_hourly AS (
        -- Dominant (mode) wind direction sector per station per hour.
        -- Use the average direction value within each hour, then map to sector.
        SELECT "StationID",
               date_trunc('hour', "DateTime") AS hr,
               AVG("Value")::float8           AS avg_dir
        FROM aqms_meteorological_observations
        WHERE "ParameterID" = 16
          AND "StationID" = ANY($1::int[])
          AND "DateTime"  >= $3
          AND "DateTime"  <= $4
        GROUP BY "StationID", date_trunc('hour', "DateTime")
      ),
      pollutant_hourly AS (
        -- Mean pollutant concentration per station × parameter × hour.
        SELECT o."StationID",
               o."ParameterID",
               date_trunc('hour', o."DateTime") AS hr,
               AVG(o."Value")::float8           AS avg_conc,
               COUNT(*)::int                    AS cnt,
               MAX(u."UnitName")                AS unit
        FROM aqms_ambient_air_quality_observations o
        JOIN aqms_measurement_units u ON u."UnitID" = o."UnitID"
        WHERE o."StationID"   = ANY($1::int[])
          AND o."ParameterID" = ANY($2::int[])
          AND o."DateTime"   >= $3
          AND o."DateTime"   <= $4
        GROUP BY o."StationID", o."ParameterID", date_trunc('hour', o."DateTime")
      )
      SELECT s."StationName"                         AS station,
             p."ParameterName"                       AS parameter,
             ${sectorCaseSql('w.avg_dir')}           AS direction,
             AVG(ph.avg_conc)::float8                AS avg_conc,
             SUM(ph.cnt)::int                        AS cnt,
             MAX(ph.unit)                            AS unit
      FROM pollutant_hourly ph
      JOIN wind_hourly           w ON w."StationID" = ph."StationID"
                                   AND w.hr          = ph.hr
      JOIN aqms_monitoring_sites s ON s."StationID"  = ph."StationID"
      JOIN aqms_parameter_masters p ON p."ParameterID" = ph."ParameterID"
      GROUP BY s."StationName", p."ParameterName", ${sectorCaseSql('w.avg_dir')}
      ORDER BY s."StationName", p."ParameterName", direction
    `, [stationIds, parameterIds, startDate, endDate]);

    return rows.map(r => ({
      station:           r.station,
      parameter:         r.parameter,
      direction:         r.direction,
      avg_concentration: fmt(r.avg_conc, 4),
      count:             num(r.cnt),
      unit:              r.unit,
    }));
  },
};

module.exports = { windrose, pollutionrose };
