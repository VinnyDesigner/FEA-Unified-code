const fs = require('fs');
const path = require('path');

const jsxPath = path.join(__dirname, '..', 'pages', 'LandingPage.jsx');
const content = fs.readFileSync(jsxPath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('lang') || line.includes('lang =')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
