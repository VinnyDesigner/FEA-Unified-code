'use strict';

function ok(res, data) {
  res.json(data);
}

function list(res, data, { total, limit, offset }) {
  res.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
  });
}

module.exports = { ok, list };
