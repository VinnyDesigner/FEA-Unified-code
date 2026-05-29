const fs = require('fs');

function fixTranslations(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Fix getTransLabel map
  const helperFix = `
  const getTransLabel = (val) => {
    if (!val) return val;
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
      'Scatter Chart': 'chart.scatterPlot',
      'Sonde Information': 'analytics.sondeInformation',
      'Specific Conductivity': 'parameters.specificConductivity',
      'Water Temperature': 'parameters.waterTemperature',
      'Salinity': 'parameters.salinity',
      'Chlorophyll': 'parameters.chlorophyll',
      'Oxygen Saturation': 'parameters.oxygenSaturation',
      'Dissolved Oxygen': 'parameters.dissolvedOxygen',
      'Turbidity': 'parameters.turbidity',
      'pH': 'parameters.pH',
      'Depth': 'parameters.depth',
      'Blue-Green Algae': 'parameters.blueGreenAlgae',
      'Bluegreen Algae': 'parameters.blueGreenAlgae',
      'Last Day': 'analytics.lastDay',
      'Last Week': 'analytics.lastWeek',
      'Last Month': 'analytics.lastMonth',
      'Last Three Months': 'analytics.lastThreeMonths',
      'Last 24 Hours': 'analytics.last24Hours'
    };
    return map[val] ? t(map[val], val) : t('analytics.'+val.replace(/ /g, ''), val);
  };
`;

  content = content.replace(/const getTransLabel = \(val\) => \{[\s\S]*?  \};\n/, helperFix);

  // Hardcoded English replacements
  content = content.replace(/>Select Predefined Parameter</g, '>{t("analytics.selectPredefinedParameter", "Select Predefined Parameter")}<');
  content = content.replace(/>Parameters</g, '>{t("analytics.parameters", "Parameters")}<');
  content = content.replace(/>Duration</g, '>{t("analytics.duration", "Duration")}<');
  content = content.replace(/>Chart Type</g, '>{t("analytics.chartTypeTitle", "Chart Type")}<');
  content = content.replace(/>Select Parameters\.\.\.</g, '>{t("analytics.selectParameters", "Select Parameters...")}<');
  content = content.replace(/>Select Parameters</g, '>{t("analytics.selectParametersTitle", "Select Parameters")}<');
  content = content.replace(/>Pre-defined Parameters</g, '>{t("analytics.predefinedParameters", "Pre-defined Parameters")}<');
  content = content.replace(/>Custom Parameters</g, '>{t("analytics.customParameters", "Custom Parameters")}<');
  content = content.replace(/>Select Time Period</g, '>{t("analytics.selectTimePeriod", "Select Time Period")}<');
  content = content.replace(/>All</g, '>{t("common.all", "All")}<');

  // Cancel buttons
  content = content.replace(/>\s*Cancel\s*<\/button>/g, '>{t("common.cancel", "Cancel")}</button>');
  
  // Custom Parameters list items in AnalyticsFilters.jsx (e.g. {param} => {getTransLabel(param)})
  content = content.replace(/>\{param\}<\/span>/g, '>{getTransLabel(param)}</span>');
  content = content.replace(/>\{opt\}<\/span>/g, '>{getTransLabel(opt)}</span>');
  
  fs.writeFileSync(path, content);
  console.log(path + ' translation fixed');
}

fixTranslations('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/AnalyticsFilters.jsx');
fixTranslations('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/SensorDataFilters.jsx');
