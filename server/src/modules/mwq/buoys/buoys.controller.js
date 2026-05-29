'use strict';

const { listBuoys } = require('./buoys.service');
const { ok } = require('../../../utils/response');

async function list(req, res) {
  const buoys = await listBuoys();
  ok(res, { data: buoys });
}

module.exports = { list };
