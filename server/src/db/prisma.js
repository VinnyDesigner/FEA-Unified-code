'use strict';

const { PrismaClient: PrismaClientMwq } = require('../../node_modules/.prisma/client-mwq');
const { PrismaClient: PrismaClientAqms } = require('../../node_modules/.prisma/client-aqms');
const { PrismaClient: PrismaClientHigherLevel } = require('../../node_modules/.prisma/client-higher-level');

const globalForPrisma = globalThis;

const logLevel = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

const prismaMwq = globalForPrisma.prismaMwq ?? new PrismaClientMwq({ log: logLevel });
const prismaAqms = globalForPrisma.prismaAqms ?? new PrismaClientAqms({ log: logLevel });
const prismaHigherLevel = globalForPrisma.prismaHigherLevel ?? new PrismaClientHigherLevel({ log: logLevel });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaMwq = prismaMwq;
  globalForPrisma.prismaAqms = prismaAqms;
  globalForPrisma.prismaHigherLevel = prismaHigherLevel;
}

module.exports = { prismaMwq, prismaAqms, prismaHigherLevel, prisma: prismaMwq };
