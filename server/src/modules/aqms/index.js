'use strict';

const { Router } = require('express');
const stationsRouter       = require('./stations/stations.routes');
const airQualityRouter     = require('./air-quality/air-quality.routes');
const weatherRouter        = require('./weather/weather.routes');
const dataCaptureRouter    = require('./data-capture-rate/data-capture-rate.routes');
const parametersRouter     = require('./parameters/parameters.routes');
const thresholdsRouter     = require('./thresholds/thresholds.routes');

const router = Router();

router.use('/stations',          stationsRouter);
router.use('/air-quality',       airQualityRouter);
router.use('/weather',           weatherRouter);
router.use('/data-capture-rate', dataCaptureRouter);
router.use('/parameters',        parametersRouter);
router.use('/thresholds',        thresholdsRouter);

module.exports = router;
