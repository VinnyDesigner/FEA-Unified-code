'use strict';
const fs = require('node:fs');
const PDFDocument = require('pdfkit');

const PDF_MAX_ROWS = 10_000;

function streamToFile(rows, { filePath, columns, title = 'Report' }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 24 });
    const out = fs.createWriteStream(filePath);
    doc.pipe(out);
    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(8);
    const colWidth = (doc.page.width - 48) / columns.length;
    let y = doc.y;
    columns.forEach((c, i) => doc.text(String(c.header), 24 + i * colWidth, y, { width: colWidth, continued: false }));
    y = doc.y + 4;
    doc.moveTo(24, y).lineTo(doc.page.width - 24, y).stroke();
    y += 4;
    const truncated = rows.length > PDF_MAX_ROWS;
    const slice = truncated ? rows.slice(0, PDF_MAX_ROWS) : rows;
    let rowsWritten = 0;
    for (const row of slice) {
      if (y > doc.page.height - 40) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 24 }); y = 24; }
      columns.forEach((c, i) => doc.text(String(row[c.key] ?? ''), 24 + i * colWidth, y, { width: colWidth, continued: false }));
      y += 12;
      rowsWritten++;
    }
    doc.end();
    out.on('finish', () => resolve({ rowsWritten, truncated }));
    out.on('error', reject);
  });
}

module.exports = { streamToFile, PDF_MAX_ROWS };
