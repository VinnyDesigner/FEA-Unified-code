'use strict';

require('dotenv').config();
const env = require('./config/env');
const { createApp } = require('./app');
const { logger } = require('./lib/logger');
const { prismaMwq, prismaAqms } = require('./db/prisma');

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});

// In dev, boot a second internal-only listener for dev-otp inspection
let internalServer = null;
if (env.NODE_ENV === 'development') {
  const express = require('express');
  const devOtpRouter = require('./modules/shared/auth/dev-otp.routes');
  const internalApp = express();
  internalApp.use(express.json());
  internalApp.use(devOtpRouter);

  internalServer = internalApp.listen(env.INTERNAL_PORT, '127.0.0.1', () => {
    logger.info({ port: env.INTERNAL_PORT }, 'Internal dev server started');
  });
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  const closeServer = (srv) =>
    new Promise((resolve) => (srv ? srv.close(resolve) : resolve()));

  await Promise.all([closeServer(server), closeServer(internalServer)]);
  await Promise.all([prismaMwq.$disconnect(), prismaAqms.$disconnect()]);
  process.exit(0);
});

module.exports = { server };
