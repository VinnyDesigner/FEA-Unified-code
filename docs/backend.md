# Backend Documentation

The backend is an **Express 5** API that serves two products — **MWQ** (Marine Water
Quality) and **AQMS** (Air Quality Monitoring System) — from a single process, backed by
**three PostgreSQL databases** accessed through three Prisma clients: a centralized
identity/access DB (`fea_higher_level`) plus one domain DB per product (`fea_mwq`,
`fea_aqms`).

- Base URL: `/api/v1`
- Entry points: `server/src/server.js` (boot) → `server/src/app.js` (middleware + app) → `server/src/routes/index.js` (route mounting)

---

## Architecture

### Request lifecycle
```
server.js          boot, env validation, graceful shutdown, dev internal OTP server
   └─ app.js        helmet → cors → morgan → json/urlencoded → requestId → /api/v1 router → errorHandler
        └─ routes/index.js   mounts auth, users, aqms, mwq, alarms, reports
             └─ modules/<product>/<feature>/   routes → validate → controller → service → Prisma
```

### Module pattern
Each feature follows the same file convention:

| File | Responsibility |
|------|----------------|
| `*.routes.js` | Defines HTTP methods/paths, attaches `validate(...)` + `asyncHandler(...)` |
| `*.schemas.js` | Zod schemas for query/body/params validation |
| `*.controller.js` | Reads validated input, calls the service, shapes the HTTP response |
| `*.service.js` | Business logic + Prisma / raw SQL queries |

`server/src/modules/aqms/index.js` and `server/src/modules/mwq/index.js` aggregate each
product's feature routers; `server/src/modules/shared/` holds cross-module features
(auth helpers, alarms, reports).

### Three databases, three Prisma clients
`server/src/db/prisma.js` exports `prismaHigherLevel`, `prismaMwq`, and `prismaAqms`.
Identity & access (users, refresh_tokens, RBAC) live in `fea_higher_level`; product domain
data (plus the FK-less `otps`/`reports`/`audit_logs`) lives in `fea_mwq` / `fea_aqms`. Routes
are namespaced by product (`/mwq/...`, `/aqms/...`) so each handler talks to the correct
domain database; the shared `/alarms` endpoint queries both module clients and merges results
(see [alerts-and-alarms.md](alerts-and-alarms.md)).

---

## Authentication & Authorization

Auth is **unified** behind a single `/auth` mount (with `/mwq/auth/*` + `/aqms/auth/*`
retained as back-compat aliases), backed by the single identity DB. A person is **one**
`User` row in `fea_higher_level` with per-application **grants** (`user_application_access`);
RBAC roles map to permissions. Login/refresh return `access[]`/`perms[]` in the body and the
client uses those for authorization (rather than a URL-derived module). Tokens are JWTs.

### Token model
- **Access token** — short-lived (default `1h`, `JWT_SECRET`, `aud: 'access'`). Claims:
  `sub`, `email`, `accountStatus`, **`access[]`** (`{app, role, status}` per non-revoked
  grant), **`perms[]`** (permission codes from ACTIVE grants); legacy `role`/`module` kept
  additively for FE back-compat.
- **Refresh token** — long-lived (default `7d`, `JWT_REFRESH_SECRET`). Stored hashed in the
  `refresh_tokens` table **in `fea_higher_level`** with a `familyId` for refresh-reuse
  detection. Grants re-load on every refresh.

### Middleware (`server/src/middleware/`)
| Middleware | Effect |
|-----------|--------|
| `requireAuth` | Validates the `Authorization: Bearer <token>` header. On expiry returns `401 { error.code: "TOKEN_EXPIRED" }`; otherwise `UNAUTHORIZED`. Populates `req.user` (incl. `access`/`perms`). |
| `requireModule('MWQ'\|'AQMS')` | Requires an ACTIVE grant for the app; any ACTIVE `ADMIN` grant bypasses. Mismatch → `403 MODULE_MISMATCH`. (Falls back to legacy `role`/`module` for pre-v2 tokens.) |
| `requirePermission('code')` | Requires the permission in `perms[]`, or an ACTIVE `ADMIN` grant. Failure → `403 FORBIDDEN`. (e.g. `users:manage`, `reports:generate`.) |
| `validate({ query, body, params })` | Runs Zod schemas; failure → `400 VALIDATION_FAILED`. |
| `authLimiter` / `otpVerifyLimiter` | Rate limits (5 req / 60s for auth; 5 / 5min keyed by email for OTP). Disabled under `NODE_ENV=test`. |

> `requireRole` remains as a thin legacy shim but is no longer mounted on any route — admin
> CRUD is gated by `requirePermission('users:manage')`.

### Token-refresh handshake (client side)
The frontend (`client/src/lib/api.js`) auto-refreshes: on a `401 TOKEN_EXPIRED` it calls
the module's `/auth/refresh` once (single-flight), retries the original request, and on
failure logs out and redirects to the module's login page.

### Auth flow
```
signup → account PENDING → (admin activates) → ACTIVE
login  → { user, accessToken, refreshToken }
forgot-password → emails a 4-digit OTP (dev: inspect via internal server, see below)
verify-otp → { resetToken }
reset-password (email + resetToken + newPassword) → 204
refresh (refreshToken) → new { accessToken, refreshToken }
logout (refreshToken) → 204
```

Account statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`. Roles: `ADMIN`, `AQMS_MEMBER` (and the MWQ equivalent).

---

## Response Conventions

`server/src/utils/response.js` defines two envelope helpers:

- **List/paginated** — `{ data: [...], pagination: { total, limit, offset, hasMore } }`
- **Single/object** — the raw object (no `data` wrapper) via `ok()`

⚠️ **Important quirks the frontend relies on:**
- Most list endpoints use the `{ data, pagination }` envelope.
- The AQMS **`/latest`** endpoints (`air-quality/latest`, `air-quality/index/latest`, `weather/latest`) return a **bare array**, not a `{ data }` envelope.
- The AQMS **`/public/overview`** endpoint returns a **bare object**.
- AQMS `/latest` data is **long-format** (one row per parameter); the frontend pivots it into wide objects (see `client/src/lib/queries.js`).

### Error shape
All errors use:
```json
{ "error": { "code": "SOME_CODE", "message": "Human readable", "details": { } } }
```
Common codes: `VALIDATION_FAILED`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `MODULE_MISMATCH`,
`FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`,
`ACCOUNT_NOT_ACTIVE`, `OTP_EXPIRED`, `OTP_INVALID`, `OTP_MAX_ATTEMPTS`,
`REFRESH_REUSE_DETECTED`, `FORMAT_NOT_AVAILABLE`.

### Pagination defaults
`limit` defaults to `100` (max `1000`); `offset` defaults to `0`.

---

## API Reference

All routes are prefixed with **`/api/v1`**. The **Auth** column indicates middleware:
🌐 public · 🔒 `requireAuth` · 🧩 `+ requireModule` (ACTIVE grant) · 👑 `+ requirePermission('users:manage')`.

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | 🌐 | Liveness + DB check for all three databases. Returns `{ ok, db, uptime }` (503 if any DB is down). |

### Authentication — `/auth` (single collapsed mount)
Auth lives at a single `/auth` mount; the `/mwq/auth/*` and `/aqms/auth/*` paths are retained
as back-compat aliases (the handler reads the path segment when present). Login/refresh return
`access[]`/`perms[]` in the body (alongside the JWT claims) for the client to consume.

| Method | Path | Auth | Body / Notes |
|--------|------|------|--------------|
| POST | `/auth/signup` | 🌐 (rate-limited) | `{ email, password, firstName, lastName, application ('MWQ'\|'AQMS'), middleName?, phoneNumber?, emiratesId? }`. `application` names the app to request access to (required on `/auth`; inferred from the path on the aliases). → `201 { user }` (PENDING grant). |
| POST | `/auth/login` | 🌐 (rate-limited) | `{ email, password }` → `200 { user, accessToken, refreshToken, access, perms }`. |
| POST | `/auth/refresh` | 🌐 | `{ refreshToken }` → `200 { accessToken, refreshToken, access, perms }`. |
| POST | `/auth/forgot-password` | 🌐 (rate-limited) | `{ email }` → `204`; emails a 4-digit OTP. |
| POST | `/auth/verify-otp` | 🌐 (rate-limited) | `{ email, code }` (code = 4 digits) → `200 { resetToken }`. |
| POST | `/auth/reset-password` | 🌐 | `{ email, resetToken, newPassword }` → `204`. |
| POST | `/auth/logout` | 🔒 | `{ refreshToken }` → `204`. |

### Profile (self-service) — `/{module}/auth/me`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/{module}/auth/me` | 🔒 | Current user profile (DB chosen from `req.user.module`). |
| PATCH | `/{module}/auth/me` | 🔒 | `{ firstName?, lastName?, middleName?, phoneNumber?, emiratesId? }`. |

### Users (admin CRUD) — `/{module}/users`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/{module}/users` | 👑 | Query: `page`, `limit` (≤100), `accountStatus?`, `role?`. |
| POST | `/{module}/users` | 👑 | Create a user `{ email, password, firstName, lastName, ...role }`. |
| PATCH | `/{module}/users/:id` | 👑 | Update `{ role?, accountStatus? }`. |

---

### AQMS data — `/aqms/*` (🧩 requireAuth + requireModule('AQMS'))

**Stations** — `/aqms/stations`
| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/aqms/stations` | `limit?`, `offset?`, `operationalState?`, `stationType?` | List monitoring sites. `{ data, pagination }`. |

**Air Quality** — `/aqms/air-quality`
| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/aqms/air-quality/latest` | `stationId?`, `parameterId?` | Latest pollutant readings. **Bare array, long-format** (one row per parameter). |
| GET | `/aqms/air-quality/index/latest` | `stationId?`, `parameterId?` | Latest AQI per station. **Bare array.** |
| GET | `/aqms/air-quality/index/history` | `stationId?`, `startTime?`, `endTime?`, `limit?`, `offset?` | AQI time-series. `{ data, pagination }`. Range ≤ 90 days. |
| GET | `/aqms/air-quality/history` | `stationId` (req), `parameterId?`, `startTime` (req), `endTime` (req), `limit?`, `offset?` | Pollutant history. Range ≤ 90 days; `endTime` must be after `startTime`. |

**Weather (meteorological)** — `/aqms/weather`
| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/aqms/weather/latest` | `stationId?`, `parameterId?` | Latest met readings. **Bare array, long-format.** |
| GET | `/aqms/weather/history` | `stationId` (req), `parameterId?`, `startTime` (req), `endTime` (req), `limit?`, `offset?` | Met history (≤ 90 days). |

**Other AQMS**
| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/aqms/data-capture-rate` | `startDate` (req), `endDate` (req), `stationId?` | Data completeness/capture rate. |
| GET | `/aqms/parameters` | — | Parameter master list `{ data: [{ id, name, type, unit }] }`. |
| GET | `/aqms/thresholds` | — | Per-parameter thresholds `{ data: [{ parameterId, parameterName, min, max, standardType }] }`. |

**AQMS public (no auth)** — `/aqms/public`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/aqms/public/overview` | 🌐 | Pre-auth landing data. **Bare object** `{ latestAqiByStation, stationCount, trend }`. Registered *before* the protected `/aqms` mount. |

---

### MWQ data — `/mwq/*` (🧩 requireAuth + requireModule('MWQ'))

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/mwq/buoys` | — | List buoys `{ data: [{ id, buoyName, latitude, longitude, ... }] }`. |
| GET | `/mwq/sensor-data/latest` | `buoyId?` | Latest sonde readings per buoy. `{ data }`. |
| GET | `/mwq/sensor-data` | `buoyId?`, `params?`, `from?`, `to?`, `limit?`, `offset?` | Sonde observation history. `{ data }`. |
| GET | `/mwq/battery-health` | `buoyId?`, `from?`, `to?` | Battery telemetry. `{ data }`. |
| GET | `/mwq/data-capture-rate` | `buoyId?`, `from?`, `to?` | Data capture rate. `{ data }`. |
| GET | `/mwq/weather/latest` | `buoyId?` | Latest wind/weather reading. `{ data }`. |
| GET | `/mwq/weather/history` | `buoyId?`, `from?`, `to?`, `limit?`, `offset?` | Weather history. `{ data }`. |
| GET | `/mwq/parameters` | — | Parameter master list `{ data: [{ id, name }] }`. |
| GET | `/mwq/thresholds` | — | Per-parameter thresholds `{ data: [{ parameterId, parameterName, min, max }] }`. |

> Note: the frontend accepts a buoy id, numeric string, or buoy *name* and resolves it
> to an id via `/mwq/buoys` before calling these endpoints.

---

### Shared — Alarms — `/alarms` (🔒 requireAuth)
| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/alarms` | `module?` (`MWQ`\|`AQMS`), `severity?`, `status?`, `startTime?`, `endTime?`, `limit?`, `offset?` | Merged, normalized alarms (MWQ alarms + AQMS violations). Omit `module` to query both DBs. See [alerts-and-alarms.md](alerts-and-alarms.md). |

### Shared — Reports — `/reports` (🔒 requireAuth)
| Method | Path | Body / Query | Description |
|--------|------|--------------|-------------|
| POST | `/reports/generate` | `{ module, reportType, parameterIds[], stationIds[], startDate, endDate, formats[] }` | Generates a report in 1–3 formats (`XLSX`, `DOCX`, `PDF`). → `201 { data: report }`. |
| GET | `/reports/:id` | — | Report metadata + status. `404` if not found / not owned. |
| GET | `/reports/:id/download` | `format` (`XLSX`\|`DOCX`\|`PDF`) | Streams the file with proper `Content-Type`/`Content-Disposition`. `404 FORMAT_NOT_AVAILABLE` if that format wasn't generated. |

**Report types** (`reportType` enum): `basic_data_export` (default), `average_data_trend`,
`concentration_distribution`, `frequency_distribution`, `max_hourly_values`,
`network_data_recovery`, `violation_of_standards`, `summary_24h_avg`, `rolling_8h_avg`,
`daily_summary`, `monthly_report`, `windrose`, `pollutionrose`.

Report generation is concurrency-limited by `MAX_CONCURRENT_EXPORTS` (export semaphore).
Files are stored on local disk in dev or Cloudflare R2 when configured.

---

## Data Model Overview

Identity/access lives in `fea_higher_level`; each module DB has FK-less operational tables
plus its **product** schema.

### Identity & access — `prisma/higher-level/schema/{identity,rbac}.prisma`
`User`, `RefreshToken`, `Application`, `RbacRole`, `Permission`, `RolePermission`,
`UserApplicationAccess`.

### Per-module operational (both module DBs) — `prisma/{mwq,aqms}/schema/shared.prisma`
`Otp`, `Report`, `AuditLog` — each references a user by a plain `userId Int` (`UserID`) with
**no** cross-DB `user` relation.

### AQMS — `prisma/aqms/schema/aqms.prisma`
Core: `AqmsMonitoringSite`, `AqmsSensorDetails`, `AqmsParameterMaster`,
`AqmsMeasurementUnit`, `AqmsSiteParameter`, `AqmsSamplingFrequency`.
Observations: `AqmsAmbientAirQualityObservation`, `AqmsMeteorologicalObservation`,
`AqmsCEMSAirQualityObservation`.
Thresholds & AQI: `AqmsAQParametersThreshold`, `AqmsAQIndexMaster`, `AqmsHealthAdvisory`.
Pre-aggregated stats: hourly/daily/monthly/yearly AQI + ambient + met + CEMS + data-completeness stats tables.
Quality/violations: `AqmsDataQualityFlagDefinition`, `AqmsFlaggedObservation`, `AqmsDataViolationLog`.
Calibration & rose: `AqmsCalibrationDefinition`, `AqmsCalibrationData`, `AqmsWindRoseLog`.
Notifications: `AqmsNotificationMaster`, `AqmsNotificationLog`.

### MWQ — `prisma/mwq/schema/mwq.prisma`
Core: `MwqBuoy`, `MwqSensorCatalog`, `MwqBuoySensor`, `MwqParameterMaster`,
`MwqParameterUnit`, `MwqParameterThreshold`.
Observations: `MwqSondeObservation`, `MwqWeatherObservation`, `MwqGpsObservation`,
`MwqBatteryObservation`, `MwqDoorObservation`.
Capture & summaries: `MwqDataCaptureRate` (+ hourly/monthly), `MwqHourlySummary`,
`MwqDailySummary`, `MwqMonthlySummary`, `MwqWindRoseSummary`.
Alarms: `MwqAlertMaster`, `MwqStationAlert`, `MwqStationMedia`.
Logger health: `MwqLoggerSystemInfo`, `MwqLoggerRuntimeStatus`, `MwqLoggerPortStatus`,
`MwqLoggerCalibrationInfo`, `MwqStationHealthMetaData`.

---

## Environment Variables

Defined and validated in `server/src/config/env.js` (the process exits if invalid).

| Variable | Default | Notes |
|----------|---------|-------|
| `NODE_ENV` | `development` | `development` \| `test` \| `staging` \| `production` |
| `PORT` | `5000` | API port |
| `INTERNAL_PORT` | `5001` | Dev-only internal server for OTP inspection |
| `DATABASE_URL_MWQ` | — (required) | MWQ Postgres URL |
| `DATABASE_URL_AQMS` | — (required) | AQMS Postgres URL |
| `JWT_SECRET` | — (required, ≥32) | Access-token secret |
| `JWT_REFRESH_SECRET` | — (required, ≥32) | Refresh-token secret; **must differ** from `JWT_SECRET` |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Access-token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token TTL |
| `BCRYPT_COST` | `12` | bcrypt rounds |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated origins |
| `OTP_TTL_SECONDS` / `OTP_LENGTH` / `OTP_MAX_ATTEMPTS` | `300` / `4` / `5` | OTP behavior |
| `MAX_CONCURRENT_EXPORTS` | `2` | Report export concurrency cap |
| `SMTP_HOST/PORT/USER/PASS/FROM` | optional | OTP email; dev falls back to a JSON transport |
| `R2_ENDPOINT/BUCKET/ACCESS_KEY/SECRET_KEY` | optional | Cloudflare R2 report storage; dev uses local disk |
| `SEED_*` | various | Seed-script volumes (`SEED_SENSOR_ROWS`, `SEED_DAYS`, `SEED_BUOYS`, `SEED_STATIONS`) |
| `LOG_LEVEL` | `info` | Pino log level |

---

## Dev-only OTP inspection

In `NODE_ENV=development`, a **second internal listener** boots on `INTERNAL_PORT` (bound to
`127.0.0.1`) exposing the last OTP for an email so you can complete the password-reset flow
without real email:
```
GET http://127.0.0.1:5001/_internal/last-otp/:email?module=MWQ|AQMS
```
This router is never mounted in production.

---

## Testing

| Command | Scope |
|---------|-------|
| `npm test` / `npm run test:unit` | `tests/unit/*.test.js` (node:test) |
| `npm run test:contract` | `tests/contract/fe-shapes.test.js` — guards the response shapes the frontend depends on (e.g. bare-array `/latest`) |

Contract tests are the safety net for the response-envelope quirks documented above — run
them after changing any data-endpoint output.
