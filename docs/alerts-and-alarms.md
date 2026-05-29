# Alerts and Alarms

## Overview

Both MWQ and AQMS modules surface "alerts" to operators, but their data models differ significantly in structure and meaning:

- **MWQ Alarms** are discrete events tied to buoys: a communication loss, door open, low battery, sensor fault, power loss, GPS loss, or threshold breach. Each instance (`MwqStationAlert`) records *when* the alarm occurred, its status (OPEN/RESOLVED), and when it was resolved.

- **AQMS Violations** are recorded threshold breaches: a measured pollutant or meteorological parameter exceeds (or falls below) a regulatory standard. Each instance (`AqmsDataViolationLog`) links to a specific observation, station, parameter, and threshold definition, with a status (OPEN/RESOLVED/ACKNOWLEDGED).

Both flow through the shared `/api/v1/alarms` endpoint and are rendered in FE tables. The endpoint merges rows from both sources into a normalized shape for consistent UI display.

```
Device/Observation
       ↓
   [Rule]  ← Alert code / Threshold definition
       ↓
   [Log]   ← MwqStationAlert / AqmsDataViolationLog
       ↓
/api/v1/alarms  ← Merged, normalized response
       ↓
FE Table ← AlarmsTable.jsx renders alerts
```

## MWQ Alarms

### MwqAlertMaster
**Location:** `server/prisma/mwq/schema/mwq.prisma:362`

The catalog of alert types. Each row defines one alert code and its properties:

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, auto-increment |
| `alertCode` | String (40) | Unique: COMM_LOST, DOOR_OPEN, GPS_LOST, BATTERY_LOW, SENSOR_FAULT, POWER_FAULT, THRESHOLD_EXCEEDED, OFFLINE |
| `alertType` | String (60) | Category or label for the alert |
| `alertMessage` | String | Human-readable description |
| `alertLevel` | String (20) | Severity: INFO, WARN, or CRITICAL |
| `alertCategory` | String (60) | Grouping category |
| `alertTime` | DateTime? | Timestamp (nullable) |
| `thresholdId` | Int? | FK to MwqParameterThreshold (nullable) |
| `parameterId` | Int? | FK to MwqParameterMaster (nullable) |

### MwqStationAlert
**Location:** `server/prisma/mwq/schema/mwq.prisma:381`

Each instance of an alert occurring at a buoy:

| Field | Type | Notes |
|-------|------|-------|
| `id` | BigInt | PK, auto-increment |
| `buoyId` | Int | FK to MwqBuoy |
| `sensorId` | Int | FK to sensor that raised the alert |
| `alertMasterId` | Int | FK to MwqAlertMaster (the rule) |
| `alertTime` | DateTime | When the alert occurred (indexed with buoyId) |
| `alertStatus` | String (20) | OPEN or RESOLVED |
| `resolvedTime` | DateTime? | When the alert was manually resolved (nullable) |
| `alertValue` | Decimal (12,4)? | Current value at alert time (e.g., battery % or threshold breach amount) |
| `remarks` | String? | Operator notes |

**Status Lifecycle:** OPEN → RESOLVED (via manual action or timeout). Currently no automatic transition; operators resolve via UI or seed data populates pre-resolved alerts.

### Alert Generation
Today, MWQ alerts exist **only via seed data** (`server/prisma/seed.js:349–370`). The seed script:
- Creates 20 `MwqStationAlert` rows per run
- Randomizes alert time within `SEED_DAYS` (typically 30 days)
- Sets 15 alerts to RESOLVED (with a resolved time 5–60 minutes after alert time) and 5 to OPEN
- Assigns a random `alertMasterId` from the catalog

**Known Gap:** No production rule engine runs continuously to generate alerts. Operators must:
1. Deploy a scheduled job that evaluates device health (e.g., last heartbeat) and parameter thresholds
2. Insert `MwqStationAlert` rows on violation
3. Set resolvedTime when the condition clears

## AQMS Alerts/Violations

### AqmsDataViolationLog
**Location:** `server/prisma/aqms/schema/aqms.prisma:621`

Each recorded threshold breach (the AQMS equivalent of a "violation alarm"):

| Field | Type | Notes |
|-------|------|-------|
| `id` | BigInt | PK, auto-increment |
| `ambientObservationId` | BigInt? | FK to AqmsAmbientAirQualityObservation (nullable) |
| `metObservationId` | BigInt? | FK to AqmsMeteorologicalObservation (nullable) |
| `cemsObservationId` | BigInt? | FK to AqmsCEMSAirQualityObservation (nullable) |
| `stationId` | Int | FK to AqmsMonitoringSite |
| `parameterId` | Int | FK to AqmsParameterMaster |
| `thresholdId` | Int | FK to AqmsAQParametersThreshold (the rule) |
| `status` | String (20) | OPEN, RESOLVED, or ACKNOWLEDGED |
| `remarks` | String? | Text notes |

**Status Enum:** OPEN (unreviewed), RESOLVED (cleared), ACKNOWLEDGED (noted but unresolved).

### AqmsAQParametersThreshold
**Location:** `server/prisma/aqms/schema/aqms.prisma:221`

The rule definition for a parameter's acceptable range:

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK |
| `parameterId` | Int | FK to AqmsParameterMaster |
| `standardType` | String (40) | Regulatory standard (WHO_24H, WHO_ANNUAL, WHO_PEAK8H, etc.) |
| `minValue` | Decimal (12,4) | Lower bound |
| `maxValue` | Decimal (12,4) | Upper bound |

When an observation falls outside [minValue, maxValue], a violation is logged.

### AqmsNotificationMaster & AqmsNotificationLog
**Location:** `server/prisma/aqms/schema/aqms.prisma:715, 728`

A notification subscription system (currently **not auto-dispatched** on violation):

**AqmsNotificationMaster:**
- `id`, `notificationCode` (unique), `notificationName`, `severityLevel`, `description`

**AqmsNotificationLog:**
- `id`, `notificationTypeId`, `userId`, `priority`, `subject`, `message`, `notificationStatus`
- Links a user to a notification type (email/SMS for violations)

**Known Gap:** Violations do not automatically create notification log entries. Future work: wire violation creation → notification dispatch (email/SMS to subscribed users).

### Violation Generation
Today, AQMS violations exist **only via seed data** (`server/prisma/seed.js:660–690`). The seed script:
- Queries 20 ambient air observations (one per station/parameter combo)
- Creates 20 `AqmsDataViolationLog` rows
- Randomizes status: OPEN, RESOLVED, or ACKNOWLEDGED (round-robin)
- Sets remarks to document the parameter and age of the violation

**Known Gap:** No production process evaluates observations against thresholds. A scheduled job must:
1. Fetch the latest observations per station/parameter
2. Compare against the active threshold for that parameter
3. Insert `AqmsDataViolationLog` rows for any breaches
4. Update status when a later observation clears the condition

## Shared `/api/v1/alarms` Endpoint

**Location:** `server/src/modules/shared/alarms/`

### Route & Method
`GET /api/v1/alarms`

**Auth:** Requires `requireAuth` middleware. ADMIN users bypass module gating; members are restricted by `requireModule` (can only see alarms for modules they belong to).

### Query Parameters
**Location:** `server/src/modules/shared/alarms/alarms.schemas.js:6`

| Param | Type | Optional | Notes |
|-------|------|----------|-------|
| `module` | 'MWQ' \| 'AQMS' | Yes | If set, fetch only that module's rows; omit to fetch both |
| `severity` | string | Yes | Filter MWQ alarms by severity (INFO/WARN/CRITICAL); compared case-insensitive |
| `status` | string | Yes | Filter by status (OPEN/RESOLVED/ACKNOWLEDGED) |
| `startTime` | ISO 8601 | Yes | Filter by alarm time >= this datetime (MWQ only) |
| `endTime` | ISO 8601 | Yes | Filter by alarm time <= this datetime (MWQ only) |
| `limit` | number | Yes | Pagination limit (from paginationSchema) |
| `offset` | number | Yes | Pagination offset (from paginationSchema) |

### Response Shape
**Controller:** `server/src/modules/shared/alarms/alarms.controller.js:6`

```json
{
  "data": [
    {
      "id": "1",
      "module": "MWQ",
      "sourceId": "5",
      "sourceName": "Buoy-Alpha",
      "raisedAt": "2026-05-28T14:30:00Z",
      "alarmCode": "BATTERY_LOW",
      "alarmMessage": "Battery level critical",
      "severity": "CRITICAL",
      "status": "OPEN",
      "resolvedAt": null,
      "details": { "alertValue": 12.5, "remarks": "Check power supply" }
    },
    {
      "id": "42",
      "module": "AQMS",
      "sourceId": "3",
      "sourceName": "Station-Mumbai",
      "raisedAt": null,
      "alarmCode": "THRESHOLD_EXCEEDED",
      "alarmMessage": "Threshold exceeded",
      "severity": "WARN",
      "status": "RESOLVED",
      "resolvedAt": null,
      "details": { "parameterId": 7, "thresholdId": 12, "remarks": "PM2.5 breach" }
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

### Service Logic
**Location:** `server/src/modules/shared/alarms/alarms.service.js:9`

1. **MWQ Query (if module !== 'AQMS'):** Joins `mwq_station_alerts` + `mwq_alert_masters` + `mwq_buoys`; returns rows with `raisedAt` = alert.alertTime and severity from alert master's alertLevel.

2. **AQMS Query (if module !== 'MWQ'):** Joins `aqms_data_violation_logs` + `aqms_monitoring_sites`; returns rows with `raisedAt` = NULL (no timestamp on violations) and severity hardcoded to "WARN".

3. **Merge & Sort:** Concatenates arrays, sorts by raisedAt DESC (nulls last), paginates in JavaScript.

**Note:** AQMS violations lack a timestamp, so they sort to the end of any result set.

## FE Consumers

### AlarmsTable Component
**Location:** `client/src/modules/MWQ/components/AlarmsTable.jsx:7`

Fetches and renders MWQ alarms in a desktop table or mobile card layout:

```javascript
getAlarms({ module: 'MWQ', limit: 50 })
  .then((data) => setAlarmsData(data || []))
```

- Calls `client/src/lib/queries.js:209` → `GET /api/v1/alarms?module=MWQ&limit=50`
- Displays columns: Date & Time (formatDateTime), Station Name (buoyName), Alert Type (alarmCode via `getAlarmLabel`), Severity
- No filtering UI; shows first 50 alarms, most recent first
- Handles empty state ("No alarms recorded") and loading state gracefully

### Dashboard Page
**Location:** `client/src/modules/MWQ/pages/Dashboard.jsx:47`

Fetches alarms for display in the right-panel status card:

```javascript
getAlarms({ module: 'MWQ' })
  .then((data) => setLatestAlarms(data || []))
```

- Calls once on mount; no live polling
- Uses `latestAlarms` array in the BuoyStatusCard sub-component to show recent alerts
- No filtering; relies on backend's default sort (most recent first)

### AQMS-Side UI
**Status:** Absent. No frontend page currently displays AQMS violations.

**Recommendation:** 
1. Create `client/src/modules/AQMS/pages/AlertsPage.jsx` (analogous to MWQ's AlarmsTable)
2. Fetch `getAlarms({ module: 'AQMS', limit: 50 })`
3. Render violation data (station name, parameter, threshold breach, status)
4. Add status-change controls (mark RESOLVED/ACKNOWLEDGED) when backend supports PATCH

## Seed Data Behavior

**Command:** `npm run seed` (runs `server/prisma/seed.js`)

### MWQ Alerts
**Lines:** `349–370`

Populates:
- 20 `MwqStationAlert` rows
- Alert times randomized across last 30 days
- 15 rows RESOLVED (with resolvedTime ~5–60 min after alertTime), 5 OPEN
- Uses existing alert master catalog and buoys from seed

**Extending:** Modify the loop to increase count, adjust `SEED_DAYS`, or cherry-pick specific alert codes:
```javascript
if (alertCode === 'BATTERY_LOW' || alertCode === 'COMM_LOST') {
  // increase weight for critical alerts
}
```

### AQMS Violations
**Lines:** `660–690`

Populates:
- 20 `AqmsDataViolationLog` rows
- Linked to existing ambient observations and stations
- Status round-robin: OPEN, RESOLVED, ACKNOWLEDGED
- Remarks document the parameter and age

**Extending:** Loop through more observations or add multi-week ranges:
```javascript
for (const obs of ambientObsSample) {
  for (const pName of violationParamNames) {
    // Create violations for all parameter/station combos
  }
}
```

## Operational Notes

### Rule Engine Missing
Neither MWQ nor AQMS has a production rule engine that continuously evaluates device health or observations:
- **MWQ:** No job monitors buoy heartbeat, communication status, or battery level. Alerts exist only via seed.
- **AQMS:** No job fetches observations and compares against thresholds. Violations exist only via seed.

**Action Items:**
1. Deploy a scheduled service (e.g., every 5 min for MWQ, every 1 hour for AQMS)
2. MWQ: Query device state (last heartbeat, signal strength, battery from latest obs); insert `MwqStationAlert` rows for breaches
3. AQMS: Query latest observations; compare against `AqmsAQParametersThreshold`; insert/update `AqmsDataViolationLog` rows

### Authentication & Authorization
- Endpoint requires `requireAuth` middleware
- ADMIN role: sees all alerts across all modules
- Member role: filtered by `requireModule` (can only view alarms for their assigned modules)

### Notification System (AQMS)
The `AqmsNotificationMaster` and `AqmsNotificationLog` tables define a subscription pattern, but **no trigger exists** to create log entries when violations occur. 

**Future Work:**
1. When a violation is logged, check subscribed users (AqmsNotificationLog records)
2. Queue email/SMS notifications via an external service (SendGrid, Twilio, etc.)
3. Store notification status (sent, pending, failed) in AqmsNotificationLog
4. Add FE pages for users to manage notification subscriptions

### AQMS Lack of Timestamps
`AqmsDataViolationLog` does not record *when* the violation occurred, only that it exists. This causes:
- Violations always sort to the end of `/api/v1/alarms` results (raisedAt = NULL)
- Difficult to correlate with exact observation time (ambientObservationId is a FK but not always populated)

**Recommendation:** Add a `violationDetectedAt` timestamp to record when the breach was detected or acknowledged.

### Module Dispatch at Endpoint
The `/api/v1/alarms` endpoint dispatches on the `module` query param:
- If `module=MWQ` → query only prismaMwq (skip AQMS)
- If `module=AQMS` → query only prismaAqms (skip MWQ)
- If omitted → query both in parallel, merge results

This avoids cross-database queries and supports independent scaling if MWQ/AQMS databases are on different servers.
