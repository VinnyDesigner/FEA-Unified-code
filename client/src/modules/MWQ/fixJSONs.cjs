const fs = require('fs');
const arPath = 'client/src/modules/MQW/i18n/ar.json';
const enPath = 'client/src/modules/MQW/i18n/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!ar.alarms) ar.alarms = {};
if (!en.alarms) en.alarms = {};

ar.alarms.alertType = 'نوع التنبيه';
en.alarms.alertType = 'Alert Type';

ar.alarms.alertDescription = 'وصف التنبيه';
en.alarms.alertDescription = 'Alert Description';

ar.analytics.disabled = 'معطل';
en.analytics.disabled = 'Disabled';

// Make sure stationName exists
ar.analytics.stationName = 'اسم المحطة';
en.analytics.stationName = 'Station Name';

ar.analytics.selectStation = 'اختر المحطة';
en.analytics.selectStation = 'Select Station';

ar.analytics.selectTimePeriod = 'اختر الفترة الزمنية';
en.analytics.selectTimePeriod = 'Select Time Period';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('JSON updated');
