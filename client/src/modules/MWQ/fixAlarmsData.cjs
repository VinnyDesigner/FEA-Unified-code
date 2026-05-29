const fs = require('fs');

const arPath = 'client/src/modules/MQW/i18n/ar.json';
const enPath = 'client/src/modules/MQW/i18n/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Alarms Data translations
ar.alarms.commAlert = 'تنبيه الاتصال';
en.alarms.commAlert = 'Comm Alert';

ar.alarms.gpsAlert = 'تنبيه نظام تحديد المواقع';
en.alarms.gpsAlert = 'GPS Alert';

ar.alarms.enclosureDoorOpenAlert = 'تنبيه فتح باب الحاوية';
en.alarms.enclosureDoorOpenAlert = 'Enclosure Door Open Alert';

ar.alarms.commAlertDesc = 'يتم إطلاقه عند فقدان الاتصال مع محطة المراقبة البحرية/العوامة أو انقطاع نقل البيانات.';
en.alarms.commAlertDesc = 'Triggered when communication with the marine monitoring station/buoy is lost or data transmission is interrupted.';

ar.alarms.gpsAlertDesc1 = 'يتم إطلاقه عند فتح باب حاوية محطة المراقبة أو تركه مفتوحًا.';
en.alarms.gpsAlertDesc1 = 'Triggered when the monitoring station enclosure door is opened or left open.';

ar.alarms.gpsAlertDesc2 = 'يتم إطلاقه عند فقدان إشارة نظام تحديد المواقع أو تغير موقع المحطة عن الموقع المحدد.';
en.alarms.gpsAlertDesc2 = 'Triggered when GPS signal is lost or the station location changes from the configured position.';

ar.stations.alAqahNew = 'العقة الجديدة';
en.stations.alAqahNew = 'Al Aqah New';

ar.stations.osb = 'عوامة بحرية';
en.stations.osb = 'OSB';

ar.stations.nsb = 'عوامة قريبة من الشاطئ';
en.stations.nsb = 'NSB';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Alarms translations updated');
