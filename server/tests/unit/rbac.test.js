'use strict';

// Phase 3 RBAC unit tests: token v2 round-trip + requirePermission + requireModule.
// Pure unit tests — no DB, no network. Run with: npm run test:unit

const { test } = require('node:test');
const assert = require('node:assert/strict');

// env required by tokens.js — set before require.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(40);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'y'.repeat(40);
process.env.DATABASE_URL_MWQ = process.env.DATABASE_URL_MWQ || 'postgresql://u:p@localhost:5432/x';
process.env.DATABASE_URL_AQMS = process.env.DATABASE_URL_AQMS || 'postgresql://u:p@localhost:5432/x';
process.env.DATABASE_URL_HIGHER_LEVEL = process.env.DATABASE_URL_HIGHER_LEVEL || 'postgresql://u:p@localhost:5432/x';

const { signAccess, verifyAccess } = require('../../src/modules/shared/auth/tokens');
const { requirePermission } = require('../../src/middleware/requirePermission');
const { requireModule } = require('../../src/middleware/requireModule');

// Minimal res/next doubles.
function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}
function runMw(mw, req) {
  const res = mockRes();
  let nexted = false;
  mw(req, res, () => { nexted = true; });
  return { res, nexted };
}

// ---------------------------------------------------------------------
// Token v2
// ---------------------------------------------------------------------
test('signAccess/verifyAccess round-trips access[] and perms[]', () => {
  const token = signAccess({
    sub: 5, role: 'ADMIN', module: 'MWQ', accountStatus: 'ACTIVE', email: 'a@b.c',
    access: [{ app: 'MWQ', role: 'ADMIN', status: 'ACTIVE' }, { app: 'AQMS', role: 'ADMIN', status: 'ACTIVE' }],
    perms: ['data:read', 'users:manage'],
  });
  const claims = verifyAccess(token);
  assert.equal(claims.sub, 5);
  assert.equal(claims.aud, 'access');
  assert.deepEqual(claims.perms, ['data:read', 'users:manage']);
  assert.equal(claims.access.length, 2);
  assert.equal(claims.access[0].app, 'MWQ');
});

test('signAccess defaults access/perms to empty arrays', () => {
  const claims = verifyAccess(signAccess({ sub: 1, role: 'MWQ_MEMBER', module: 'MWQ', accountStatus: 'ACTIVE', email: 'm@b.c' }));
  assert.deepEqual(claims.access, []);
  assert.deepEqual(claims.perms, []);
});

// ---------------------------------------------------------------------
// requirePermission
// ---------------------------------------------------------------------
test('requirePermission allows when perm present', () => {
  const { nexted } = runMw(requirePermission('reports:generate'), { user: { perms: ['reports:generate'], access: [] } });
  assert.equal(nexted, true);
});

test('requirePermission allows ACTIVE admin grant (bypass) without explicit perm', () => {
  const { nexted } = runMw(requirePermission('reports:generate'), { user: { perms: [], access: [{ app: 'MWQ', role: 'ADMIN', status: 'ACTIVE' }] } });
  assert.equal(nexted, true);
});

test('requirePermission 403 when perm missing and not admin', () => {
  const { res, nexted } = runMw(requirePermission('users:manage'), { user: { perms: ['data:read'], access: [{ app: 'MWQ', role: 'MWQ_MEMBER', status: 'ACTIVE' }] } });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('requirePermission does NOT bypass for a non-ACTIVE admin grant', () => {
  const { res, nexted } = runMw(requirePermission('users:manage'), { user: { perms: [], access: [{ app: 'MWQ', role: 'ADMIN', status: 'SUSPENDED' }] } });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 403);
});

test('requirePermission 401 with no user', () => {
  const { res } = runMw(requirePermission('data:read'), {});
  assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------------
// requireModule
// ---------------------------------------------------------------------
test('requireModule allows matching ACTIVE grant', () => {
  const { nexted } = runMw(requireModule('AQMS'), { user: { access: [{ app: 'AQMS', role: 'AQMS_MEMBER', status: 'ACTIVE' }] } });
  assert.equal(nexted, true);
});

test('requireModule admin (ACTIVE admin grant) passes any app', () => {
  const req = { user: { access: [{ app: 'MWQ', role: 'ADMIN', status: 'ACTIVE' }] } };
  assert.equal(runMw(requireModule('MWQ'), req).nexted, true);
  assert.equal(runMw(requireModule('AQMS'), req).nexted, true);
});

test('requireModule 403 for member of a different app', () => {
  const { res, nexted } = runMw(requireModule('AQMS'), { user: { access: [{ app: 'MWQ', role: 'MWQ_MEMBER', status: 'ACTIVE' }] } });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, 'MODULE_MISMATCH');
});

test('requireModule 403 when the matching grant is revoked/non-active', () => {
  const { res, nexted } = runMw(requireModule('AQMS'), { user: { access: [{ app: 'AQMS', role: 'AQMS_MEMBER', status: 'SUSPENDED' }] } });
  assert.equal(nexted, false);
  assert.equal(res.statusCode, 403);
});

test('requireModule legacy-token fallback (no access[]) uses role/module', () => {
  assert.equal(runMw(requireModule('MWQ'), { user: { module: 'MWQ', access: [] } }).nexted, true);
  assert.equal(runMw(requireModule('AQMS'), { user: { role: 'ADMIN', module: 'MWQ', access: [] } }).nexted, true);
  assert.equal(runMw(requireModule('AQMS'), { user: { module: 'MWQ', access: [] } }).res.statusCode, 403);
});

test('requireModule 401 with no user', () => {
  assert.equal(runMw(requireModule('MWQ'), {}).res.statusCode, 401);
});
