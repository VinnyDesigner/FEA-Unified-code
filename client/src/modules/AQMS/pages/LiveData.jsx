import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, ZoomIn, ZoomOut, Search, Hand, Home, Printer, Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useLanguage } from '../contexts/LanguageContext';
import { getAqmsStationsLive, getAqmsAirQualityHistory, getAqmsWeatherHistory, getAqmsAirQualityIndexHistory, getAqmsStations, generateReport, downloadReportFile } from '../../../lib/queries';
import { usePolling } from '../../../lib/polling';

// Robust unwrapper for legacy CommonJS highcharts-react-official wrapper in React 19/Vite ESM
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

// Date-range presets for the dashboard filter. The history endpoints cap ranges at
// 90 days, so "Last Year" is clamped to 90 days to avoid a 400 (empty graph).
const DAY_MS = 86400000;
const RANGE_DAYS = { 'Last Day': 1, 'Last Week': 7, 'Last Month': 30, 'Last Year': 90 };
function resolveDateRange(selectedDate, startDate, endDate) {
  const now = new Date();
  if (selectedDate === 'Live Data') {
    return { startTime: new Date(now.getTime() - 3600000).toISOString(), endTime: now.toISOString() };
  }
  if (RANGE_DAYS[selectedDate]) {
    return { startTime: new Date(now.getTime() - RANGE_DAYS[selectedDate] * DAY_MS).toISOString(), endTime: now.toISOString() };
  }
  // Customize / fallback: use the explicit start/end date inputs.
  return {
    startTime: new Date(startDate + 'T00:00:00Z').toISOString(),
    endTime: new Date(endDate + 'T23:59:59Z').toISOString(),
  };
}
// Thin x-axis category labels to ~10 max so dense series don't blur the axis.
const axisLabelStep = (n) => Math.max(1, Math.ceil((n || 0) / 10));

const createCustomIcon = (value, color, isSelected = false) => {
  const isYellow = (color === '#fcd34d');
  const textColor = isYellow ? '#854d0e' : 'white';
  const selectedStyle = isSelected 
    ? 'border: 3px solid #00f3ff; box-shadow: 0 0 15px #00f3ff, 0 0 5px rgba(0,0,0,0.4); transform: scale(1.2); z-index: 999;' 
    : 'border: 1.5px solid rgba(255,255,255,0.85);';
  return L.divIcon({
    className: 'custom-map-marker-icon',
    html: `<div class="custom-marker-pill" style="background:${color}; color:${textColor}; ${selectedStyle}">${value}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

/* ── Cloud-shaped pollutant icons ─────────────────────────────── */
const CloudPath = "M19.5 12.5c0-3.59-2.91-6.5-6.5-6.5-2.96 0-5.45 1.97-6.26 4.66C4.05 11.23 2 13.62 2 16.5 2 19.54 4.46 22 7.5 22h12c3.04 0 5.5-2.46 5.5-5.5 0-2.88-2.05-5.27-4.74-5.84-.18 0-.35-.16-.5-.16z";

const PM25Icon = () => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="10" cy="15" r="1.8" fill="white" />
    <circle cx="17" cy="15" r="1.8" fill="white" />
  </svg>
);

const PM10Icon = () => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="8.5" cy="15" r="1.4" fill="white" />
    <circle cx="13.5" cy="15" r="1.4" fill="white" />
    <circle cx="18.5" cy="15" r="1.4" fill="white" />
  </svg>
);

const ChemicalIcon = ({ label }) => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="13.5" cy="15" r="5.5" fill="white" stroke="#009FAC" strokeWidth="1" />
    <text x="13.5" y="15.5" fill="#009FAC" fontSize="5.5" fontFamily="'Roboto', sans-serif"
      fontWeight="800" textAnchor="middle" dominantBaseline="middle">
      {label}
    </text>
  </svg>
);

/* ── Pollutant data ──────────────────────────────────────────── */
const pollutants = [
  { icon: <img src="/assets/AQMS/pollutants/PM2.5.png" alt="PM2.5" className="p-icon" />, name: 'PM2.5', val: '9', unit: '\u00B5g/m\u00B3', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/PM10.png" alt="PM10" className="p-icon" />, name: 'PM10', val: '18', unit: '\u00B5g/m\u00B3', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/CO.png" alt="CO" className="p-icon" />, name: 'CO', val: '0.3', unit: 'ppb', statusColor: '#84cc16' },
  { icon: <img src="/assets/AQMS/pollutants/o3.png" alt="O3" className="p-icon" />, name: 'O\u2083', val: '38', unit: 'ppb', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/No2.png" alt="NO2" className="p-icon" />, name: 'NO\u2082', val: '12', unit: 'ppb', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/So2.png" alt="SO2" className="p-icon" />, name: 'SO\u2082', val: '03', unit: 'ppb', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/Co2.png" alt="CO2" className="p-icon" />, name: 'CO\u2082', val: '04', unit: 'ppm', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/Ch4.png" alt="CH4" className="p-icon" />, name: 'CH\u2084', val: '0.1', unit: 'ppb', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/H2o.png" alt="H2S" className="p-icon" />, name: 'H\u2082S', val: '0.02', unit: 'ppm', statusColor: '#fcd34d' },
];


// AQMS history endpoints return long-format rows (one per parameter). These maps
// pivot parameterName -> the per-row field names the table and charts consume.
const AQ_HISTORY_FIELD = {
  'PM2.5': 'pm25', 'PM10': 'pm10', 'CO': 'co', 'O3': 'o3', 'NO2': 'no2',
  'SO2': 'so2', 'CO2': 'co2', 'CH4': 'ch4', 'H2S': 'h2s', 'NMHC': 'nmhc',
};
const WX_HISTORY_FIELD = {
  'Temperature': 'temperature', 'Pressure': 'pressure', 'Solar Radiation': 'solar',
  'Humidity': 'humidity', 'Wind Speed': 'windSpeed', 'Wind Direction': 'windDirection',
};

// Report wiring (mirrors DataCapture.jsx). Parameter name -> AQMS ParameterID and
// chart-download menu label -> backend ReportFormat + file extension.
const PARAM_ID_BY_NAME = { 'PM2.5': 1, 'PM10': 2, 'CO': 3, 'O3': 4, 'NO2': 5, 'SO2': 6, 'H2S': 9 };
const FORMAT_BY_LABEL = { Export: 'XLSX', PDF: 'PDF', Word: 'DOCX' };
const EXT_BY_FORMAT = { XLSX: 'xlsx', PDF: 'pdf', DOCX: 'docx' };

// Map a station name/code to its "About Station" illustration, falling back to a
// default asset when no station-specific image is bundled.
const stationImageSrc = (stationCode, stationName) => {
  const slug = String(stationCode || stationName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `/assets/AQMS/station-${slug}.jpg` : '/assets/AQMS/station-city-centre.jpg';
};

const MapController = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);
  return null;
};

const LiveData = () => {
  const { lang, t } = useLanguage();
  const isRtl = lang === 'ar';
  const navigate = useNavigate();

  const translateDateTime = (timeStr) => {
    if (!isRtl || !timeStr) return timeStr;
    return timeStr
      .replace('Jan', 'يناير')
      .replace('Feb', 'فبراير')
      .replace('Mar', 'مارس')
      .replace('Apr', 'أبريل')
      .replace('May', 'مايو')
      .replace('Jun', 'يونيو')
      .replace('Jul', 'يوليو')
      .replace('Aug', 'أغسطس')
      .replace('Sep', 'سبتمبر')
      .replace('Oct', 'أكتوبر')
      .replace('Nov', 'نوفمبر')
      .replace('Dec', 'ديسمبر');
  };

  const translateWindSpeed = (speedStr) => {
    if (!isRtl || !speedStr) return speedStr;
    return speedStr.replace('Km/h', 'كم/ساعة');
  };

  const translateWindDir = (dirStr) => {
    if (!isRtl || !dirStr) return dirStr;
    return dirStr
      .replace(' W', ' غرب')
      .replace(' E', ' شرق')
      .replace(' N', ' شمال')
      .replace(' S', ' جنوب')
      .replace(' NW', ' شمال غرب')
      .replace(' NE', ' شمال شرق')
      .replace(' SW', ' جنوب غرب')
      .replace(' SE', ' جنوب شرق');
  };

  const [stationsData, setStationsData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const data = await getAqmsStationsLive();
      setStationsData(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchLive, 60000);

  // Full Screen Chart Modal States & Zoom Reference
  const [modalChartType, setModalChartType] = useState('Line');
  const [modalOptimizeData, setModalOptimizeData] = useState(true);
  const [modalMaxPoints, setModalMaxPoints] = useState(2000);
  const [modalShowMarkers, setModalShowMarkers] = useState(true);
  const [modalShowDashes, setModalShowDashes] = useState(false);
  const [modalShowTooltip, setModalShowTooltip] = useState(true);
  const [modalShowAnimation, setModalShowAnimation] = useState(true);
  const [activeTool, setActiveTool] = useState('zoom'); // 'zoom', 'pan', 'select'
  const [isMobileResponsive, setIsMobileResponsive] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileResponsive(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.15;
      chart.xAxis[0].setExtremes(min + step, max - step);
    }
  };

  const handleZoomOut = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max, dataMin, dataMax } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.2;
      const newMin = Math.max(dataMin, min - step);
      const newMax = Math.min(dataMax, max + step);
      chart.xAxis[0].setExtremes(newMin, newMax);
    }
  };

  const handleReset = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.xAxis[0].setExtremes(null, null);
    }
  };

  const handlePan = (direction) => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max, dataMin, dataMax } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.25;
      if (direction === 'left') {
        const newMin = Math.max(dataMin, min - step);
        const newMax = newMin + range;
        chart.xAxis[0].setExtremes(newMin, newMax);
      } else {
        const newMax = Math.min(dataMax, max + step);
        const newMin = newMax - range;
        chart.xAxis[0].setExtremes(newMin, newMax);
      }
    }
  };

  const handlePrint = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.print();
    }
  };

  const getToolbarTitle = (key, fallback) => {
    const map = {
      'Zoom In': isRtl ? 'تكبير' : 'Zoom In',
      'Zoom Out': isRtl ? 'تصغير' : 'Zoom Out',
      'Select Zoom': isRtl ? 'تحديد التكبير' : 'Select Zoom',
      'Pan Mode': isRtl ? 'وضع التحريك' : 'Pan Mode',
      'Pan Left': isRtl ? 'تحريك لليسار' : 'Pan Left',
      'Pan Right': isRtl ? 'تحريك لليمين' : 'Pan Right',
      'Reset/Home': isRtl ? 'إعادة تعيين' : 'Reset/Home',
      'Print': isRtl ? 'طباعة' : 'Print',
      'Menu': isRtl ? 'القائمة' : 'Menu'
    };
    return map[key] || fallback;
  };

  const getModalChartOptions = () => {
    const baseOptions = expandedChart === 'aqi' ? aqiChartOptions : concChartOptions;
    
    let seriesType = 'spline';
    if (modalChartType === 'Bars') {
      seriesType = 'column';
    } else if (modalChartType === 'Dots') {
      seriesType = 'scatter';
    }

    const seriesConfig = {
      lineWidth: modalChartType === 'Dots' ? 0 : 3,
      step: modalChartType === 'Step Line' ? 'center' : undefined,
      dashStyle: modalShowDashes ? 'Dash' : 'Solid',
      animation: modalShowAnimation,
      marker: {
        enabled: modalShowMarkers || modalChartType === 'Dots',
        radius: modalChartType === 'Dots' ? 5 : 4
      }
    };

    const options = {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: seriesType,
        height: isMobileResponsive ? 300 : 450,
        spacing: [15, 15, 15, 15]
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        ...baseOptions.plotOptions,
        spline: {
          ...(baseOptions.plotOptions?.spline || {}),
          ...seriesConfig
        },
        line: {
          ...seriesConfig
        },
        column: {
          animation: modalShowAnimation
        },
        scatter: {
          ...seriesConfig,
          marker: {
            enabled: true,
            radius: 6
          }
        }
      },
      tooltip: {
        ...baseOptions.tooltip,
        enabled: modalShowTooltip
      }
    };

    if (modalOptimizeData) {
      options.series = options.series.map(s => {
        const slicedData = s.data ? s.data.slice(0, modalMaxPoints) : [];
        return {
          ...s,
          data: slicedData
        };
      });
    }

    return options;
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [isAqiFlipped, setIsAqiFlipped] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const toggleMapFullscreen = () => {
    const mapCardEl = document.querySelector('.map-card');
    if (!mapCardEl) return;
    
    if (!document.fullscreenElement) {
      mapCardEl.requestFullscreen().then(() => {
        setTimeout(() => {
          mapInstance?.invalidateSize();
        }, 150);
      }).catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setTimeout(() => {
          mapInstance?.invalidateSize();
        }, 150);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 150);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mapInstance]);

  const [selectedStations, setSelectedStations] = useState('City Centre');
  const [selectedDate, setSelectedDate] = useState('Live Data');
  const [selectedView, setSelectedView] = useState('Graph View');

  // Custom date range states for LiveData page (default to the last 7 days so the
  // "Customize" range lands on real data instead of a stale hard-coded window).
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentPage, setCurrentPage] = useState(1);
  const TABULAR_PAGE_SIZE = 25;
  const [activeAccordionIdx, setActiveAccordionIdx] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [tabularRows, setTabularRows] = useState([]);

  // Full station metadata (stationCode + assignedParameters) keyed by station name,
  // used for the About-Station panel and report generation.
  const [stationMetaByName, setStationMetaByName] = useState({});
  useEffect(() => {
    let active = true;
    getAqmsStations()
      .then((list) => {
        if (!active) return;
        const map = {};
        (list || []).forEach((s) => { if (s.name) map[s.name] = s; });
        setStationMetaByName(map);
      })
      .catch(() => { /* About-Station panel falls back to static text */ });
    return () => { active = false; };
  }, []);

  // Real AQI history for the "Last 24hrs Air Quality Index" chart (ascending order).
  const [aqiHistory, setAqiHistory] = useState([]); // [{observationTime, aqi}]

  // Live-updating header date/time (replaces previously hard-coded value)
  const [currentDateTime, setCurrentDateTime] = useState('');
  useEffect(() => {
    const formatNow = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      return `${datePart} ${timePart}`;
    };
    setCurrentDateTime(formatNow());
    const interval = setInterval(() => setCurrentDateTime(formatNow()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stationNames = Object.keys(stationsData);
  const currentStation = stationsData[selectedStations] || stationsData[stationNames[0]] || null;

  useEffect(() => {
    if (!currentStation) return;
    const { startTime, endTime } = resolveDateRange(selectedDate, startDate, endDate);
    const sid = currentStation.id;
    Promise.all([
      getAqmsAirQualityHistory({ stationId: sid, startTime, endTime, limit: 1000 }),
      getAqmsWeatherHistory({ stationId: sid, startTime, endTime, limit: 1000 }),
    ]).then(([aqRows, wxRows]) => {
      // Both responses are long-format (one row per parameter). Pivot into a
      // single wide record per timestamp, keyed by observationTime.
      const byTime = {};
      const ensure = (ts) => (byTime[ts] ||= { observationTime: ts });
      (aqRows || []).forEach((r) => {
        const f = AQ_HISTORY_FIELD[r.parameterName];
        if (f) ensure(r.observationTime)[f] = r.value;
      });
      (wxRows || []).forEach((r) => {
        const f = WX_HISTORY_FIELD[r.parameterName];
        if (f) ensure(r.observationTime)[f] = r.value;
      });

      const conc = (v) => (v != null && v !== '' ? String(Math.round(Number(v) * 100) / 100) : '-');
      const met1 = (v) => (v != null && v !== '' ? Math.round(Number(v) * 10) / 10 : null);

      const rows = Object.values(byTime)
        .sort((a, b) => new Date(b.observationTime) - new Date(a.observationTime))
        .map((rec) => {
          const ts = new Date(rec.observationTime);
          const timeStr = ts.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          const temp = met1(rec.temperature);
          const hum = met1(rec.humidity);
          const windSpd = met1(rec.windSpeed);
          const windDir = rec.windDirection != null ? Math.round(Number(rec.windDirection)) : null;
          return {
            time: timeStr,
            station: currentStation.name || selectedStations,
            co: conc(rec.co),
            co2: conc(rec.co2),
            o3: conc(rec.o3),
            no2: conc(rec.no2),
            so2: conc(rec.so2),
            pm25: conc(rec.pm25),
            pm10: conc(rec.pm10),
            ch4: conc(rec.ch4),
            h2s: conc(rec.h2s),
            nmhc: conc(rec.nmhc),
            temp: temp != null ? `${temp}\u00B0C` : '-',
            hum: hum != null ? `${hum}%` : '-',
            windSpd: windSpd != null ? `${windSpd} Km/h` : '-',
            windDir: windDir != null ? `${windDir}\u00B0` : '-',
          };
        });
      setTabularRows(rows);
    }).catch(() => setTabularRows([]));
  }, [selectedStations, selectedDate, startDate, endDate, currentStation]);

  // Fetch real AQI time-series for the AQI chart (separate endpoint from the
  // pollutant/weather history above). Sorted ascending for left-to-right plotting.
  useEffect(() => {
    if (!currentStation) return;
    const { startTime, endTime } = resolveDateRange(selectedDate, startDate, endDate);

    getAqmsAirQualityIndexHistory({
      stationId: currentStation.id,
      startTime,
      endTime,
      limit: 1000,
    })
      .then((rows) => {
        const sorted = (rows || [])
          .filter((r) => r.aqi != null && r.observationTime)
          .sort((a, b) => new Date(a.observationTime) - new Date(b.observationTime));
        setAqiHistory(sorted);
      })
      .catch(() => setAqiHistory([]));
  }, [selectedStations, selectedDate, startDate, endDate, currentStation]);

  const pollutants = currentStation ? [
    { icon: <img src="/assets/AQMS/pollutants/PM2.5.png" alt="PM2.5" className="p-icon" />, name: 'PM2.5', val: currentStation.pm25 != null ? String(currentStation.pm25) : '-', unit: '\u00B5g/m\u00B3', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/PM10.png" alt="PM10" className="p-icon" />, name: 'PM10', val: currentStation.pm10 != null ? String(currentStation.pm10) : '-', unit: '\u00B5g/m\u00B3', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/CO.png" alt="CO" className="p-icon" />, name: 'CO', val: currentStation.co != null ? String(currentStation.co) : '-', unit: 'ppb', statusColor: '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/o3.png" alt="O3" className="p-icon" />, name: 'O\u2083', val: currentStation.o3 != null ? String(currentStation.o3) : '-', unit: 'ppb', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/No2.png" alt="NO2" className="p-icon" />, name: 'NO\u2082', val: currentStation.no2 != null ? String(currentStation.no2) : '-', unit: 'ppb', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/So2.png" alt="SO2" className="p-icon" />, name: 'SO\u2082', val: currentStation.so2 != null ? String(currentStation.so2) : '-', unit: 'ppb', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/Co2.png" alt="CO2" className="p-icon" />, name: 'CO\u2082', val: currentStation.co2 != null ? String(currentStation.co2) : '-', unit: 'ppm', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/Ch4.png" alt="CH4" className="p-icon" />, name: 'CH\u2084', val: currentStation.ch4 != null ? String(currentStation.ch4) : '-', unit: 'ppb', statusColor: currentStation.aqiColor || '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/H2o.png" alt="H2S" className="p-icon" />, name: 'H\u2082S', val: currentStation.h2s != null ? String(currentStation.h2s) : '-', unit: 'ppm', statusColor: currentStation.aqiColor || '#84cc16' },
  ] : [];

  const getSortedTabularData = () => {
    const sorted = [...tabularRows];
    sorted.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  };

  // Client-side pagination over the (sorted) tabular rows.
  const sortedTabularData = getSortedTabularData();
  const tabularTotalPages = Math.max(1, Math.ceil(sortedTabularData.length / TABULAR_PAGE_SIZE));
  const tabularSafePage = Math.min(currentPage, tabularTotalPages);
  const tabularPageRows = sortedTabularData.slice(
    (tabularSafePage - 1) * TABULAR_PAGE_SIZE,
    tabularSafePage * TABULAR_PAGE_SIZE
  );
  const tabularPageWindow = Array.from({ length: tabularTotalPages }, (_, i) => i + 1)
    .filter((n) => Math.abs(n - tabularSafePage) <= 2)
    .slice(0, 5);

  const toggleDateSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    if (mapInstance && selectedStations) {
      const station = stationsData[selectedStations];
      if (station) {
        mapInstance.setView([station.lat, station.lng], 12.5, {
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [selectedStations, mapInstance]);

  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);
  const [aqiDownloadOpen, setAqiDownloadOpen] = useState(false);
  const [concDownloadOpen, setConcDownloadOpen] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Generate a Basic Data Export report on the backend for the current station +
  // selected parameters/date range, then download the chosen format as a blob.
  const handleDownload = async (chartName, formatLabel) => {
    setAqiDownloadOpen(false);
    setConcDownloadOpen(false);
    const fmt = FORMAT_BY_LABEL[formatLabel] || formatLabel;

    if (!currentStation?.id) {
      setToastMessage('No station selected.');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const stationIds = [currentStation.id];
    const parameterIds = selectedParams.map((n) => PARAM_ID_BY_NAME[n]).filter(Boolean);
    if (parameterIds.length === 0) {
      setToastMessage('Select at least one parameter.');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const now = new Date();
    const start = selectedDate === 'Live Data'
      ? new Date(now - 86400000)
      : new Date(startDate + 'T00:00:00Z');
    const end = selectedDate === 'Live Data' ? now : new Date(endDate + 'T23:59:59Z');

    setToastMessage(`Exporting ${chartName} as ${formatLabel}...`);
    try {
      const report = await generateReport({
        module: 'AQMS',
        reportType: 'basic_data_export',
        stationIds,
        parameterIds,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        formats: [fmt],
      });
      const blob = await downloadReportFile(report.id, fmt);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chartName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${report.id}.${EXT_BY_FORMAT[fmt] || 'dat'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToastMessage(`${chartName} successfully saved as ${formatLabel}!`);
    } catch (err) {
      setToastMessage(err?.response?.data?.error?.message || `Failed to export ${chartName}.`);
    } finally {
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  /* ── Highcharts Settings: Last 24hrs Air Quality Index ── */
  const aqiChartOptions = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 260,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [10, 5, 5, 5],
    },
    title: { text: null },
    xAxis: {
      categories: aqiHistory.map((r) =>
        new Date(r.observationTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
      ),
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      tickInterval: axisLabelStep(aqiHistory.length),
      labels: {
        step: axisLabelStep(aqiHistory.length),
        rotation: aqiHistory.length > 12 ? -30 : 0,
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      max: 300,
      tickInterval: 50,
      title: { text: null },
      gridLineColor: 'rgba(0,0,0,0.05)',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      useHTML: true,
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderRadius: 10,
      borderColor: 'rgba(255,255,255,1)',
      shadow: {
        color: 'rgba(0,0,0,0.08)',
        offsetX: 0,
        offsetY: 4,
        opacity: 0.8,
        width: 12
      },
      padding: 10,
      formatter: function () {
        return `
          <div style="font-family:'Roboto',sans-serif; text-align:center; padding:2px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:4px;">
              <span style="width:10px; height:10px; background:${currentStation ? currentStation.aqiColor : '#84cc16'}; border-radius:50%; display:inline-block;"></span>
              <strong style="color:#111; font-size:0.875rem;">${this.y} AQI</strong>
            </div>
          </div>
        `;
      }
    },
    plotOptions: {
      spline: {
        lineWidth: 3,
        color: currentStation ? currentStation.aqiColor : '#84cc16',
        marker: {
          enabled: true,
          radius: 4,
          fillColor: currentStation ? currentStation.aqiColor : '#84cc16',
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        states: { hover: { lineWidth: 4 } }
      }
    },
    series: [{
      name: 'AQI Index',
      data: aqiHistory.map((r) => {
        const v = parseFloat(r.aqi);
        return isNaN(v) ? null : v;
      })
    }]
  };

  /* ── Highcharts Settings: Last 24hrs Concentration ── */
  // Pollutant readings (air-quality history) and weather history arrive on
  // different timestamps; weather-only rows have no pollutant values and would
  // otherwise pad the x-axis with empty slots. Restrict this chart to rows that
  // actually carry a pollutant reading so the series fill the axis.
  const concRows = tabularRows.filter((r) =>
    r.so2 !== '-' || r.no2 !== '-' || r.co !== '-' || r.pm10 !== '-' || r.pm25 !== '-'
  );
  const concChartOptions = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 260,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [10, 5, 5, 5],
    },
    title: { text: null },
    xAxis: {
      categories: concRows.map((r) => r.time),
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      tickInterval: axisLabelStep(concRows.length),
      labels: {
        step: axisLabelStep(concRows.length),
        rotation: -35,
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      title: {
        text: 'CO(mg/m³)   ug/m³',
        style: { color: '#6b7280', fontSize: '0.72rem', fontWeight: '600' }
      },
      gridLineColor: 'rgba(0,0,0,0.05)',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 8,
      borderColor: 'rgba(0,0,0,0.05)',
      shadow: true,
      style: { fontSize: '0.8rem' }
    },
    plotOptions: {
      spline: {
        lineWidth: 2,
        marker: { enabled: false },
        states: { hover: { lineWidth: 2.5 } }
      }
    },
    series: [
      { name: 'SO2',   data: concRows.map((r) => { const v = parseFloat(r.so2); return isNaN(v) ? null : v; }), color: '#3b82f6' },
      { name: 'NO2',   data: concRows.map((r) => { const v = parseFloat(r.no2); return isNaN(v) ? null : v; }), color: '#0ea5e9' },
      { name: 'CO',    data: concRows.map((r) => { const v = parseFloat(r.co); return isNaN(v) ? null : v; }), color: '#0f766e' },
      { name: 'PM10',  data: concRows.map((r) => { const v = parseFloat(r.pm10); return isNaN(v) ? null : v; }), color: '#0d9488' },
      { name: 'PM2.5', data: concRows.map((r) => { const v = parseFloat(r.pm25); return isNaN(v) ? null : v; }), color: '#06b6d4' }
    ].filter(s => selectedParams.includes(s.name))
  };

  const SidebarToggle = ({ label, checked, onChange, subtext }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{label}</span>
        {subtext && <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{subtext}</span>}
      </div>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: '38px',
          height: '20px',
          background: checked ? '#009FAC' : '#e2e8f0',
          borderRadius: '999px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0
        }}
      >
        <div 
          style={{
            width: '16px',
            height: '16px',
            background: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#009fac', fontSize: '1rem', fontWeight: '600' }}>
        Loading stations...
      </div>
    );
  }

  if (stationNames.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#6b7280', fontSize: '1rem' }}>
        No station data available.
      </div>
    );
  }

  return (
    <div className="aqms-live-data-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          {selectedView === 'Tabular View' ? (
            <>
              <h1 className="tabular-title">Tabular Form</h1>
              <p className="tabular-date">{translateDateTime(currentDateTime)}</p>
            </>
          ) : (
            <>
              <h1>{t('live.title')}</h1>
              <p className="header-date">{translateDateTime(currentDateTime)}</p>
            </>
          )}
        </div>
        
        <div className="header-controls-group">
          {/* Pill Switcher Navigation */}
          <div className="pill-tabs-group">
            <button className="pill-tab active" onClick={() => navigate('/AQMS/live-data')}>
              {t('nav.live_data', 'Live Data')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/analytics')}>
              {t('nav.analytics', 'Analytics')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/data-capture')}>
              {t('nav.reports', 'Reports')}
            </button>
          </div>

          {/* View Toggle Icons (Graph / Tabular) */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${selectedView === 'Graph View' ? 'active' : ''}`}
              onClick={() => setSelectedView('Graph View')}
              title="Graph View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${selectedView === 'Tabular View' ? 'active' : ''}`}
              onClick={() => setSelectedView('Tabular View')}
              title="Tabular View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="9" x2="9" y2="21"/>
                <line x1="15" y1="9" x2="15" y2="21"/>
              </svg>
            </button>
          </div>

          {/* Floating filter toggle button & popover wrapper */}
          <div className="filter-popover-anchor-wrapper">
            <button 
              className={`filter-toggle-circle-btn ${filtersOpen ? 'active' : ''}`} 
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setActiveSubMenu(null);
              }}
              title={t('filter.title', 'Filter')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>

            {filtersOpen && (
              <div className="filter-dropdown-popover">
                <div className="popover-header">{t('filter.title', 'Filter')}</div>
                
                {/* Station Dropdown (Single-select with radio buttons) */}
                <div 
                  className="popover-item site-location-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'location' ? null : 'location');
                  }}
                >
                  <span className="popover-item-label teal-label">
                    {t('filter.station', 'Station')}: <strong style={{ color: '#009fac', marginLeft: '4px' }}>{t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}</strong>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="3" className={`popover-arrow-svg ${activeSubMenu === 'location' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'location' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {stationNames.map(option => {
                        let label = t(`live.${option.toLowerCase().replace(' ', '_')}`, option);
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${selectedStations === option ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                              setSelectedStations(option);
                              setActiveSubMenu(null);
                            }}
                          >
                            <input 
                              type="radio" 
                              checked={selectedStations === option}
                              onChange={() => {}}
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Date Range Dropdown */}
                <div 
                  className="popover-item date-today-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'date' ? null : 'date');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {selectedDate === 'Live Data' ? t('live.live_data', 'Live Data') :
                     selectedDate === 'Last Day' ? t('live.last_day', 'Last Day') :
                     selectedDate === 'Last Week' ? t('live.last_week', 'Last Week') :
                     selectedDate === 'Last Month' ? t('live.last_month', 'Last Month') :
                     selectedDate === 'Last Year' ? t('live.last_year', 'Last Year') :
                     t('live.customize', 'Customize')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'date' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'date' && (
                    <div className="popover-sub-menu">
                      {["Live Data", "Last Day", "Last Week", "Last Month", "Last Year", "Customize"].map(option => {
                        const labels = {
                          'Live Data': t('live.live_data', 'Live Data'),
                          'Last Day': t('live.last_day', 'Last Day'),
                          'Last Week': t('live.last_week', 'Last Week'),
                          'Last Month': t('live.last_month', 'Last Month'),
                          'Last Year': t('live.last_year', 'Last Year'),
                          'Customize': t('live.customize', 'Customize'),
                        };
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${selectedDate === option ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(option);
                              if (option !== 'Customize') {
                                setActiveSubMenu(null);
                                setFiltersOpen(false);
                              }
                            }}
                          >
                            {labels[option]}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* If selectedDate is 'Customize', render start/end date inputs beautifully inside the popover! */}
                {selectedDate === 'Customize' && (
                  <div className="custom-date-inputs-container" onClick={(e) => e.stopPropagation()}>
                    <div className="date-input-field">
                      <label>{t('filter.start_date', 'Start Date')}</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="custom-date-picker"
                      />
                    </div>
                    <div className="date-input-field">
                      <label>{t('filter.end_date', 'End Date')}</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="custom-date-picker"
                      />
                    </div>
                  </div>
                )}

                {/* Parameter Dropdown (Multi-select) */}
                <div 
                  className="popover-item parameter-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'parameter' ? null : 'parameter');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {`${t('analytics.parameters', 'Parameters')} (${selectedParams.length})`}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'parameter' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'parameter' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {['SO2', 'NO2', 'CO', 'PM10', 'PM2.5'].map(option => {
                        const isChecked = selectedParams.includes(option);
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${isChecked ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedParams(selectedParams.filter(p => p !== option));
                              } else {
                                setSelectedParams([...selectedParams, option]);
                              }
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <div className="aqms-live-data-scroll-body">
        {selectedView === 'Tabular View' ? (
        <div className="tabular-form-container">
          <div className="tabular-card">
            {/* Mobile View: Responsive Accordion Cards */}
            <div className="tabular-mobile-accordion-list">
              {tabularPageRows.map((row, idx) => {
                const isExpanded = activeAccordionIdx === idx;
                return (
                  <div 
                    key={idx} 
                    className={`tabular-accordion-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setActiveAccordionIdx(isExpanded ? null : idx)}
                  >
                    {/* Collapsed Header */}
                    <div className="accordion-card-header">
                      <div className="header-main-info">
                        <div className="station-row">
                          <span className="station-name">{row.station}</span>
                          <span className="record-time">{row.time}</span>
                        </div>
                        <div className="aqi-row">
                          <span className="aqi-status-badge" style={{ backgroundColor: currentStation.aqiColor + '20', color: currentStation.aqiColor, border: `1px solid ${currentStation.aqiColor}40` }}>
                            {currentStation.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="header-aqi-indicator">
                        <div className="aqi-stat-col">
                          <span className="aqi-label">AQI</span>
                          <span className="aqi-value" style={{ color: currentStation.aqiColor }}>{currentStation.aqi}</span>
                        </div>
                        <svg className={`accordion-chevron ${isExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Expanded Content Details */}
                    <div className={`accordion-card-details ${isExpanded ? 'open' : ''}`}>
                      <div className="details-grid">
                        <div className="detail-item"><span className="detail-label">CO</span><span className="detail-value">{row.co} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">CO₂</span><span className="detail-value">{row.co2} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">O₃</span><span className="detail-value">{row.o3} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">NO₂</span><span className="detail-value">{row.no2} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">SO₂</span><span className="detail-value">{row.so2} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">PM2.5</span><span className="detail-value">{row.pm25} µg/m³</span></div>
                        <div className="detail-item"><span className="detail-label">PM10</span><span className="detail-value">{row.pm10} µg/m³</span></div>
                        <div className="detail-item"><span className="detail-label">CH₄</span><span className="detail-value">{row.ch4} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">H₂S</span><span className="detail-value">{row.h2s} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">NMHC</span><span className="detail-value">{row.nmhc} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.temperature', 'Temperature')}</span><span className="detail-value">{row.temp}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.humidity', 'Humidity')}</span><span className="detail-value">{row.hum}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.wind_speed', 'Wind Speed')}</span><span className="detail-value">{translateWindSpeed(row.windSpd)}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.wind_direction', 'Wind Direction')}</span><span className="detail-value">{translateWindDir(row.windDir)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tabular-table-scroll-wrapper">
              <table className="tabular-table">
                <thead>
                  <tr>
                    <th onClick={toggleDateSort} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t('live.date_time', 'Date & Time')}
                        <span className="sort-icon" style={{ opacity: 1, display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle' }}>
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke={sortOrder === 'asc' ? '#009fac' : '#9ca3af'} strokeWidth="4" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke={sortOrder === 'desc' ? '#009fac' : '#9ca3af'} strokeWidth="4" strokeLinecap="round" style={{ marginTop: '1px' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </span>
                      </div>
                    </th>
                    <th>{t('datacapture.station_name', 'Station Name')}</th>
                    <th>{t('live.co', 'CO')}</th>
                    <th>{t('live.co2', 'CO2')}</th>
                    <th>{t('live.o3', 'O3')}</th>
                    <th>{t('live.no2', 'NO2')}</th>
                    <th>{t('live.so2', 'SO2')}</th>
                    <th>{t('live.pm2.5', 'PM2.5')}</th>
                    <th>{t('live.pm10', 'PM10')}</th>
                    <th>{t('live.ch4', 'CH4')}</th>
                    <th>{t('live.h2s', 'H2S')}</th>
                    <th>{t('live.nmhc', 'NMHC')}</th>
                    <th>{t('live.temperature', 'Temperature')}</th>
                    <th>{t('live.humidity', 'Humidity')}</th>
                    <th>{t('live.wind_speed', 'Wind Speed')}</th>
                    <th>{t('live.wind_direction', 'Wind Direction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tabularPageRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{translateDateTime(row.time)}</td>
                      <td>{t(`live.${row.station.toLowerCase().replace(' ', '_')}`, row.station)}</td>
                      <td>{row.co}</td>
                      <td>{row.co2}</td>
                      <td>{row.o3}</td>
                      <td>{row.no2}</td>
                      <td>{row.so2}</td>
                      <td>{row.pm25}</td>
                      <td>{row.pm10}</td>
                      <td>{row.ch4}</td>
                      <td>{row.h2s}</td>
                      <td>{row.nmhc}</td>
                      <td>{row.temp}</td>
                      <td>{row.hum}</td>
                      <td>{translateWindSpeed(row.windSpd)}</td>
                      <td>{translateWindDir(row.windDir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="tabular-pagination-container">
              <button
                className="tab-page-btn"
                disabled={tabularSafePage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                &lt;
              </button>
              {tabularPageWindow.map(pageNum => (
                <button
                  key={pageNum}
                  className={`tab-page-btn ${tabularSafePage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="tab-page-btn"
                disabled={tabularSafePage === tabularTotalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, tabularTotalPages))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── TOP GRID: AQI + Pollutants ──────────────────── */}
          <div className="top-grid">
        {/* AQI Card */}
        <div 
          className={`aqi-card${isAqiFlipped ? ' aqi-card-flipped-container' : ''}`} 
          style={{ 
            border: '1px solid #FFF', 
            boxShadow: '0 4px 34px 0 rgba(0, 0, 0, 0.21)' 
          }}
        >
          {isAqiFlipped ? (
            /* ── FLIPPED: About Station ─── */
            <div className="about-station-card">
              <div className="about-station-header">
                <span className="about-station-title">About Station</span>
                <button
                  className="aqi-flip-btn about-station-flip-btn"
                  title="Flip back"
                  onClick={() => setIsAqiFlipped(false)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>

              <div className="about-station-body">
                {/* Station image */}
                <div className="about-station-img-wrap">
                  <img
                    src={stationImageSrc(stationMetaByName[selectedStations]?.stationCode, selectedStations)}
                    alt="Station Illustration"
                    className="about-station-img"
                    onError={e => {
                      // Fall back to the default station illustration, then to a flat tint.
                      if (e.target.dataset.fallback) { e.target.style.background = '#c8e6ea'; e.target.removeAttribute('src'); return; }
                      e.target.dataset.fallback = '1';
                      e.target.src = '/assets/AQMS/station-city-centre.jpg';
                    }}
                  />
                  <div className="about-station-img-label">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3" fill="currentColor"/>
                    </svg>
                    {t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}
                  </div>
                </div>

                {/* Parameters */}
                <div className="about-station-params">
                  <div className="about-param-block">
                    <div className="about-param-title">AQ Parameters:</div>
                    <div className="about-param-text">
                      {stationMetaByName[selectedStations]?.assignedParameters?.length
                        ? stationMetaByName[selectedStations].assignedParameters.map((p) => p.name).join(', ')
                        : 'PM10, PM2.5, NO₂, SO₂, H₂S, Total Hydrocarbons (THC), CO, Benzene, Toluene, Ethylbenzene, and Xylene.'}
                    </div>
                  </div>
                  <div className="about-param-block">
                    <div className="about-param-title">Met Parameters:</div>
                    <div className="about-param-text">
                      Wind Speed, Wind Direction, Net Radiation, Relative Humidity, Temperature, Atmospheric Pressure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── DEFAULT: AQI View ─── */
            <>
              <div className="aqi-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pin-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3" fill="currentColor"/>
                </svg>
                {t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}
              </div>

              <button
                className="aqi-flip-btn"
                title="Flip card"
                onClick={() => setIsAqiFlipped(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>

              <div className="aqi-info">
                <div className="aqi-label">{t('live.aqi_index')}</div>
                <div className="aqi-value" style={{ color: currentStation.aqiColor }}>{currentStation.aqi}</div>
              </div>
              <div className="aqi-footer">
                <div 
                  className="status-badge" 
                  style={{ 
                    backgroundColor: currentStation.aqiColor, 
                    color: currentStation.aqiColor === '#fcd34d' ? '#854d0e' : '#fff'
                  }}
                >
                  {t(`live.${currentStation.category.toLowerCase().replace(/ /g, '_')}`, currentStation.category)}
                </div>
                <div className="live-indicator">
                  <div className="dot animate-pulse"></div> {t('live.live_aqi')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pollutants Card */}
        <div className="pollutants-wrapper">
          <h2 className="pollutants-title">{t('live.pollutant_metrics')}</h2>
          <div className="pollutants-list">
            {pollutants.map((p, i) => (
              <div className="pollutant-card" key={i}>
                <div className="pollutant-icon-container">
                  {p.icon}
                </div>
                <div className="p-name">{p.name}</div>
                <div className="p-val">{p.val}</div>
                <div className="p-unit">{p.unit}</div>
                <div className="p-status-bar" style={{ backgroundColor: p.statusColor }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: Wind + Env + Map ───────────────── */}
      <div className="bottom-grid">

        {/* Wind Card */}
        <div className="wind-card">
          {/* Windmills background */}
          <img className="turbines-bg" src="/assets/AQMS/icons/widnspeed.png" alt="Windmills" />

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, zIndex: 1, position: 'relative' }}>
            <div className="wind-section">
              <div className="wind-label">{t('live.wind_speed')}</div>
              <div className="wind-val">{currentStation.windSpeed ?? '-'} <span className="wind-unit">Km/h</span></div>
            </div>

            <div className="wind-divider" />

            <div className="wind-section">
              <div className="wind-label">{t('live.wind_direction')}</div>
              <div className="wind-val">{currentStation.windDirection != null ? `${currentStation.windDirection}\u00B0` : '-'} <span className="wind-unit">{currentStation.windDirText || ''}</span></div>
            </div>
          </div>

          <div className="wind-pill" style={{ zIndex: 1, position: 'relative' }}>{currentStation.windDirText || '-'}</div>
        </div>

        {/* Environmental Grid (2x2) */}
        <div className="env-grid">
          {/* Temperature */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.temperature')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.temp ?? '-'}<span className="env-card-unit">{'\u00B0C'}</span></div>
                <div className="env-card-desc">{t('live.ideal_temperature', 'Ideal Temperature')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Temperature.png" alt="Temperature" />
            </div>
          </div>

          {/* Atmospheric Pressure */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.atmospheric_pressure')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.pressure ?? '-'}<span className="env-card-unit">mbar</span></div>
                <div className="env-card-desc">{t('live.balanced_air_pressure', 'Balanced Air Pressure')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Atmospheric.png" alt="Atmospheric Pressure" />
            </div>
          </div>

          {/* Solar Radiation */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.solar_radiation')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.solar ?? '-'}<span className="env-card-unit">w/m{'\u00B2'}</span></div>
                <div className="env-card-desc">{t('live.high_solar_radiation', 'High Solar Radiation')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Solar.png" alt="Solar Radiation" />
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.relative_humidity')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.humidity ?? '-'}<span className="env-card-unit">%</span></div>
                <div className="env-card-desc">{t('live.humidity_normal', 'Humidity Normal')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Humidity.png" alt="Relative Humidity" />
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div className="map-card">
          <MapContainer
            center={[25.1288, 56.3265]}
            zoom={12}
            zoomControl={false}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />
            {Object.values(stationsData).map(station => {
              const isSelected = selectedStations === station.name;
              return (
                <Marker 
                  key={station.name}
                  position={[station.lat, station.lng]} 
                  icon={createCustomIcon(String(station.aqi), station.aqiColor, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStations(station.name);
                    }
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]} className={`custom-map-tooltip-styled ${isSelected ? 'tooltip-selected' : ''}`}>
                    {t(`live.${station.name.toLowerCase().replace(/ /g, '_')}`, station.name)}
                  </Tooltip>
                </Marker>
              );
            })}
            <MapController setMapInstance={setMapInstance} />
          </MapContainer>

          {/* Floating controls */}
          <div className="map-controls">
            <button 
              className="map-btn" 
              title="Expand" 
              onClick={toggleMapFullscreen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            <button 
              className="map-btn" 
              title="Zoom In" 
              style={{ fontSize: '1.25rem', fontWeight: '700', paddingBottom: '2px' }}
              onClick={() => mapInstance?.zoomIn()}
            >
              +
            </button>
            <button 
              className="map-btn" 
              title="Zoom Out" 
              style={{ fontSize: '1.25rem', fontWeight: '700', paddingBottom: '3px' }}
              onClick={() => mapInstance?.zoomOut()}
            >
              −
            </button>
          </div>

          <div className="map-floating-fujairah-title">
            {t('live.fujairah')}
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: 24hrs Air Quality Index & Concentrations Spline Charts ── */}
      <div className="charts-grid-row">
        {/* Panel 1: Last 24hrs Air Quality Index */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <h3 className="chart-panel-title">Last 24hrs Air Quality Index</h3>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-download-dropdown-btn"
                  onClick={() => setAqiDownloadOpen(!aqiDownloadOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight: '6px'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={aqiDownloadOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {aqiDownloadOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '130px', top: 'calc(100% + 4px)' }}>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'Export')}>Export</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'PDF')}>PDF</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'Word')}>Word</div>
                  </div>
                )}
              </div>

              <button 
                className="chart-expand-icon-btn" 
                onClick={() => setExpandedChart('aqi')}
                title="Expand Graph"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chart-container-wrapper">
            <HighchartsReactComponent
              highcharts={Highcharts}
              options={aqiChartOptions}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          </div>

          {/* Legend exactly matching the reference */}
          <div className="chart-legend-container aqi-legend">
            <div className="legend-item"><span className="legend-box" style={{background: '#84cc16'}}></span>Good</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#fcd34d'}}></span>Moderate</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#f97316'}}></span>Unhealthy for Sensitive Groups</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#ef4444'}}></span>Unhealthy</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#a855f7'}}></span>Very Unhealthy</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#7f1d1d'}}></span>Hazardous</div>
          </div>
        </div>

        {/* Panel 2: Last 24hrs Concentration */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <h3 className="chart-panel-title">Last 24hrs Concentration</h3>
            
            <div style={{display: 'flex', gap: '8px'}}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-parameter-dropdown-btn"
                  onClick={() => setParamDropdownOpen(!paramDropdownOpen)}
                >
                  {selectedParams.length === 0 
                    ? 'Select Parameter' 
                    : selectedParams.length === 5
                      ? 'All Parameters'
                      : selectedParams.join(', ')}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={paramDropdownOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {paramDropdownOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ minWidth: '150px', right: 0, left: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    {['SO2', 'NO2', 'CO', 'PM10', 'PM2.5'].map(param => {
                      const isChecked = selectedParams.includes(param);
                      return (
                        <div 
                          key={param} 
                          className={`reports-sub-dropdown-item ${isChecked ? 'active' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedParams(selectedParams.filter(p => p !== param));
                            } else {
                              setSelectedParams([...selectedParams, param]);
                            }
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ accentColor: '#009fac', cursor: 'pointer' }}
                          />
                          <span>{param}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-download-dropdown-btn"
                  onClick={() => setConcDownloadOpen(!concDownloadOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight: '6px'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={concDownloadOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {concDownloadOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '130px', top: 'calc(100% + 4px)' }}>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'Export')}>Export</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'PDF')}>PDF</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'Word')}>Word</div>
                  </div>
                )}
              </div>

              <button 
                className="chart-expand-icon-btn" 
                onClick={() => setExpandedChart('conc')}
                title="Expand Graph"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chart-container-wrapper">
            <HighchartsReactComponent
              highcharts={Highcharts}
              options={concChartOptions}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          </div>

          {/* Legend matching the reference dynamically */}
          <div className="chart-legend-container conc-legend">
            {selectedParams.includes('SO2') && <div className="legend-item"><span className="legend-box" style={{background: '#3b82f6'}}></span>SO2</div>}
            {selectedParams.includes('NO2') && <div className="legend-item"><span className="legend-box" style={{background: '#0ea5e9'}}></span>NO2</div>}
            {selectedParams.includes('CO') && <div className="legend-item"><span className="legend-box" style={{background: '#0f766e'}}></span>CO</div>}
            {selectedParams.includes('PM10') && <div className="legend-item"><span className="legend-box" style={{background: '#0d9488'}}></span>PM10</div>}
            {selectedParams.includes('PM2.5') && <div className="legend-item"><span className="legend-box" style={{background: '#06b6d4'}}></span>PM2.5</div>}
          </div>
        </div>
      </div>
        </>
      )}
      {expandedChart && (
        <div className="aqms-chart-modal-overlay" dir="ltr">
          <div className="aqms-chart-modal-card">
            
            {/* Top Header */}
            <div className="aqms-chart-modal-header">
              <div>
                <h2 className="aqms-chart-modal-title">
                  {expandedChart === 'aqi' 
                    ? t('live.last_24hrs_aqi', 'Last 24hrs Air Quality Index') 
                    : t('live.last_24hrs_conc', 'Last 24hrs Concentration')}
                </h2>
              </div>
              
              <div className="aqms-chart-type-container" style={{ marginRight: '36px', marginLeft: '0' }}>
                {/* Chart Type Toggle pill exactly styled like MWQ */}
                <div className="aqms-chart-type-pill">
                  {[
                    { id: 'Line', label: t('chart.line', 'Line') },
                    { id: 'Step Line', label: t('chart.stepLine', 'Step Line') },
                    { id: 'Dots', label: t('chart.dots', 'Dots') },
                    { id: 'Stacked Lines', label: t('chart.stackedLines', 'Stacked Lines') },
                    { id: 'Bars', label: t('chart.bars', 'Bars') }
                  ].map((type) => {
                    const isActive = modalChartType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setModalChartType(type.id)}
                        className={`aqms-chart-type-btn ${isActive ? 'active' : ''}`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Absolute Close Button */}
              <button 
                onClick={() => setExpandedChart(null)}
                className="aqms-chart-modal-close-btn"
                style={{
                  right: '20px',
                  left: 'auto'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content Area: Split 75% chart / 25% sidebar control on desktop */}
            <div className="aqms-chart-modal-content-body">
              
              {/* Left Side: Chart canvas and toolbar */}
              <div className="aqms-chart-modal-left">
                
                {/* Chart Toolbar */}
                <div className="aqms-chart-modal-toolbar">
                  <div className="aqms-chart-modal-toolbar-group">
                    {/* Zoom In */}
                    <button 
                      onClick={handleZoomIn} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Zoom In', 'Zoom In')}
                    >
                      <ZoomIn size={18} />
                    </button>

                    {/* Zoom Out */}
                    <button 
                      onClick={handleZoomOut} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Zoom Out', 'Zoom Out')}
                    >
                      <ZoomOut size={18} />
                    </button>
                    
                    {/* Search / Zoom Select */}
                    <button 
                      onClick={() => setActiveTool('select')} 
                      className={`aqms-chart-modal-toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                      title={getToolbarTitle('Select Zoom', 'Select Zoom')}
                    >
                      <Search size={18} />
                    </button>
                    
                    {/* Pan Mode */}
                    <button 
                      onClick={() => setActiveTool('pan')} 
                      className={`aqms-chart-modal-toolbar-btn ${activeTool === 'pan' ? 'active' : ''}`}
                      title={getToolbarTitle('Pan Mode', 'Pan Mode')}
                    >
                      <Hand size={18} />
                    </button>
                    
                    {/* Pan Controls */}
                    {activeTool === 'pan' && (
                      <>
                        <button 
                          onClick={() => handlePan('left')} 
                          className="aqms-chart-modal-toolbar-btn"
                          title={getToolbarTitle('Pan Left', 'Pan Left')}
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <button 
                          onClick={() => handlePan('right')} 
                          className="aqms-chart-modal-toolbar-btn"
                          title={getToolbarTitle('Pan Right', 'Pan Right')}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </>
                    )}
                    
                    {/* Home / Reset */}
                    <button 
                      onClick={handleReset} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Reset/Home', 'Reset/Home')}
                    >
                      <Home size={18} />
                    </button>
                    
                    <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
                    
                    {/* Print */}
                    <button 
                      onClick={handlePrint} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Print', 'Print')}
                    >
                      <Printer size={18} />
                    </button>

                    {/* Menu */}
                    <button 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Menu', 'Menu')}
                    >
                      <Menu size={18} />
                    </button>
                  </div>
                </div>

                {/* Chart Canvas Container */}
                <div className="aqms-chart-modal-canvas-container">
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <HighchartsReactComponent
                      highcharts={Highcharts}
                      options={getModalChartOptions()}
                      ref={chartRef}
                      containerProps={{ style: { height: '100%', width: '100%' } }}
                    />
                  </div>
                </div>

                {/* Legend beneath chart */}
                {expandedChart === 'aqi' ? (
                  <div className="chart-legend-container aqi-legend" style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    <div className="legend-item"><span className="legend-box" style={{background: '#84cc16'}}></span>{t('landing.stats.good', 'Good')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#fcd34d'}}></span>{t('live.moderate', 'Moderate')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#f97316'}}></span>{t('landing.dash.unhealthy_sg', 'Unhealthy for Sensitive Groups')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#ef4444'}}></span>{t('landing.dash.unhealthy', 'Unhealthy')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#a855f7'}}></span>{t('landing.dash.very_unhealthy', 'Very Unhealthy')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#7f1d1d'}}></span>{t('landing.dash.hazardous', 'Hazardous')}</div>
                  </div>
                ) : (
                  <div className="chart-legend-container conc-legend" style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    {selectedParams.includes('SO2') && <div className="legend-item"><span className="legend-box" style={{background: '#3b82f6'}}></span>SO2</div>}
                    {selectedParams.includes('NO2') && <div className="legend-item"><span className="legend-box" style={{background: '#0ea5e9'}}></span>NO2</div>}
                    {selectedParams.includes('CO') && <div className="legend-item"><span className="legend-box" style={{background: '#0f766e'}}></span>CO</div>}
                    {selectedParams.includes('PM10') && <div className="legend-item"><span className="legend-box" style={{background: '#0d9488'}}></span>PM10</div>}
                    {selectedParams.includes('PM2.5') && <div className="legend-item"><span className="legend-box" style={{background: '#06b6d4'}}></span>PM2.5</div>}
                  </div>
                )}
              </div>

              {/* Right Side: Sidebar Controls */}
              <div 
                className="aqms-chart-modal-sidebar"
                style={{
                  borderLeft: '1px solid #f1f5f9',
                  borderRight: 'none'
                }}
              >
                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Optimize large datasets */}
                  <SidebarToggle 
                    label={t('chart.optimize_large_datasets', 'Optimize large datasets')}
                    subtext={t('chart.showing_all_points', 'Showing all points')} 
                    checked={modalOptimizeData} 
                    onChange={setModalOptimizeData} 
                  />
                  
                  {/* Max points */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{t('chart.max_points_optimized', 'Max points (optimized)')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '28px' }}>
                      <button 
                        onClick={() => setModalMaxPoints(m => Math.max(100, m - 100))} 
                        style={{ border: 'none', background: 'none', padding: '0 10px', height: '100%', cursor: 'pointer', color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        -
                      </button>
                      <span style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#334155', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', height: '100%' }}>
                        {modalMaxPoints}
                      </span>
                      <button 
                        onClick={() => setModalMaxPoints(m => m + 100)} 
                        style={{ border: 'none', background: 'none', padding: '0 10px', height: '100%', cursor: 'pointer', color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>
                  
                  {/* Marker */}
                  <SidebarToggle 
                    label={t('chart.marker', 'Marker')} 
                    checked={modalShowMarkers} 
                    onChange={setModalShowMarkers} 
                  />

                  {/* Dashes */}
                  <SidebarToggle 
                    label={t('chart.dashes', 'Dashes')} 
                    checked={modalShowDashes} 
                    onChange={setModalShowDashes} 
                  />

                  {/* Date Tooltip */}
                  <SidebarToggle 
                    label={t('chart.date_tooltip', 'Date Tooltip')} 
                    checked={modalShowTooltip} 
                    onChange={setModalShowTooltip} 
                  />

                  {/* Animation */}
                  <SidebarToggle 
                    label={t('chart.animation', 'Animation')} 
                    checked={modalShowAnimation} 
                    onChange={setModalShowAnimation} 
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="custom-toast-notification">
          <div className="custom-toast-content">
            <svg className="custom-toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LiveData;


