const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'styles', 'LandingPage.css');
const content = fs.readFileSync(cssPath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('map-panel-left') || line.includes('map-panel-right')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
