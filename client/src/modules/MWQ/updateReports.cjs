const fs = require('fs');
const path = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/ReportsFilterForm.jsx';
let content = fs.readFileSync(path, 'utf8');

const helper = `
  const getTransLabel = (val) => {
    if (!val) return val;
    const map = {
      'Al Aqah New': 'stations.alAqahNew',
      'North Dibbah': 'stations.northDibbah',
      'OSB': 'stations.osb',
      'NSB': 'stations.nsb',
      'Sonde Information': 'analytics.sondeInformation',
      'Weather Information': 'analytics.weatherInformation',
      'Specific Conductivity': 'analytics.specificConductivity',
      'Water Temperature': 'analytics.waterTemperature',
      'Salinity': 'analytics.salinity',
      'Chlorophyll': 'analytics.chlorophyll',
      'Oxygen Saturation': 'analytics.oxygenSaturation',
      'Dissolved Oxygen': 'analytics.dissolvedOxygen',
      'Turbidity': 'analytics.turbidity',
      'pH': 'analytics.ph',
      'Depth': 'analytics.depth',
      'Blue-Green Algae': 'analytics.blueGreenAlgae'
    };
    return map[val] ? t(map[val], val) : val;
  };
`;

if (!content.includes('getTransLabel')) {
  content = content.replace('const { t } = useTranslation();', 'const { t } = useTranslation();\n' + helper);
  
  // Replace {station} dropdown items
  content = content.replace(/>{station}</g, '>{getTransLabel(station)}<');
  content = content.replace(/>{type}</g, '>{getTransLabel(type)}<');
  content = content.replace(/>{param}</g, '>{getTransLabel(param)}<');
  
  // Replace the labels for the dropdowns
  content = content.replace('<span>{formData.station || "Select Station"}</span>', '<span>{formData.station ? getTransLabel(formData.station) : t("analytics.selectStation", "Select Station")}</span>');
  content = content.replace('<span>{formData.monitoringType || "Select Type"}</span>', '<span>{formData.monitoringType ? getTransLabel(formData.monitoringType) : t("reports.type", "Select Type")}</span>');
  content = content.replace('<span>{formData.parameter || "Select Parameter"}</span>', '<span>{formData.parameter ? getTransLabel(formData.parameter) : t("reports.parameters", "Select Parameter")}</span>');

  fs.writeFileSync(path, content);
  console.log('ReportsFilterForm.jsx updated');
}
