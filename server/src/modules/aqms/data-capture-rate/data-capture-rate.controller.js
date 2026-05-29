'use strict';

const { listDataCaptureRate } = require('./data-capture-rate.service');
const { ok } = require('../../../utils/response');

async function handleList(req, res) {
  const { startDate, endDate, stationId } = req.query;
  const data = await listDataCaptureRate({ startDate, endDate, stationId });
  ok(res, data);
}

module.exports = { handleList };
