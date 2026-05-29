'use strict';

const { listAlarms } = require('./alarms.service');
const { list } = require('../../../utils/response');

async function handleList(req, res) {
  const { module: mod, severity, status, startTime, endTime, limit, offset } = req.query;
  const { rows, total } = await listAlarms({ module: mod, severity, status, startTime, endTime, limit, offset });
  list(res, rows, { total, limit, offset });
}

module.exports = { handleList };
