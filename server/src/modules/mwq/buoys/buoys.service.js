'use strict';

const { prismaMwq: prisma } = require('../../../db/prisma');

async function listBuoys() {
  return prisma.mwqBuoy.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      buoyName: true,
      latitude: true,
      longitude: true,
      remarks: true,
    },
  });
}

module.exports = { listBuoys };
