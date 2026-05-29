# Frontend Documentation

The frontend is a **React 19 + Vite 8** single-page application that hosts two products as
self-contained modules — **AQMS** (Air Quality Monitoring System) and **MWQ** (Marine Water
Quality) — sharing one auth store, one Axios API client, and one set of route guards.

- Entry: `client/src/main.jsx` → `client/src/App.jsx` → `client/src/routes/AppRoutes.jsx`
- Dev server: `http://localhost:5173`
- API base: `import.meta.env.VITE_API_URL || '/api/v1'`

---

## Top-Level Architecture

```
src/
├── App.jsx                  ← <BrowserRouter><AppRoutes/></BrowserRouter>
├── routes/AppRoutes.jsx     ← /MWQ/* → MWQRoutes, /AQMS/* → AQMSRoutes, "/" → /MWQ
├── stores/useAuthStore.js   ← Zustand auth state (persisted to localStorage "fea-auth")
├── lib/
│   ├── api.js               ← Axios instance + Bearer injection + 401 refresh interceptor
│   ├── queries.js           ← ALL API calls (auth + data), response normalization
│   ├── polling.js           ← live-data polling helper
│   ├── parameters.js        ← parameter id/name helpers
│   ├── duration.js          ← time-range helpers
│   └── i18n/alarmCodes.js   ← alarm code → human label
├── components/
│   ├── AuthGate.jsx         ← redirects unauthenticated users to the module login
│   └── RequireRole.jsx      ← gates a route by role (e.g. ADMIN)
└── modules/
    ├── AQMS/                ← Air Quality module
    └── MWQ/                 ← Marine Water Quality module
```

### Routing
`AppRoutes` splits the app into two URL namespaces. Each module owns its sub-router:

| URL | Module router | Default |
|-----|---------------|---------|
| `/MWQ/*` | `modules/MWQ/routes/MWQRoutes.jsx` | `/MWQ/dashboard` |
| `/AQMS/*` | `modules/AQMS/routes/AQMSRoutes.jsx` | `/AQMS` (landing page) |
| `/` and `*` | redirect → `/MWQ` | — |

### The shared API & auth layer

**`lib/api.js`** — a single Axios instance:
- **Request interceptor** injects `Authorization: Bearer <accessToken>` from the auth store.
- **Response interceptor** handles `401`:
  - If `error.code === "TOKEN_EXPIRED"`, it calls `refresh()` **once** (single-flight via `refreshInflight`), retries the original request with the new token.
  - On any other 401 (or failed refresh), it logs out and redirects to the module's login (`/AQMS/login` or `/MWQ/signin`).

**`lib/queries.js`** — the only place that knows endpoint paths. Every page/component calls
these functions rather than Axios directly. It also normalizes the backend's response
quirks (see below).

**`stores/useAuthStore.js`** — Zustand store persisted as `fea-auth` (localStorage, version 3).
Holds `user`, `accessToken`, `refreshToken`, `module`, `hydrated`. Exposes `login`, `logout`,
`refresh`, `updateProfile`. The persisted `module` decides which login page to bounce to on
auth failure.

**Route guards** (`components/`):
- `AuthGate` — wraps protected routes; redirects to login if not authenticated.
- `RequireRole` — wraps admin-only routes (e.g. MWQ user management).

### Handling backend response quirks
Because the API has a few non-standard shapes, `queries.js` centralizes the normalization:

| Endpoint | Shape | Normalization in `queries.js` |
|----------|-------|-------------------------------|
| AQMS `/air-quality/latest`, `/index/latest`, `/weather/latest` | **bare array**, long-format | `getAqmsStationsLive()` pivots one-row-per-parameter into wide objects keyed by station, mapping parameter names → fields (`PM2.5`→`pm25`, `Temperature`→`temp`, etc.) and computing AQI category/color. |
| AQMS `/public/overview` | **bare object** | returned as-is for the landing page. |
| Most list endpoints | `{ data, pagination }` | functions return `r.data.data`. |
| MWQ buoy params | id / numeric string / **name** | `resolveBuoyId()` resolves a buoy name to its id via `/mwq/buoys` (cached). |

---

## AQMS Module (`src/modules/AQMS/`)

Air Quality Monitoring System — fixed monitoring stations, pollutants (PM2.5, PM10, CO, O3,
NO2, SO2, CO2, CH4, H2S, NMHC), meteorology, and AQI. Includes a **public pre-auth landing
page**.

```
modules/AQMS/
├── routes/AQMSRoutes.jsx       ← all /AQMS/* routes (wrapped in LanguageProvider)
├── contexts/LanguageContext.jsx← EN/AR language context for this module
├── components/
│   ├── Layout.jsx              ← authenticated shell (header/nav + <Outlet/>)
│   ├── AuthLayout.jsx          ← shell for auth pages
│   └── Dropdown.jsx
├── pages/
│   ├── LandingPage.jsx         ← PUBLIC overview (uses /aqms/public/overview)
│   ├── Login.jsx, SignUp.jsx
│   ├── ForgotPassword.jsx, OTPVerification.jsx, ResetPassword.jsx
│   ├── LiveData.jsx            ← live station map + latest readings + AQI chart
│   ├── Analytics.jsx           ← historical pollutant/AQI analysis
│   └── DataCapture.jsx         ← data capture/completeness rates
└── styles/
```

### Routes
| Path | Page | Protected | Notes |
|------|------|-----------|-------|
| `/AQMS` | `LandingPage` | 🌐 public | Pre-auth AQI overview via `getAqmsPublicOverview()` |
| `/AQMS/login` | `Login` | 🌐 | |
| `/AQMS/signup` | `SignUp` | 🌐 | |
| `/AQMS/forgot-password` | `ForgotPassword` | 🌐 | |
| `/AQMS/verify-otp` | `OTPVerification` | 🌐 | |
| `/AQMS/reset-password` | `ResetPassword` | 🌐 | |
| `/AQMS/live-data` | `LiveData` | 🔒 AuthGate | Inside `DashboardLayout` (`Layout`) |
| `/AQMS/analytics` | `Analytics` | 🔒 AuthGate | |
| `/AQMS/data-capture` | `DataCapture` | 🔒 AuthGate | |

### Key pages
- **LandingPage** — public. Calls `getAqmsPublicOverview()` for `{ latestAqiByStation, stationCount, trend }`; no auth required.
- **LiveData** — the module hot path. Uses `getAqmsStationsLive()` (parallel fetch of stations + air-quality latest + weather latest + AQI latest, pivoted into per-station wide objects), a Leaflet map, AQI category coloring, and an AQI history chart (`getAqmsAirQualityIndexHistory`). Polls for live updates (`lib/polling.js`).
- **Analytics** — historical analysis using `getAqmsAirQualityHistory` / `getAqmsWeatherHistory` / `getAqmsAirQualityIndexHistory`, with parameter and threshold lookups (`getAqmsParameters`, `getAqmsThresholds`). Charts via Highcharts/Recharts.
- **DataCapture** — `getDataCaptureRateAqms({ startDate, endDate })` rendered as completeness tables.

### Localization
AQMS uses its own `LanguageContext` (EN/AR) provided at the route root.

---

## MWQ Module (`src/modules/MWQ/`)

Marine Water Quality — buoy-mounted sensors reporting sonde (water-quality) data, weather
(wind), battery health, GPS, and door status. Fully internationalized (i18next, EN + AR with
RTL), with a themed shell (`mwq-theme`).

```
modules/MWQ/
├── routes/MWQRoutes.jsx        ← all /MWQ/* routes + MWQThemeWrapper (RTL/lang)
├── i18n/i18n.js                ← i18next init for MWQ
├── components/
│   ├── layout/Sidebar.jsx, TopHeader.jsx
│   ├── ui/Button.jsx, Card.jsx, Input.jsx   ← design-system primitives
│   ├── AuthLayout.jsx, AuthCard.jsx, FormInput.jsx
│   ├── MapView.jsx, FujairahMap.jsx         ← buoy maps (Leaflet)
│   ├── MetricsGrid.jsx, MetricCard.jsx, BuoyStatusCard.jsx
│   ├── SensorDataTable.jsx, SensorDataFilters.jsx
│   ├── AnalyticsTabs.jsx, AnalyticsFilters.jsx, AnalyticsTable.jsx
│   ├── BuoysChart.jsx, TemperatureChart.jsx, WaterTempChart.jsx, ChartModal.jsx
│   ├── BatteryHealthView.jsx, DataCaptureRateTable.jsx
│   ├── AlarmsTable.jsx                       ← shared /alarms (module=MWQ)
│   ├── ReportsFilterForm.jsx, DownloadDropdown.jsx
│   ├── DashboardHeader.jsx, GlobalHeader.jsx, MobileHeader.jsx, MobileSidebar.jsx
│   ├── LanguageSelector.jsx, FAQAccordion.jsx
└── pages/
    ├── SignIn.jsx, SignUp.jsx
    ├── ForgotPassword.jsx, OTPVerification.jsx, ResetPassword.jsx
    ├── Dashboard.jsx          ← map + metrics + latest alarms
    ├── MISAnalyticsPage.jsx   ← analytics tabs (sensor data, battery, capture rate)
    ├── ReportsPage.jsx        ← report builder + download
    ├── ProfilePage.jsx        ← self-service profile (getMe/updateMe)
    ├── UserManagementPage.jsx ← ADMIN-only user CRUD
    └── FAQPage.jsx
```

### Routes
| Path | Page | Protected | Notes |
|------|------|-----------|-------|
| `/MWQ/signin` | `SignIn` | 🌐 | inside `AuthLayout` |
| `/MWQ/signup` | `SignUp` | 🌐 | |
| `/MWQ/forgot-password` | `ForgotPassword` | 🌐 | |
| `/MWQ/verify-otp` | `OTPVerification` | 🌐 | |
| `/MWQ/reset-password` | `ResetPassword` | 🌐 | |
| `/MWQ/dashboard` | `Dashboard` | 🔒 AuthGate | default landing for MWQ |
| `/MWQ/mis-analytics` | `MISAnalyticsPage` | 🔒 AuthGate | |
| `/MWQ/reports` | `ReportsPage` | 🔒 AuthGate | |
| `/MWQ/profile` | `ProfilePage` | 🔒 AuthGate | |
| `/MWQ/user-management` | `UserManagementPage` | 🔒 AuthGate + 👑 `RequireRole(['ADMIN'])` | |
| `/MWQ/faq` | `FAQPage` | 🌐 | |

### Key pages
- **Dashboard** — buoy map (`MapView`/`FujairahMap`), `MetricsGrid` of latest readings (`getMqwSensorDataLatest`, `getMqwWeatherLatest`), and `AlarmsTable`/`BuoyStatusCard` driven by `getAlarms({ module: 'MWQ' })`.
- **MISAnalyticsPage** — tabbed analytics (`AnalyticsTabs`): sensor-data history (`getMqwSensorData`), battery health (`getMqwBatteryHealth`), data capture rate (`getDataCaptureRateMqw`), with charts and CSV-style tables.
- **ReportsPage** — builds a report request and posts to `/reports/generate` (`generateReport`), polls `getReport(id)`, then downloads via `downloadReportFile(id, format)` (authenticated blob download, since a plain link would 401).
- **ProfilePage** — `getMe`/`updateMe`.
- **UserManagementPage** — ADMIN-only; `listUsers` / `createUser` / `updateUser`.

### Theming & i18n
`MWQThemeWrapper` adds the `mwq-theme` class, sets `dir`/`lang` from `localStorage.appLanguage`,
and toggles the Arabic font for RTL. Translations are initialized by `i18n/i18n.js` and
selectable via `LanguageSelector`.

---

## Data-Fetching Cheat Sheet (`lib/queries.js`)

| Function | Endpoint | Used by |
|----------|----------|---------|
| `login / signup / refresh / logout` | `/{module}/auth/*` | auth pages, auth store |
| `forgotPassword / verifyOtp / resetPassword` | `/{module}/auth/*` | password reset flow |
| `getMe / updateMe` | `/{module}/auth/me` | ProfilePage |
| `listUsers / createUser / updateUser` | `/{module}/users` | UserManagementPage (admin) |
| `getAqmsPublicOverview` | `/aqms/public/overview` | AQMS LandingPage (public) |
| `getAqmsStations / getAqmsStationsLive` | `/aqms/stations` + `/aqms/*/latest` | AQMS LiveData |
| `getAqmsAirQualityHistory / ...IndexHistory` | `/aqms/air-quality/(history\|index/history)` | AQMS Analytics, LiveData |
| `getAqmsWeatherLatest / History` | `/aqms/weather/*` | AQMS LiveData, Analytics |
| `getAqmsParameters / getAqmsThresholds` | `/aqms/parameters`, `/aqms/thresholds` | AQMS Analytics |
| `getDataCaptureRateAqms` | `/aqms/data-capture-rate` | AQMS DataCapture |
| `getMqwBuoys` | `/mwq/buoys` | MWQ Dashboard / maps |
| `getMqwSensorData / ...Latest` | `/mwq/sensor-data(/latest)` | MWQ Dashboard, MIS Analytics |
| `getMqwBatteryHealth` | `/mwq/battery-health` | MWQ MIS Analytics |
| `getMqwWeatherLatest / History` | `/mwq/weather/*` | MWQ Dashboard, Analytics |
| `getDataCaptureRateMqw` | `/mwq/data-capture-rate` | MWQ MIS Analytics |
| `getMqwParameters / getMqwThresholds` | `/mwq/parameters`, `/mwq/thresholds` | MWQ Analytics |
| `getAlarms` | `/alarms` | MWQ AlarmsTable, Dashboard |
| `generateReport / getReport / downloadReportFile` | `/reports/*` | MWQ ReportsPage |

See [backend.md](backend.md#api-reference) for the full endpoint contract.

---

## Adding a New Page (recipe)

1. Add the page component under `modules/<MODULE>/pages/`.
2. Register it in the module router (`AQMSRoutes.jsx` / `MWQRoutes.jsx`); wrap with `AuthGate` (and `RequireRole` if admin-only).
3. Add any new API calls to `lib/queries.js` (never call Axios directly from components).
4. Reuse module UI primitives (MWQ: `components/ui/*`) and respect i18n/theme conventions.
