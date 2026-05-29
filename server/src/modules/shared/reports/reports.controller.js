'use strict';
const { openReadStream } = require('../../../lib/storage');
const { generate, getById } = require('./reports.service');

async function generateHandler(req, res) {
  const report = await generate(req.user.id, req.body);
  res.status(201).json({ data: report });
}

async function getHandler(req, res) {
  const report = await getById(req.user.id, req.params.id);
  if (!report) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
  res.json({ data: report });
}

async function downloadHandler(req, res) {
  const report = await getById(req.user.id, req.params.id);
  if (!report) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
  const { format } = req.query;
  const paths = report.storagePaths;
  if (!paths || !paths[format]) {
    return res.status(404).json({ error: { code: 'FORMAT_NOT_AVAILABLE', message: `Format ${format} was not generated for this report` } });
  }
  const ext  = format === 'XLSX' ? 'xlsx' : format === 'DOCX' ? 'docx' : 'pdf';
  const mime = format === 'XLSX'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : format === 'DOCX'
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.${ext}"`);
  openReadStream(report.id, format).pipe(res);
}

module.exports = { generateHandler, getHandler, downloadHandler };
