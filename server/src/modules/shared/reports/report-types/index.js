'use strict';

// Registry of all AQMS report types, keyed by reportType. Each category module
// exports a map of { <key>: definition }; we merge them into one lookup.
const basic = require('./basic');           // Average Reports (basic_data_export, average_data_trend)
const statistical = require('./statistical'); // Statistical Reports
const summary = require('./summary');         // Summary Reports
const rose = require('./rose');               // Met + Pollutionrose Reports

const REGISTRY = { ...basic, ...statistical, ...summary, ...rose };

const DEFAULT_TYPE = 'basic_data_export';

function getReportType(key) {
  return REGISTRY[key || DEFAULT_TYPE] || null;
}

function listReportTypes() {
  return Object.values(REGISTRY).map(d => ({ key: d.key, label: d.label, modules: d.modules }));
}

// All valid keys — used by the request schema's enum.
const REPORT_TYPE_KEYS = [
  'basic_data_export',
  'average_data_trend',
  'concentration_distribution',
  'frequency_distribution',
  'max_hourly_values',
  'network_data_recovery',
  'violation_of_standards',
  'summary_24h_avg',
  'rolling_8h_avg',
  'daily_summary',
  'monthly_report',
  'windrose',
  'pollutionrose',
];

module.exports = { REGISTRY, DEFAULT_TYPE, REPORT_TYPE_KEYS, getReportType, listReportTypes };
