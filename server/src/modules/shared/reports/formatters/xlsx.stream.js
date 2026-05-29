'use strict';
const ExcelJS = require('exceljs');

const XLSX_MAX_ROWS = 50_000;

async function streamToFile(rows, { filePath, columns, sheetName = 'Report' }) {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: filePath, useStyles: true });
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns;
  let rowsWritten = 0;
  let truncated = false;
  for (const row of rows) {
    if (rowsWritten >= XLSX_MAX_ROWS) { truncated = true; break; }
    worksheet.addRow(row).commit();
    rowsWritten++;
  }
  await worksheet.commit();
  await workbook.commit();
  return { rowsWritten, truncated };
}

module.exports = { streamToFile, XLSX_MAX_ROWS };
