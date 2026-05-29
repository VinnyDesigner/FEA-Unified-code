import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../contexts/LanguageContext';
import { getAqmsPublicOverview } from '../../../lib/queries';
import '../styles/index.css';
import '../styles/LandingPage.css';

// Import custom PNG icons for Protective Measures
import KeepWindowsIcon from '../../../assets/Icons/Keep Windows Closed.png';
import WearMaskIcon from '../../../assets/Icons/Wear N95 Masks.png';
import StayHydratedIcon from '../../../assets/Icons/Stay Hydrated.png';
import IndoorPlantsIcon from '../../../assets/Icons/Indoor Plants.png';

// Import custom PNG icons for Air Quality Possible Causes / Activities
import SuburbanTrafficIcon from '../../../assets/Air quality/Suburban Traffic.png';
import NaturalSourcesIcon from '../../../assets/Air quality/Natural Sources.png';

// Import footer background image asset
import FooterBg from '../../../assets/footer-bg.png';

// Custom marker icon creation function
const HighchartsReactComponent = (() => {
  if (!HighchartsReact) return null;
  if (typeof HighchartsReact === 'function' || HighchartsReact.$$typeof) return HighchartsReact;
  if (HighchartsReact.default) {
    const def = HighchartsReact.default;
    if (typeof def === 'function' || def.$$typeof) return def;
    if (def.default && (typeof def.default === 'function' || def.default.$$typeof)) return def.default;
  }
  if (HighchartsReact.HighchartsReact) {
    const hr = HighchartsReact.HighchartsReact;
    if (typeof hr === 'function' || hr.$$typeof) return hr;
  }
  return HighchartsReact;
})();

const createCustomIcon = (value, bgColor) => {
  return L.divIcon({
    className: 'custom-map-marker-icon',
    html: `<div class="custom-marker-pill" style="background-color: ${bgColor}; color: white;">${value}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Template dataset supplying the rich descriptive fields (pollutant breakdown,
// causes, activities, contributing pollutant, coordinates) that the PUBLIC
// overview endpoint does not return. The live numeric data (aqi/color/name/trend)
// is merged over this template from getAqmsPublicOverview() at runtime.
const FALLBACK_STATIONS = [
  {
    id: 'ncm_dibba_station',
    nameEn: 'NCM Dibba Station',
    nameAr: 'محطة دبا - المركز الوطني للأرصاد',
    aqi: 45,
    coordinates: [25.1288, 56.3265],
    color: '#84cc16',
    pollutants: [
      { name: 'CO', value: 229, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 11, unit: 'ppb', status: 'moderate' },
      { name: 'O3', value: 24, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 95, unit: 'µg/m³', status: 'good' },
      { name: 'PM2.5', value: 15, unit: 'µg/m³', status: 'moderate' },
      { name: 'SO2', value: 24, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 420,
    barpress: 1012,
    wind: 12,
    contributingPollutantEn: 'Particulate Matter, PM10',
    contributingPollutantAr: 'الجسيمات الدقيقة، PM10',
    contributingValue: '95 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Suburban Traffic' },
      { icon: NaturalSourcesIcon, text: 'Natural Sources' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'حركة المرور في الضواحي' },
      { icon: NaturalSourcesIcon, text: 'المصادر الطبيعية' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Jogging' },
      { icon: NaturalSourcesIcon, text: 'Cycling' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'الجري' },
      { icon: NaturalSourcesIcon, text: 'ركوب الدراجات' }
    ],
    trendData: [270, 230, 290, 200, 310, 270, 120, 200, 45, 80, 80, 120, 160],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'ncm_thoban_station',
    nameEn: 'NCM Thoban Station',
    nameAr: 'محطة ثوبان - المركز الوطني للأرصاد',
    aqi: 78,
    coordinates: [25.1100, 56.3300],
    color: '#fcd34d',
    pollutants: [
      { name: 'CO', value: 410, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 38, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 45, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 142, unit: 'µg/m³', status: 'moderate' },
      { name: 'PM2.5', value: 29, unit: 'µg/m³', status: 'moderate' },
      { name: 'SO2', value: 32, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 380,
    barpress: 1010,
    wind: 18,
    contributingPollutantEn: 'Particulate Matter, PM10',
    contributingPollutantAr: 'الجسيمات الدقيقة، PM10',
    contributingValue: '142 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Industrial Emissions' },
      { icon: NaturalSourcesIcon, text: 'Heavy Vehicles' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'الانبعاثات الصناعية' },
      { icon: NaturalSourcesIcon, text: 'المركبات الثقيلة' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Indoor Gym' },
      { icon: NaturalSourcesIcon, text: 'Yoga Classes' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'النادي الرياضي الداخلي' },
      { icon: NaturalSourcesIcon, text: 'دروس اليوغا' }
    ],
    trendData: [80, 95, 110, 105, 98, 85, 78, 72, 68, 75, 82, 90, 95],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'mobile_station',
    nameEn: 'Mobile Station',
    nameAr: 'المحطة المتنقلة',
    aqi: 32,
    coordinates: [25.1350, 56.3050],
    color: '#84cc16',
    pollutants: [
      { name: 'CO', value: 145, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 5, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 14, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 38, unit: 'µg/m³', status: 'good' },
      { name: 'PM2.5', value: 6, unit: 'µg/m³', status: 'good' },
      { name: 'SO2', value: 10, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 490,
    barpress: 1014,
    wind: 9,
    contributingPollutantEn: 'Fine Particles, PM2.5',
    contributingPollutantAr: 'الجسيمات الناعمة، PM2.5',
    contributingValue: '6 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Sea Breeze' },
      { icon: NaturalSourcesIcon, text: 'Residential Areas' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'نسيم البحر' },
      { icon: NaturalSourcesIcon, text: 'المناطق السكنية' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Open Windows' },
      { icon: NaturalSourcesIcon, text: 'Light Jogging' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'فتح النوافذ' },
      { icon: NaturalSourcesIcon, text: 'الجري الخفيف' }
    ],
    trendData: [25, 28, 30, 35, 32, 28, 26, 24, 25, 28, 30, 32, 35],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'qidfa',
    nameEn: 'Qidfa',
    nameAr: 'قدفع',
    aqi: 52,
    coordinates: [25.1050, 56.3350],
    color: '#fcd34d',
    pollutants: [
      { name: 'CO', value: 210, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 15, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 31, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 82, unit: 'µg/m³', status: 'good' },
      { name: 'PM2.5', value: 12, unit: 'µg/m³', status: 'good' },
      { name: 'SO2', value: 18, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 405,
    barpress: 1011,
    wind: 10,
    contributingPollutantEn: 'Ozone, O3',
    contributingPollutantAr: 'الأوزون، O3',
    contributingValue: '31 ppb',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Coastal Breeze' },
      { icon: NaturalSourcesIcon, text: 'Open Sea' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'نسيم الساحل' },
      { icon: NaturalSourcesIcon, text: 'البحر المفتوح' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Beach Walk' },
      { icon: NaturalSourcesIcon, text: 'Outdoor Sports' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'المشي على الشاطئ' },
      { icon: NaturalSourcesIcon, text: 'الرياضات الخارجية' }
    ],
    trendData: [45, 48, 52, 55, 53, 50, 48, 46, 47, 49, 51, 53, 52],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'aq_hc',
    nameEn: 'AQ- HC',
    nameAr: 'هيئة البيئة - مراقبة جودة الهواء',
    aqi: 68,
    coordinates: [25.1200, 56.3150],
    color: '#fcd34d',
    pollutants: [
      { name: 'CO', value: 340, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 24, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 38, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 105, unit: 'µg/m³', status: 'good' },
      { name: 'PM2.5', value: 22, unit: 'µg/m³', status: 'moderate' },
      { name: 'SO2', value: 26, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 435,
    barpress: 1013,
    wind: 14,
    contributingPollutantEn: 'Particulate Matter, PM2.5',
    contributingPollutantAr: 'الجسيمات الدقيقة، PM2.5',
    contributingValue: '22 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'City Operations' },
      { icon: NaturalSourcesIcon, text: 'Urban Transport' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'عمليات المدينة' },
      { icon: NaturalSourcesIcon, text: 'النقل الحضري' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Shopping' },
      { icon: NaturalSourcesIcon, text: 'Short Walks' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'التسوق' },
      { icon: NaturalSourcesIcon, text: 'المشي القصير' }
    ],
    trendData: [60, 62, 65, 68, 70, 67, 65, 63, 64, 66, 68, 69, 68],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'sakamkam',
    nameEn: 'Sakamkam',
    nameAr: 'محطة سقمقم',
    aqi: 42,
    coordinates: [25.1480, 56.3280],
    color: '#84cc16',
    pollutants: [
      { name: 'CO', value: 180, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 8, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 20, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 64, unit: 'µg/m³', status: 'good' },
      { name: 'PM2.5', value: 8, unit: 'µg/m³', status: 'good' },
      { name: 'SO2', value: 12, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 460,
    barpress: 1012,
    wind: 11,
    contributingPollutantEn: 'Fine Particles, PM2.5',
    contributingPollutantAr: 'الجسيمات الناعمة، PM2.5',
    contributingValue: '8 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Residential Wind' },
      { icon: NaturalSourcesIcon, text: 'Mountain Ridges' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'رياح سكنية' },
      { icon: NaturalSourcesIcon, text: 'سلاسل الجبال' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Outdoor Yoga' },
      { icon: NaturalSourcesIcon, text: 'Hiking' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'اليوغا الخارجية' },
      { icon: NaturalSourcesIcon, text: 'المشي الجبلي' }
    ],
    trendData: [38, 40, 42, 45, 43, 41, 40, 39, 40, 41, 42, 43, 42],
    lastUpdated: '2026-02-17 12:51:02'
  },
  {
    id: 'city_center',
    nameEn: 'City Center',
    nameAr: 'مركز المدينة',
    aqi: 79,
    coordinates: [25.1150, 56.3100],
    color: '#fcd34d',
    pollutants: [
      { name: 'CO', value: 425, unit: 'µg/m³', status: 'good' },
      { name: 'NO2', value: 40, unit: 'ppb', status: 'good' },
      { name: 'O3', value: 47, unit: 'ppb', status: 'good' },
      { name: 'PM10', value: 148, unit: 'µg/m³', status: 'moderate' },
      { name: 'PM2.5', value: 30, unit: 'µg/m³', status: 'moderate' },
      { name: 'SO2', value: 35, unit: 'µg/m³', status: 'good' }
    ],
    swdr: 390,
    barpress: 1009,
    wind: 17,
    contributingPollutantEn: 'Particulate Matter, PM10',
    contributingPollutantAr: 'الجسيمات الدقيقة، PM10',
    contributingValue: '148 µg/m³',
    causesEn: [
      { icon: SuburbanTrafficIcon, text: 'Heavy Traffic' },
      { icon: NaturalSourcesIcon, text: 'Construction' }
    ],
    causesAr: [
      { icon: SuburbanTrafficIcon, text: 'حركة مرور كثيفة' },
      { icon: NaturalSourcesIcon, text: 'البناء والتشييد' }
    ],
    activitiesEn: [
      { icon: SuburbanTrafficIcon, text: 'Indoor Mall' },
      { icon: NaturalSourcesIcon, text: 'Indoor Play area' }
    ],
    activitiesAr: [
      { icon: SuburbanTrafficIcon, text: 'المول الداخلي' },
      { icon: NaturalSourcesIcon, text: 'منطقة ألعاب داخلية' }
    ],
    trendData: [72, 75, 79, 83, 81, 78, 76, 74, 75, 77, 79, 81, 79],
    lastUpdated: '2026-02-17 12:51:02'
  }
];

const getNeedleRotation = (aqi) => {
  if (aqi <= 50) return -85 + (aqi / 50) * 28;
  if (aqi <= 100) return -55 + ((aqi - 50) / 50) * 28;
  if (aqi <= 150) return -25 + ((aqi - 100) / 50) * 28;
  if (aqi <= 200) return 5 + ((aqi - 150) / 50) * 28;
  if (aqi <= 250) return 35 + ((aqi - 200) / 50) * 28;
  const clampedAQI = Math.min(aqi, 300);
  return 65 + ((clampedAQI - 250) / 50) * 20;
};

const getAqiStatus = (aqi, t) => {
  if (aqi <= 50) return { label: t('landing.stats.good', 'Good'), class: 'good', color: '#6BBE00' };
  if (aqi <= 100) return { label: t('landing.dash.moderate', 'Moderate'), class: 'moderate', color: '#FDD836' };
  if (aqi <= 150) return { label: t('landing.dash.unhealthy_sg', 'Unhealthy for Sensitive Groups'), class: 'sensitive', color: '#FF9800' };
  if (aqi <= 200) return { label: t('landing.dash.unhealthy', 'Unhealthy'), class: 'unhealthy', color: '#E53935' };
  if (aqi <= 250) return { label: t('landing.dash.very_unhealthy', 'Very Unhealthy'), class: 'very-unhealthy', color: '#9C27B0' };
  return { label: t('landing.dash.hazardous', 'Hazardous'), class: 'hazardous', color: '#881B1B' };
};

const getProtectiveMeasures = (aqi, KeepWindowsIcon, WearMaskIcon, StayHydratedIcon, IndoorPlantsIcon, lang) => {
  const isAr = lang === 'ar';
  if (aqi <= 50) {
    return [
      { icon: KeepWindowsIcon, text: isAr ? 'افتح النوافذ للتهوية' : 'Open Windows for Ventilation' },
      { icon: WearMaskIcon, text: isAr ? 'لا داعي لارتداء الكمامة' : 'No Mask Needed' },
      { icon: StayHydratedIcon, text: isAr ? 'استمتع بالأنشطة الخارجية' : 'Enjoy Outdoor Activities' },
      { icon: IndoorPlantsIcon, text: isAr ? 'حافظ على جودة الهواء الداخلي' : 'Maintain Indoor Air Quality' }
    ];
  } else {
    return [
      { icon: KeepWindowsIcon, text: isAr ? 'أغلق النوافذ' : 'Keep Windows Closed' },
      { icon: WearMaskIcon, text: isAr ? 'ارتداء كمامة N95' : 'Wear N95 Masks' },
      { icon: StayHydratedIcon, text: isAr ? 'حافظ على رطوبة جسمك' : 'Stay Hydrated' },
      { icon: IndoorPlantsIcon, text: isAr ? 'استخدم منقيات الهواء' : 'Indoor Plants' }
    ];
  }
};

const getCoordinatesForParameter = (baseCoords, param) => {
  const baseLat = baseCoords[0];
  const baseLng = baseCoords[1];
  switch (param.toUpperCase()) {
    case 'SWDR':
      return [baseLat + 0.015, baseLng - 0.012];
    case 'BARPRESS':
      return [baseLat - 0.010, baseLng + 0.018];
    case 'WIND':
      return [baseLat + 0.020, baseLng - 0.022];
    case 'CO':
      return [baseLat - 0.022, baseLng + 0.010];
    case 'O3':
      return [baseLat + 0.025, baseLng + 0.015];
    case 'NO2':
      return [baseLat - 0.015, baseLng - 0.020];
    case 'PM2.5':
      return [baseLat + 0.010, baseLng + 0.022];
    case 'SO2':
      return [baseLat - 0.025, baseLng - 0.010];
    case 'PM10':
      return [baseLat + 0.030, baseLng - 0.015];
    case 'AQI':
    default:
      return [baseLat, baseLng];
  }
};

// Default AQI color when the API omits one (mirrors the AQI category scale).
const colorForAqi = (aqi) => {
  if (aqi == null) return '#9ca3af';
  if (aqi <= 50) return '#84cc16';
  if (aqi <= 100) return '#fcd34d';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a855f7';
  return '#7f1d1d';
};

// Merge a live overview station onto a fallback template (round-robin) so the
// descriptive fields stay populated while aqi/color/name/trend come from the API.
const mergeStation = (live, template, idx, trendData) => {
  const base = template || FALLBACK_STATIONS[idx % FALLBACK_STATIONS.length];
  const aqi = live.aqi != null ? Number(live.aqi) : base.aqi;
  return {
    ...base,
    id: live.stationCode || base.id,
    nameEn: live.name || base.nameEn,
    nameAr: live.name || base.nameAr,
    aqi,
    color: live.color || colorForAqi(aqi),
    trendData: trendData && trendData.length ? trendData : base.trendData,
  };
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, lang, toggleLanguage } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [mobileMapPanelOpen, setMobileMapPanelOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('causes'); // 'causes' or 'activities'

  // Live PUBLIC overview data (no auth). Falls back to template stations until loaded.
  const [overviewLoading, setOverviewLoading] = React.useState(true);
  const [stations, setStations] = React.useState(FALLBACK_STATIONS);
  const [stationCount, setStationCount] = React.useState(null);
  const [trendPoints, setTrendPoints] = React.useState([]); // [{observationTime, aqi}]

  const [selectedStation, setSelectedStation] = React.useState(FALLBACK_STATIONS[0]);
  const [selectedParameter, setSelectedParameter] = React.useState('AQI');
  const heroSectionRef = useRef(null);
  const mapSectionRef = useRef(null);
  const footerSectionRef = useRef(null);

  React.useEffect(() => {
    let active = true;
    getAqmsPublicOverview()
      .then((data) => {
        if (!active) return;
        const latest = Array.isArray(data?.latestAqiByStation) ? data.latestAqiByStation : [];
        const trend = Array.isArray(data?.trend) ? data.trend : [];
        const merged = latest.length
          ? latest.map((live, i) => mergeStation(live, FALLBACK_STATIONS[i % FALLBACK_STATIONS.length], i, trend.map((p) => Number(p.aqi))))
          : FALLBACK_STATIONS;
        setStations(merged);
        setSelectedStation(merged[0] || FALLBACK_STATIONS[0]);
        setStationCount(data?.stationCount != null ? Number(data.stationCount) : latest.length || null);
        setTrendPoints(trend);
      })
      .catch(() => { /* keep fallback template data */ })
      .finally(() => { if (active) setOverviewLoading(false); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    document.body.classList.add('aqms-theme');
    return () => {
      document.body.classList.remove('aqms-theme');
    };
  }, []);

  React.useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add('aqms-menu-open');
    } else {
      document.body.classList.remove('aqms-menu-open');
    }
    return () => document.body.classList.remove('aqms-menu-open');
  }, [mobileNavOpen]);

  React.useEffect(() => {
    if (mobileMapPanelOpen) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [mobileMapPanelOpen]);

  const scrollToHero = (e) => {
    e.preventDefault();
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  const scrollToMap = (e) => {
    e?.preventDefault();
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  const scrollToFooter = (e) => {
    e.preventDefault();
    footerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  // Real AQI trend derived from the public overview endpoint. Falls back to the
  // selected station's template trend when the API returns no trend points.
  const trendTimeLabels = trendPoints.map((p) =>
    new Date(p.observationTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const trendSeriesData = trendPoints.length
    ? trendPoints.map((p) => (p.aqi != null ? Number(p.aqi) : null))
    : selectedStation.trendData;
  const trendCategories = trendTimeLabels.length ? trendTimeLabels : null;

  // Highcharts options for Hourly Trend
  const trendOptions = {
    chart: { 
      type: 'areaspline', 
      backgroundColor: 'transparent', 
      height: 145,
      margin: [10, 15, 35, 35],
      spacingTop: 0,
      spacingBottom: 5,
      spacingLeft: 0,
      spacingRight: 0
    },
    title: { text: '' },
    xAxis: {
      categories: trendCategories,
      visible: true,
      lineWidth: 0, 
      tickWidth: 0, 
      reversed: lang === 'ar',
      labels: {
        rotation: 0, // Keep labels horizontal to prevent clipping and rotation issues
        style: {
          fontSize: '8.5px',
          color: '#888',
          fontWeight: '500'
        }
      }
    },
    yAxis: { 
      min: 0,
      max: 300,
      tickInterval: 50,
      title: { text: '' }, 
      gridLineColor: 'rgba(0, 0, 0, 0.05)', 
      opposite: lang === 'ar',
      labels: {
        x: -8,
        style: {
          fontSize: '9px',
          color: '#888',
          fontWeight: '500'
        }
      }
    },
    legend: { enabled: false },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, 'rgba(254, 128, 35, 0.45)'],       // #FE8023 stops at 0%
            [0.216, 'rgba(252, 217, 86, 0.45)'],   // #FCD956 stops at 21.6%
            [0.519, 'rgba(131, 203, 23, 0.45)'],   // #83CB17 stops at 51.9%
            [0.697, 'rgba(252, 217, 86, 0.45)'],   // #FCD956 stops at 69.7%
            [1, 'rgba(254, 121, 31, 0.45)']        // #FE791F stops at 100%
          ]
        },
        marker: { 
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5
            }
          }
        },
        lineWidth: 3,
        states: { hover: { lineWidth: 3 } },
        threshold: null
      }
    },
    series: [{
      name: t('landing.map.aqi_index', 'AQI'),
      data: trendSeriesData,
      color: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
        stops: [
          [0, '#FE8023'],
          [0.216, '#FCD956'],
          [0.519, '#83CB17'],
          [0.697, '#FCD956'],
          [1, '#FE791F']
        ]
      }
    }],
    credits: { enabled: false }
  };

  return (
    <div className="landing-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`nav-overlay ${mobileNavOpen ? 'active' : ''}`} onClick={() => setMobileNavOpen(false)}></div>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <img src="/assets/AQMS/logo-dark.png" alt="Fujairah Environment Authority" />
        </div>
        <div className={`landing-links ${mobileNavOpen ? 'active' : ''}`}>
          <div className="drawer-header">
            <h3>Menu</h3>
            <button className="close-btn" onClick={() => setMobileNavOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <a href="#" onClick={scrollToHero}>{t('landing.nav.our_air_quality')}</a>
          <a href="#" onClick={scrollToMap}>{t('landing.nav.live_air_quality')}</a>
          <a href="#" onClick={scrollToFooter}>{t('landing.nav.contact_us')}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Premium Sliding Language Switcher Toggle */}
          <div 
            className={`lang-switcher-container ${lang}`}
            onClick={toggleLanguage}
            style={{
              width: '108px',
              height: '44px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #009fac 0%, #008794 100%)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              marginInlineEnd: '16px',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.1)',
              direction: 'ltr' // Always force LTR on language switcher container to match mockup
            }}
            title="Change Language / تغيير اللغة"
          >
            {/* Static background 'ع' when language is English */}
            {lang === 'en' && (
              <span 
                className="lang-label-bg"
                style={{
                  position: 'absolute',
                  left: '2px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '500',
                  fontSize: '18px',
                  zIndex: 1
                }}
              >
                ع
              </span>
            )}
            
            {/* Static background 'En' when language is Arabic */}
            {lang === 'ar' && (
              <span 
                className="lang-label-bg"
                style={{
                  position: 'absolute',
                  right: '2px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '500',
                  fontSize: '14px',
                  fontFamily: "'Roboto', sans-serif",
                  zIndex: 1
                }}
              >
                En
              </span>
            )}

            {/* Sliding 3D Raised Circular knob button containing active language label */}
            <div 
              className="lang-knob"
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00b8c8 0%, #008c9a 100%)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.25), inset 0 2px 2px rgba(255, 255, 255, 0.4), inset 0 -2px 2px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: lang === 'en' ? 'translateX(64px)' : 'translateX(0)',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {/* Centered Active Label inside the knob */}
              <span 
                className="lang-knob-text"
                style={{
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: lang === 'en' ? '15px' : '18px',
                  fontFamily: lang === 'en' ? "'Roboto', sans-serif" : 'inherit',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  lineHeight: 1
                }}
              >
                {lang === 'en' ? 'En' : 'ع'}
              </span>
            </div>
          </div>
          <button className="landing-login-btn" onClick={() => navigate('/AQMS/login')}>
            {t('login.title', 'Login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={heroSectionRef} className="landing-hero">
        <div className="landing-content">
          <h1>{t('landing.hero.title')}<br />{t('landing.hero.subtitle')}</h1>
          
          <button className="landing-cta" onClick={() => navigate('/AQMS/live-data')}>
            {t('landing.hero.view_live')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Stats Grid (driven by the public overview endpoint) */}
          <div className="landing-stats">
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.current_aqi')}</div>
              <div className="stat-value">
                {overviewLoading ? '…' : (stations[0]?.aqi != null ? stations[0].aqi : '—')}
              </div>
              <div className="stat-desc">{getAqiStatus(stations[0]?.aqi ?? 0, t).label}</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.active_stations')}</div>
              <div className="stat-value">
                {overviewLoading ? '…' : (stationCount != null ? stationCount : stations.length)}
              </div>
              <div className="stat-desc">{t('landing.stats.monitoring')}</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.coverage_area')}</div>
              <div className="stat-value">100%</div>
              <div className="stat-desc">{t('landing.stats.fujairah')}</div>
            </div>
          </div>
        </div>

        {/* Decorative Radar/Map Overlays */}
        <div className="landing-radar left-radar">
          <div className="radar-circle"><div className="radar-text">AQI</div></div>
        </div>
        <div className="landing-radar right-radar">
           <div className="radar-circle"><div className="radar-text">AQI</div></div>
        </div>
        <div className="landing-arrow-down" onClick={scrollToMap} style={{ cursor: 'pointer', padding: '20px' }}>
          <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 10 12 15 17 10"></polyline>
            <polyline points="7 14 12 19 17 14"></polyline>
          </svg>
        </div>
      </main>

      {/* EXTENDED SECTION: Live Air Quality Map */}
      <section className="landing-map-section" ref={mapSectionRef}>
        <div className="map-section-header">
          <h2>{t('landing.map.title')}</h2>
          <p>{t('landing.map.desc')}</p>
          
          <div className="map-top-selectors mobile-only-selectors">
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center' }}>
              {t('landing.map.city_centre', 'Stations')}:
            </span>
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const stn = stations.find(s => s.id === e.target.value);
                if (stn) setSelectedStation(stn);
              }}
              className="custom-select"
              style={{
                border: '1px solid rgba(255,255,255,0.6)',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingInlineEnd: '24px',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: lang === 'ar' ? 'left 8px center' : 'right 8px center',
                backgroundSize: '12px',
                cursor: 'pointer'
              }}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id} style={{ background: '#fff', color: '#333' }}>
                  {lang === 'ar' ? stn.nameAr : stn.nameEn}
                </option>
              ))}
            </select>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="custom-select small"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingInlineEnd: '18px',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: lang === 'ar' ? 'left 4px center' : 'right 4px center',
                backgroundSize: '10px',
                cursor: 'pointer'
              }}
            >
              <option value="AQI">{lang === 'ar' ? 'مؤشر جودة الهواء' : 'Air Quality Index'}</option>
              <option value="SWDR">SWDR</option>
              <option value="Barpress">Barpress</option>
              <option value="Wind">Wind</option>
              <option value="CO">CO</option>
              <option value="O3">O3</option>
              <option value="No2">No2</option>
              <option value="PM2.5">PM2.5</option>
              <option value="SO2">SO2</option>
              <option value="PM10">PM10</option>
            </select>
          </div>
        </div>

        <div className="map-dashboard-container">
          
          <div className="map-background">
            <MapContainer center={[25.1240, 56.3250]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              {(() => {
                const parameterOptions = ['AQI', 'SWDR', 'Barpress', 'Wind', 'CO', 'O3', 'No2', 'PM2.5', 'SO2', 'PM10'];
                const paramsToRender = selectedParameter === 'AQI' ? parameterOptions : [selectedParameter];
                const points = [];
                
                paramsToRender.forEach(param => {
                  stations.forEach(stn => {
                    let displayVal = stn.aqi;
                    let displayColor = stn.color;
                    
                    if (param !== 'AQI') {
                      const pData = stn.pollutants.find(p => p.name.toUpperCase() === param.toUpperCase());
                      if (pData) {
                        displayVal = pData.value;
                        displayColor = pData.status === 'moderate' ? '#fcd34d' : '#84cc16';
                      } else if (param === 'SWDR') {
                        displayVal = stn.swdr;
                        displayColor = '#84cc16';
                      } else if (param === 'Barpress') {
                        displayVal = stn.barpress;
                        displayColor = '#84cc16';
                      } else if (param === 'Wind') {
                        displayVal = stn.wind;
                        displayColor = '#84cc16';
                      }
                    }
                    
                    points.push({
                      id: `${stn.id}_${param}`,
                      station: stn,
                      parameter: param,
                      displayVal,
                      displayColor,
                      coords: getCoordinatesForParameter(stn.coordinates, param)
                    });
                  });
                });
                
                return points.map(pt => (
                  <Marker
                    key={pt.id}
                    position={pt.coords}
                    icon={createCustomIcon(String(pt.displayVal), pt.displayColor)}
                    eventHandlers={{
                      click: () => {
                        setSelectedStation(pt.station);
                        if (pt.parameter !== 'AQI') {
                          setSelectedParameter(pt.parameter);
                        }
                        setMobileMapPanelOpen(true);
                      }
                    }}
                  />
                ));
              })()}
            </MapContainer>
          </div>

          {/* Map sliding panel background overlay for closing it on tap */}
          <div 
            className={`map-panel-overlay ${mobileMapPanelOpen ? 'active' : ''}`} 
            onClick={() => setMobileMapPanelOpen(false)}
          ></div>

          {/* Main Floating Controls Wrapper (Slides on Mobile, content injection on Desktop) */}
          <div className={`map-controls-sliding-wrapper ${mobileMapPanelOpen ? 'active' : ''}`}>
            
            {/* Pull Tab Handle (Visible on mobile on the left edge of drawer) */}
            <button 
              className="map-drawer-pull-tab"
              onClick={() => setMobileMapPanelOpen(!mobileMapPanelOpen)}
              title={mobileMapPanelOpen ? "Close Controls" : "Open Controls"}
            >
              {mobileMapPanelOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  <span style={{ fontSize: '9px', fontWeight: '800', writingMode: 'vertical-lr', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MAP</span>
                </div>
              )}
            </button>

            {/* Mobile close button inside sliding panel */}
            <div className="mobile-panel-header">
              <h3>{t('landing.map.details', 'Map Details & Layers')}</h3>
              <button className="close-btn" onClick={() => setMobileMapPanelOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Top Selectors */}
          <div className="map-top-selectors desktop-only-selectors" style={{ left: lang === 'ar' ? 'auto' : '358px', right: lang === 'ar' ? '358px' : 'auto' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center' }}>
              {t('landing.map.city_centre', 'Stations')}:
            </span>
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const stn = stations.find(s => s.id === e.target.value);
                if (stn) setSelectedStation(stn);
              }}
              className="custom-select"
              style={{
                border: '1px solid rgba(255,255,255,0.6)',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingInlineEnd: '24px',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: lang === 'ar' ? 'left 8px center' : 'right 8px center',
                backgroundSize: '12px',
                cursor: 'pointer'
              }}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id} style={{ background: '#fff', color: '#333' }}>
                  {lang === 'ar' ? stn.nameAr : stn.nameEn}
                </option>
              ))}
            </select>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="custom-select small"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingInlineEnd: '18px',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: lang === 'ar' ? 'left 4px center' : 'right 4px center',
                backgroundSize: '10px',
                cursor: 'pointer'
              }}
            >
              <option value="AQI">{lang === 'ar' ? 'مؤشر جودة الهواء' : 'Air Quality Index'}</option>
              <option value="SWDR">SWDR</option>
              <option value="Barpress">Barpress</option>
              <option value="Wind">Wind</option>
              <option value="CO">CO</option>
              <option value="O3">O3</option>
              <option value="No2">No2</option>
              <option value="PM2.5">PM2.5</option>
              <option value="SO2">SO2</option>
              <option value="PM10">PM10</option>
            </select>
          </div>

          <div className="map-panel-right" style={{
            position: 'absolute',
            top: '20px',
            right: lang === 'ar' ? 'auto' : '20px',
            left: lang === 'ar' ? '20px' : 'auto',
            zIndex: 15,
            width: '340px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Top Row: Primary & Secondary */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    border: '1.5px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff'
                  }}></div>
                  {t('landing.map.primary', 'Primary')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '1.5px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff'
                  }}></div>
                  {t('landing.map.secondary', 'Secondary')}
                </label>
              </div>

              {/* Inner Blue Panel */}
              <div style={{
                background: '#ecf8f9',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* AQI | Weather */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1.5px solid #008f9b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffffff'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#008f9b' }}></div>
                    </div>
                    {t('landing.map.aqi_index', 'AQI')}
                  </div>
                  <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff'
                    }}></div>
                    {t('landing.map.weather', 'Weather')}
                  </div>
                </div>

                {/* Sub-tabs / Chips */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', width: '100%' }}>
                  <div style={{
                    background: '#9cdde2',
                    color: '#073e41',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '4px 0',
                    textAlign: 'center',
                    flexGrow: 1,
                    cursor: 'pointer'
                  }}>AQI</div>
                  <div style={{
                    background: '#dedede',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '4px 0',
                    textAlign: 'center',
                    flexGrow: 1,
                    cursor: 'pointer'
                  }}>PM<sub>10</sub></div>
                  <div style={{
                    background: '#dedede',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '4px 0',
                    textAlign: 'center',
                    flexGrow: 1,
                    cursor: 'pointer'
                  }}>SO<sub>2</sub></div>
                  <div style={{
                    background: '#dedede',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '4px 0',
                    textAlign: 'center',
                    flexGrow: 1,
                    cursor: 'pointer'
                  }}>CO</div>
                  <div style={{
                    background: '#dedede',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '20px',
                    padding: '4px 0',
                    textAlign: 'center',
                    flexGrow: 1,
                    cursor: 'pointer'
                  }}>NO<sub>2</sub></div>
                </div>

                {/* Gradient Scale */}
                <div>
                  <div style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, #83cb17 0%, #83cb17 10%, #fcd34d 10%, #fcd34d 30%, #fe8023 30%, #fe8023 50%, #ef4444 50%, #ef4444 70%, #8b5cf6 70%, #8b5cf6 85%, #7f1d1d 85%, #7f1d1d 100%)'
                  }}></div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    padding: '0 2px',
                    fontSize: '9px',
                    fontWeight: '600',
                    color: '#0f172a'
                  }}>
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                    <span>300</span>
                    <span>500</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

          {/* Left Panel: City Centre Specifics */}
          <div className="map-panel-left" style={{ left: lang === 'ar' ? 'auto' : '16px', right: lang === 'ar' ? '16px' : 'auto' }}>
            <div className="city-card">
              <div className="city-card-header">
                {(() => {
                  const statusInfo = getAqiStatus(selectedStation.aqi, t);
                  return (
                    <>
                      <div className="aqi-circle" style={{ backgroundColor: statusInfo.color }}>
                        <div className="aqi-val">{selectedStation.aqi}</div>
                        <div className="aqi-status">{statusInfo.label}</div>
                      </div>
                      <h3>{lang === 'ar' ? selectedStation.nameAr : selectedStation.nameEn}</h3>
                    </>
                  );
                })()}
                <div className="subtitle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginInlineEnd: '4px' }}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                  {t('landing.map.aqi_index')}
                </div>
              </div>
              
              <div className="pollutants-grid">
                {selectedStation.pollutants.map((p, idx) => {
                  const isMod = p.status === 'moderate';
                  return (
                    <div key={idx} className={`p-item ${isMod ? 'moderate' : ''}`}>
                      <div className="p-head">
                        <span className={`p-dot ${p.status}`}></span> 
                        {p.status === 'good' ? t('landing.stats.good', 'Good') : t('landing.dash.moderate', 'Moderate')}
                      </div>
                      <div className="p-body">
                        <div className="p-sym">{p.name}</div>
                        <div className="p-val-container">
                          <div className="p-val">{p.value}</div>
                          <span className="p-unit">{p.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card-footer">{t('landing.map.last_updated')}: {selectedStation.lastUpdated}</div>
            </div>
          </div>

          {/* Mobile Only Additional Cards Section (Safety Level, Protective Measures, Hourly Trend) */}
          <div className="mobile-additional-cards">
            {/* 1. Air Quality Safety Level & Main Contributing Pollutant */}
            <div className="dash-card combined-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(105, 244, 255, 0.10)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
              <div className="combined-half" style={{ width: '100%' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>{t('landing.dash.safety_level')}</h4>
                {(() => {
                  const cx = 143.408;
                  const cy = 143.408;
                  const rOut = 135;
                  const rIn = 113;
                  
                  const segments = [
                    { start: 175, end: 147, color: '#6BBE00', range: '0-50', label: t('landing.stats.good') },
                    { start: 145, end: 117, color: '#FDD836', range: '50-100', label: t('landing.dash.moderate') },
                    { start: 115, end: 87,  color: '#FF9800', range: '100-150', label: 'Unhealthy for\nsensitive groups' },
                    { start: 85,  end: 57,  color: '#E53935', range: '150-200', label: 'Unhealthy' },
                    { start: 55,  end: 27,  color: '#9C27B0', range: '200-250', label: 'Very\nUnhealthy' },
                    { start: 25,  end: 5,   color: '#881B1B', range: '250-300', label: 'Hazardous' }
                  ];

                  const getArcPath = (startAngle, endAngle) => {
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const x1_out = cx + rOut * Math.cos(startRad);
                    const y1_out = cy - rOut * Math.sin(startRad);
                    const x2_out = cx + rOut * Math.cos(endRad);
                    const y2_out = cy - rOut * Math.sin(endRad);
                    
                    const x1_in = cx + rIn * Math.cos(startRad);
                    const y1_in = cy - rIn * Math.sin(startRad);
                    const x2_in = cx + rIn * Math.cos(endRad);
                    const y2_in = cy - rIn * Math.sin(endRad);
                    
                    return `M ${x1_out} ${y1_out} A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${rIn} ${rIn} 0 0 0 ${x1_in} ${y1_in} Z`;
                  };

                  return (
                    <div className="gauge-placeholder" style={{ position: 'relative', width: '100%', maxWidth: '287px', height: '130px', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', marginTop: '4px', marginBottom: '0' }}>
                      <svg viewBox="-30 -35 347 190" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="paint0_linear_3077_8097_mobile" x1="143.408" y1="0" x2="143.408" y2="143.408" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EEEEEE"/>
                            <stop offset="1" stopColor="#9E9D9D"/>
                          </linearGradient>
                        </defs>

                        <g transform={`translate(${cx}, ${cy}) scale(1.0) translate(-${cx}, -${cy})`}>
                          <path d="M286.816 143.408H248.471C248.471 85.4757 201.34 38.3444 143.408 38.3444C85.4756 38.3444 38.3444 85.4757 38.3444 143.408H0C0 133.69 0.980187 123.973 2.91331 114.527C4.79922 105.31 7.61342 96.2444 11.2776 87.5812C14.8735 79.0796 19.3232 70.8812 24.5032 63.2138C29.6306 55.6242 35.5185 48.4879 42.0032 42.0032C48.4879 35.5185 55.6242 29.6307 63.2138 24.5031C70.8812 19.3232 79.0796 14.8735 87.5812 11.2775C96.2444 7.61337 105.31 4.79922 114.527 2.91322C123.973 0.980143 133.69 0 143.408 0C153.125 0 162.842 0.980143 172.289 2.91322C181.506 4.79922 190.571 7.61337 199.235 11.2775C207.736 14.8734 215.935 19.3232 223.602 24.5031C231.192 29.6306 238.328 35.5184 244.813 42.0032C251.297 48.4879 257.185 55.6242 262.313 63.2138C267.493 70.8812 271.942 79.0796 275.538 87.5812C279.202 96.2444 282.017 105.31 283.903 114.527C285.836 123.973 286.816 133.69 286.816 143.408Z" fill="url(#paint0_linear_3077_8097_mobile)"/>
                          {segments.map((seg, idx) => (
                            <path key={idx} d={getArcPath(seg.start, seg.end)} fill={seg.color} />
                          ))}
                          <g transform={`translate(${cx}, ${cy}) rotate(-71)`}>
                            <polygon points="-3,0 3,0 0,-120" fill="#1e293b" />
                            <circle cx="0" cy="0" r="7" fill="#1e293b" />
                            <circle cx="0" cy="0" r="2.5" fill="white" />
                          </g>
                        </g>

                        {segments.map((seg, idx) => {
                          const midAngle = (seg.start + seg.end) / 2;
                          const midRad = (midAngle * Math.PI) / 180;
                          
                          const tx = cx + 124 * Math.cos(midRad);
                          const ty = cy - 124 * Math.sin(midRad);
                          const rot = 90 - midAngle;
                          
                          const lx = cx + 154 * Math.cos(midRad);
                          const ly = cy - 154 * Math.sin(midRad);
                          
                          const labelParts = seg.label.split('\n');

                          return (
                            <g key={idx}>
                              <text x={tx} y={ty + 3} transform={`rotate(${rot} ${tx} ${ty})`} fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">{seg.range}</text>
                              {labelParts.length > 1 ? (
                                <text x={lx} y={ly} transform={`rotate(${rot} ${lx} ${ly})`} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                                  <tspan x={lx} dy="-3">{labelParts[0]}</tspan>
                                  <tspan x={lx} dy="9">{labelParts[1]}</tspan>
                                </text>
                              ) : (
                                <text x={lx} y={ly} transform={`rotate(${rot} ${lx} ${ly})`} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">{seg.label}</text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                      <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6BBE00' }}>{t('landing.stats.good')}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(0, 0, 0, 0.08)' }}></div>

              <div className="combined-half" style={{ width: '100%' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>{t('landing.dash.pollutant')}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    background: '#DEDEDE',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    Particulate Matter, PM10
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#009fac'
                  }}>
                    95 µg/m³
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '10px 0' }} />

                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setActiveTab('causes')}
                    style={activeTab === 'causes' ? {
                      borderRadius: '10px',
                      border: 'none',
                      background: '#008F9B',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    } : {
                      borderRadius: '10px',
                      border: '1px solid #A2A2A2',
                      background: 'transparent',
                      color: '#A2A2A2',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Possible Causes
                  </button>
                  <button 
                    onClick={() => setActiveTab('activities')}
                    style={activeTab === 'activities' ? {
                      borderRadius: '10px',
                      border: 'none',
                      background: '#008F9B',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    } : {
                      borderRadius: '10px',
                      border: '1px solid #A2A2A2',
                      background: 'transparent',
                      color: '#A2A2A2',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Activities
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    border: '1px solid rgba(50, 154, 163, 0.10)',
                    borderRadius: '10px',
                    background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                    boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                    backdropFilter: 'blur(4.4px)',
                    WebkitBackdropFilter: 'blur(4.4px)',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#334155'
                  }}>
                    <img src={SuburbanTrafficIcon} alt="Suburban Traffic" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                    {t('landing.dash.suburban')}
                  </div>
                  <div style={{
                    border: '1px solid rgba(50, 154, 163, 0.10)',
                    borderRadius: '10px',
                    background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                    boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                    backdropFilter: 'blur(4.4px)',
                    WebkitBackdropFilter: 'blur(4.4px)',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#334155'
                  }}>
                    <img src={NaturalSourcesIcon} alt="Natural Sources" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                    {t('landing.dash.natural')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Protective Measures */}
            <div className="dash-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(105, 244, 255, 0.10)', padding: '20px', boxSizing: 'border-box' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>{t('landing.dash.measures')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <div style={{
                  border: '1px solid rgba(50, 154, 163, 0.10)',
                  borderRadius: '10px',
                  background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                  boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                  backdropFilter: 'blur(4.4px)',
                  WebkitBackdropFilter: 'blur(4.4px)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#334155'
                }}>
                  <img src={KeepWindowsIcon} alt="Keep Windows Closed" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {t('landing.dash.measures.windows', 'Keep Windows Closed')}
                </div>

                <div style={{
                  border: '1px solid rgba(50, 154, 163, 0.10)',
                  borderRadius: '10px',
                  background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                  boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                  backdropFilter: 'blur(4.4px)',
                  WebkitBackdropFilter: 'blur(4.4px)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#334155'
                }}>
                  <img src={WearMaskIcon} alt="Wear N95 Masks" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {t('landing.dash.measures.mask', 'Wear N95 Masks')}
                </div>

                <div style={{
                  border: '1px solid rgba(50, 154, 163, 0.10)',
                  borderRadius: '10px',
                  background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                  boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                  backdropFilter: 'blur(4.4px)',
                  WebkitBackdropFilter: 'blur(4.4px)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#334155'
                }}>
                  <img src={StayHydratedIcon} alt="Stay Hydrated" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {t('landing.dash.measures.hydrated', 'Stay Hydrated')}
                </div>

                <div style={{
                  border: '1px solid rgba(50, 154, 163, 0.10)',
                  borderRadius: '10px',
                  background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                  boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                  backdropFilter: 'blur(4.4px)',
                  WebkitBackdropFilter: 'blur(4.4px)',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#334155'
                }}>
                  <img src={IndoorPlantsIcon} alt="Indoor Plants" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  {t('landing.dash.measures.plants', 'Indoor Plants')}
                </div>
              </div>
            </div>

            {/* 3. Hourly AQI Trend - Stations */}
            <div className="dash-card trend-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(105, 244, 255, 0.10)', padding: '20px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                  {lang === 'ar' ? `اتجاه المؤشر كل ساعة - ${selectedStation.nameAr}` : `Hourly AQI Trend - ${selectedStation.nameEn}`}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                  AQI
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="chart-wrapper">
                <HighchartsReactComponent highcharts={Highcharts} options={trendOptions} />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '8px',
                marginTop: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#83CB17', flexShrink: 0 }}></span> Good
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FCD956', flexShrink: 0 }}></span> Moderate
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FE8023', flexShrink: 0 }}></span> Sensitive
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }}></span> Unhealthy
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8b5cf6', flexShrink: 0 }}></span> V. Unhealthy
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7f1d1d', flexShrink: 0 }}></span> Hazardous
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Vertically centered Map controls */}
          <div className={`map-controls ${lang === 'ar' ? 'rtl' : ''}`}>
            <button className="ctrl-btn" onClick={() => {}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            </button>
            <button className="ctrl-btn" onClick={() => {}}>+</button>
            <button className="ctrl-btn" onClick={() => {}}>−</button>
          </div>

          {/* Bottom Dashboards */}
          <section className="bottom-dashboards" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="dash-card combined-card">
              <div className="combined-half" style={{ flex: '0 0 300px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{t('landing.dash.safety_level')}</h4>
                {(() => {
                  const cx = 143.408;
                  const cy = 143.408;
                  const rOut = 135;
                  const rIn = 113;
                  
                  const segments = [
                    { start: 175, end: 147, color: '#6BBE00', range: '0-50', label: t('landing.stats.good') },
                    { start: 145, end: 117, color: '#FDD836', range: '50-100', label: t('landing.dash.moderate') },
                    { start: 115, end: 87,  color: '#FF9800', range: '100-150', label: lang === 'ar' ? 'غير صحي للفئات الحساسة' : 'Unhealthy for\nsensitive groups' },
                    { start: 85,  end: 57,  color: '#E53935', range: '150-200', label: lang === 'ar' ? 'غير صحي' : 'Unhealthy' },
                    { start: 55,  end: 27,  color: '#9C27B0', range: '200-250', label: lang === 'ar' ? 'غير صحي للغاية' : 'Very\nUnhealthy' },
                    { start: 25,  end: 5,   color: '#881B1B', range: '250-300', label: lang === 'ar' ? 'خطير' : 'Hazardous' }
                  ];

                  const getArcPath = (startAngle, endAngle) => {
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const x1_out = cx + rOut * Math.cos(startRad);
                    const y1_out = cy - rOut * Math.sin(startRad);
                    const x2_out = cx + rOut * Math.cos(endRad);
                    const y2_out = cy - rOut * Math.sin(endRad);
                    
                    const x1_in = cx + rIn * Math.cos(startRad);
                    const y1_in = cy - rIn * Math.sin(startRad);
                    const x2_in = cx + rIn * Math.cos(endRad);
                    const y2_in = cy - rIn * Math.sin(endRad);
                    
                    return `M ${x1_out} ${y1_out} A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${rIn} ${rIn} 0 0 0 ${x1_in} ${y1_in} Z`;
                  };

                  const needleRotation = getNeedleRotation(selectedStation.aqi);
                  const statusInfo = getAqiStatus(selectedStation.aqi, t);

                  return (
                    <div className="gauge-placeholder" style={{ position: 'relative', width: '287px', height: '130px', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', marginTop: '4px', marginBottom: '0' }}>
                      <svg viewBox="-30 -35 347 190" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="paint0_linear_3077_8097" x1="143.408" y1="0" x2="143.408" y2="143.408" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EEEEEE"/>
                            <stop offset="1" stopColor="#9E9D9D"/>
                          </linearGradient>
                        </defs>

                        {/* Full Scale Visual Group */}
                        <g transform={`translate(${cx}, ${cy}) scale(1.0) translate(-${cx}, -${cy})`}>
                          {/* Backing Track Path */}
                          <path d="M286.816 143.408H248.471C248.471 85.4757 201.34 38.3444 143.408 38.3444C85.4756 38.3444 38.3444 85.4757 38.3444 143.408H0C0 133.69 0.980187 123.973 2.91331 114.527C4.79922 105.31 7.61342 96.2444 11.2776 87.5812C14.8735 79.0796 19.3232 70.8812 24.5032 63.2138C29.6306 55.6242 35.5185 48.4879 42.0032 42.0032C48.4879 35.5185 55.6242 29.6307 63.2138 24.5031C70.8812 19.3232 79.0796 14.8735 87.5812 11.2775C96.2444 7.61337 105.31 4.79922 114.527 2.91322C123.973 0.980143 133.69 0 143.408 0C153.125 0 162.842 0.980143 172.289 2.91322C181.506 4.79922 190.571 7.61337 199.235 11.2775C207.736 14.8734 215.935 19.3232 223.602 24.5031C231.192 29.6306 238.328 35.5184 244.813 42.0032C251.297 48.4879 257.185 55.6242 262.313 63.2138C267.493 70.8812 271.942 79.0796 275.538 87.5812C279.202 96.2444 282.017 105.31 283.903 114.527C285.836 123.973 286.816 133.69 286.816 143.408Z" fill="url(#paint0_linear_3077_8097)"/>

                          {/* Colored Segments */}
                          {segments.map((seg, idx) => (
                            <path key={idx} d={getArcPath(seg.start, seg.end)} fill={seg.color} />
                          ))}

                          {/* Needle & Center Pivot */}
                          <g transform={`translate(${cx}, ${cy}) rotate(${needleRotation})`}>
                            <polygon points="-3,0 3,0 0,-120" fill="#1e293b" />
                            <circle cx="0" cy="0" r="7" fill="#1e293b" />
                            <circle cx="0" cy="0" r="2.5" fill="white" />
                          </g>
                        </g>

                        {/* Typography */}
                        {segments.map((seg, idx) => {
                          const midAngle = (seg.start + seg.end) / 2;
                          const midRad = (midAngle * Math.PI) / 180;
                          
                          const tx = cx + 124 * Math.cos(midRad);
                          const ty = cy - 124 * Math.sin(midRad);
                          const rot = 90 - midAngle;
                          
                          const lx = cx + 154 * Math.cos(midRad);
                          const ly = cy - 154 * Math.sin(midRad);
                          
                          const labelParts = seg.label.split('\n');

                          return (
                            <g key={idx}>
                              {/* Inner Range Text */}
                              <text x={tx} y={ty + 3} transform={`rotate(${rot} ${tx} ${ty})`} fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">{seg.range}</text>
                              
                              {/* Outer Label text */}
                              {labelParts.length > 1 ? (
                                <text x={lx} y={ly} transform={`rotate(${rot} ${lx} ${ly})`} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                                  <tspan x={lx} dy="-3">{labelParts[0]}</tspan>
                                  <tspan x={lx} dy="9">{labelParts[1]}</tspan>
                                </text>
                              ) : (
                                <text x={lx} y={ly} transform={`rotate(${rot} ${lx} ${ly})`} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">{seg.label}</text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                      <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: statusInfo.color }}>{statusInfo.label}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="combined-divider"></div>

              <div className="combined-half">
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>{t('landing.dash.pollutant')}</h4>
                
                {/* Pollutant Name and Value Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    background: '#DEDEDE',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    {lang === 'ar' ? selectedStation.contributingPollutantAr : selectedStation.contributingPollutantEn}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#009fac'
                  }}>
                    {selectedStation.contributingValue}
                  </div>
                </div>

                {/* Divider Line */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '10px 0' }} />

                {/* Dynamic Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setActiveTab('causes')}
                    style={activeTab === 'causes' ? {
                      borderRadius: '10px',
                      border: 'none',
                      borderBottom: '1px solid #008F9B',
                      background: '#008F9B',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    } : {
                      borderRadius: '10px',
                      border: '1px solid #A2A2A2',
                      background: 'transparent',
                      color: '#A2A2A2',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'ar' ? 'الأسباب المحتملة' : 'Possible Causes'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('activities')}
                    style={activeTab === 'activities' ? {
                      borderRadius: '10px',
                      border: 'none',
                      borderBottom: '1px solid #008F9B',
                      background: '#008F9B',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    } : {
                      borderRadius: '10px',
                      border: '1px solid #A2A2A2',
                      background: 'transparent',
                      color: '#A2A2A2',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'ar' ? 'الأنشطة' : 'Activities'}
                  </button>
                </div>

                {/* Causes/Activities Tags */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(() => {
                    const items = activeTab === 'causes'
                      ? (lang === 'ar' ? selectedStation.causesAr : selectedStation.causesEn)
                      : (lang === 'ar' ? selectedStation.activitiesAr : selectedStation.activitiesEn);
                    return items.map((item, idx) => (
                      <div key={idx} style={{
                        border: '1px solid rgba(50, 154, 163, 0.10)',
                        borderRadius: '10px',
                        background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                        boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                        backdropFilter: 'blur(4.4px)',
                        WebkitBackdropFilter: 'blur(4.4px)',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#334155'
                      }}>
                        <img src={item.icon} alt={item.text} style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                        {item.text}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="dash-card">
              <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{t('landing.dash.measures')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {getProtectiveMeasures(selectedStation.aqi, KeepWindowsIcon, WearMaskIcon, StayHydratedIcon, IndoorPlantsIcon, lang).map((measure, idx) => (
                  <div key={idx} style={{
                    border: '1px solid rgba(50, 154, 163, 0.10)',
                    borderRadius: '10px',
                    background: 'radial-gradient(527.21% 102.13% at 0% 61.76%, rgba(50, 154, 163, 0.02) 0%, rgba(50, 154, 163, 0.07) 100%)',
                    boxShadow: 'inset 3px 3px 4px 0px rgba(255, 255, 255, 0.17)',
                    backdropFilter: 'blur(4.4px)',
                    WebkitBackdropFilter: 'blur(4.4px)',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#334155'
                  }}>
                    <img src={measure.icon} alt={measure.text} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    {measure.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card trend-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {lang === 'ar' ? `اتجاه المؤشر كل ساعة - ${selectedStation.nameAr}` : `Hourly AQI Trend - ${selectedStation.nameEn}`}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}>
                  AQI
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="chart-wrapper">
                <HighchartsReactComponent highcharts={Highcharts} options={trendOptions} />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'space-between',
                gap: '4px',
                marginTop: '10px',
                paddingLeft: '35px',
                paddingRight: '10px',
                width: '100%',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#83CB17', flexShrink: 0 }}></span> {t('landing.stats.good', 'Good')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FCD956', flexShrink: 0 }}></span> {t('landing.dash.moderate', 'Moderate')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FE8023', flexShrink: 0 }}></span> {lang === 'ar' ? 'غير صحي للمجموعات الحساسة' : 'Unhealthy for Sensitive Groups'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }}></span> {t('landing.dash.unhealthy', 'Unhealthy')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8b5cf6', flexShrink: 0 }}></span> {t('landing.dash.very_unhealthy', 'Very Unhealthy')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7f1d1d', flexShrink: 0 }}></span> {lang === 'ar' ? 'خطير' : 'Hazardous'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerSectionRef} className="landing-footer" style={{ backgroundImage: `url(${FooterBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="f-left">
          <img src="/assets/AQMS/logo-dark.png" alt="Logo" className="f-logo" />
        </div>
        <div className="f-center">
          <span>{t('landing.footer.copyright')}</span>
          <a href="#">{t('landing.footer.terms')}</a>
          <a href="#">{t('landing.footer.privacy')}</a>
          <a href="#">{t('landing.footer.support')}</a>
        </div>
        <div className="f-right">
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
