'use strict';

const { getLatest, getIndexLatest, getIndexHistory, getHistory } = require('./air-quality.service');
const { ok, list } = require('../../../utils/response');

const DAY_MS = 24 * 60 * 60 * 1000;

async function handleLatest(req, res) {
  const { stationId, parameterId } = req.query;
  const data = await getLatest({ stationId, parameterId });
  ok(res, data);
}

async function handleIndexLatest(req, res) {
  const { stationId } = req.query;
  const data = await getIndexLatest({ stationId });
  ok(res, data);
}

async function handleIndexHistory(req, res) {
  const { stationId, limit, offset } = req.query;
  // Forward-pad default window to cover the seed anchor (now+7d).
  const startTime = req.query.startTime ?? new Date(Date.now() - 7 * DAY_MS).toISOString();
  const endTime = req.query.endTime ?? new Date(Date.now() + 8 * DAY_MS).toISOString();
  const { rows, total } = await getIndexHistory({ stationId, startTime, endTime, limit, offset });
  list(res, rows, { total, limit, offset });
}

async function handleHistory(req, res) {
  const { stationId, parameterId, startTime, endTime, limit, offset } = req.query;
  const { rows, total } = await getHistory({ stationId, parameterId, startTime, endTime, limit, offset });
  list(res, rows, { total, limit, offset });
}

module.exports = { handleLatest, handleIndexLatest, handleIndexHistory, handleHistory };
