const fs = require('fs');

function updateJson(path, isAr) {
  const fileContent = fs.readFileSync(path, 'utf8');
  const json = JSON.parse(fileContent);

  if (!json.common) json.common = {};
  if (!json.analytics) json.analytics = {};
  if (!json.parameters) json.parameters = {};

  // Common
  json.common.all = isAr ? "الكل" : "All";
  
  // Analytics missing fields
  json.analytics.selectPredefinedParameter = isAr ? "اختر المعلمة المحددة مسبقًا" : "Select Predefined Parameter";
  json.analytics.parameters = isAr ? "المعلمات" : "Parameters";
  json.analytics.duration = isAr ? "المدة" : "Duration";
  json.analytics.chartTypeTitle = isAr ? "نوع المخطط" : "Chart Type";
  json.analytics.selectParameters = isAr ? "اختر المعلمات..." : "Select Parameters...";
  json.analytics.selectParametersTitle = isAr ? "اختر المعلمات" : "Select Parameters";
  json.analytics.predefinedParameters = isAr ? "معلمات محددة مسبقًا" : "Pre-defined Parameters";
  json.analytics.customParameters = isAr ? "معلمات مخصصة" : "Custom Parameters";
  json.analytics.selectTimePeriod = isAr ? "اختر الفترة الزمنية" : "Select Time Period";

  json.analytics.lastDay = isAr ? "اليوم الأخير" : "Last Day";
  json.analytics.lastWeek = isAr ? "الأسبوع الماضي" : "Last Week";
  json.analytics.lastMonth = isAr ? "الشهر الماضي" : "Last Month";
  json.analytics.lastThreeMonths = isAr ? "آخر ثلاثة أشهر" : "Last Three Months";
  json.analytics.last24Hours = isAr ? "آخر 24 ساعة" : "Last 24 Hours";

  // Parameters
  json.parameters.specificConductivity = isAr ? "التوصيل النوعي" : "Specific Conductivity";
  json.parameters.waterTemperature = isAr ? "درجة حرارة الماء" : "Water Temperature";
  json.parameters.salinity = isAr ? "الملوحة" : "Salinity";
  json.parameters.chlorophyll = isAr ? "الكلوروفيل" : "Chlorophyll";
  json.parameters.oxygenSaturation = isAr ? "تشبع الأكسجين" : "Oxygen Saturation";
  json.parameters.dissolvedOxygen = isAr ? "الأكسجين المذاب" : "Dissolved Oxygen";
  json.parameters.turbidity = isAr ? "التعكر" : "Turbidity";
  json.parameters.pH = isAr ? "الرقم الهيدروجيني" : "pH";
  json.parameters.depth = isAr ? "العمق" : "Depth";
  json.parameters.blueGreenAlgae = isAr ? "الطحالب الخضراء المزرقة" : "Blue-Green Algae";

  fs.writeFileSync(path, JSON.stringify(json, null, 2));
  console.log(path + ' updated');
}

updateJson('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/i18n/en.json', false);
updateJson('c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/i18n/ar.json', true);
