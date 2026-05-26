const fs = require('fs');

function replaceFile(path, replaces) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  for (const r of replaces) {
    content = content.split(r.find).join(r.replace);
  }
  fs.writeFileSync(path, content);
}

replaceFile('client/src/modules/MQW/components/AnalyticsFilters.jsx', [
  { find: '>Select Duration<', replace: '>{t("analytics.selectTimePeriod", "Select Duration")}<' },
  { find: '>Select Chart Type<', replace: '>{t("analytics.selectChartType", "Select Chart Type")}<' },
  { find: '>Stations<', replace: '>{t("analytics.stations", "Stations")}<' },
  { find: '>All Stations<', replace: '>{t("stations.allStations", "All Stations")}<' },
  { find: '>Disabled<', replace: '>{t("analytics.disabled", "Disabled")}<' },
  { find: '>Parameters<', replace: '>{t("analytics.parameters", "Parameters")}<' },
  { find: '>Duration<', replace: '>{t("analytics.duration", "Duration")}<' }
]);

replaceFile('client/src/modules/MQW/components/SensorDataFilters.jsx', [
  { find: '>Select Station<', replace: '>{t("analytics.selectStation", "Select Station")}<' },
  { find: '>Select Date & Time<', replace: '>{t("analytics.selectTimePeriod", "Select Date & Time")}<' }
]);

replaceFile('client/src/modules/MQW/components/AlarmsTable.jsx', [
  { find: '>Date & Time <', replace: '>{t("analytics.dateTime", "Date & Time")} <' },
  { find: '>Station Name <', replace: '>{t("analytics.stationName", "Station Name")} <' },
  { find: '>Alert Type <', replace: '>{t("alarms.alertType", "Alert Type")} <' },
  { find: '>Alert Description <', replace: '>{t("alarms.alertDescription", "Alert Description")} <' }
]);

console.log('Replacements completed');
