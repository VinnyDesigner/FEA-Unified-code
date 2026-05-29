'use strict';
const fs = require('node:fs');
const path = require('node:path');
const env = require('../config/env');

const LOCAL_ROOT = path.resolve(process.cwd(), 'tmp/reports');

async function ensureDir(dir) { await fs.promises.mkdir(dir, { recursive: true }); }

function getReportDir(reportId) {
  return path.join(LOCAL_ROOT, String(reportId));
}

async function reserveFilePath(reportId, format) {
  const ext = format === 'XLSX' ? 'xlsx' : format === 'DOCX' ? 'docx' : 'pdf';
  const dir = getReportDir(reportId);
  await ensureDir(dir);
  return path.join(dir, `report.${ext}`);
}

function openReadStream(reportId, format) {
  const ext = format === 'XLSX' ? 'xlsx' : format === 'DOCX' ? 'docx' : 'pdf';
  const filePath = path.join(getReportDir(reportId), `report.${ext}`);
  if (!fs.existsSync(filePath)) throw Object.assign(new Error('Report file not found'), { status: 404, code: 'REPORT_FILE_NOT_FOUND' });
  return fs.createReadStream(filePath);
}

function isProduction() { return env.NODE_ENV === 'production'; }

function ensureProductionStorageConfigured() {
  if (isProduction() && !env.R2_BUCKET) {
    throw Object.assign(new Error('R2 storage not configured for production. Set R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY.'), { status: 500, code: 'R2_NOT_CONFIGURED' });
  }
}

module.exports = { reserveFilePath, openReadStream, getReportDir, ensureProductionStorageConfigured, LOCAL_ROOT };
