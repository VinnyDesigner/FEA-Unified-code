'use strict';
const fs = require('node:fs');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel } = require('docx');

const DOCX_MAX_ROWS = 10_000;

async function streamToFile(rows, { filePath, columns, title = 'Report' }) {
  const truncated = rows.length > DOCX_MAX_ROWS;
  const slice = truncated ? rows.slice(0, DOCX_MAX_ROWS) : rows;
  const headerRow = new TableRow({
    children: columns.map(c => new TableCell({ children: [new Paragraph({ text: String(c.header), bold: true })] })),
  });
  const dataRows = slice.map(row => new TableRow({
    children: columns.map(c => new TableCell({ children: [new Paragraph({ text: String(row[c.key] ?? '') })] })),
  }));
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
        new Table({ rows: [headerRow, ...dataRows] }),
      ],
    }],
  });
  const buf = await Packer.toBuffer(doc);
  await fs.promises.writeFile(filePath, buf);
  return { rowsWritten: slice.length, truncated };
}

module.exports = { streamToFile, DOCX_MAX_ROWS };
