const fs = require('fs');
const path = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/AnalyticsFilters.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add translation helper
const helper = `
  const getTransLabel = (val) => {
    const map = {
      'Near Shore Buoy': 'stations.nearShore',
      'Offshore Buoy': 'stations.offshore',
      'Al Aqah Buoy': 'stations.alAqah',
      'North Dibbah': 'stations.northDibbah',
      'All Stations': 'stations.allStations',
      'Graph and Table View': 'analytics.graphAndTable',
      'Graph View': 'analytics.graphView',
      'Table View': 'analytics.tableView',
      'Line Chart': 'chart.lineChart',
      'Bar Chart': 'chart.barChart',
      'Area Chart': 'chart.areaChart',
      'Scatter Plot': 'chart.scatterPlot',
      'Sonde Information': 'analytics.sondeInformation'
    };
    return map[val] ? t(map[val], val) : t('analytics.'+val.replace(/ /g, ''), val);
  };
`;

if (!content.includes('getTransLabel =')) {
  content = content.replace('const { t } = useTranslation();', 'const { t } = useTranslation();\n' + helper);
}

// Replace selectedView display
content = content.replace('<span>{selectedView}</span>', '<span>{getTransLabel(selectedView)}</span>');

// Replace map labels for viewTypes
content = content.replace(/>{type}</g, '>{getTransLabel(type)}<');

// Replace buoy labels in buoyDropdown
content = content.replace(/>{buoy}</g, '>{getTransLabel(buoy)}<');

// Replace getBuoyTriggerLabel display
content = content.replace('<span>{getBuoyTriggerLabel()}</span>', '<span>{getTransLabel(getBuoyTriggerLabel())}</span>');
content = content.replace('<span>{getBuoyTriggerLabel(selectedBuoy, isBuoysAnalytics)}</span>', '<span>{getTransLabel(getBuoyTriggerLabel(selectedBuoy, isBuoysAnalytics))}</span>');

// Replace 'Apply Filter' button text
content = content.replace(/>\s*Apply Filters?\s*</g, '>{t("analytics.applyFilters", "Apply Filters")}<');

// Replace 'View By' label
content = content.replace(/>View By</g, '>{t("analytics.viewBy", "View By")}<');

// Replace 'Time Period' label
content = content.replace(/>Time Period</g, '>{t("analytics.timePeriod", "Time Period")}<');

// Replace 'Select Chart Type' label
content = content.replace(/>Select Chart Type</g, '>{t("analytics.selectChartType", "Select Chart Type")}<');

// Replace 'Choose Parameters' label
content = content.replace(/>Choose Parameters</g, '>{t("analytics.chooseParameters", "Choose Parameters")}<');

// Replace 'Filter' text in button
content = content.replace(/<span>Filter<\/span>/g, '<span>{t("common.filter", "Filter")}</span>');

fs.writeFileSync(path, content);
console.log('AnalyticsFilters.jsx updated');
