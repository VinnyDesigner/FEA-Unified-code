# FEA Unified — Environmental Monitoring Platform

A full-stack platform that unifies two environmental-monitoring products under one
codebase and one API surface:

- **MWQ** — Marine Water Quality monitoring (buoy-based sensors, sonde/weather/battery telemetry).
- **AQMS** — Air Quality Monitoring System (fixed monitoring stations, pollutant + meteorological observations, AQI).

Each product is a self-contained module on both the frontend and the backend, but they
share a single Express API (`/api/v1`), a shared authentication system, and a shared
reporting/alarms engine. The two products are backed by **two separate PostgreSQL databases**
(`fea_mwq` and `fea_aqms`) accessed through two Prisma clients.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 8, React Router 7, Zustand (auth state), Axios, Tailwind CSS 4, Highcharts + Recharts, Leaflet / react-leaflet (maps), i18next / react-i18next (EN/AR + RTL), Framer Motion, lucide-react |
| **Backend** | Node.js, Express 5, Prisma 5 (two clients), PostgreSQL, Zod (validation), JWT (access + refresh), bcrypt, Helmet, CORS, Morgan/Pino (logging), Nodemailer (OTP email), ExcelJS / docx / PDFKit (report export) |
| **Tooling** | npm workspaces-style root scripts, ESLint, nodemon, node:test + supertest |

---

## Repository Layout

```
FEA-Unified-code/
├── README.md                ← you are here
├── package.json             ← root orchestration scripts (concurrently)
├── docs/
│   ├── onboarding.md        ← New-dev handover guide (read this first)
│   ├── architecture.md      ← Whole-system technical & architectural design
│   ├── frontend.md          ← Frontend documentation, by module
│   ├── backend.md           ← Backend documentation + full API reference
│   └── alerts-and-alarms.md ← Deep-dive on the shared alarms/violations model
├── client/                  ← React + Vite frontend
│   └── src/
│       ├── modules/AQMS/    ← Air Quality module (pages, components, routes)
│       ├── modules/MWQ/     ← Marine Water Quality module
│       ├── lib/             ← api client, queries, polling, parameters
│       ├── stores/          ← Zustand auth store
│       ├── components/      ← shared AuthGate / RequireRole
│       └── routes/          ← top-level module router
└── server/                  ← Express + Prisma backend
    ├── src/
    │   ├── app.js, server.js
    │   ├── routes/index.js   ← mounts every module under /api/v1
    │   ├── modules/aqms/     ← AQMS feature modules
    │   ├── modules/mwq/      ← MWQ feature modules
    │   ├── modules/shared/   ← auth, alarms, reports (cross-module)
    │   └── middleware/       ← auth, role/module gating, validation, rate limiting
    └── prisma/
        ├── mwq/schema/       ← MWQ Prisma schema + migrations
        └── aqms/schema/      ← AQMS Prisma schema + migrations
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (three databases: `fea_higher_level` for identity/access, plus one each for MWQ and AQMS)

### 1. Install dependencies
From the repository root:
```bash
npm run install:all
```
This installs root, `client`, and `server` dependencies.

### 2. Configure environment
Copy the backend example env and fill in real values:
```bash
cp .env.example server/.env
```
Key variables (see [docs/backend.md](docs/backend.md#environment-variables) for the full list):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL_HIGHER_LEVEL` | Postgres connection string for the identity/access database (`fea_higher_level`) |
| `DATABASE_URL_MWQ` | Postgres connection string for the MWQ domain database |
| `DATABASE_URL_AQMS` | Postgres connection string for the AQMS domain database |
| `JWT_SECRET` | Access-token signing secret (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret (≥ 32 chars, **must differ** from `JWT_SECRET`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:5173`) |
| `PORT` | API port (default `5000`) |

For the frontend, set `VITE_API_URL` if the API is not served from the same origin
(defaults to the relative path `/api/v1`).

### 3. Set up the databases
From `server/`:
```bash
npm run prisma:generate        # generate all three Prisma clients (higher-level, mwq, aqms)
npm run prisma:migrate:deploy  # apply migrations to all three DBs
npm run seed:hl                # seed RBAC baseline (applications, roles, permissions)
npm run seed                   # populate dev domain data (stations, buoys, observations, alarms)
node prisma/migrate-to-higher-level.js  # ETL: backfill identity DB users + grants from module DBs
node prisma/backfill-7day.js   # optional: backfill recent rows so /latest endpoints have data
```

### 4. Run everything
From the repository root:
```bash
npm start
```
This runs the backend (`server`) and frontend (`client`) concurrently:
- API → `http://localhost:5000` (routes under `/api/v1`)
- Web → `http://localhost:5173` (Vite dev server)

The app opens on the MWQ module by default (`/MWQ`). The AQMS module lives under `/AQMS`.

---

## Documentation

| Document | What's inside |
|----------|---------------|
| **[docs/onboarding.md](docs/onboarding.md)** | New-developer handover guide: Day-1 setup, repo tour, request flow, common tasks, and the gotchas/tribal knowledge. Start here. |
| **[docs/architecture.md](docs/architecture.md)** | Whole-system technical & architectural design: modular-monolith structure, the three-database model (centralized identity + per-product domain DBs), RBAC security architecture, data flow, design rationale, deployment topology, and known gaps. |
| **[docs/frontend.md](docs/frontend.md)** | Frontend architecture, the two module structures (AQMS & MWQ), routing, the shared API/auth layer, pages, and components. |
| **[docs/backend.md](docs/backend.md)** | Backend architecture, the module pattern, authentication flow, and a **complete `/api/v1` endpoint reference** (auth, users, AQMS, MWQ, shared alarms & reports). |
| **[docs/alerts-and-alarms.md](docs/alerts-and-alarms.md)** | Deep dive into how MWQ alarms and AQMS violations are modeled and merged through the shared `/alarms` endpoint. |

---

## NPM Scripts Reference

### Root
| Script | Action |
|--------|--------|
| `npm start` | Run server + client concurrently |
| `npm run server` | Run backend only |
| `npm run client` | Run frontend dev server only |
| `npm run install:all` | Install dependencies for root, client, and server |

### Client (`client/`)
| Script | Action |
|--------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### Server (`server/`)
| Script | Action |
|--------|--------|
| `npm start` | Start API (`node src/server.js`) |
| `npm run dev` | Start API with nodemon |
| `npm test` | Run unit tests |
| `npm run test:contract` | Run FE-shape contract tests |
| `npm run prisma:generate` | Generate all three Prisma clients |
| `npm run prisma:migrate:deploy` | Apply migrations to all three DBs |
| `npm run prisma:studio:mwq` / `:aqms` / `:hl` | Open Prisma Studio for a DB |
| `npm run seed:hl` | Seed RBAC baseline (applications, roles, permissions) |
| `npm run seed` | Seed dev domain data |
