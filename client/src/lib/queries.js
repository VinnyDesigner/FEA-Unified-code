import api from './api';

// ── Auth helpers ────────────────────────────────────────────────────────────

// Auth is served by the single collapsed `/auth` mount. `module` is no longer
// part of the path — for signup it only names the application to request access
// to; the server returns access[]/perms[] which the client uses for authz.
export async function signup({ module, body }) {
  const r = await api.post('/auth/signup', { ...body, application: module });
  return r.data;
}

export async function login({ body }) {
  const r = await api.post('/auth/login', body);
  return r.data;
}

export async function logout(refreshToken) {
  const r = await api.post('/auth/logout', { refreshToken });
  return r.data;
}

export async function refresh(refreshToken) {
  const r = await api.post('/auth/refresh', { refreshToken });
  return r.data;
}

export async function forgotPassword({ body }) {
  const r = await api.post('/auth/forgot-password', body);
  return r.data;
}

export async function verifyOtp({ body }) {
  const r = await api.post('/auth/verify-otp', body);
  return r.data;
}

export async function resetPassword({ body }) {
  const r = await api.post('/auth/reset-password', body);
  return r.data;
}

export async function getMe(module) {
  const r = await api.get(`/${module.toLowerCase()}/auth/me`);
  return r.data;
}

export async function updateMe(module, body) {
  const r = await api.patch(`/${module.toLowerCase()}/auth/me`, body);
  return r.data;
}

export async function listUsers(module, params) {
  const r = await api.get(`/${module.toLowerCase()}/users`, { params });
  return r.data;
}

export async function updateUser(module, id, body) {
  const r = await api.patch(`/${module.toLowerCase()}/users/${id}`, body);
  return r.data;
}

export async function createUser(module, body) {
  const r = await api.post(`/${module.toLowerCase()}/users`, body);
  return r.data;
}

// ── Data helpers ─────────────────────────────────────────────────────────────

const BUOY_COLORS = ['orange', 'yellow', 'cyan', 'pink'];

let _buoyIdByName = null;
async function resolveBuoyId(input) {
  if (input == null) return input;
  if (typeof input === 'object' && input.id != null) return Number(input.id);
  if (typeof input === 'number') return input;
  const s = String(input).trim();
  if (/^\d+$/.test(s)) return Number(s);
  if (!_buoyIdByName) {
    const r = await api.get('/mwq/buoys');
    _buoyIdByName = new Map((r.data.data || []).map((b) => [b.buoyName.toLowerCase(), b.id]));
  }
  return _buoyIdByName.get(s.toLowerCase()) ?? input;
}

function aqiCategory(aqi) {
  if (aqi <= 50) return { category: 'Good', aqiColor: '#84cc16' };
  if (aqi <= 100) return { category: 'Moderate', aqiColor: '#fcd34d' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', aqiColor: '#f97316' };
  if (aqi <= 200) return { category: 'Unhealthy', aqiColor: '#ef4444' };
  if (aqi <= 300) return { category: 'Very Unhealthy', aqiColor: '#a855f7' };
  return { category: 'Hazardous', aqiColor: '#7f1d1d' };
}

function windDirText(deg) {
  if (deg == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// The AQMS /latest endpoints return long-format rows (one per parameter). These
// maps pivot parameterName -> the wide-format field names the UI consumes.
const AQMS_POLLUTANT_FIELD = {
  'PM2.5': 'pm25', 'PM10': 'pm10', 'CO': 'co', 'O3': 'o3', 'NO2': 'no2',
  'SO2': 'so2', 'CO2': 'co2', 'CH4': 'ch4', 'H2S': 'h2s', 'NMHC': 'nmhc',
};
const AQMS_WEATHER_FIELD = {
  'Temperature': 'temp', 'Pressure': 'pressure', 'Solar Radiation': 'solar',
  'Humidity': 'humidity', 'Wind Speed': 'windSpeed', 'Wind Direction': 'windDirection',
};

// Parse a numeric string from the API and round to 1 decimal for clean display.
function num1(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.round(n * 10) / 10;
}

export async function getAqmsStations({ signal } = {}) {
  const r = await api.get('/aqms/stations', { signal });
  return (r.data.data || []).map((s) => ({
    ...s,
    name: s.stationName,
    lat: Number(s.latitude),
    lng: Number(s.longitude),
  }));
}

// /latest endpoints return a BARE array (not a { data } envelope), so read r.data directly.
export async function getAqmsAirQualityLatest({ stationId } = {}, { signal } = {}) {
  const params = stationId ? { stationId } : {};
  return api.get('/aqms/air-quality/latest', { params, signal }).then((r) => r.data);
}

export async function getAqmsAirQualityIndexLatest({ stationId } = {}, { signal } = {}) {
  const params = stationId ? { stationId } : {};
  return api.get('/aqms/air-quality/index/latest', { params, signal }).then((r) => r.data);
}

// AQI time-series for the LiveData AQI chart + LandingPage trend. {data,pagination} envelope.
export async function getAqmsAirQualityIndexHistory({ stationId, startTime, endTime, limit, offset } = {}, { signal } = {}) {
  return api.get('/aqms/air-quality/index/history', { params: { stationId, startTime, endTime, limit, offset }, signal }).then((r) => r.data.data);
}

// AQMS parameter master list (kills the hardcoded PARAM_ID_BY_NAME). {data} envelope.
export async function getAqmsParameters({ signal } = {}) {
  return api.get('/aqms/parameters', { signal }).then((r) => r.data.data);
}

// Per-parameter thresholds. {data} envelope.
export async function getAqmsThresholds({ signal } = {}) {
  return api.get('/aqms/thresholds', { signal }).then((r) => r.data.data);
}
export async function getMqwThresholds({ signal } = {}) {
  return api.get('/mwq/thresholds', { signal }).then((r) => r.data.data);
}

// MWQ weather (wind-only): latest is {data}; history is {data,pagination}.
export async function getMqwWeatherLatest({ buoyId } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  const params = id ? { buoyId: id } : {};
  return api.get('/mwq/weather/latest', { params, signal }).then((r) => r.data.data);
}
export async function getMqwWeatherHistory({ buoyId, from, to, limit, offset } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  return api.get('/mwq/weather/history', { params: { buoyId: id, from, to, limit, offset }, signal }).then((r) => r.data.data);
}

// PUBLIC landing-page overview (no auth). BARE object: {latestAqiByStation, stationCount, trend}.
export async function getAqmsPublicOverview({ signal } = {}) {
  return api.get('/aqms/public/overview', { signal }).then((r) => r.data);
}

export async function getAqmsAirQualityHistory({ stationId, startTime, endTime, limit, offset }, { signal } = {}) {
  return api.get('/aqms/air-quality/history', { params: { stationId, startTime, endTime, limit, offset }, signal }).then((r) => r.data.data);
}

export async function getAqmsWeatherLatest({ stationId } = {}, { signal } = {}) {
  const params = stationId ? { stationId } : {};
  return api.get('/aqms/weather/latest', { params, signal }).then((r) => r.data);
}

export async function getAqmsWeatherHistory({ stationId, startTime, endTime, limit, offset }, { signal } = {}) {
  return api.get('/aqms/weather/history', { params: { stationId, startTime, endTime, limit, offset }, signal }).then((r) => r.data.data);
}

export async function getAqmsStationsLive({ signal } = {}) {
  const [stations, aqLatest, wxLatest, aqiLatest] = await Promise.all([
    getAqmsStations({ signal }),
    getAqmsAirQualityLatest({}, { signal }),
    getAqmsWeatherLatest({}, { signal }),
    getAqmsAirQualityIndexLatest({}, { signal }).catch(() => []),
  ]);

  // Pivot long-format rows (one per parameter) into wide objects keyed by stationId.
  const aqByStation = {};
  (aqLatest || []).forEach((row) => {
    const field = AQMS_POLLUTANT_FIELD[row.parameterName];
    if (!field) return;
    (aqByStation[row.stationId] ||= {})[field] = num1(row.value);
  });

  const wxByStation = {};
  (wxLatest || []).forEach((row) => {
    const field = AQMS_WEATHER_FIELD[row.parameterName];
    if (!field) return;
    (wxByStation[row.stationId] ||= {})[field] = num1(row.value);
  });

  const aqiByStation = {};
  (aqiLatest || []).forEach((row) => { aqiByStation[row.stationId] = row; });

  const result = {};
  stations.forEach((s) => {
    const aq = aqByStation[s.id] || {};
    const wx = wxByStation[s.id] || {};
    const aqi = aqiByStation[s.id]?.aqi != null ? Number(aqiByStation[s.id].aqi) : null;
    result[s.name] = {
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      aqi,
      ...aqiCategory(aqi),
      pm25: aq.pm25 ?? null,
      pm10: aq.pm10 ?? null,
      co: aq.co ?? null,
      o3: aq.o3 ?? null,
      no2: aq.no2 ?? null,
      so2: aq.so2 ?? null,
      co2: aq.co2 ?? null,
      ch4: aq.ch4 ?? null,
      h2s: aq.h2s ?? null,
      nmhc: aq.nmhc ?? null,
      windSpeed: wx.windSpeed ?? null,
      windDirection: wx.windDirection ?? null,
      windDirText: windDirText(wx.windDirection),
      temp: wx.temp ?? null,
      pressure: wx.pressure ?? null,
      solar: wx.solar ?? null,
      humidity: wx.humidity ?? null,
    };
  });
  return result;
}

export async function getDataCaptureRateAqms({ startDate, endDate } = {}, { signal } = {}) {
  return api.get('/aqms/data-capture-rate', { params: { startDate, endDate }, signal }).then((r) => r.data.data);
}

export async function getMqwBuoys({ signal } = {}) {
  const r = await api.get('/mwq/buoys', { signal });
  return (r.data.data || []).map((b, i) => ({
    ...b,
    latitude: Number(b.latitude),
    longitude: Number(b.longitude),
    position: [Number(b.latitude), Number(b.longitude)],
    color: BUOY_COLORS[i % BUOY_COLORS.length],
  }));
}

export async function getMqwSensorData({ buoyId, params, from, to, limit, offset } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  return api.get('/mwq/sensor-data', { params: { buoyId: id, params, from, to, limit, offset }, signal }).then((r) => r.data.data);
}

export async function getMqwSensorDataLatest({ buoyId } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  const params = id ? { buoyId: id } : {};
  return api.get('/mwq/sensor-data/latest', { params, signal }).then((r) => r.data.data);
}

export async function getMqwBatteryHealth({ buoyId, from, to } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  return api.get('/mwq/battery-health', { params: { buoyId: id, from, to }, signal }).then((r) => r.data.data);
}

export async function getDataCaptureRateMqw({ buoyId, from, to } = {}, { signal } = {}) {
  const id = await resolveBuoyId(buoyId);
  return api.get('/mwq/data-capture-rate', { params: { buoyId: id, from, to }, signal }).then((r) => r.data.data);
}

export async function getAlarms({ module, limit } = {}, { signal } = {}) {
  return api.get('/alarms', { params: { module, limit }, signal }).then((r) => r.data.data);
}

export async function getMqwParameters({ signal } = {}) {
  const { data } = await api.get('/mwq/parameters', { signal });
  return data.data;
}

export async function generateReport(payload, opts = {}) {
  const { data } = await api.post('/reports/generate', payload, opts);
  return data.data;
}

export async function getReport(id, opts = {}) {
  const { data } = await api.get(`/reports/${id}`, opts);
  return data.data;
}

export function getReportDownloadUrl(id, format) {
  return `${api.defaults.baseURL}/reports/${id}/download?format=${format}`;
}

// Download a generated report file as a Blob. Goes through axios so the Bearer
// token interceptor authenticates the request (a plain link would 401).
export async function downloadReportFile(id, format, opts = {}) {
  const r = await api.get(`/reports/${id}/download`, {
    params: { format },
    responseType: 'blob',
    ...opts,
  });
  return r.data;
}
