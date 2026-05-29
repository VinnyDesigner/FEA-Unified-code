'use strict';

// Set required env vars before any module that imports env.js is loaded
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(40);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(40);
process.env.DATABASE_URL_MWQ = process.env.DATABASE_URL_MWQ || 'postgresql://x';
process.env.DATABASE_URL_AQMS = process.env.DATABASE_URL_AQMS || 'postgresql://x';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { requireAuth } = require('../../src/middleware/requireAuth');
const { signAccess } = require('../../src/modules/shared/auth/tokens');

const MOCK_USER = {
  sub: 'user-123',
  role: 'ADMIN',
  module: 'MWQ',
  accountStatus: 'ACTIVE',
  email: 'admin@fea.local',
};

function makeRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

describe('requireAuth (JWT verification)', () => {
  test('no Authorization header: 401 UNAUTHORIZED, next not called', () => {
    const req = { headers: {} };
    const res = makeRes();
    let called = false;
    requireAuth(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res._status, 401);
    assert.equal(res._body.error.code, 'UNAUTHORIZED');
  });

  test('malformed header (no Bearer prefix): 401 UNAUTHORIZED', () => {
    const req = { headers: { authorization: 'not-a-valid-bearer' } };
    const res = makeRes();
    let called = false;
    requireAuth(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res._status, 401);
    assert.equal(res._body.error.code, 'UNAUTHORIZED');
  });

  test('valid signed JWT: req.user populated from claims, next called once', () => {
    const token = signAccess(MOCK_USER);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    let callCount = 0;
    requireAuth(req, res, () => { callCount++; });
    assert.equal(callCount, 1);
    assert.equal(req.user.id, MOCK_USER.sub);
    assert.equal(req.user.role, MOCK_USER.role);
    assert.equal(req.user.module, MOCK_USER.module);
    assert.equal(req.user.accountStatus, MOCK_USER.accountStatus);
    assert.equal(req.user.email, MOCK_USER.email);
  });

  test('expired JWT: 401 TOKEN_EXPIRED', () => {
    const token = jwt.sign(
      { sub: MOCK_USER.sub, role: MOCK_USER.role, module: MOCK_USER.module, accountStatus: MOCK_USER.accountStatus, email: MOCK_USER.email },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    let called = false;
    requireAuth(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res._status, 401);
    assert.equal(res._body.error.code, 'TOKEN_EXPIRED');
  });

  test('tampered token: 401 UNAUTHORIZED', () => {
    const token = signAccess(MOCK_USER);
    // Mutate last char of signature (third segment)
    const parts = token.split('.');
    const sig = parts[2];
    parts[2] = sig.slice(0, -1) + (sig[sig.length - 1] === 'A' ? 'B' : 'A');
    const tampered = parts.join('.');
    const req = { headers: { authorization: `Bearer ${tampered}` } };
    const res = makeRes();
    let called = false;
    requireAuth(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res._status, 401);
    assert.equal(res._body.error.code, 'UNAUTHORIZED');
  });
});

describe('requireRole', () => {
  const { requireRole } = require('../../src/middleware/requireRole');
  let res, next;

  beforeEach(() => {
    res = makeRes();
    next = (() => { let c = 0; const fn = () => c++; fn.callCount = () => c; return fn; })();
  });

  test('matching role: calls next()', () => {
    const req = { user: { role: 'ADMIN' } };
    requireRole('ADMIN')(req, res, next);
    assert.equal(next.callCount(), 1);
  });

  test('mismatched role: 403 FORBIDDEN', () => {
    const req = { user: { role: 'VIEWER' } };
    requireRole('ADMIN')(req, res, next);
    assert.equal(next.callCount(), 0);
    assert.equal(res._status, 403);
    assert.equal(res._body.error.code, 'FORBIDDEN');
  });

  test('no req.user: 403 FORBIDDEN', () => {
    const req = {};
    requireRole('ADMIN')(req, res, next);
    assert.equal(next.callCount(), 0);
    assert.equal(res._status, 403);
  });

  test('req.user is null: 403 FORBIDDEN', () => {
    const req = { user: null };
    requireRole('VIEWER')(req, res, next);
    assert.equal(next.callCount(), 0);
    assert.equal(res._status, 403);
  });
});
