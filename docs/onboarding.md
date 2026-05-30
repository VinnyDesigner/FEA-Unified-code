# Developer Onboarding & Handover Guide

> **FEA Unified — Environmental Monitoring Platform**
> The "read this first" doc for anyone new to the codebase. It walks you from a clean
> checkout to confidently making changes, and captures the tribal knowledge that isn't
> obvious from the code.

If you read only one doc, read this one. When you need depth, jump to:

| You want… | Go to |
|-----------|-------|
| The big picture / why it's built this way | [architecture.md](architecture.md) |
| Every API endpoint, env var, data model | [backend.md](backend.md) |
| Frontend structure, pages, query layer | [frontend.md](frontend.md) |
| How alarms/violations work | [alerts-and-alarms.md](alerts-and-alarms.md) |
| Quick start + scripts | [../README.md](../README.md) |

---

## 1. What this product is (in 60 seconds)

It's **two environmental-monitoring products in one codebase**:

- **MWQ** — *Marine Water Quality.* Sensors on **buoys** in the water report water quality
  (sonde), weather/wind, battery, GPS, door status.
- **AQMS** — *Air Quality Monitoring System.* Fixed ground **stations** report air pollutants
  (PM2.5, PM10, CO, O₃, …), weather, and a computed **AQI**.

They look like one app to you the developer (one repo, one API process, one web app), but
they're kept **deliberately separate** at runtime: separate users, separate databases,
separate URLs (`/MWQ/*` and `/AQMS/*`). A user belongs to one product; only an **ADMIN**
spans both.

> **Mental model:** think "two apps that are roommates." They share the kitchen (auth,
> reporting, alarms, HTTP conventions) but sleep in separate rooms (their own DB, their own
> module folder, their own UI).

---

## 2. Day 1 — get it running

### Prerequisites
- Node.js 18+ and npm
- **PostgreSQL 14+** with **two** databases (e.g. `fea_mwq` and `fea_aqms`)

### Steps
```bash
# 1. Install everything (root + client + server)
npm run install:all

# 2. Create the server env file
cp .env.example server/.env
#    ⚠️ then EDIT IT — see the gotcha in §6. .env.example is stale.

# 3. Set up all three databases (run from server/)
cd server
npm run prisma:generate        # generates THREE Prisma clients (client-higher-level, client-mwq, client-aqms)
npm run prisma:migrate:deploy  # applies migrations to ALL THREE databases
npm run seed:hl                # RBAC baseline: applications, roles, permissions
npm run seed                   # dev domain data: stations, buoys, observations, alarms
node prisma/migrate-to-higher-level.js  # ETL: backfill identity DB users + grants from module DBs
node prisma/backfill-7day.js   # ⚠️ IMPORTANT — see §6. Without this, /latest screens look empty.
cd ..

# 4. Run server + web together
npm start
```

- API → `http://localhost:5000` (everything under `/api/v1`)
- Web → `http://localhost:5173`
- The app opens on **MWQ** by default (`/MWQ`). AQMS lives at `/AQMS`.

### First login
There's no public sign-up shortcut for getting a working account fast — `signup` creates a
**PENDING** account that an ADMIN must activate. For local dev, use a seeded user (check
`server/prisma/seed.js`) or activate your new account by flipping `accountStatus` to
`ACTIVE` in Prisma Studio (`npm run prisma:studio:mwq` / `:aqms`).

### Forgot-password / OTP in dev
You don't need real email. In `NODE_ENV=development` a tiny internal server runs on
`127.0.0.1:5001`. After triggering `forgot-password`, read the code back:
```
GET http://127.0.0.1:5001/_internal/last-otp/<email>?module=MWQ
```

---

## 3. Repo tour — where things live

```
FEA-Unified-code/
├── package.json          ← root: `npm start` runs server + client concurrently
├── client/               ← React 19 + Vite frontend
│   └── src/
│       ├── App.jsx, routes/AppRoutes.jsx   ← splits / into /MWQ/* and /AQMS/*
│       ├── stores/useAuthStore.js          ← Zustand auth (persisted as "fea-auth")
│       ├── lib/
│       │   ├── api.js        ← the ONE axios instance (auth header + 401 refresh)
│       │   ├── queries.js    ← the ONE place endpoint paths live  ←★ you'll edit this a lot
│       │   ├── polling.js    ← interval polling for "live" screens
│       │   └── parameters.js, duration.js, i18n/
│       ├── components/       ← AuthGate, RequireRole (shared route guards)
│       └── modules/
│           ├── AQMS/         ← pages + components + routes for Air Quality
│           └── MWQ/          ← pages + components + routes for Marine Water
└── server/                ← Express 5 + Prisma backend
    ├── src/
    │   ├── server.js  ← boot, env validation, graceful shutdown, dev OTP listener
    │   ├── app.js     ← middleware chain
    │   ├── routes/index.js          ← ★ the map of the whole API — read this first
    │   ├── db/prisma.js             ← exports prismaMwq + prismaAqms
    │   ├── config/env.js            ← env schema; process EXITS if env is invalid
    │   ├── middleware/              ← requireAuth, requireModule, requireRole, validate, rate-limit
    │   └── modules/
    │       ├── aqms/<feature>/      ← air-quality, weather, stations, parameters, …
    │       ├── mwq/<feature>/       ← buoys, sensor-data, weather, battery-health, …
    │       └── shared/              ← auth helpers, alarms, reports (cross-product)
    └── prisma/
        ├── mwq/schema/   ← MWQ schema (shared.prisma + mwq.prisma)
        ├── aqms/schema/  ← AQMS schema (shared.prisma + aqms.prisma)
        ├── seed.js, backfill-7day.js
```

**The two files to read first:** `server/src/routes/index.js` (the entire API surface and
its auth gates on one screen) and `client/src/lib/queries.js` (every call the frontend makes).

---

## 4. How a request flows (follow one all the way through)

### Backend: every feature is the same 4 files
When you open any feature folder (say `server/src/modules/aqms/air-quality/`), you'll find:

```
air-quality.routes.js      ← which URLs exist; attaches validate(...) + asyncHandler(...)
air-quality.schemas.js     ← Zod rules for query/body/params
air-quality.controller.js  ← reads validated input, calls the service, shapes the response
air-quality.service.js     ← the business logic + the ONLY place that talks to Prisma
```

Data goes **down** (route → controller → service → DB) and **back up**. Controllers never
write SQL; services never touch `req`/`res`. Once you've seen one feature, you've seen them
all.

### Frontend: components never call axios directly
```
Page/Component  →  function in lib/queries.js  →  api.js (axios)  →  /api/v1/...
```
A component imports `getAqmsStationsLive()` from `queries.js` and renders the result. It
never knows the URL. This is intentional (see §6 — the API has some weird response shapes and
`queries.js` is where they get normalized).

### The full picture for the busiest screen (AQMS LiveData)
```
LiveData.jsx
 └ getAqmsStationsLive()                       // queries.js
    ├ GET /aqms/stations            { data, pagination }
    ├ GET /aqms/air-quality/latest  BARE ARRAY, one row per parameter
    ├ GET /aqms/weather/latest      BARE ARRAY, one row per parameter
    └ GET /aqms/air-quality/index/latest  BARE ARRAY
       → pivot the long rows into ONE object per station (PM2.5→pm25, Temperature→temp …)
       → compute AQI category + color
       → Leaflet map + cards + AQI chart, re-polled on an interval
```

---

## 5. Common tasks (how do I…?)

### …add a new API endpoint?
1. In `server/src/modules/<product>/<feature>/`, add the route to `*.routes.js`, a Zod schema
   to `*.schemas.js`, a handler to `*.controller.js`, and the DB logic to `*.service.js`.
2. Make sure the feature router is aggregated in `modules/<product>/index.js` and mounted in
   `routes/index.js` (it probably already is for an existing feature).
3. If it returns a list, use the `{ data, pagination }` envelope; if a single object, use
   `ok()`. Don't invent a third shape unless you mean to (see §6).

### …call that endpoint from the frontend?
1. Add a function to `client/src/lib/queries.js` (never call axios from a component).
2. Decide the envelope: most endpoints → return `r.data.data`; a bare object → `r.data`.
3. Import and use it in your page.

### …add a frontend page?
1. Create it under `client/src/modules/<MODULE>/pages/`.
2. Register it in that module's router (`AQMSRoutes.jsx` / `MWQRoutes.jsx`).
3. Wrap it in `AuthGate` (and `RequireRole(['ADMIN'])` if admin-only).
4. Reuse the module's UI primitives (MWQ has `components/ui/*`) and respect its i18n/theme.

### …change a database table?
1. Edit the right schema: `server/prisma/<product>/schema/<product>.prisma` for domain
   tables; `server/prisma/<product>/schema/shared.prisma` for the FK-less `otps`/`reports`/
   `audit_logs`; or `server/prisma/higher-level/schema/{identity,rbac}.prisma` for
   users/refresh_tokens/RBAC.
2. `npm run prisma:migrate:dev` from `server/` (it migrates all three DBs).
3. `npm run prisma:generate` to refresh the clients.

### …work the password-reset / OTP flow locally?
See §2 — use the internal `127.0.0.1:5001/_internal/last-otp/...` listener.

---

## 6. Gotchas & tribal knowledge (read this before you lose an afternoon)

**`.env.example` is the source of truth for env — copy it and fill in secrets.** It lists
exactly what the server validates on boot (`server/src/config/env.js`); copy it to
`server/.env` and set real values. Key points that trip people up:
- Three Postgres URLs are required: `DATABASE_URL_HIGHER_LEVEL`, `DATABASE_URL_MWQ`, and
  `DATABASE_URL_AQMS`.
- `JWT_SECRET` **and** `JWT_REFRESH_SECRET` must be **different**, each ≥ 32 chars.
- The API base is `/api/v1`, not `/api`.
> If env is wrong the server **exits on boot** with a validation error — that's a feature.
> **Source of truth for env is [backend.md → Environment Variables](backend.md#environment-variables)**, validated by `server/src/config/env.js`. If env is wrong, the server **exits on boot** with a validation error — that's a feature, not a crash to debug.

**⚠️ Run `backfill-7day.js` or "live" screens look broken.** The `/latest` endpoints return
the most recent rows; a fresh seed may not place data in the last few hours. The backfill
script populates recent rows so LiveData/Dashboard actually show something.

**⚠️ Some endpoints intentionally break the envelope.** Most endpoints return
`{ data, pagination }`, but:
- AQMS `air-quality/latest`, `index/latest`, `weather/latest` return a **bare array**.
- AQMS `public/overview` returns a **bare object**.
- Those `/latest` arrays are **long-format** (one row per parameter) and get **pivoted** to
  wide objects in `queries.js`.
These shapes are **contract** — there are tests that fail if you change them. After touching
any data endpoint's output, run `npm run test:contract` (in `server/`).

**Three databases, three Prisma clients.** `prismaHigherLevel` (identity/access: users,
refresh_tokens, RBAC), `prismaMwq`, `prismaAqms` (domain + FK-less otps/reports/audit_logs).
There are **no cross-DB joins** and no cross-DB FKs — module tables reference a user by a
plain `UserID Int`. `/mwq/*` uses `prismaMwq`, `/aqms/*` uses `prismaAqms`; all auth/identity
goes to `prismaHigherLevel`; shared endpoints like `/alarms` query both module DBs and merge.

**One ADMIN row, multiple grants (no fan-out).** An admin is a **single** `User` row in
`fea_higher_level` with an `ADMIN` grant per application in `user_application_access`. The
JWT carries `access[]`/`perms[]`; `requireModule`/`requirePermission` enforce grants and any
ACTIVE ADMIN grant bypasses. The old `admin-fanout.js` is gone.

**Route ordering matters.** `/aqms/public` is mounted **before** the protected `/aqms` data
router in `routes/index.js` so it stays public. Keep public routes above their protected
sibling mounts.

**The 401 refresh is automatic and single-flight.** `api.js` catches `TOKEN_EXPIRED`,
refreshes once even under concurrent requests, and replays. Any *other* 401 logs you out and
redirects to the module login. So if you're getting bounced to login, look at the error
*code*, not just the 401.

**Authenticated file downloads.** Report downloads go through axios as a blob, not a plain
`<a href>` — a bare link can't send the Bearer token and would 401.

**Alarms are seed-only right now.** There is no production rule engine generating alarms or
violations; they exist because the seed inserts them. Don't expect new alarms to appear from
live data yet. (See [alerts-and-alarms.md](alerts-and-alarms.md#rule-engine-missing).)

**Dev-only folders are gitignored.** `.omc/`, `.claude/`, `.verify/`, `verify-tooling/` are
local tooling, not part of the app.

---

## 7. Testing & verifying your change

```bash
# from server/
npm test               # unit tests (node:test)
npm run test:contract  # guards the FE-facing response shapes  ←★ run after any data-endpoint change
```
```bash
# from client/
npm run lint           # ESLint
npm run build          # production build (catches a lot)
```

Rule of thumb: **changed a response shape? run the contract tests.** They are the safety net
for the envelope quirks in §6, which are exactly the kind of thing that silently breaks the
UI.

---

## 8. Glossary

| Term | Meaning |
|------|---------|
| **MWQ** | Marine Water Quality — buoy-based water monitoring |
| **AQMS** | Air Quality Monitoring System — fixed-station air monitoring |
| **Buoy** | An MWQ monitoring device (the MWQ equivalent of a "station") |
| **Station / Site** | An AQMS fixed monitoring location |
| **Sonde** | The water-quality sensor package on a buoy |
| **AQI** | Air Quality Index — a computed category (Good→Hazardous) with a color |
| **Observation** | A single timestamped sensor reading row |
| **Long-format** | One DB row per parameter (vs. "wide": one object with many parameter fields) |
| **Alarm (MWQ)** | A discrete buoy event (door open, low battery, comms lost…) |
| **Violation (AQMS)** | A recorded threshold breach for a pollutant/met parameter |
| **Module** | One of the two products (MWQ / AQMS); also a user's allegiance, carried in the JWT |
| **Envelope** | The JSON wrapper around a response (`{ data, pagination }` vs bare array/object) |

---

## 9. Who-touches-what cheat sheet

| If you're working on… | Frontend | Backend |
|-----------------------|----------|---------|
| Air quality data / AQI | `modules/AQMS/pages/LiveData.jsx`, `Analytics.jsx` | `modules/aqms/air-quality/`, `weather/` |
| Buoy / water data | `modules/MWQ/pages/Dashboard.jsx`, `MISAnalyticsPage.jsx` | `modules/mwq/sensor-data/`, `buoys/`, `battery-health/` |
| Login / signup / reset | `modules/*/pages/(SignIn|Login|SignUp|…)` | `modules/*/auth/` |
| Alarms / violations | `modules/MWQ/components/AlarmsTable.jsx` | `modules/shared/alarms/` |
| Reports & exports | `modules/MWQ/pages/ReportsPage.jsx` | `modules/shared/reports/` |
| User admin | `modules/MWQ/pages/UserManagementPage.jsx` | `modules/*/users/` |
| Any API call | `lib/queries.js` | the matching `*.routes.js` |
| Auth/token behavior | `lib/api.js`, `stores/useAuthStore.js` | `middleware/`, `modules/*/auth/` |

---

**Welcome aboard.** Start by running it (§2), then read `routes/index.js` and `queries.js`
side by side — between those two files you can see the whole contract between front and back.
When something surprises you, check §6 before assuming it's a bug.
