const fs = require('fs');

function updateFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Fix Tooltip wrapperStyle zIndex
  content = content.replace(/<Tooltip([\s\S]*?)>/g, (match, p1) => {
    if (!p1.includes('wrapperStyle')) {
      // Add wrapperStyle
      return `<Tooltip${p1} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}>`;
    }
    // If it already has wrapperStyle, we might need to inject zIndex. But usually it doesn't.
    if (!p1.includes('zIndex')) {
      return `<Tooltip${p1.replace('wrapperStyle={{', 'wrapperStyle={{ zIndex: 9999, pointerEvents: "none",')} >`;
    }
    return match;
  });

  // Fix CustomTooltip background opacity
  // Original: background: 'rgba(255, 255, 255, 0.08)',
  content = content.replace(
    /background:\s*'rgba\(255,\s*255,\s*255,\s*0\.08\)'/,
    `background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.65) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.3) 100%)'`
  );

  fs.writeFileSync(path, content);
  console.log(path + ' updated');
}

updateFile('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/BuoysChart.jsx');
try {
  updateFile('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/ChartModal.jsx');
} catch (e) {
  // Ignore if ChartModal doesn't exist
}
