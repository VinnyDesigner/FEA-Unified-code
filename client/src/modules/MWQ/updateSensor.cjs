const fs = require('fs');
const path = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/SensorDataFilters.jsx';
let content = fs.readFileSync(path, 'utf8');

const helper = `
  const getTransLabel = (val) => {
    if (!val) return val;
    const map = {
      'Near Shore Buoy': 'stations.nearShore',
      'Offshore Buoy': 'stations.offshore',
      'Al Aqah Buoy': 'stations.alAqah',
      'North Dibbah': 'stations.northDibbah',
      'All Stations': 'stations.allStations',
      'Live Data': 'analytics.liveData',
      'Last Day': 'analytics.timeLastHour', // Note: using closest mapping for time
      'Today': 'analytics.timeToday',
      'Last Week': 'analytics.timeOneWeek',
      'Last Month': 'analytics.timeOneMonth',
      'Last Three Months': 'analytics.timeThreeMonths',
      'Choose Period': 'analytics.timeChoosePeriod',
      'Alarms': 'analytics.alarms',
      'Battery Health': 'analytics.batteryHealth',
      'Sonde Status': 'analytics.sondeStatus',
      'Log Intervals': 'analytics.logIntervals'
    };
    return map[val] ? t(map[val], val) : val;
  };
`;

if (!content.includes('getTransLabel')) {
  content = content.replace('const { t } = useTranslation();', 'const { t } = useTranslation();\n' + helper);
  
  // Apply translation replacements for buoy
  content = content.replace(/>{buoy}</g, '>{getTransLabel(buoy)}<');
  content = content.replace(/>{b}</g, '>{getTransLabel(b)}<');
  content = content.replace(/>{station}</g, '>{getTransLabel(station)}<');
  
  // Apply translation replacements for labels
  content = content.replace('<span>{activeSubTab}</span>', '<span>{getTransLabel(activeSubTab)}</span>');
  content = content.replace('<span>{tempSubTab}</span>', '<span>{getTransLabel(tempSubTab)}</span>');
  content = content.replace('<span>{selectedDate}</span>', '<span>{getTransLabel(selectedDate)}</span>');
  content = content.replace(/>{opt}</g, '>{getTransLabel(opt)}<');
  content = content.replace(/>{range}</g, '>{getTransLabel(range)}<');
  content = content.replace('<span>{getBuoyTriggerLabel(selectedBuoy, false)}</span>', '<span>{getTransLabel(getBuoyTriggerLabel(selectedBuoy, false))}</span>');
  content = content.replace('<span>{getBuoyTriggerLabel(tempBuoy, true)}</span>', '<span>{getTransLabel(getBuoyTriggerLabel(tempBuoy, true))}</span>');
  content = content.replace('>{range}</span>', '>{getTransLabel(range)}</span>');
  
  // Buttons and hardcoded
  content = content.replace(/>Cancel</g, '>{t("common.cancel", "Cancel")}<');
  content = content.replace(/>Apply Filter</g, '>{t("analytics.applyFilter", "Apply Filter")}<');
  content = content.replace(/>Filter</g, '>{t("common.filter", "Filter")}<');
  content = content.replace(/>View By</g, '>{t("analytics.viewBy", "View By")}<');
  content = content.replace(/>Time Period</g, '>{t("analytics.timePeriod", "Time Period")}<');
  content = content.replace(/>Select Station</g, '>{t("analytics.selectStation", "Select Station")}<');

  fs.writeFileSync(path, content);
  console.log('SensorDataFilters.jsx updated');
}
