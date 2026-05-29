'use strict';

const { test, describe, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');

const { validate } = require('../../src/middleware/validate');

function makeRes() {
  const res = { status: mock.fn(() => res), json: mock.fn(() => res) };
  return res;
}

describe('validate middleware — query', () => {
  test('valid query input passes through and populates req.query with parsed data', () => {
    const schema = z.object({ limit: z.coerce.number().int().min(1) });
    const req    = { query: { limit: '10' } };
    const next   = mock.fn();

    validate({ query: schema })(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    assert.equal(next.mock.calls[0].arguments[0], undefined);
    assert.deepEqual(req.query, { limit: 10 });
  });

  test('invalid query input calls next with ApiError — status 400, code VALIDATION_FAILED', () => {
    const schema = z.object({ limit: z.coerce.number().int().min(1) });
    const req    = { query: { limit: 'not-a-number' } };
    const next   = mock.fn();

    validate({ query: schema })(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    const err = next.mock.calls[0].arguments[0];
    assert.ok(err, 'next must be called with an error');
    assert.equal(err.status, 400);
    assert.equal(err.code, 'VALIDATION_FAILED');
    assert.ok(err.details, 'error envelope must include details');
  });

  test('getter-only req.query patch: transform() result is assigned correctly via Object.defineProperty', () => {
    const schema = z.object({ value: z.string().transform(v => v.toUpperCase()) });
    const req    = { query: { value: 'hello' } };
    // Simulate getter-only by sealing the query descriptor
    Object.defineProperty(req, 'query', {
      value: { value: 'hello' },
      writable: false,
      configurable: true,
    });
    const next = mock.fn();

    validate({ query: schema })(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    assert.equal(req.query.value, 'HELLO');
  });
});

describe('validate middleware — body', () => {
  test('valid body passes through and populates req.body with parsed data', () => {
    const schema = z.object({ name: z.string().min(1) });
    const req    = { body: { name: 'test' } };
    const next   = mock.fn();

    validate({ body: schema })(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    assert.deepEqual(req.body, { name: 'test' });
  });

  test('invalid body produces 400 VALIDATION_FAILED with uniform error envelope', () => {
    const schema = z.object({ name: z.string().min(1) });
    const req    = { body: { name: '' } };
    const next   = mock.fn();

    validate({ body: schema })(req, makeRes(), next);

    const err = next.mock.calls[0].arguments[0];
    assert.equal(err.status, 400);
    assert.equal(err.code, 'VALIDATION_FAILED');
    assert.ok(err.details);
  });
});

describe('validate middleware — params', () => {
  test('valid params passes through and populates req.params with parsed data', () => {
    const schema = z.object({ id: z.coerce.number().int() });
    const req    = { params: { id: '42' } };
    const next   = mock.fn();

    validate({ params: schema })(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    assert.deepEqual(req.params, { id: 42 });
  });

  test('invalid params produces 400 VALIDATION_FAILED', () => {
    const schema = z.object({ id: z.coerce.number().int() });
    const req    = { params: { id: 'not-an-int' } };
    const next   = mock.fn();

    validate({ params: schema })(req, makeRes(), next);

    const err = next.mock.calls[0].arguments[0];
    assert.equal(err.status, 400);
    assert.equal(err.code, 'VALIDATION_FAILED');
  });
});

describe('validate middleware — no schemas', () => {
  test('calling validate with no schemas calls next with no error', () => {
    const req  = { query: {}, body: {}, params: {} };
    const next = mock.fn();

    validate()(req, makeRes(), next);

    assert.equal(next.mock.calls.length, 1);
    assert.equal(next.mock.calls[0].arguments[0], undefined);
  });
});
