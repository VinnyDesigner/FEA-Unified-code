'use strict';

const { Router } = require('express');

const buoysRouter        = require('./buoys/buoys.routes');
const sensorDataRouter   = require('./sensor-data/sensor-data.routes');
const batteryRouter      = require('./battery-health/battery-health.routes');
const captureRateRouter  = require('./data-capture-rate/data-capture-rate.routes');
const parametersRouter   = require('./parameters/parameters.routes');
const weatherRouter      = require('./weather/weather.routes');
const thresholdsRouter   = require('./thresholds/thresholds.routes');

const router = Router();

router.use('/buoys',             buoysRouter);
router.use('/sensor-data',       sensorDataRouter);
router.use('/battery-health',    batteryRouter);
router.use('/data-capture-rate', captureRateRouter);
router.use('/parameters',        parametersRouter);
router.use('/weather',           weatherRouter);
router.use('/thresholds',        thresholdsRouter);

module.exports = router;
