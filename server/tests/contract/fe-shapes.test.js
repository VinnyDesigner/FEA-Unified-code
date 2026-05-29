'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

const AQMS_STATION_ID = process.env.BENCH_AQMS_STATION_ID || '1';
const MQW_BUOY_ID = process.env.BENCH_MQW_BUOY_ID || '1';

const END_DT = new Date().toISOString();
const START_DT = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const TODAY_START = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
const TODAY_END = new Date().toISOString().slice(0, 10) + 'T23:59:59Z';

let accessToken = null;

before(async () => {
  const res = await fetch(`${BASE_URL}/api/v1/mwq/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'admin@fea.local', password: 'ChangeMe123!' }),
  });
  if (res.ok) {
    const body = await res.json();
    accessToken = body.accessToken || (body.data && body.data.accessToken) || null;
  }
});

async function get(path) {
  const headers = { Accept: 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

function assertKeys(obj, keys, ctx) {
  for (const k of keys) {
    assert.ok(k in obj, `${ctx}: missing key '${k}'`);
  }
}

function assertPagination(p, ctx) {
  assertKeys(p, ['offset', 'limit', 'total'], `${ctx}.pagination`);
  assert.equal(typeof p.offset, 'number', `${ctx}.pagination.offset must be number`);
  assert.equal(typeof p.limit, 'number', `${ctx}.pagination.limit must be number`);
  assert.equal(typeof p.total, 'number', `${ctx}.pagination.total must be number`);
}

// ─── /healthz ────────────────────────────────────────────────────────────────

describe('GET /api/v1/healthz', () => {
  it('returns { ok: true, db: { mwq: "ok", aqms: "ok" } }', async () => {
    const { status, body } = await get('/api/v1/healthz');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.equal(body.ok, true);
    assert.ok(body.db && body.db.mwq === 'ok' && body.db.aqms === 'ok', `expected db.mwq=ok and db.aqms=ok, got: ${JSON.stringify(body.db)}`);
  });
});

// ─── AQMS stations ───────────────────────────────────────────────────────────
// Actual shape: { data: [...], pagination: {...} }
// Station fields: id, stationCode, stationName, latitude(string), longitude(string)

describe('GET /api/v1/aqms/stations', () => {
  it('returns { data, pagination } with stationName/latitude/longitude', async () => {
    const { status, body } = await get('/api/v1/aqms/stations');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assert.ok(body.data.length > 0, 'data must not be empty');
    assertPagination(body.pagination, 'aqms/stations');
    const s = body.data[0];
    assertKeys(s, ['id', 'stationName', 'latitude', 'longitude'], 'stations.data[0]');
    // Phase 4 note: FE LiveData.jsx uses lat/lng but API returns latitude/longitude
  });
});

// ─── AQMS air-quality/latest ─────────────────────────────────────────────────
// Actual shape: array of per-parameter rows with stationId/stationName/parameterName/value/unit

describe('GET /api/v1/aqms/air-quality/latest', () => {
  it('returns array with per-parameter rows', async () => {
    const { status, body } = await get('/api/v1/aqms/air-quality/latest');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(Array.isArray(body), 'response must be array');
    if (body.length > 0) {
      const r = body[0];
      assertKeys(r, ['stationId', 'stationName', 'parameterName', 'value', 'unit'], 'air-quality/latest[0]');
    }
  });
});

// ─── AQMS air-quality/history ─────────────────────────────────────────────────
// Actual fields: id(string BigInt), stationId, stationName, parameterId, parameterName, observationTime, value, unit

describe('GET /api/v1/aqms/air-quality/history', () => {
  it('returns { data, pagination } envelope', async () => {
    const url = `/api/v1/aqms/air-quality/history?stationId=${AQMS_STATION_ID}&startTime=${START_DT}&endTime=${END_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assertPagination(body.pagination, 'air-quality/history');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['stationId', 'parameterName', 'value', 'unit', 'observationTime'], 'air-quality/history.data[0]');
    }
  });

  it('returns 400 when startTime > endTime', async () => {
    const url = `/api/v1/aqms/air-quality/history?stationId=${AQMS_STATION_ID}&startTime=${END_DT}&endTime=${START_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 400, `expected 400, got ${status}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── AQMS weather/latest ─────────────────────────────────────────────────────

describe('GET /api/v1/aqms/weather/latest', () => {
  it('returns array with stationId and stationName', async () => {
    const { status, body } = await get('/api/v1/aqms/weather/latest');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(Array.isArray(body), 'response must be array');
    if (body.length > 0) {
      assertKeys(body[0], ['stationId', 'stationName'], 'weather/latest[0]');
    }
  });
});

// ─── AQMS weather/history ────────────────────────────────────────────────────

describe('GET /api/v1/aqms/weather/history', () => {
  it('returns { data, pagination } envelope', async () => {
    const url = `/api/v1/aqms/weather/history?stationId=${AQMS_STATION_ID}&startTime=${START_DT}&endTime=${END_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assertPagination(body.pagination, 'weather/history');
  });

  it('returns 400 when startTime > endTime', async () => {
    const url = `/api/v1/aqms/weather/history?stationId=${AQMS_STATION_ID}&startTime=${END_DT}&endTime=${START_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 400, `expected 400, got ${status}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── AQMS data-capture-rate ──────────────────────────────────────────────────

describe('GET /api/v1/aqms/data-capture-rate', () => {
  it('returns array with per-station-per-parameter shape', async () => {
    const url = `/api/v1/aqms/data-capture-rate?startDate=${TODAY_START}&endDate=${TODAY_END}`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(Array.isArray(body), 'response must be array');
    if (body.length > 0) {
      assertKeys(body[0], ['stationId'], 'aqms/data-capture-rate[0]');
    }
  });

  it('returns 400 on invalid period params', async () => {
    const { status, body } = await get('/api/v1/aqms/data-capture-rate?startDate=bad&endDate=bad');
    assert.equal(status, 400, `expected 400, got ${status}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── MQW buoys ───────────────────────────────────────────────────────────────
// Actual shape: { data: [...], pagination: {...} }
// Buoy fields: id, buoyName, latitude(string), longitude(string)
// Phase 4 note: BuoyStatusCard.jsx uses hardcoded getBuoyCoordinates() — lat/lng not from API yet

describe('GET /api/v1/mwq/buoys', () => {
  it('returns { data } with buoyName/latitude/longitude', async () => {
    const { status, body } = await get('/api/v1/mwq/buoys');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assert.ok(body.data.length > 0, 'data must not be empty');
    const b = body.data[0];
    assertKeys(b, ['id', 'buoyName', 'latitude', 'longitude'], 'mqw/buoys.data[0]');
    // Phase 4 note: route returns {data} without pagination envelope — diverges from plan
  });
});

// ─── MQW sensor-data (list) ───────────────────────────────────────────────────
// Actual fields: buoyId, station, dateTime, turbidity, ph, dissolvedOxygen, chlorophyll, oxygenSat, salinity, depth
// Phase 4 note: FE uses oxygenSat (matches API), but field is oxygenSaturation in schema — API uses oxygenSat

describe('GET /api/v1/mwq/sensor-data', () => {
  it('returns { data, pagination } with sonde fields', async () => {
    const url = `/api/v1/mwq/sensor-data?buoyId=${MQW_BUOY_ID}&startTime=${START_DT}&endTime=${END_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assertPagination(body.pagination, 'mqw/sensor-data');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['buoyId', 'station', 'dateTime'], 'mqw/sensor-data.data[0]');
    }
  });
});

// ─── MQW sensor-data/latest ───────────────────────────────────────────────────
// Actual shape: { data: [...], pagination: {...} }
// Fields: buoyId, station, dateTime, oxygenSat, dissolvedOxygen, turbidity, ph, chlorophyll, salinity, depth

describe('GET /api/v1/mwq/sensor-data/latest', () => {
  it('returns { data } with one reading per buoy', async () => {
    const { status, body } = await get('/api/v1/mwq/sensor-data/latest');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['buoyId', 'station', 'dateTime'], 'mqw/sensor-data/latest.data[0]');
    }
    // Phase 4 note: route returns {data} without pagination envelope — diverges from plan
  });
});

// ─── MQW battery-health ───────────────────────────────────────────────────────
// Actual shape: { data: [{ buoyId, buoyName, currentVoltage, series: [{observationTime, volt}] }], pagination }

describe('GET /api/v1/mwq/battery-health', () => {
  it('returns { data } with nested voltage series', async () => {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const url = `/api/v1/mwq/battery-health?buoyId=${MQW_BUOY_ID}&startTime=${THIRTY_DAYS_AGO}&endTime=${END_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['buoyId', 'buoyName', 'currentVoltage', 'series'], 'mqw/battery-health.data[0]');
      assert.ok(Array.isArray(body.data[0].series), 'series must be array');
    }
    // Phase 4 note: route returns {data} without pagination envelope — diverges from plan
  });
});

// ─── MQW data-capture-rate ───────────────────────────────────────────────────
// Actual shape: { data: [], pagination: {...} } — mwq_data_capture_rates table empty in Phase 3 seed

describe('GET /api/v1/mwq/data-capture-rate', () => {
  it('returns { data, pagination } (data may be empty — known Phase 3 seed gap)', async () => {
    const url = `/api/v1/mwq/data-capture-rate?startDate=${TODAY_START}&endDate=${TODAY_END}`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assertPagination(body.pagination, 'mqw/data-capture-rate');
  });
});

// ─── Shared alarms ───────────────────────────────────────────────────────────

describe('GET /api/v1/alarms', () => {
  it('returns { data, pagination } envelope', async () => {
    const { status, body } = await get('/api/v1/alarms?limit=10&offset=0');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assertPagination(body.pagination, 'alarms');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['id', 'alarmCode', 'module', 'alarmMessage'], 'alarms.data[0]');
      const validCodes = ['COMM_LOST', 'DOOR_OPEN', 'GPS_LOST', 'BATTERY_LOW', 'SENSOR_FAULT', 'POWER_FAULT', 'THRESHOLD_EXCEEDED', 'OFFLINE'];
      assert.ok(validCodes.includes(body.data[0].alarmCode), `alarmCode '${body.data[0].alarmCode}' must be valid enum`);
      const validModules = ['AQMS', 'MWQ'];
      assert.ok(validModules.includes(body.data[0].module), `module '${body.data[0].module}' must be AQMS or MWQ`);
    }
  });

  it('filters by ?module=AQMS', async () => {
    const { status, body } = await get('/api/v1/alarms?module=AQMS&limit=10&offset=0');
    assert.equal(status, 200, `expected 200, got ${status}`);
    body.data.forEach((a, i) => assert.equal(a.module, 'AQMS', `alarms[${i}].module must be AQMS`));
  });

  it('filters by ?module=MWQ', async () => {
    const { status, body } = await get('/api/v1/alarms?module=MWQ&limit=10&offset=0');
    assert.equal(status, 200, `expected 200, got ${status}`);
    body.data.forEach((a, i) => assert.equal(a.module, 'MWQ', `alarms[${i}].module must be MWQ`));
  });

  it('returns 400 on invalid module value', async () => {
    const { status, body } = await get('/api/v1/alarms?module=INVALID');
    assert.equal(status, 400, `expected 400, got ${status}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── Phase 1: AQMS parameters ─────────────────────────────────────────────────
// Shape: { data: [{ id, name, type, unit }] }

describe('GET /api/v1/aqms/parameters', () => {
  it('returns { data } with { id, name, type, unit }', async () => {
    const { status, body } = await get('/api/v1/aqms/parameters');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assert.ok(body.data.length > 0, 'data must not be empty');
    assertKeys(body.data[0], ['id', 'name', 'type', 'unit'], 'aqms/parameters.data[0]');
    assert.equal(typeof body.data[0].id, 'number', 'id must be number');
  });
});

// ─── Phase 1: AQMS air-quality/index/history ──────────────────────────────────
// Shape: { data: [{ stationId, stationName, aqi, category, color, observationTime }], pagination }

describe('GET /api/v1/aqms/air-quality/index/history', () => {
  it('returns { data, pagination } with AQI index fields', async () => {
    const url = `/api/v1/aqms/air-quality/index/history?stationId=${AQMS_STATION_ID}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assertPagination(body.pagination, 'aqms/air-quality/index/history');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['stationId', 'stationName', 'aqi', 'category', 'color', 'observationTime'], 'index/history.data[0]');
    }
  });
});

// ─── Phase 1: AQMS stations extended with assignedParameters ──────────────────

describe('GET /api/v1/aqms/stations (assignedParameters)', () => {
  it('each station row carries assignedParameters: [{id, name}]', async () => {
    const { status, body } = await get('/api/v1/aqms/stations');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(Array.isArray(body.data) && body.data.length > 0, 'data must be non-empty array');
    const s = body.data[0];
    assertKeys(s, ['assignedParameters'], 'stations.data[0]');
    assert.ok(Array.isArray(s.assignedParameters), 'assignedParameters must be array');
    if (s.assignedParameters.length > 0) {
      assertKeys(s.assignedParameters[0], ['id', 'name'], 'stations.data[0].assignedParameters[0]');
    }
  });
});

// ─── Phase 1: MWQ weather/latest ──────────────────────────────────────────────
// Shape: { data: [{ buoyId, station, dateTime, windSpeed, windDirection }] }

describe('GET /api/v1/mwq/weather/latest', () => {
  it('returns { data } with buoyId/station/dateTime', async () => {
    const { status, body } = await get('/api/v1/mwq/weather/latest');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['buoyId', 'station', 'dateTime'], 'mwq/weather/latest.data[0]');
    }
  });
});

// ─── Phase 1: MWQ weather/history ─────────────────────────────────────────────

describe('GET /api/v1/mwq/weather/history', () => {
  it('returns { data, pagination } envelope', async () => {
    const url = `/api/v1/mwq/weather/history?buoyId=${MQW_BUOY_ID}&from=${START_DT}&to=${END_DT}&limit=10&offset=0`;
    const { status, body } = await get(url);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body && 'pagination' in body, 'must have data and pagination keys');
    assert.ok(Array.isArray(body.data), 'data must be array');
    assertPagination(body.pagination, 'mwq/weather/history');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['buoyId', 'station', 'dateTime'], 'mwq/weather/history.data[0]');
    }
  });
});

// ─── Phase 1: MWQ thresholds ──────────────────────────────────────────────────
// Shape: { data: [{ parameterId, parameterName, min, max }] }

describe('GET /api/v1/mwq/thresholds', () => {
  it('returns { data } with { parameterId, parameterName, min, max }', async () => {
    const { status, body } = await get('/api/v1/mwq/thresholds');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['parameterId', 'parameterName', 'min', 'max'], 'mwq/thresholds.data[0]');
    }
  });
});

// ─── Phase 1: AQMS thresholds ─────────────────────────────────────────────────
// Shape: { data: [{ parameterId, parameterName, min, max, standardType }] }

describe('GET /api/v1/aqms/thresholds', () => {
  it('returns { data } with { parameterId, parameterName, min, max }', async () => {
    const { status, body } = await get('/api/v1/aqms/thresholds');
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok('data' in body, 'must have data key');
    assert.ok(Array.isArray(body.data), 'data must be array');
    if (body.data.length > 0) {
      assertKeys(body.data[0], ['parameterId', 'parameterName', 'min', 'max'], 'aqms/thresholds.data[0]');
    }
  });
});

// ─── Phase 1: AQMS public overview (PUBLIC — anonymous 200 enforces mount order) ─
// Standalone fetch with NO Authorization header. Asserts 200 to mechanically
// enforce that /aqms/public is registered before the protected /aqms mount.

describe('GET /api/v1/aqms/public/overview (PUBLIC)', () => {
  it('returns 200 anonymously (no token) with overview fields', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/aqms/public/overview`, {
      headers: { Accept: 'application/json' }, // intentionally NO Authorization
    });
    let body;
    try { body = await res.json(); } catch { body = null; }
    assert.equal(res.status, 200, `expected anonymous 200, got ${res.status}: ${JSON.stringify(body)}`);
    assertKeys(body, ['latestAqiByStation', 'stationCount', 'trend'], 'aqms/public/overview');
    assert.ok(Array.isArray(body.latestAqiByStation), 'latestAqiByStation must be array');
    assert.equal(typeof body.stationCount, 'number', 'stationCount must be number');
    assert.ok(Array.isArray(body.trend), 'trend must be array');
    if (body.latestAqiByStation.length > 0) {
      assertKeys(body.latestAqiByStation[0], ['stationCode', 'name', 'aqi', 'category', 'color'], 'latestAqiByStation[0]');
    }
    if (body.trend.length > 0) {
      assertKeys(body.trend[0], ['observationTime', 'aqi'], 'trend[0]');
    }
  });
});
