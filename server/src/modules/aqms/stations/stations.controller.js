'use strict';

const { listStations } = require('./stations.service');
const { list } = require('../../../utils/response');

async function handleList(req, res) {
  const { limit, offset, operationalState, stationType } = req.query;
  const { rows, total } = await listStations({ limit, offset, operationalState, stationType });
  list(res, rows, { total, limit, offset });
}

module.exports = { handleList };
