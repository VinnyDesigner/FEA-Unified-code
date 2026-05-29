'use strict';
const { prismaMwq, prismaAqms } = require('../../../db/prisma');
const { ApiError } = require('../../../lib/api-error');
const { exportSemaphore } = require('../../../lib/export-semaphore');
const { reserveFilePath } = require('../../../lib/storage');
const { getReportType, DEFAULT_TYPE } = require('./report-types');
const xlsx = require('./formatters/xlsx.stream');
const docx = require('./formatters/docx');
const pdf  = require('./formatters/pdf');

const FORMAT_MAP = { XLSX: xlsx, DOCX: docx, PDF: pdf };

// Rows returned inline for the FE preview table (the full set still goes to files).
const PREVIEW_LIMIT = 1000;

async function generate(userId, body) {
  const reportType = body.reportType || DEFAULT_TYPE;
  const def = getReportType(reportType);
  if (!def) {
    throw new ApiError(400, 'UNKNOWN_REPORT_TYPE', `Unknown report type: ${reportType}`);
  }
  if (!def.modules.includes(body.module)) {
    throw new ApiError(400, 'REPORT_TYPE_MODULE_UNSUPPORTED',
      `Report type "${reportType}" is not available for module ${body.module}`);
  }

  if (!exportSemaphore.tryAcquire()) {
    const err = new ApiError(429, 'TOO_MANY_EXPORTS', 'Too many concurrent exports — try again shortly');
    err.retryAfter = 30;
    throw err;
  }
  try {
    const prismaForModule = body.module === 'AQMS' ? prismaAqms : prismaMwq;

    // Report-type definitions return plain, already-serialized row objects.
    const rows = await def.fetchRows(prismaForModule, body);

    if (rows.length > 50_000) {
      throw new ApiError(413, 'ROW_LIMIT_EXCEEDED', 'Result set exceeds 50 000 rows; narrow your date range or station filter');
    }
    if (rows.length > 10_000 && body.formats.some(f => f === 'DOCX' || f === 'PDF')) {
      throw new ApiError(413, 'ROW_LIMIT_EXCEEDED', 'DOCX/PDF formats are limited to 10 000 rows; use XLSX for larger exports');
    }

    const columns = def.columns;
    const title = def.title(body);

    const report = await prismaForModule.report.create({
      data: {
        userId,
        module: body.module,
        reportType,
        parameterIds: body.parameterIds,
        stationIds: body.stationIds,
        startDate: body.startDate,
        endDate: body.endDate,
        formats: body.formats,
        storagePaths: {},
        status: 'PENDING',
      },
    });

    const storagePaths = {};
    for (const format of body.formats) {
      const filePath = await reserveFilePath(report.id, format);
      await FORMAT_MAP[format].streamToFile(rows, {
        filePath,
        columns,
        sheetName: 'Report',
        title,
      });
      storagePaths[format] = filePath;
    }

    const updated = await prismaForModule.report.update({
      where: { id: report.id },
      data: { storagePaths, status: 'READY', completedAt: new Date() },
    });

    // Inline preview (computed from rows already in memory — no extra query).
    const preview = {
      columns,
      rows: rows.slice(0, PREVIEW_LIMIT),
      totalRows: rows.length,
      truncated: rows.length > PREVIEW_LIMIT,
    };
    return { ...updated, preview };
  } finally {
    exportSemaphore.release();
  }
}

async function getById(userId, id) {
  const [rMwq, rAqms] = await Promise.all([
    prismaMwq.report.findUnique({ where: { id } }),
    prismaAqms.report.findUnique({ where: { id } }),
  ]);
  const r = rMwq ?? rAqms;
  if (!r || r.userId !== userId) return null;
  return r;
}

module.exports = { generate, getById };
