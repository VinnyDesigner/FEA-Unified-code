const fs = require('fs');

function replaceModal() {
  const path = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/BuoysChart.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // Add import if not exists
  if (!content.includes('import ChartModal from')) {
    content = content.replace(
      "import { useTranslation } from 'react-i18next';",
      "import { useTranslation } from 'react-i18next';\nimport ChartModal from './ChartModal';"
    );
  }

  // Find the start of the modal
  const modalStart = content.indexOf('{/* Expand Modal overlay */}');
  if (modalStart === -1) {
    console.log('Modal start not found');
    return;
  }

  const replacement = `{/* Expand Modal overlay */}
      {expandedParam && (
        <ChartModal
          isOpen={!!expandedParam}
          onClose={() => setExpandedParam(null)}
          metric={expandedParam.filterName}
          translatedMetricTitle={t(expandedParam.label)}
          selectedBuoy={Array.isArray(selectedBuoy) ? { name: selectedBuoy.join(', ') } : { name: selectedBuoy }}
          customData={chartData}
          series={(Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy]).map(buoy => {
            const buoyColors = {
              'Near Shore Buoy': '#3B82F6',
              'Offshore Buoy': '#F59E0B',
              'Al Aqah Buoy': '#10B981',
              'North Dibbah': '#EC4899'
            };
            return {
              key: \`\${expandedParam.key}_\${buoy}\`,
              name: buoy,
              color: buoyColors[buoy] || '#1DCDDD'
            };
          })}
          xAxisKey="month"
        />
      )}
    </div>
  );
};

export default BuoysChart;
`;

  // Use regex to replace from modalStart to end of file
  const regex = /\{\/\* Expand Modal overlay \*\/\}[\s\S]*export default BuoysChart;\s*$/;
  if (!regex.test(content)) {
    console.log("Regex not found");
    return;
  }

  content = content.replace(regex, replacement);

  fs.writeFileSync(path, content);
  console.log('Replaced custom modal with ChartModal');
}

replaceModal();
