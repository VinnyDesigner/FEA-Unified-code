const fs = require('fs');

function fixTooltipSyntaxError(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Revert the malformed wrapperStyle injection
  content = content.replace(/content=\{<CustomTooltip \/ wrapperStyle=\{\{ zIndex: 9999, pointerEvents: 'none' \}\}>\}/g, 'content={<CustomTooltip />}');
  content = content.replace(/content=\{<CustomTooltip \/ wrapperStyle=\{\{ zIndex: 9999, pointerEvents: "none",>\}/g, 'content={<CustomTooltip />}');

  // Also remove the wrapperStyle from the <Tooltip> itself if it got added incorrectly
  // Let's actually just do a smart regex replacement to add it correctly this time.
  // We can just find `<Tooltip ` and append `wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} `
  
  // First, strip all wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} to reset
  content = content.replace(/ wrapperStyle=\{\{ zIndex: 9999, pointerEvents: 'none' \}\}/g, '');
  content = content.replace(/ wrapperStyle=\{\{ zIndex: 9999, pointerEvents: "none",/g, '');

  // Now, safely inject wrapperStyle into <Tooltip
  content = content.replace(/<Tooltip\s/g, "<Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} ");

  fs.writeFileSync(path, content);
  console.log(path + ' fixed');
}

fixTooltipSyntaxError('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/BuoysChart.jsx');
try {
  fixTooltipSyntaxError('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/ChartModal.jsx');
} catch (e) {
}
