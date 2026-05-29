'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// small filter that should return rows from seeded data; uses wide date range
const GENERATE_BODY = {
  module: 'MQW',
  parameterIds: [1, 2],
  stationIds: [1],
  startDate: '2020-01-01T00:00:00Z',
  endDate: '2030-01-01T00:00:00Z',
  formats: ['XLSX'],
};

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json, headers: res.headers };
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Accept: 'application/json' } });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json, headers: res.headers };
}

async function getRaw(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const buf = await res.arrayBuffer();
  return { status: res.status, byteLength: buf.byteLength, headers: res.headers, contentType: res.headers.get('content-type') };
}

// ─── POST /reports/generate happy path ───────────────────────────────────────

describe('POST /api/v1/reports/generate', () => {
  it('returns 201 with Report row shape (MQW + XLSX)', async () => {
    const { status, body } = await post('/api/v1/reports/generate', GENERATE_BODY);
    assert.equal(status, 201, `expected 201, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.data, 'response must have data key');
    const r = body.data;
    assert.ok('id' in r,          'report must have id');
    assert.ok('userId' in r,       'report must have userId');
    assert.ok('module' in r,       'report must have module');
    assert.ok('formats' in r,      'report must have formats');
    assert.ok('storagePaths' in r, 'report must have storagePaths');
    assert.ok('status' in r,       'report must have status');
    assert.equal(r.status, 'READY', 'status must be READY on sync generation');
    assert.ok(r.storagePaths && r.storagePaths['XLSX'], 'storagePaths must have XLSX key');
  });

  it('returns 400 with VALIDATION_FAILED on missing required fields', async () => {
    const { status, body } = await post('/api/v1/reports/generate', { module: 'MQW' });
    assert.equal(status, 400, `expected 400, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });

  it('returns 400 with VALIDATION_FAILED on invalid module', async () => {
    const { status, body } = await post('/api/v1/reports/generate', {
      ...GENERATE_BODY,
      module: 'INVALID',
    });
    assert.equal(status, 400, `expected 400, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });

  it('returns 400 when endDate < startDate', async () => {
    const { status, body } = await post('/api/v1/reports/generate', {
      ...GENERATE_BODY,
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2024-01-01T00:00:00Z',
    });
    assert.equal(status, 400, `expected 400, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── GET /reports/:id ─────────────────────────────────────────────────────────

describe('GET /api/v1/reports/:id', () => {
  it('returns 200 with same Report row shape after generate', async () => {
    // create a report first
    const { status: s201, body: created } = await post('/api/v1/reports/generate', GENERATE_BODY);
    assert.equal(s201, 201, `generate must return 201, got ${s201}`);
    const reportId = created.data.id;

    const { status, body } = await get(`/api/v1/reports/${reportId}`);
    assert.equal(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.data, 'response must have data key');
    assert.equal(body.data.id, reportId, 'returned id must match');
    assert.equal(body.data.status, 'READY', 'status must be READY');
  });

  it('returns 404 for non-existent report id', async () => {
    const { status, body } = await get('/api/v1/reports/999999999');
    assert.equal(status, 404, `expected 404, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});

// ─── GET /reports/:id/download ────────────────────────────────────────────────

describe('GET /api/v1/reports/:id/download', () => {
  it('returns 200 binary with correct content-type for XLSX', async () => {
    const { body: created, status: s201 } = await post('/api/v1/reports/generate', GENERATE_BODY);
    assert.equal(s201, 201, `generate must return 201, got ${s201}`);
    const reportId = created.data.id;

    const { status, byteLength, contentType } = await getRaw(`/api/v1/reports/${reportId}/download?format=XLSX`);
    assert.equal(status, 200, `expected 200 download, got ${status}`);
    assert.ok(byteLength > 0, 'downloaded file must have bytes');
    assert.ok(
      contentType && contentType.includes('spreadsheetml'),
      `expected XLSX content-type, got ${contentType}`
    );
  });

  it('returns 404 FORMAT_NOT_AVAILABLE when requesting DOCX format not generated', async () => {
    // generate XLSX only
    const { body: created, status: s201 } = await post('/api/v1/reports/generate', GENERATE_BODY);
    assert.equal(s201, 201, `generate must return 201, got ${s201}`);
    const reportId = created.data.id;

    const { status, body } = await get(`/api/v1/reports/${reportId}/download?format=DOCX`);
    assert.equal(status, 404, `expected 404, got ${status}: ${JSON.stringify(body)}`);
    assert.equal(body?.error?.code, 'FORMAT_NOT_AVAILABLE', 'error code must be FORMAT_NOT_AVAILABLE');
  });

  it('returns 400 on invalid format query param', async () => {
    const { body: created } = await post('/api/v1/reports/generate', GENERATE_BODY);
    const reportId = created?.data?.id ?? 1;
    const { status, body } = await get(`/api/v1/reports/${reportId}/download?format=CSV`);
    assert.equal(status, 400, `expected 400, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.error?.code, 'error envelope must include code');
  });
});
