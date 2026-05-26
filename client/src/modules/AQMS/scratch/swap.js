const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'LandingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the boundaries of map-panel-left
const leftStartIdx = content.indexOf('{/* Left Panel: City Centre Specifics */}');
if (leftStartIdx === -1) {
  console.error("Could not find map-panel-left start");
  process.exit(1);
}

// Find the map-panel-right start
const rightStartIdx = content.indexOf('<div className="map-panel-right"');
if (rightStartIdx === -1) {
  console.error("Could not find map-panel-right start");
  process.exit(1);
}

// We want to find the exact end of map-panel-left, which is right before map-panel-right starts
const leftBlock = content.substring(leftStartIdx, rightStartIdx);

// Now, we want to find the end of map-panel-right.
// map-panel-right ends right before {/* Mobile Only Additional Cards Section */}
const rightEndIdx = content.indexOf('{/* Mobile Only Additional Cards Section');
if (rightEndIdx === -1) {
  console.error("Could not find map-panel-right end boundary");
  process.exit(1);
}

const rightBlock = content.substring(rightStartIdx, rightEndIdx);

console.log("Found Left Block length:", leftBlock.length);
console.log("Found Right Block length:", rightBlock.length);

// Swap them!
const before = content.substring(0, leftStartIdx);
const after = content.substring(rightEndIdx);

const newContent = before + rightBlock + leftBlock + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully swapped panels in LandingPage.jsx!");
