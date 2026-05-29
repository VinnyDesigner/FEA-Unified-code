import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ZoomIn, ZoomOut, Search, Hand, Home, Printer, ArrowLeft, ArrowRight } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useLanguage } from '../contexts/LanguageContext';
import { getAqmsStations, getAqmsAirQualityHistory, getAqmsWeatherHistory } from '../../../lib/queries';

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

const STATION_COLORS = {
  'City Centre': '#00b8c8',
  'Mobile Station': '#f59e0b',
  'Qidfa': '#10b981',
  'Lafarge Cems': '#ec4899',
  'Lafarge CEMS': '#ec4899',
};

const PARAM_FIELD_MAP = {
  'SO2': 'so2', 'NO2': 'no2', 'CO': 'co', 'PM10': 'pm10', 'PM2.5': 'pm25',
  'O3': 'o3', 'CO2': 'co2', 'CH4': 'ch4', 'H2S': 'h2s', 'NMHC': 'nmhc',
  'Temperature': 'temperature', 'Humidity': 'humidity', 'Wind Speed': 'windSpeed',
};

const getParamUnit = (param) => {
  const units = {
    'SO2': 'ppb', 'NO2': 'ppb', 'CO': 'ppb', 'PM10': 'µg/m³', 'PM2.5': 'µg/m³',
    'O3': 'ppb', 'CO2': 'ppm', 'CH4': 'ppb', 'H2S': 'ppb', 'NMHC': 'ppb',
    'Temperature': '°C', 'Humidity': '%', 'Wind Speed': 'Km/h'
  };
  return units[param] || 'ppb';
};


const Analytics = () => {
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  // Set highly comparative initial states as requested
  const [selectedStations, setSelectedStations] = useState([]);
  // Tracks whether we've already applied the default selection after stations load.
  const [stationsInitialized, setStationsInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Graphical View');
  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);
  
  // Custom date range states (default to the last 7 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeAccordionIdx, setActiveAccordionIdx] = useState(null);

  // Full Screen Chart Modal States
  const [expandedChart, setExpandedChart] = useState(null); // { param, station }
  const [modalChartType, setModalChartType] = useState('Line');
  const [modalOptimizeData, setModalOptimizeData] = useState(true);
  const [modalMaxPoints, setModalMaxPoints] = useState(2000);
  const [modalShowMarkers, setModalShowMarkers] = useState(true);
  const [modalShowDashes, setModalShowDashes] = useState(false);
  const [modalShowTooltip, setModalShowTooltip] = useState(true);
  const [modalShowAnimation, setModalShowAnimation] = useState(true);
  const [activeTool, setActiveTool] = useState('zoom'); // 'zoom', 'pan', 'select'
  const [sortOrder, setSortOrder] = useState('asc');
  const [tabularPage, setTabularPage] = useState(1);
  
  const chartRef = useRef(null);

  const [stationsList, setStationsList] = useState([]);
  const [historyByStation, setHistoryByStation] = useState({});

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

  useEffect(() => {
    getAqmsStations().then(setStationsList).catch(() => {});
  }, []);

  // Default the selected stations to the first N real stations once loaded.
  useEffect(() => {
    if (stationsInitialized || stationsList.length === 0) return;
    const names = stationsList.map((s) => s.name).filter(Boolean);
    setSelectedStations(names.slice(0, 3));
    setStationsInitialized(true);
  }, [stationsList, stationsInitialized]);

  // Station names available in the filter dropdown (driven by real stations).
  const stationNameOptions = stationsList.map((s) => s.name).filter(Boolean);

  useEffect(() => {
    if (stationsList.length === 0) return;
    const getRange = () => {
      const now = new Date();
      if (selectedDate === 'Today') return { startTime: new Date(now.setHours(0, 0, 0, 0)).toISOString(), endTime: new Date().toISOString() };
      if (selectedDate === 'Daily') return { startTime: new Date(now - 86400000).toISOString(), endTime: new Date().toISOString() };
      if (selectedDate === 'Monthly') return { startTime: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endTime: new Date().toISOString() };
      if (selectedDate === 'Yearly') return { startTime: new Date(now.getFullYear(), 0, 1).toISOString(), endTime: new Date().toISOString() };
      return { startTime: new Date(startDate + 'T00:00:00Z').toISOString(), endTime: new Date(endDate + 'T23:59:59Z').toISOString() };
    };
    const { startTime, endTime } = getRange();
    const matchedStations = stationsList.filter(s => selectedStations.includes(s.name));
    const pivot = (rows) => {
      const byTime = {};
      (rows || []).forEach((r) => {
        const t = r.observationTime;
        if (!t) return;
        if (!byTime[t]) byTime[t] = { timestamp: t };
        const field = PARAM_FIELD_MAP[r.parameterName];
        if (field) byTime[t][field] = Number(r.value);
      });
      return Object.values(byTime);
    };
    Promise.all(
      matchedStations.map(async (s) => {
        const [aqRows, wxRows] = await Promise.all([
          getAqmsAirQualityHistory({ stationId: s.id, startTime, endTime }),
          getAqmsWeatherHistory({ stationId: s.id, startTime, endTime }),
        ]);
        const merged = [...pivot(aqRows), ...pivot(wxRows)]
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return { name: s.name, rows: merged };
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ name, rows }) => { map[name] = rows; });
      setHistoryByStation(map);
    }).catch(() => {});
  }, [selectedStations, selectedDate, startDate, endDate, stationsList]);

  const getSeriesData = (station, param) => {
    const field = PARAM_FIELD_MAP[param];
    const rows = historyByStation[station] || [];
    return rows.map((r) => (r[field] != null ? Number(r[field]) : null));
  };

  const getCategories = (station) => {
    const rows = historyByStation[station] || [];
    return rows.map((r) => {
      const ts = new Date(r.timestamp);
      return ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    });
  };

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
    if (!expandedChart) return {};
    const { param, station } = expandedChart;

    const series = station
      ? [{
          name: station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station,
          data: getSeriesData(station, param),
          color: STATION_COLORS[station] || '#00b8c8'
        }]
      : selectedStations.map(st => ({
          name: st === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                st === 'City Centre' ? t('live.city_centre', 'City Centre') :
                st === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                st === 'Qidfa' ? t('live.qidfa', 'Qidfa') : st,
          data: getSeriesData(st, param),
          color: STATION_COLORS[st] || '#00b8c8'
        }));

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
      ...chartOptionsBase,
      chart: {
        ...chartOptionsBase.chart,
        type: seriesType,
        height: window.innerWidth < 768 ? 300 : 450,
        spacing: [15, 15, 15, 15]
      },
      yAxis: {
        ...chartOptionsBase.yAxis,
        title: { text: getParamUnit(param) }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        ...chartOptionsBase.plotOptions,
        spline: {
          ...(chartOptionsBase.plotOptions?.spline || {}),
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
        ...chartOptionsBase.tooltip,
        enabled: modalShowTooltip
      },
      series: series
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

  const getTabularData = () => {
    const data = [];
    selectedStations.forEach(station => {
      const rows = historyByStation[station] || [];
      rows.forEach(r => {
        const ts = new Date(r.timestamp);
        const timeStr = ts.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const values = {};
        selectedParams.forEach(param => {
          const field = PARAM_FIELD_MAP[param];
          const v = r[field];
          values[param] = v != null ? `${v} ${getParamUnit(param)}` : '-';
        });
        data.push({
          time: timeStr,
          _ts: r.timestamp,
          station: station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                   station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                   station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                   station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station,
          values,
        });
      });
    });
    return data;
  };

  const getSortedTabularData = () => {
    const sorted = getTabularData();
    sorted.sort((a, b) => sortOrder === 'asc' ? new Date(a._ts) - new Date(b._ts) : new Date(b._ts) - new Date(a._ts));
    return sorted;
  };

  const toggleDateSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Client-side pagination over the sorted tabular rows.
  const TABULAR_PAGE_SIZE = 25;
  const sortedTabularData = getSortedTabularData();
  const tabularTotalPages = Math.max(1, Math.ceil(sortedTabularData.length / TABULAR_PAGE_SIZE));
  const tabularSafePage = Math.min(tabularPage, tabularTotalPages);
  const tabularPageRows = sortedTabularData.slice(
    (tabularSafePage - 1) * TABULAR_PAGE_SIZE,
    tabularSafePage * TABULAR_PAGE_SIZE
  );
  const tabularPageWindow = Array.from({ length: tabularTotalPages }, (_, i) => i + 1)
    .filter((n) => Math.abs(n - tabularSafePage) <= 2)
    .slice(0, 5);

  const chartOptionsBase = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 200,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [10, 5, 10, 5],
    },
    title: { text: null },
    xAxis: {
      categories: getCategories(selectedStations[0] || ''),
      gridLineWidth: 1,
      gridLineColor: 'rgba(0,0,0,0.03)',
      lineColor: 'rgba(0,0,0,0.06)',
      labels: {
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      title: { text: null },
      gridLineColor: 'rgba(0,0,0,0.05)',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderRadius: 10,
      borderColor: 'rgba(255,255,255,1)',
      shadow: {
        color: 'rgba(0,0,0,0.06)',
        offsetX: 0,
        offsetY: 4,
        opacity: 0.8,
        width: 10
      },
      style: { fontSize: '0.8rem' }
    },
    plotOptions: {
      spline: {
        lineWidth: 2.5,
        marker: { enabled: false },
        states: { hover: { lineWidth: 3 } }
      }
    }
  };

  return (
    <div className="aqms-analytics-container">
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
              <h1>{t('nav.analytics', 'Analytics')}</h1>
              <p className="header-date">{translateDateTime(currentDateTime)}</p>
            </>
          )}
        </div>
        
        <div className="header-controls-group">
          {/* Pill Switcher Navigation */}
          <div className="pill-tabs-group">
            <button className="pill-tab" onClick={() => navigate('/AQMS/live-data')}>
              {t('nav.live_data', 'Live Data')}
            </button>
            <button className="pill-tab active" onClick={() => navigate('/AQMS/analytics')}>
              {t('nav.analytics', 'Analytics')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/data-capture')}>
              {t('nav.reports', 'Reports')}
            </button>
          </div>

          {/* View Toggle Icons (Single Chart / Graph / Tabular) */}
          <div className="view-toggle-group" style={{ marginInlineStart: '12px' }}>
            <button
              className={`view-toggle-btn ${selectedView === 'Single Chart' ? 'active' : ''}`}
              onClick={() => setSelectedView('Single Chart')}
              title="Single Chart View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${selectedView === 'Graphical View' ? 'active' : ''}`}
              onClick={() => setSelectedView('Graphical View')}
              title="Graphical View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                
                {/* Site Location Dropdown (Multi-select) */}
                <div 
                  className="popover-item site-location-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'location' ? null : 'location');
                  }}
                >
                  <span className="popover-item-label teal-label" style={{ fontWeight: '800' }}>
                    {`Stations (${selectedStations.length})`}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="3" className={`popover-arrow-svg ${activeSubMenu === 'location' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'location' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {stationNameOptions.map(option => {
                        const isChecked = selectedStations.includes(option);
                        let label = option;
                        if (option === 'City Centre') label = t('live.city_centre', 'City Centre');
                        if (option === 'Mobile Station') label = t('live.mobile_station', 'Mobile Station');
                        if (option === 'Qidfa') label = t('live.qidfa', 'Qidfa');
                        if (option === 'Lafarge Cems') label = t('live.lafarge_cems', 'Lafarge Cems');
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${isChecked ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedStations(selectedStations.filter(s => s !== option));
                              } else {
                                setSelectedStations([...selectedStations, option]);
                              }
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              readOnly
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Date Dropdown */}
                <div 
                  className="popover-item date-today-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'date' ? null : 'date');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {selectedDate === 'Today' ? t('live.today', 'Today') :
                     selectedDate === 'Daily' ? t('live.daily', 'Daily') :
                     selectedDate === 'Monthly' ? t('live.monthly', 'Monthly') :
                     selectedDate === 'Yearly' ? t('live.yearly', 'Yearly') :
                     'Customize'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'date' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'date' && (
                    <div className="popover-sub-menu">
                      {["Today", "Daily", "Monthly", "Yearly", "Customize"].map(option => {
                        let label = option;
                        if (option === 'Today') label = t('live.today', 'Today');
                        if (option === 'Daily') label = t('live.daily', 'Daily');
                        if (option === 'Monthly') label = t('live.monthly', 'Monthly');
                        if (option === 'Yearly') label = t('live.yearly', 'Yearly');
                        if (option === 'Customize') label = 'Customize';
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${selectedDate === option ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(option);
                              if (option !== 'Customize') {
                                setActiveSubMenu(null);
                              }
                            }}
                          >
                            {label}
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
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="custom-date-picker"
                      />
                    </div>
                    <div className="date-input-field">
                      <label>End Date</label>
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
                    {`Parameters (${selectedParams.length})`}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'parameter' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'parameter' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {['SO2', 'NO2', 'CO', 'PM10', 'PM2.5', 'O3', 'CO2', 'CH4', 'H2S', 'NMHC', 'Temperature', 'Humidity', 'Wind Speed'].map(option => {
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
                              readOnly
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Customize Date Range Dropdown Item */}
                <div 
                  className="popover-item customize-date-range-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'customDate' ? null : 'customDate');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {t('filter.customize_date_range', 'Customize Date Range')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'customDate' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>

                  {activeSubMenu === 'customDate' && (
                    <div className="popover-sub-menu custom-date-floating-panel" onClick={(e) => e.stopPropagation()}>
                      <div className="date-input-field">
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>Start Date</label>
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)} 
                          className="custom-date-picker"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="date-input-field" style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>End Date</label>
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)} 
                          className="custom-date-picker"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="aqms-analytics-scroll-body">
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
                          <span className="aqi-status-badge" style={{ backgroundColor: '#009fac20', color: '#009fac', border: '1px solid #009fac40' }}>
                            Active
                          </span>
                        </div>
                      </div>
                      
                      <div className="header-aqi-indicator">
                        <div className="aqi-stat-col">
                          <span className="aqi-label">Parameters</span>
                          <span className="aqi-value" style={{ color: '#009fac', fontSize: '1rem', fontWeight: '800' }}>
                            {selectedParams.length}
                          </span>
                        </div>
                        <svg className={`accordion-chevron ${isExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Expanded Content Details */}
                    <div className={`accordion-card-details ${isExpanded ? 'open' : ''}`} style={{ maxHeight: isExpanded ? '1000px' : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <div className="details-grid" style={{ padding: '12px', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        {selectedParams.map(param => (
                          <div className="detail-item" key={param}>
                            <span className="detail-label">{param}</span>
                            <span className="detail-value">{row.values[param] || '-'}</span>
                          </div>
                        ))}
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
                    {selectedParams.map(param => (
                      <th key={param}>{param}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabularPageRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{translateDateTime(row.time)}</td>
                      <td>{t(`live.${row.station.toLowerCase().replace(' ', '_')}`, row.station)}</td>
                      {selectedParams.map(param => (
                        <td key={param}>{row.values[param] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="tabular-pagination-container">
              <button
                className="tab-page-btn"
                disabled={tabularSafePage === 1}
                onClick={() => setTabularPage(p => Math.max(1, p - 1))}
              >
                &lt;
              </button>
              {tabularPageWindow.map(n => (
                <button
                  key={n}
                  className={`tab-page-btn ${tabularSafePage === n ? 'active' : ''}`}
                  onClick={() => setTabularPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="tab-page-btn"
                disabled={tabularSafePage === tabularTotalPages}
                onClick={() => setTabularPage(p => Math.min(tabularTotalPages, p + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : selectedView === 'Single Chart' ? (
        <div className="single-chart-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {selectedStations.map(station => {
            const stationLabel = station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                                 station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                                 station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                                 station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station;
            return (
              <div key={station} className="station-analytics-section">
                <div className="station-section-header" style={{ marginBottom: '16px' }}>
                  <span className="station-status-indicator" style={{ background: STATION_COLORS[station] || '#00b8c8', boxShadow: `0 0 8px ${STATION_COLORS[station] || '#00b8c8'}` }}></span>
                  <h2>{stationLabel}</h2>
                </div>
                
                <div className="analytics-graphs-grid">
                  {selectedParams.map(param => {
                    const series = [{
                      name: stationLabel,
                      data: getSeriesData(station, param),
                      color: STATION_COLORS[station] || '#00b8c8'
                    }];

                    const paramOptions = {
                      ...chartOptionsBase,
                      series: series,
                      yAxis: {
                        ...chartOptionsBase.yAxis,
                        title: { text: getParamUnit(param) }
                      }
                    };

                    return (
                      <div className="analytics-graph-card" key={param}>
                        <div className="graph-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 className="graph-param-title">{param}</h3>
                            <span className="graph-unit-label" style={{ marginTop: '2px' }}>{getParamUnit(param)}</span>
                          </div>
                          
                          <button 
                            className="chart-expand-icon-btn" 
                            onClick={() => setExpandedChart({ param, station })}
                            title="Expand Graph"
                            style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="graph-canvas-wrapper">
                          <HighchartsReactComponent
                            highcharts={Highcharts}
                            options={paramOptions}
                            containerProps={{ style: { height: '100%', width: '100%' } }}
                          />
                        </div>

                        <div className="graph-legend-container">
                          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="legend-box" style={{ background: STATION_COLORS[station] || '#00b8c8', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563' }}>{stationLabel}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="analytics-graphs-grid">
          {selectedParams.map(param => {
            const series = selectedStations.map(station => ({
              name: station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                    station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                    station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                    station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station,
              data: getSeriesData(station, param),
              color: STATION_COLORS[station] || '#00b8c8'
            }));

            const paramOptions = {
              ...chartOptionsBase,
              series: series,
              yAxis: {
                ...chartOptionsBase.yAxis,
                title: { text: getParamUnit(param) }
              }
            };

            return (
              <div className="analytics-graph-card" key={param}>
                <div className="graph-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className="graph-param-title">{param}</h3>
                    <span className="graph-unit-label" style={{ marginTop: '2px' }}>{getParamUnit(param)}</span>
                  </div>

                  <button 
                    className="chart-expand-icon-btn" 
                    onClick={() => setExpandedChart({ param, station: null })}
                    title="Expand Graph"
                    style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </button>
                </div>
                
                <div className="graph-canvas-wrapper">
                  {series.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af', fontWeight: '500' }}>
                      Please select at least one station.
                    </div>
                  ) : (
                    <HighchartsReactComponent
                      highcharts={Highcharts}
                      options={paramOptions}
                      containerProps={{ style: { height: '100%', width: '100%' } }}
                    />
                  )}
                </div>

                <div className="graph-legend-container">
                  {selectedStations.map(station => (
                    <div className="legend-item" key={station}>
                      <span className="legend-box" style={{ background: STATION_COLORS[station] || '#00b8c8' }}></span>
                      <span>
                        {station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                         station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                         station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                         station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expandedChart && (
        <div className="aqms-chart-modal-overlay" dir="ltr">
          <div className="aqms-chart-modal-card">
            
            {/* Top Header */}
            <div className="aqms-chart-modal-header">
              <div>
                <h2 className="aqms-chart-modal-title">
                  {expandedChart.station 
                    ? `${expandedChart.param} - ${expandedChart.station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                       expandedChart.station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                       expandedChart.station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                       expandedChart.station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : expandedChart.station}`
                    : expandedChart.param}
                </h2>
              </div>
              
              <div className="aqms-chart-type-container" style={{ marginRight: '36px', marginLeft: '0' }}>
                {/* Chart Type Toggle pill */}
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

            {/* Main Content Area */}
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="6" x2="20" y2="6"></line>
                        <line x1="4" y1="18" x2="20" y2="18"></line>
                      </svg>
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
                <div className="chart-legend-container conc-legend" style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                  {expandedChart.station ? (
                    <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="legend-box" style={{ background: STATION_COLORS[expandedChart.station] || '#00b8c8', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563' }}>
                        {expandedChart.station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                         expandedChart.station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                         expandedChart.station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                         expandedChart.station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : expandedChart.station}
                      </span>
                    </div>
                  ) : (
                    selectedStations.map(st => (
                      <div className="legend-item" key={st} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="legend-box" style={{ background: STATION_COLORS[st] || '#00b8c8', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563' }}>
                          {st === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                           st === 'City Centre' ? t('live.city_centre', 'City Centre') :
                           st === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                           st === 'Qidfa' ? t('live.qidfa', 'Qidfa') : st}
                        </span>
                      </div>
                    ))
                  )}
                </div>
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
      </div>
    </div>
  );
};

export default Analytics;
