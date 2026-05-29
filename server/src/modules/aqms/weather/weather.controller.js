'use strict';

const { getLatest, getHistory } = require('./weather.service');
const { ok, list } = require('../../../utils/response');

async function handleLatest(req, res) {
  const { stationId, parameterId } = req.query;
  const data = await getLatest({ stationId, parameterId });
  ok(res, data);
}

async function handleHistory(req, res) {
  const { stationId, parameterId, startTime, endTime, limit, offset } = req.query;
  const { rows, total } = await getHistory({ stationId, parameterId, startTime, endTime, limit, offset });
  list(res, rows, { total, limit, offset });
}

module.exports = { handleLatest, handleHistory };
