# Technical & Architectural Design

> **FEA Unified — Environmental Monitoring Platform**
> System-design reference covering architecture, data flow, security, cross-cutting
> concerns, design rationale, and operational topology.

This document is the **whole-system** view. For component-level depth, see the focused docs:

| Document | Scope |
|----------|-------|
| [README.md](../README.md) | Quick start, tech stack, scripts |
| [frontend.md](frontend.md) | React app, modules, routing, query layer |
| [backend.md](backend.md) | Express API, module pattern, full endpoint reference |
| [alerts-and-alarms.md](alerts-and-alarms.md) | Shared alarms/violations model |

---

## 1. System Context

FEA Unified is a full-stack platform that consolidates **two independent environmental
monitoring products** into one codebase, one running API process, and one web app:

- **MWQ — Marine Water Quality.** Buoy-mounted sensors reporting sonde (water-quality)
  readings, weather/wind, battery health, GPS, and door state.
- **AQMS — Air Quality Monitoring System.** Fixed ground stations reporting pollutants
  (PM2.5, PM10, CO, O₃, NO₂, SO₂, CO₂, CH₄, H₂S, NMHC), meteorology, and a computed AQI.

The two products have **operationally separate domain data** (separate databases, separate
URL namespaces) but **share infrastructure**: a single identity/access database, one unified
authentication service, the HTTP envelope conventions, the reporting engine, and the alarms
engine. Identity (who can log in) and access (what they may reach) are **centralized** in a
third "higher-level" database — a user is one row there, with per-application grants.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Web Browser (SPA)                            │
│   React 19 + Vite · /MWQ/*  and  /AQMS/*  URL namespaces              │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  HTTPS · Bearer JWT (access[]/perms[]) · /api/v1
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Express 5 API  (single process)                    │
│   helmet → cors → morgan → json → requestId → /api/v1 → errorHandler  │
│                                                                       │
│   /auth   /mwq/*   /aqms/*   /alarms   /reports   /healthz            │
└───────┬───────────────────────┬────────────────────────┬─────────────┘
        │ prismaHigherLevel      │ prismaMwq               │ prismaAqms
        ▼                        ▼                         ▼
 ┌────────────────────┐  ┌───────────────────┐   ┌───────────────────┐
 │ PostgreSQL          │  │ PostgreSQL        │   │ PostgreSQL        │
 │ fea_higher_level    │  │ fea_mwq           │   │ fea_aqms          │
 │ identity · auth ·   │  │ MWQ domain +      │   │ AQMS domain +     │
 │ RBAC (users,        │  │ otps/reports/     │   │ otps/reports/     │
 │ refresh_tokens,     │  │ audit_logs        │   │ audit_logs        │
 │ applications,roles, │  │ (FK-less UserID)  │   │ (FK-less UserID)  │
 │ permissions,grants) │  │                   │   │                   │
 └────────────────────┘  └───────────────────┘   └───────────────────┘

      External (optional):  SMTP (OTP email)  ·  Cloudflare R2 (report files)
```

---

## 2. Architectural Drivers

The shape of the system is dictated by a handful of decisions. Each is justified below in
[§9 Design Decisions](#9-design-decisions-and-rationale).

| Driver | Architectural consequence |
|--------|---------------------------|
| Two products, one team, one deploy | **Modular monolith** — one repo, one API process, two frontend modules. |
| Strong data isolation between products | **Separate PostgreSQL domain databases** (`fea_mwq`, `fea_aqms`), separate Prisma clients, no cross-DB joins. |
| One identity that can span both products | **Centralized identity/access DB** (`fea_higher_level`); a user is one row with per-application **grants** (`user_application_access`). No user duplication, no fan-out. |
| Authorization beyond a single role | **RBAC**: roles → permissions; the JWT carries `access[]` (per-app role+status) and `perms[]`; `requirePermission` / `requireModule` enforce grants. |
| Frontend depends on exact response shapes | A **single query layer** (`lib/queries.js`) plus **contract tests** that guard envelope quirks. |
| Reports are CPU/IO-heavy | **Concurrency-limited export semaphore**; pluggable storage (disk → R2). |

---

## 3. High-Level Architecture

### 3.1 Modular monolith

The system is a **modular monolith**, not microservices. One Express process serves both
products; isolation is enforced at the **module** and **database** layers rather than by
process boundaries.

```
                          ┌──────────────────────────────┐
                          │        routes/index.js        │
                          │  mounts every feature router  │
                          └──────────────┬────────────────┘
        ┌──────────────┬─────────────────┼──────────────────┬──────────────┐
        ▼              ▼                 ▼                  ▼              ▼
   /auth          /{mwq,aqms}/users  /mwq/*             /aqms/*       /alarms
   (public;       requireAuth +      requireAuth +       requireAuth +   /reports
   +aliases)      requirePermission  requireModule(MWQ)  requireModule(AQMS)  (shared,
                                                                       requireAuth)
        │              │                 │                  │              │
        └──────────────┴─────────────────┴──────────────────┴──────────────┘
                                         │
                         modules/<product>/<feature>/
                   routes → validate(zod) → controller → service → Prisma
```

### 3.2 Backend layering (per feature)

Every backend feature follows the same four-file convention — this is the single most
important pattern to internalize:

```
*.routes.js      HTTP verb/path; attaches validate(...) + asyncHandler(...)
*.schemas.js     Zod schemas for query/body/params
*.controller.js  Reads validated input, calls service, shapes HTTP response
*.service.js     Business logic + Prisma / raw SQL; the only layer that touches the DB
```

The request flows **strictly downward** (routes → controller → service → Prisma) and data
flows back up. Controllers never contain SQL; services never read `req`/`res`. This keeps
business logic testable in isolation and makes the API surface auditable from the route
files alone.

> Feature modules present: AQMS — `air-quality`, `weather`, `stations`, `parameters`,
> `thresholds`, `data-capture-rate`, `public`, `auth`, `users`. MWQ — `buoys`,
> `sensor-data`, `weather`, `battery-health`, `data-capture-rate`, `parameters`,
> `thresholds`, `auth`, `users`. Shared — `auth` (helpers/dev-otp), `alarms`, `reports`.

### 3.3 Frontend layering

```
main.jsx → App.jsx (<BrowserRouter>) → routes/AppRoutes.jsx
                                          ├── /MWQ/*  → MWQRoutes  (i18n + theme wrapper)
                                          └── /AQMS/* → AQMSRoutes (LanguageProvider)

Cross-cutting (shared by both modules):
  stores/useAuthStore.js   Zustand auth state, persisted to localStorage "fea-auth"
  lib/api.js               single Axios instance: Bearer injection + 401-refresh interceptor
  lib/queries.js           the ONLY place endpoint paths live; normalizes response quirks
  components/AuthGate      redirect unauthenticated users to the module login
  components/RequireRole   gate a route by RBAC grant (checks access[] for an ADMIN grant)
```

Components **never call Axios directly** — all network access goes through `lib/queries.js`.
This is what makes the backend's response-envelope quirks ([§6.3](#63-response-envelope-conventions))
survivable: normalization lives in exactly one file.

---

## 4. The Three-Database Design

This is the defining structural choice of the platform: **identity is centralized, domain
data is isolated per product.**

### 4.1 Topology

- **`fea_higher_level`** — the single source of truth for **identity & access**: `users`,
  `refresh_tokens`, and the RBAC tables (`applications`, `roles`, `permissions`,
  `role_permissions`, `user_application_access`).
- **`fea_mwq`** and **`fea_aqms`** — separate PostgreSQL **domain** databases. They also
  hold the per-module `otps`, `reports`, and `audit_logs` (operational artifacts that stay
  product-local), which reference a user by a plain integer `UserID` with **no cross-DB
  foreign key**.
- `server/src/db/prisma.js` instantiates **three Prisma clients** — `prismaHigherLevel`,
  `prismaMwq`, `prismaAqms` — generated from three schema directories
  (`prisma/{higher-level,mwq,aqms}/schema/`) into three output clients
  (`.prisma/client-higher-level`, `client-mwq`, `client-aqms`).
- In non-production, all three clients are cached on `globalThis` to survive hot-reload and
  avoid exhausting connections.

### 4.2 Schema composition

| Schema file | Content | DB |
|-------------|---------|-----|
| `higher-level/{identity,rbac}.prisma` | `User`, `RefreshToken` + `Application`, `RbacRole`, `Permission`, `RolePermission`, `UserApplicationAccess` | `fea_higher_level` |
| `{mwq,aqms}/shared.prisma` | `Otp`, `Report`, `AuditLog` — **FK-less** `userId Int` (no `user` relation) | each module DB |
| `<product>.prisma` | Product tables (observations, stations/buoys, thresholds, alarms…) | each module DB |

There are **no ORM relations across a DB boundary** — Prisma cannot span databases, so
module tables reference users by plain `Int` and integrity is enforced in app code. (The
old per-module `users`/`refresh_tokens` tables were migrated into `fea_higher_level` and
renamed `*_migrated_backup`; they are retained for the dev session and dropped in a later
cleanup commit. See the migration ETL `prisma/migrate-to-higher-level.js`.)

### 4.3 Routing data to the right client

Database selection is deterministic:

1. **Identity & access** — every `user` / `refresh_token` / grant read+write goes to
   `prismaHigherLevel`, regardless of which `/mwq` or `/aqms` URL was called.
2. **Domain data** — `/mwq/*` handlers use `prismaMwq`; `/aqms/*` handlers use `prismaAqms`.
   `requireModule` guarantees a member can only reach an app they hold an ACTIVE grant for.
3. **Per-module auth artifacts** (`otps`, auth `audit_logs`) — routed to ONE module DB by
   `resolveHomeModule(userId)` (deterministic on the user's grants), so OTP write + verify
   always hit the same store. For shared endpoints (`/alarms`, `/reports`) with no module
   filter, the handler queries each module DB and merges in JavaScript.

There are **no cross-database joins anywhere** — preserving the option to host the databases
on different servers later (see [alerts-and-alarms.md](alerts-and-alarms.md#module-dispatch-at-endpoint)).

---

## 5. Security Architecture

### 5.1 Request pipeline (boot → handler → error)

```
server.js   boot · dotenv · env validation (process exits if invalid) · graceful SIGTERM
            · in dev only: a second 127.0.0.1-bound listener for OTP inspection
   │
app.js      helmet  →  cors(allowlist)  →  morgan  →  json/urlencoded  →  requestId
   │                                  →  /api/v1 router  →  errorHandler (last)
   │
routes/index.js   per-route middleware stacks (below)
```

### 5.2 Per-route middleware stacks

| Route group | Middleware chain |
|-------------|------------------|
| `/healthz` | none — pings all three DBs (`SELECT 1`), returns 503 if any is down |
| `/auth/*` | public (rate-limited on sensitive verbs); single **unified** mount (with `/mwq/auth` + `/aqms/auth` back-compat aliases). Login/refresh return `access[]`/`perms[]` |
| `/aqms/public/*` | public — **registered before** the protected `/aqms` mount so it escapes `requireAuth` |
| `/{module}/auth/me`, `/{module}/users` | `requireAuth` (+ `requirePermission('users:manage')` inside the shared users router) |
| `/mwq`, `/aqms` (data) | `requireAuth` → `requireModule(<PRODUCT>)` (grant-based) |
| `/reports` | `requireAuth`; `/generate` → `requirePermission('reports:generate')`, `/:id/download` → `requirePermission('reports:download')` |
| `/alarms` (shared) | `requireAuth` — no module gate; handlers enforce scope via query/body |

The ordering in `routes/index.js` is load-bearing: the public AQMS overview **must** mount
before the protected `/aqms` data router, or it would inherit `requireAuth`.

### 5.3 Token model

- **Access token** — short-lived (default `1h`, signed with `JWT_SECRET`, `aud: 'access'`).
  Claims: `sub`, `email`, `accountStatus`, **`access[]`** (one `{app, role, status}` per
  non-revoked grant) and **`perms[]`** (union of permission codes from the user's ACTIVE
  grants). Legacy `role` and `module` claims are retained additively for FE back-compat.
- **Refresh token** — long-lived (default `7d`, signed with a **distinct**
  `JWT_REFRESH_SECRET`). Stored **hashed** in the `refresh_tokens` table **in
  `fea_higher_level`** with a `familyId` to enable **refresh-reuse detection**
  (`REUSE_DETECTED`). On each refresh the grants are re-loaded, so revoked/added access
  propagates within ≤ 1 access-token TTL.

`JWT_REFRESH_SECRET` must differ from `JWT_SECRET`; `env.js` validates both are ≥ 32 chars
and exits the process otherwise.

### 5.4 RBAC: grants instead of an ADMIN fan-out

There is **one** `User` row per person, in `fea_higher_level`. What they may reach is
expressed as rows in `user_application_access` — one **grant** per (user, application),
carrying a role (`ADMIN` / `MWQ_MEMBER` / `AQMS_MEMBER`) and a per-app status. Roles map to
permissions via `role_permissions`.

- A **member** holds a grant on one app and reaches only that app's `/mwq/*` or `/aqms/*`.
- An **`ADMIN`** holds an ADMIN grant; `requireModule` and `requirePermission` treat any
  ACTIVE ADMIN grant as a bypass, so an admin reaches both products and every permission.
- Authorization is enforced from the token's `access[]`/`perms[]` (with live re-validation
  available via `loadAccessAndPerms`). The old cross-DB `admin-fanout.js` is **removed** —
  a single identity row with multiple grants replaces it.

### 5.5 Account & credential lifecycle

```
signup → account PENDING → (admin activates) → ACTIVE
login  → { user, accessToken, refreshToken }
forgot-password → emails a 4-digit OTP (dev: read it back from the internal server)
verify-otp → { resetToken }
reset-password (email + resetToken + newPassword) → 204
refresh (refreshToken) → rotated { accessToken, refreshToken }
logout (refreshToken) → 204
```

Account statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`. Passwords are hashed with
bcrypt (`BCRYPT_COST`, default 12). Auth verbs are rate-limited (`authLimiter`:
5 req / 60 s; `otpVerifyLimiter`: 5 / 5 min keyed by email) — disabled under
`NODE_ENV=test`.

### 5.6 Client-side token handshake

`client/src/lib/api.js` is a single Axios instance with two interceptors:

- **Request:** injects `Authorization: Bearer <accessToken>` from the Zustand store.
- **Response (401):** if `error.code === "TOKEN_EXPIRED"`, it calls `refresh()` **once**
  (single-flight via a module-level `refreshInflight` promise), then **replays** the
  original request with the new token. On any other 401 — or a failed refresh — it logs
  out and hard-redirects to the module's login page (`/AQMS/login` or `/MWQ/signin`).

The single-flight guard means a burst of concurrent 401s triggers exactly one refresh, not
N races.

---

## 6. Data Flow & Contracts

### 6.1 End-to-end read path (AQMS LiveData — the hot path)

```
LiveData.jsx
  └─ getAqmsStationsLive()                       (lib/queries.js)
       ├─ GET /aqms/stations                     { data, pagination }
       ├─ GET /aqms/air-quality/latest           bare array, long-format
       ├─ GET /aqms/weather/latest               bare array, long-format
       └─ GET /aqms/air-quality/index/latest     bare array
            ↓  (all fetched in parallel)
       PIVOT long→wide: one object per station, parameter-name → field
       (PM2.5→pm25, Temperature→temp, …) + compute AQI category/color
            ↓
       Leaflet map + latest cards + AQI history chart
            ↓
       lib/polling.js re-runs the fetch on an interval for "live" updates
```

### 6.2 End-to-end write path (MWQ report generation)

```
ReportsPage.jsx
  └─ generateReport({ module, reportType, parameterIds, stationIds, dates, formats })
       └─ POST /reports/generate
            → reports.service: acquire export semaphore (MAX_CONCURRENT_EXPORTS)
            → build XLSX / DOCX / PDF (ExcelJS / docx / PDFKit)
            → persist file (local disk in dev, Cloudflare R2 if configured)
            → write Report row, release semaphore
            → 201 { data: report }
       ↺ poll getReport(id) until status ready
       └─ downloadReportFile(id, format)         authenticated blob (a plain <a href> would 401)
            → GET /reports/:id/download?format=…  streamed with Content-Disposition
```

The download must go through Axios (with the Bearer header) and receive a blob — a plain
anchor link cannot attach the token and would 401.

### 6.3 Response-envelope conventions

The API uses two envelope styles, and a few endpoints deliberately break the pattern. These
quirks are **contract**, guarded by tests, and normalized in exactly one frontend file.

| Shape | Endpoints | FE handling (`lib/queries.js`) |
|-------|-----------|--------------------------------|
| `{ data, pagination }` | most list endpoints | return `r.data.data` |
| raw object via `ok()` | single-resource GETs | return `r.data` |
| **bare array** | AQMS `air-quality/latest`, `index/latest`, `weather/latest` | iterate directly; **pivot long→wide** |
| **bare object** | AQMS `public/overview` | use as-is on the landing page |
| **long-format** rows | AQMS `/latest` family | pivot one-row-per-parameter into per-station wide objects |

> **Why this matters:** because the frontend hard-depends on these shapes, the backend ships
> **contract tests** (`tests/contract/fe-shapes.test.js`, `npm run test:contract`) whose only
> job is to fail if a `/latest` endpoint stops returning a bare array, etc. Run them after
> changing any data-endpoint output.

### 6.4 Error contract

All errors share one envelope:

```json
{ "error": { "code": "SOME_CODE", "message": "Human readable", "details": {} } }
```

Stable codes the frontend branches on include `TOKEN_EXPIRED` (drives silent refresh),
`MODULE_MISMATCH`, `VALIDATION_FAILED`, `RATE_LIMITED`, `REFRESH_REUSE_DETECTED`,
`FORMAT_NOT_AVAILABLE`. Full list in [backend.md](backend.md#error-shape).

---

## 7. Domain Model (overview)

Identity/access lives in `fea_higher_level`; each module DB carries its product schema plus
the FK-less operational tables. Full table lists live in
[backend.md](backend.md#data-model-overview); the structure is:

```
IDENTITY & ACCESS (fea_higher_level)
  User · RefreshToken · Application · RbacRole · Permission ·
  RolePermission · UserApplicationAccess

PER-MODULE OPERATIONAL (in each module DB, FK-less UserID)
  Otp · Report · AuditLog

AQMS (fea_aqms)
  Core:        AqmsMonitoringSite · AqmsSensorDetails · AqmsParameterMaster ·
               AqmsMeasurementUnit · AqmsSiteParameter · AqmsSamplingFrequency
  Observation: AqmsAmbientAirQualityObservation · AqmsMeteorologicalObservation ·
               AqmsCEMSAirQualityObservation
  Threshold/AQI: AqmsAQParametersThreshold · AqmsAQIndexMaster · AqmsHealthAdvisory
  Stats:       hourly/daily/monthly/yearly pre-aggregates (AQI, ambient, met, CEMS, completeness)
  Quality:     AqmsDataQualityFlagDefinition · AqmsFlaggedObservation · AqmsDataViolationLog
  Notify:      AqmsNotificationMaster · AqmsNotificationLog

MWQ (fea_mwq)
  Core:        MwqBuoy · MwqSensorCatalog · MwqBuoySensor · MwqParameterMaster ·
               MwqParameterUnit · MwqParameterThreshold
  Observation: MwqSondeObservation · MwqWeatherObservation · MwqGpsObservation ·
               MwqBatteryObservation · MwqDoorObservation
  Summaries:   MwqDataCaptureRate (+hourly/monthly) · Mwq{Hourly,Daily,Monthly}Summary · MwqWindRoseSummary
  Alarms:      MwqAlertMaster · MwqStationAlert · MwqStationMedia
  Logger:      MwqLoggerSystemInfo · MwqLoggerRuntimeStatus · MwqLoggerPortStatus ·
               MwqLoggerCalibrationInfo · MwqStationHealthMetaData
```

### 7.1 The alarms abstraction

MWQ **alarms** (discrete buoy events: `MwqStationAlert`) and AQMS **violations** (threshold
breaches: `AqmsDataViolationLog`) have different shapes but are unified behind a single
`/alarms` endpoint that **normalizes both into one row shape** and merges them. This is the
clearest example of the platform's "two products, one surface" philosophy and is documented
in depth in [alerts-and-alarms.md](alerts-and-alarms.md).

> **Known gap:** there is no production rule engine. Alarms and violations currently exist
> only via seed data; a scheduled evaluator must be built to generate them from live
> device/observation state. See the roadmap in [§11](#11-known-gaps--roadmap).

---

## 8. Cross-Cutting Concerns

| Concern | Mechanism |
|---------|-----------|
| **Config & secrets** | `server/src/config/env.js` validates all env on boot; the process **exits** on invalid config (fail-fast). |
| **Logging** | Pino structured logs (`LOG_LEVEL`) + Morgan HTTP access logs; every request tagged with a `requestId`. |
| **Validation** | Zod schemas at the route boundary (`validate({ query, body, params })`) → `400 VALIDATION_FAILED`. |
| **Error handling** | A single terminal `errorHandler`; `asyncHandler` wraps handlers so async throws are funneled into it. |
| **BigInt safety** | `lib/json-bigint` is required first in `app.js` so BigInt PKs (observations, alerts) serialize to JSON. |
| **Concurrency control** | Report export semaphore (`MAX_CONCURRENT_EXPORTS`) bounds CPU/IO from heavy exports. |
| **Rate limiting** | `authLimiter` / `otpVerifyLimiter` on sensitive auth verbs; off under `test`. |
| **Internationalization** | MWQ uses i18next (EN/AR, RTL) with a theme wrapper; AQMS uses its own `LanguageContext` (EN/AR). |
| **Live updates** | Frontend interval polling (`lib/polling.js`) — there is no WebSocket/SSE channel. |
| **Health** | `/healthz` pings all three databases and reports per-DB status + uptime. |

---

## 9. Design Decisions and Rationale

**Modular monolith over microservices.** One team, one deploy, two products that share auth
and reporting. A monolith with strict module boundaries gives the isolation benefits
(separate code, separate data) without the operational cost of multiple services. Module
folders + `requireModule` enforce the boundary in code review and at runtime.

**Separate domain databases, one centralized identity DB.** The products have genuinely
different domain models and may eventually scale or be hosted independently, so domain data
is physically separated (no risk of one product's queries touching the other's, independent
migrations). Identity & access, however, is **centralized** in `fea_higher_level`: this
removes the former auth-table duplication and the cross-DB ADMIN fan-out, and lets a single
person hold per-application grants instead of existing as two divergent user rows. The
trade-off — module tables reference users by a plain `Int` with app-level integrity instead
of a cross-DB FK (impossible in PostgreSQL) — is accepted deliberately.

**RBAC via grants + permissions.** Authorization is expressed as `user_application_access`
grants (role per app) mapped to `permissions`; the access token carries `access[]`/`perms[]`
and middleware (`requireModule`, `requirePermission`) enforces them, with any ACTIVE ADMIN
grant acting as a bypass. Grants re-load on every refresh, bounding stale-permission windows
to ≤ 1 access-token TTL.

**JWT with rotating refresh tokens + family reuse detection.** Stateless access tokens keep
the API horizontally scalable; hashed, rotating refresh tokens (in `fea_higher_level`) with a
`familyId` give revocation and theft-detection without a session store on the hot path.

**A single frontend query layer.** Centralizing every endpoint path and every response
normalization in `lib/queries.js` (and forbidding direct Axios calls in components) is what
makes the backend's intentional envelope quirks maintainable — and what lets contract tests
pin the exact shapes the UI relies on.

**Public routes mounted before protected mounts.** Ordering middleware so `/aqms/public`
precedes the `requireAuth`-gated `/aqms` mount is a small but deliberate routing decision
that lets the AQMS landing page render pre-auth without a separate app.

**Pluggable report storage.** Local disk in dev, Cloudflare R2 in production, selected by
env. Report generation is the heaviest workload, so it is both storage-pluggable and
concurrency-capped.

---

## 10. Deployment & Runtime Topology

### 10.1 Processes

| Process | Dev | Prod |
|---------|-----|------|
| API | `node src/server.js` (or nodemon) on `PORT` (5000) | same, behind a reverse proxy / TLS terminator |
| Internal OTP listener | `127.0.0.1:INTERNAL_PORT` (5001), **dev only** | **not mounted** |
| Web | Vite dev server on `5173` | static build (`npm run build`) served by CDN / static host |

`npm start` at the repo root runs API + web concurrently for development. In production the
SPA is built to static assets and the API runs as its own process; `VITE_API_URL` points the
SPA at the API origin (defaults to the relative `/api/v1` when co-served).

### 10.2 External dependencies

- **PostgreSQL ×3** (`fea_higher_level`, `fea_mwq`, `fea_aqms`) — required.
- **SMTP** — optional; OTP email. Dev falls back to a JSON transport and the internal
  listener exposes the last OTP at `GET 127.0.0.1:5001/_internal/last-otp/:email` (keyed on
  email only — no `module` query param).
- **Cloudflare R2** — optional; report file storage. Dev uses local disk.

### 10.3 Lifecycle

Boot validates env (exit on failure) → opens all three Prisma clients → listens. `SIGTERM`
triggers graceful shutdown: close the HTTP listeners, then `$disconnect()` the Prisma
clients, then exit. `/healthz` pings all three databases.

### 10.4 Database provisioning

```bash
# from server/
npm run prisma:generate         # generate ALL THREE clients (higher-level, mwq, aqms)
npm run prisma:migrate:deploy   # apply migrations to all three databases
npm run seed:hl                 # seed RBAC baseline: applications, roles, permissions
npm run seed                    # dev domain data: stations, buoys, observations, alarms
node prisma/migrate-to-higher-level.js  # ETL: backfill HL users + grants from module DBs
node prisma/backfill-7day.js    # backfill recent rows so /latest endpoints return data
```

> The identity ETL (`migrate-to-higher-level.js`) is idempotent and supports `--dry-run`. It
> dedupes module users by email into `fea_higher_level`, builds per-app grants, and remaps
> the module `otps`/`reports`/`audit_logs`/`aqms_notification_logs` `UserID`s to the
> consolidated HL ids.

> `migrations-deferred/` (partitioning) and `_legacy_combined/` (the pre-split single-DB
> migration history) are retained for reference and are not part of the normal deploy path.

---

## 11. Known Gaps & Roadmap

These are explicit, documented gaps — not surprises.

1. **No production alarm/violation rule engine.** MWQ alarms and AQMS violations exist only
   via seed data. A scheduled evaluator must read live device/observation state and
   insert/resolve `MwqStationAlert` / `AqmsDataViolationLog` rows. (See
   [alerts-and-alarms.md](alerts-and-alarms.md#rule-engine-missing).)
2. **AQMS violations lack a timestamp.** `AqmsDataViolationLog` records *that* a breach
   exists, not *when*; violations therefore sort last on `/alarms`. A `violationDetectedAt`
   column is recommended.
3. **Notifications are not auto-dispatched.** `AqmsNotificationMaster/Log` model a
   subscription system, but nothing wires violation → email/SMS dispatch yet.
4. **No AQMS alarms UI.** The frontend renders MWQ alarms only; an AQMS alerts page is
   recommended.
5. **Live updates are poll-based.** No WebSocket/SSE; "live" data is interval polling.

---

## 12. Quick Reference

| I want to… | Look at |
|------------|---------|
| Add an API endpoint | `server/src/modules/<product>/<feature>/` (routes → schemas → controller → service) + register in `routes/index.js` |
| Add a frontend page | `client/src/modules/<MODULE>/pages/`, register in the module router, add API calls to `lib/queries.js` (see [frontend.md](frontend.md#adding-a-new-page-recipe)) |
| Understand the full API | [backend.md](backend.md#api-reference) |
| Understand response quirks | [§6.3](#63-response-envelope-conventions) + `lib/queries.js` |
| Understand alarms | [alerts-and-alarms.md](alerts-and-alarms.md) |
| Change envelope shapes safely | run `npm run test:contract` |
| Configure the server | `server/src/config/env.js` + [backend.md](backend.md#environment-variables) |
