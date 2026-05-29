'use strict';

require('./lib/json-bigint');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { requestId } = require('./middleware/request-id');
const { errorHandler } = require('./middleware/error-handler');
const { router: v1Router } = require('./routes/index');

function createApp() {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: false }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);

  app.use('/api/v1', v1Router);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
