'use strict';

const { prismaMwq, prismaAqms } = require('../../../db/prisma');

// Normalised alarm shape from two source tables:
//   MWQ  — mwq_station_alerts JOIN mwq_alert_masters JOIN mwq_buoys
//   AQMS — aqms_data_violation_logs (no raisedAt col; uses NULL for time fields)
// UNION ALL then filter/paginate in outer query.
async function listAlarms({ module: mod, severity, status, startTime, endTime, limit, offset }) {
  const severityUp = severity ? severity.toUpperCase() : null;
  const statusUp   = status   ? status.toUpperCase()   : null;
  const fromDt     = startTime ? new Date(startTime) : null;
  const toDt       = endTime   ? new Date(endTime)   : null;

  // MWQ leg — query prismaMwq
  const mwqConditions = [];
  const mwqValues = [];
  let mi = 1;
  if (severityUp) { mwqConditions.push(`UPPER(m."AlertLevel") = $${mi++}`); mwqValues.push(severityUp); }
  if (statusUp)   { mwqConditions.push(`UPPER(a."AlertStatus") = $${mi++}`); mwqValues.push(statusUp); }
  if (fromDt)     { mwqConditions.push(`a."AlertTime" >= $${mi++}`); mwqValues.push(fromDt); }
  if (toDt)       { mwqConditions.push(`a."AlertTime" <= $${mi++}`); mwqValues.push(toDt); }
  const mwqWhere = mwqConditions.length ? `WHERE ${mwqConditions.join(' AND ')}` : '';

  const mwqSql = `
    SELECT
      a."AlertID"::text                                         AS id,
      'MWQ'                                                     AS module,
      a."BuoyID"::text                                          AS "sourceId",
      b."BuoyName"                                              AS "sourceName",
      a."AlertTime"                                             AS "raisedAt",
      m."AlertCode"                                             AS "alarmCode",
      m."AlertMessage"                                          AS "alarmMessage",
      UPPER(m."AlertLevel")                                     AS severity,
      UPPER(a."AlertStatus")                                    AS status,
      a."ResolvedTime"                                          AS "resolvedAt",
      json_build_object('alertValue', a."AlertValue", 'remarks', a."Remarks") AS details
    FROM mwq_station_alerts a
    JOIN mwq_alert_masters m ON m."AlertMasterID" = a."AlertMasterID"
    JOIN mwq_buoys         b ON b."BuoyID"        = a."BuoyID"
    ${mwqWhere}
  `;

  // AQMS leg — query prismaAqms
  const aqmsConditions = [];
  const aqmsValues = [];
  let ai = 1;
  if (severityUp) { aqmsConditions.push(`'WARN' = $${ai++}`); aqmsValues.push(severityUp); }
  if (statusUp)   { aqmsConditions.push(`UPPER(v."Status") = $${ai++}`); aqmsValues.push(statusUp); }
  const aqmsWhere = aqmsConditions.length ? `WHERE ${aqmsConditions.join(' AND ')}` : '';

  const aqmsSql = `
    SELECT
      v."ViolationID"::text                                     AS id,
      'AQMS'                                                    AS module,
      v."StationID"::text                                       AS "sourceId",
      s."StationName"                                           AS "sourceName",
      NULL::timestamptz                                         AS "raisedAt",
      'THRESHOLD_EXCEEDED'                                      AS "alarmCode",
      'Threshold exceeded'                                      AS "alarmMessage",
      'WARN'                                                    AS severity,
      UPPER(v."Status")                                         AS status,
      NULL::timestamptz                                         AS "resolvedAt",
      json_build_object('parameterId', v."ParameterID", 'thresholdId', v."ThresholdID", 'remarks', v."Remarks") AS details
    FROM aqms_data_violation_logs v
    JOIN aqms_monitoring_sites s ON s."StationID" = v."StationID"
    ${aqmsWhere}
  `;

  // Fetch from each DB in parallel, skipping the other when module filter is set
  const fetchMwq  = mod === 'AQMS' ? Promise.resolve([]) : prismaMwq.$queryRawUnsafe(mwqSql, ...mwqValues);
  const fetchAqms = mod === 'MWQ'  ? Promise.resolve([]) : prismaAqms.$queryRawUnsafe(aqmsSql, ...aqmsValues);

  const [mwqRows, aqmsRows] = await Promise.all([fetchMwq, fetchAqms]);

  // Merge, sort by raisedAt DESC nulls last, then paginate in JS
  const all = [...mwqRows, ...aqmsRows].sort((a, b) => {
    if (!a.raisedAt && !b.raisedAt) return 0;
    if (!a.raisedAt) return 1;
    if (!b.raisedAt) return -1;
    return new Date(b.raisedAt) - new Date(a.raisedAt);
  });

  const total = all.length;
  const rows  = all.slice(offset, offset + limit);

  return { rows, total };
}

module.exports = { listAlarms };
