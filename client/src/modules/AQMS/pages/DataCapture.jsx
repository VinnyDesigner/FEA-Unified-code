import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useLanguage } from '../contexts/LanguageContext';
import { getAqmsStations, getAqmsParameters, getAqmsAirQualityHistory, getAqmsWeatherHistory, generateReport, downloadReportFile } from '../../../lib/queries';

// ── Backend wiring maps ───────────────────────────────────────────────────────
// Maps the /data-capture "Generate Report" menu labels to the backend reportType
// keys implemented in server/src/modules/shared/reports/report-types.
const REPORT_TYPE_BY_LABEL = {
  'Basic Data Export':            'basic_data_export',
  'Average Data Trend Report':    'average_data_trend',
  'Concentration Distribution':   'concentration_distribution',
  'Frequency Distribution':       'frequency_distribution',
  'Max Hourly Values':            'max_hourly_values',
  'Network Data Recovery Report': 'network_data_recovery',
  'Violation of Standards':       'violation_of_standards',
  '24 Hour Avg Summary Reports':  'summary_24h_avg',
  '8 Hour Rolling Avg Report':    'rolling_8h_avg',
  'Daily Summary Report':         'daily_summary',
  'Monthly Report':               'monthly_report',
  'Windrose Report':              'windrose',
  'Pollutionrose Report':         'pollutionrose',
};

// Download menu label -> backend ReportFormat (and file extension).
const FORMAT_BY_LABEL = { Excel: 'XLSX', PDF: 'PDF', Word: 'DOCX' };
const EXT_BY_FORMAT = { XLSX: 'xlsx', PDF: 'pdf', DOCX: 'docx' };

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
  'Lafarge CEMS': '#ec4899'
};

const getParamUnit = (param) => {
  const units = {
    'SO2': 'ppb', 'H2S': 'ppb', 'NO2': 'ppb', 'CO': 'ppb', 'O3': 'ppb', 'PM2.5': 'µg/m³', 'PM10': 'µg/m³'
  };
  return units[param] || 'ppb';
};

// AQMS history endpoints return long-format rows (one per parameter). These maps
// pivot parameterName -> the per-row field names the charts consume.
const AQ_HISTORY_FIELD = {
  'PM2.5': 'pm25', 'PM10': 'pm10', 'CO': 'co', 'O3': 'o3', 'NO2': 'no2',
  'SO2': 'so2', 'CO2': 'co2', 'CH4': 'ch4', 'H2S': 'h2s', 'NMHC': 'nmhc',
};
const WX_HISTORY_FIELD = {
  'Temperature': 'temperature', 'Pressure': 'pressure', 'Solar Radiation': 'solar',
  'Humidity': 'humidity', 'Wind Speed': 'windSpeed', 'Wind Direction': 'windDirection',
};
// Parameter name -> pivoted field name (across both air-quality and weather rows).
const HISTORY_FIELD_BY_PARAM = { ...AQ_HISTORY_FIELD, ...WX_HISTORY_FIELD };

const DataCapture = () => {
  const { lang, t } = useLanguage();
  const isRtl = lang === 'ar';
  const navigate = useNavigate();
  const [isMobileResponsive, setIsMobileResponsive] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileResponsive(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentPage, setCurrentPage] = useState(3);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const [selectedStations, setSelectedStations] = useState(['City Centre']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Tabular View');

  // Reports-specific multi-select filters
  const [stationValue, setStationValue] = useState(['City Centre']);
  const [paramValue, setParamValue] = useState(['SO2', 'H2S']);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Backend report generation state
  const [stationIdByName, setStationIdByName] = useState({});
  const [paramIdByName, setParamIdByName] = useState({});
  const [stationsList, setStationsList] = useState([]);
  const [paramsList, setParamsList] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [historyByStation, setHistoryByStation] = useState({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const [stationOpen, setStationOpen] = useState(false);
  const [paramOpen, setParamOpen] = useState(false);

  // Multi-level download dropdown states
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedReportName, setSelectedReportName] = useState('Generated Report');
  const [generateDropdownOpen, setGenerateDropdownOpen] = useState(false);
  const [activeReportCategory, setActiveReportCategory] = useState(null);

  const reportMenu = [
    {
      category: "Average Reports",
      items: [
        "Basic Data Export",
        "Average Data Trend Report"
      ]
    },
    {
      category: "Statistical Reports",
      items: [
        "Concentration Distribution",
        "Frequency Distribution",
        "Max Hourly Values",
        "Network Data Recovery Report",
        "Violation of Standards"
      ]
    },
    {
      category: "Summary Reports",
      items: [
        "24 Hour Avg Summary Reports",
        "8 Hour Rolling Avg Report",
        "Daily Summary Report",
        "Monthly Report"
      ]
    },
    {
      category: "Met Reports",
      items: [
        "Windrose Report"
      ]
    },
    {
      category: "Pollutionrose Reports",
      items: [
        "Pollutionrose Report",
        "Windrose Report"
      ]
    }
  ];

  // Resolve station and parameter names -> IDs for report generation from the
  // real AQMS masters (replaces the previously hard-coded fallback maps).
  useEffect(() => {
    getAqmsStations()
      .then((stations) => {
        setStationsList(stations);
        const map = {};
        stations.forEach((s) => {
          if (s.stationName) map[s.stationName] = s.id;
          if (s.name && !map[s.name]) map[s.name] = s.id;
        });
        setStationIdByName(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAqmsParameters()
      .then((params) => {
        const list = params || [];
        setParamsList(list);
        const map = {};
        list.forEach((p) => { if (p.name) map[p.name] = p.id; });
        setParamIdByName(map);
      })
      .catch(() => {});
  }, []);

  // Names available in the Reports filter dropdowns (driven by real masters).
  const stationNameOptions = stationsList.map((s) => s.stationName || s.name).filter(Boolean);
  const paramNameOptions = paramsList.map((p) => p.name).filter(Boolean);

  // Load real history for the Graphical View whenever the selection or range changes.
  useEffect(() => {
    if (selectedView !== 'Graphical View') return;
    if (Object.keys(stationIdByName).length === 0) return;
    if (stationValue.length === 0 || !startDate || !endDate) {
      setHistoryByStation({});
      return;
    }
    const startTime = new Date(startDate + 'T00:00:00Z').toISOString();
    const endTime = new Date(endDate + 'T23:59:59Z').toISOString();
    const pivot = (rows) => {
      const byTime = {};
      (rows || []).forEach((r) => {
        const ts = r.observationTime;
        if (!ts) return;
        if (!byTime[ts]) byTime[ts] = { timestamp: ts };
        const field = HISTORY_FIELD_BY_PARAM[r.parameterName];
        if (field) byTime[ts][field] = Number(r.value);
      });
      return Object.values(byTime);
    };
    let cancelled = false;
    Promise.all(
      stationValue.map(async (name) => {
        const sid = stationIdByName[name];
        if (!sid) return { name, rows: [] };
        const [aqRows, wxRows] = await Promise.all([
          getAqmsAirQualityHistory({ stationId: sid, startTime, endTime, limit: 1000 }),
          getAqmsWeatherHistory({ stationId: sid, startTime, endTime, limit: 1000 }),
        ]);
        const merged = [...pivot(aqRows), ...pivot(wxRows)]
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return { name, rows: merged };
      })
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach(({ name, rows }) => { map[name] = rows; });
      setHistoryByStation(map);
    }).catch(() => { if (!cancelled) setHistoryByStation({}); });
    return () => { cancelled = true; };
  }, [selectedView, stationValue, paramValue, startDate, endDate, stationIdByName]);

  // Real chart series values for a station+parameter (numeric, null-safe).
  const getSeriesData = (station, param) => {
    const field = HISTORY_FIELD_BY_PARAM[param];
    const rows = historyByStation[station] || [];
    return rows.map((r) => (field && r[field] != null ? Number(r[field]) : null));
  };

  // X-axis categories from real timestamps of the first selected station.
  const getCategories = () => {
    const first = stationValue[0];
    const rows = (first && historyByStation[first]) || [];
    return rows.map((r) => new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  };

  // Generate a report on the backend for the selected report type + current filters.
  const handleGenerateReport = async (reportLabel) => {
    const reportType = REPORT_TYPE_BY_LABEL[reportLabel];
    setSelectedReportName(reportLabel);
    setGenerateDropdownOpen(false);
    setActiveReportCategory(null);
    setGenError('');
    setCurrentReport(null);
    setCurrentPage(1);

    if (!reportType) { setGenError(`Unknown report type: ${reportLabel}`); return; }
    const stationIds = stationValue.map((n) => stationIdByName[n]).filter(Boolean);
    const parameterIds = paramValue.map((n) => paramIdByName[n]).filter(Boolean);
    if (stationIds.length === 0) { setGenError('Select at least one station.'); setShowReport(true); return; }
    if (parameterIds.length === 0) { setGenError('Select at least one parameter.'); setShowReport(true); return; }
    if (!startDate || !endDate) { setGenError('Select a start and end date.'); setShowReport(true); return; }

    const payload = {
      module: 'AQMS',
      reportType,
      stationIds,
      parameterIds,
      startDate: new Date(startDate + 'T00:00:00Z').toISOString(),
      endDate: new Date(endDate + 'T23:59:59Z').toISOString(),
      formats: ['XLSX', 'PDF', 'DOCX'],
    };

    setGenerating(true);
    setShowReport(true);
    try {
      const report = await generateReport(payload);
      setCurrentReport(report);
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      // Large basic exports exceed the PDF/DOCX 10k-row limit — retry XLSX only.
      if (code === 'ROW_LIMIT_EXCEEDED') {
        try {
          const report = await generateReport({ ...payload, formats: ['XLSX'] });
          setCurrentReport(report);
          setGenError('Result set was large — only Excel (XLSX) was generated for this report.');
        } catch (err2) {
          setGenError(err2?.response?.data?.error?.message || 'Failed to generate report.');
        }
      } else {
        setGenError(err?.response?.data?.error?.message || 'Failed to generate report.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Download the generated report in the chosen format via authenticated blob fetch.
  const handleDownload = async (formatLabel) => {
    setDownloadOpen(false);
    const format = FORMAT_BY_LABEL[formatLabel] || formatLabel;
    if (!currentReport?.id) { setGenError('Generate a report before downloading.'); return; }
    if (!currentReport.formats?.includes(format)) {
      setGenError(`${formatLabel} is not available for this report.`);
      return;
    }
    setDownloadingFormat(format);
    setGenError('');
    try {
      const blob = await downloadReportFile(currentReport.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${REPORT_TYPE_BY_LABEL[selectedReportName] || 'report'}-${currentReport.id}.${EXT_BY_FORMAT[format]}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setGenError(err?.response?.data?.error?.message || 'Download failed.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Preview table data derived from the generated report (server returns a row slice).
  const previewCols = currentReport?.preview?.columns || [];
  const previewRows = currentReport?.preview?.rows || [];
  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(previewRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = previewRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageWindow = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => Math.abs(n - safePage) <= 2)
    .slice(0, 5);

  return (
    <div className="aqms-reports-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{t('nav.reports', 'Reports')}</h1>
          <p className="header-date">{currentDateTime}</p>
        </div>

        <div className="header-controls-group">
          {/* Pill Switcher Navigation */}
          <div className="pill-tabs-group">
            <button className="pill-tab" onClick={() => navigate('/AQMS/live-data')}>
              {t('nav.live_data', 'Live Data')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/analytics')}>
              {t('nav.analytics', 'Analytics')}
            </button>
            <button className="pill-tab active" onClick={() => navigate('/AQMS/data-capture')}>
              {t('nav.reports', 'Reports')}
            </button>
          </div>

          {/* View Toggle Icons (Graph / Tabular) identical to Live Data */}
          <div className="view-toggle-group" style={{ marginInlineStart: '12px' }}>
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

          {/* Floating toggle filter button & popover wrapper */}
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
                  <span className="popover-item-label teal-label">
                    {selectedStations.length === 0
                      ? t('filter.select_station', 'Select Station')
                      : selectedStations.length === 4
                        ? t('filter.all_stations', 'All Stations')
                        : selectedStations.map(s => {
                          if (s === 'City Centre' || s === 'City Center') return t('live.city_centre', 'City Centre');
                          if (s === 'Mobile Station') return t('live.mobile_station', 'Mobile Station');
                          if (s === 'Qidfa') return t('live.qidfa', 'Qidfa');
                          if (s === 'Lafarge CEMS' || s === 'Lafarge Cems') return t('live.lafarge_cems', 'Lafarge Cems');
                          return s;
                        }).join(', ')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="3" className={`popover-arrow-svg ${activeSubMenu === 'location' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>

                  {activeSubMenu === 'location' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {["City Centre", "Mobile Station", "Qidfa", "Lafarge Cems"].map(option => {
                        const isChecked = selectedStations.includes(option === 'Lafarge Cems' ? 'Lafarge Cems' : option === 'City Centre' ? 'City Centre' : option);
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
                              const checkVal = option;
                              if (isChecked) {
                                setSelectedStations(selectedStations.filter(s => s !== checkVal));
                              } else {
                                setSelectedStations([...selectedStations, checkVal]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => { }}
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
                  <span className="popover-item-label neutral-label">
                    {selectedDate === 'Today' ? t('live.today', 'Today') :
                      selectedDate === 'Daily' ? t('live.daily', 'Daily') :
                        selectedDate === 'Monthly' ? t('live.monthly', 'Monthly') :
                          t('live.yearly', 'Yearly')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'date' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>

                  {activeSubMenu === 'date' && (
                    <div className="popover-sub-menu">
                      {["Today", "Daily", "Monthly", "Yearly"].map(option => {
                        let label = option;
                        if (option === 'Today') label = t('live.today', 'Today');
                        if (option === 'Daily') label = t('live.daily', 'Daily');
                        if (option === 'Monthly') label = t('live.monthly', 'Monthly');
                        if (option === 'Yearly') label = t('live.yearly', 'Yearly');
                        return (
                          <div
                            key={option}
                            className={`popover-sub-item ${selectedDate === option ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(option);
                              setActiveSubMenu(null);
                              setFiltersOpen(false);
                            }}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* View Type Dropdown */}
                <div
                  className="popover-item view-tabular-row"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'view' ? null : 'view');
                  }}
                >
                  <span className="popover-item-label neutral-label">
                    {selectedView === 'Graph View' ? t('live.graph_view', 'Graph View') : t('live.tabular_view', 'Tabular View')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'view' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>

                  {activeSubMenu === 'view' && (
                    <div className="popover-sub-menu">
                      {["Graph View", "Tabular View"].map(option => {
                        let label = option;
                        if (option === 'Graph View') label = t('live.graph_view', 'Graph View');
                        if (option === 'Tabular View') label = t('live.tabular_view', 'Tabular View');
                        return (
                          <div
                            key={option}
                            className={`popover-sub-item ${selectedView === option ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedView(option);
                              setActiveSubMenu(null);
                              setFiltersOpen(false);
                            }}
                          >
                            {label}
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

      <div className="aqms-reports-scroll-body">
      {/* ── HORIZONTAL FILTER ROW ───────────────────────── */}
      <div className={`reports-horizontal-filter-row ${showReport ? 'report-active' : ''}`}>
         {/* Station dropdown */}
         <div className="reports-form-group">
           <label className="reports-form-label">{t('filter.station', 'Station')}</label>
           <div className="reports-form-input-wrapper" onClick={() => {
             setStationOpen(!stationOpen);
             setParamOpen(false);
           }}>
             <span className="reports-form-value-text">
               {stationValue.length === 0
                 ? t('filter.select_station', 'Select Station')
                 : (stationNameOptions.length > 0 && stationValue.length === stationNameOptions.length)
                   ? t('filter.all_stations', 'All Stations')
                   : stationValue.map(s => t(`live.${s.toLowerCase().replace(/ /g, '_')}`, s)).join(', ')}
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${stationOpen ? 'open' : ''}`}>
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>

             {stationOpen && (
               <div className="reports-sub-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                 {stationNameOptions.map(option => {
                   const isChecked = stationValue.includes(option);
                   return (
                     <div
                       key={option}
                       className={`reports-sub-dropdown-item ${isChecked ? 'active' : ''}`}
                       style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                       onClick={() => {
                         if (isChecked) {
                           setStationValue(stationValue.filter(s => s !== option));
                         } else {
                           setStationValue([...stationValue, option]);
                         }
                       }}
                     >
                       <input
                         type="checkbox"
                         checked={isChecked}
                         onChange={() => { }}
                         style={{ accentColor: '#009fac', cursor: 'pointer' }}
                       />
                       <span>{t(`live.${option.toLowerCase().replace(/ /g, '_')}`, option)}</span>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
         </div>

         {/* Parameters dropdown */}
         <div className="reports-form-group">
           <label className="reports-form-label">{t('analytics.parameters', 'Parameters')}</label>
           <div className="reports-form-input-wrapper" onClick={() => {
             setParamOpen(!paramOpen);
             setStationOpen(false);
           }}>
             <span className="reports-form-value-text">
               {paramValue.length === 0
                 ? t('filter.select_parameter', 'Select Parameter')
                 : (paramNameOptions.length > 0 && paramValue.length === paramNameOptions.length)
                   ? t('filter.all_parameters', 'All Parameters')
                   : paramValue.join(', ')}
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${paramOpen ? 'open' : ''}`}>
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>

             {paramOpen && (
               <div className="reports-sub-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                 {paramNameOptions.map(option => {
                   const isChecked = paramValue.includes(option);
                   return (
                     <div
                       key={option}
                       className={`reports-sub-dropdown-item ${isChecked ? 'active' : ''}`}
                       style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                       onClick={() => {
                         if (isChecked) {
                           setParamValue(paramValue.filter(p => p !== option));
                         } else {
                           setParamValue([...paramValue, option]);
                         }
                       }}
                     >
                       <input
                         type="checkbox"
                         checked={isChecked}
                         onChange={() => { }}
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

         {/* Start Date input */}
         <div className="reports-form-group">
           <label className="reports-form-label">{t('filter.start_date', 'Start Date')}</label>
           <input 
             type="date"
             value={startDate}
             onChange={(e) => setStartDate(e.target.value)}
             className="reports-form-date-input"
           />
         </div>

         {/* End Date input */}
         <div className="reports-form-group">
           <label className="reports-form-label">{t('filter.end_date', 'End Date')}</label>
           <input 
             type="date"
             value={endDate}
             onChange={(e) => setEndDate(e.target.value)}
             className="reports-form-date-input"
           />
         </div>

         {/* Generate Report dropdown button */}
         <div className="reports-form-group button-group" style={{ position: 'relative' }}>
           <button
             className="reports-generate-btn"
             onClick={() => setGenerateDropdownOpen(!generateDropdownOpen)}
             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '6px' }}>
               <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
               <polyline points="22 4 12 14.01 9 11.01"></polyline>
             </svg>
             {t('reports.generate_report', 'Generate Report')}
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px', transform: generateDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
               <polyline points="6 9 12 15 18 9" />
             </svg>
           </button>

            {generateDropdownOpen && (
              <div 
                className="reports-sub-dropdown-menu" 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 'auto', 
                  right: 0,
                  background: '#ffffff', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 22px rgba(0,0,0,0.12)', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  minWidth: '220px', 
                  padding: '6px 0', 
                  zIndex: 2200,
                  marginTop: '4px',
                  overflow: 'visible',
                  maxHeight: 'none'
                }}
              >
                {reportMenu.map(menu => (
                  <div
                    key={menu.category}
                    className="popover-item"
                    style={{
                      position: 'relative',
                      padding: '10px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => !isMobileResponsive && setActiveReportCategory(menu.category)}
                    onMouseLeave={() => !isMobileResponsive && setActiveReportCategory(null)}
                    onClick={() => {
                      if (isMobileResponsive) {
                        setActiveReportCategory(activeReportCategory === menu.category ? null : menu.category);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="popover-item-label neutral-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t(`reports.${menu.category.toLowerCase().replace(/ /g, '_')}`, menu.category)}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ transform: activeReportCategory === menu.category ? 'rotate(180deg)' : 'rotate(90deg)', marginLeft: '8px', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {activeReportCategory === menu.category && (
                      isMobileResponsive ? (
                        <div
                          style={{
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid rgba(0,0,0,0.04)',
                            marginTop: '8px',
                            padding: '4px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {menu.items.map(item => (
                            <div
                              key={item}
                              className="popover-sub-item"
                              style={{ 
                                padding: '10px 16px', 
                                fontSize: '0.82rem', 
                                cursor: 'pointer', 
                                fontWeight: '600',
                                color: '#475569',
                                textAlign: 'start'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateReport(item);
                              }}
                            >
                              {t(`reports.${item.toLowerCase().replace(/ /g, '_')}`, item)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="popover-sub-menu"
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: isRtl ? 'auto' : 'calc(100% + 4px)',
                            left: isRtl ? 'calc(100% + 4px)' : 'auto',
                            background: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 4px 22px rgba(0,0,0,0.12)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            minWidth: '240px',
                            padding: '6px 0',
                            zIndex: 2200
                          }}
                        >
                          {menu.items.map(item => (
                            <div
                              key={item}
                              className="popover-sub-item"
                              style={{ padding: '10px 16px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '500', textAlign: 'start' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateReport(item);
                              }}
                            >
                              {t(`reports.${item.toLowerCase().replace(/ /g, '_')}`, item)}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>

      {/* ── REPORTS CARD TABLE / GRAPHS ──────────────────── */}
      {showReport && (
        <div className="reports-card-styled" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="reports-card-header" style={{ marginBottom: '10px' }}>
            {/* Back to Filter Button (Visible on mobile/tablet only) */}
            <button 
              className="reports-back-btn"
              onClick={() => setShowReport(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('reports.back_to_filter', 'Back to Filter')}
            </button>

            <h2 className="reports-generated-title" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#009fac', margin: 0 }}>
              {t(`reports.${selectedReportName.toLowerCase().replace(/ /g, '_')}`, selectedReportName)}
            </h2>
            <div className="spacer-element"></div>

            {/* Download Option Dropdown */}
            <div style={{ position: 'relative' }} className="reports-download-wrapper">
              <button
                className="chart-download-dropdown-btn"
                onClick={() => setDownloadOpen(!downloadOpen)}
                style={{
                  background: '#009fac',
                  color: 'white',
                  borderColor: '#009fac',
                  fontWeight: '700'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('reports.download', 'Download')}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }} className={downloadOpen ? 'open' : ''}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {downloadOpen && (
                <div
                  className="reports-sub-dropdown-menu"
                  style={{
                    minWidth: '150px',
                    right: 0,
                    left: 'auto',
                    overflow: 'visible',
                    padding: '6px 0',
                    maxHeight: 'none',
                    position: 'absolute',
                    top: '100%',
                    marginTop: '4px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 22px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    zIndex: 2200
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {["Excel", "PDF", "Word"].map(format => (
                    <div
                      key={format}
                      className="reports-sub-dropdown-item"
                      style={{ 
                        padding: '10px 16px', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        color: '#374151',
                        fontWeight: '500',
                        textAlign: 'start'
                      }}
                      onClick={() => handleDownload(format)}
                    >
                      {format}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Backend report status banner ──────────────────────────── */}
          {(generating || genError || currentReport) && (
            <div
              className="reports-status-banner"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                margin: '0 0 10px 0', padding: '10px 14px', borderRadius: '10px',
                fontSize: '0.82rem', fontWeight: 600,
                background: genError ? '#fef2f2' : generating ? '#f0f9ff' : '#ecfdf5',
                color: genError ? '#b91c1c' : generating ? '#0369a1' : '#047857',
                border: `1px solid ${genError ? '#fecaca' : generating ? '#bae6fd' : '#a7f3d0'}`,
              }}
            >
              {generating && <span>Generating “{selectedReportName}” from the server…</span>}
              {!generating && genError && <span>⚠ {genError}</span>}
              {!generating && !genError && currentReport && (
                <span>
                  ✓ Report #{currentReport.id} ready ({currentReport.formats?.join(', ')}).
                  {downloadingFormat ? ` Downloading ${downloadingFormat}…` : ' Use the Download button to save it.'}
                </span>
              )}
            </div>
          )}

          {selectedView === 'Graphical View' ? (
            /* Graphical View dynamic spline charts grid */
            <div className="reports-graphs-wrapper" style={{ flex: 1, overflowY: 'auto', marginTop: '8px', paddingRight: '4px' }}>
              <div className="analytics-graphs-grid" style={{ padding: '4px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {paramValue.map(param => {
                  const series = stationValue.map(station => ({
                    name: station === 'Lafarge Cems' || station === 'Lafarge CEMS' ? t('live.lafarge_cems', 'Lafarge Cems') :
                          station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                          station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                          station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station,
                    data: getSeriesData(station, param),
                    color: STATION_COLORS[station] || '#00b8c8'
                  }));

                  const chartOptionsBase = {
                    chart: {
                      type: 'spline',
                      backgroundColor: 'transparent',
                      height: 180,
                      style: { fontFamily: "'Roboto', sans-serif" },
                      spacing: [10, 5, 10, 5],
                    },
                    title: { text: null },
                    xAxis: {
                      categories: getCategories(),
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

                  const paramOptions = {
                    ...chartOptionsBase,
                    series: series,
                    yAxis: {
                      ...chartOptionsBase.yAxis,
                      title: { text: getParamUnit(param) }
                    }
                  };

                  return (
                    <div className="analytics-graph-card" key={param} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '16px' }}>
                      <div className="graph-card-header">
                        <h3 className="graph-param-title" style={{ color: '#009fac', fontSize: '1rem', fontWeight: '800', margin: '0 0 10px 0' }}>{param}</h3>
                        <span className="graph-unit-label" style={{ background: 'rgba(0,159,172,0.1)', color: '#009fac', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{getParamUnit(param)}</span>
                      </div>
                      
                      <div className="graph-canvas-wrapper" style={{ height: '180px' }}>
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

                      <div className="graph-legend-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {stationValue.map(station => (
                          <div className="legend-item" key={station} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="legend-box" style={{ background: STATION_COLORS[station] || '#00b8c8', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563' }}>
                              {station === 'Lafarge Cems' || station === 'Lafarge CEMS' ? t('live.lafarge_cems', 'Lafarge Cems') :
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
            </div>
          ) : (
            /* Tabular View with sticky header and scrollable body */
            <>
              {/* Desktop View Table */}
              <div className="reports-table-wrapper" style={{ flex: 1, overflowY: 'auto', marginTop: '8px', borderRadius: '12px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        {t('datacapture.sno', 'S.No')}
                      </th>
                      {previewCols.map((c) => (
                        <th key={c.key} style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr><td colSpan={previewCols.length + 1} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                        {currentReport ? 'No data for the selected filters and date range.' : 'Choose a report from “Generate Report” to see a preview.'}
                      </td></tr>
                    ) : pageRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                        {previewCols.map((c) => (<td key={c.key}>{row[c.key]}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list (generic, one card per preview row) */}
              <div className="reports-mobile-accordion-list" style={{ flex: 1, marginTop: '8px' }}>
                {pageRows.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                    {currentReport ? 'No data for the selected filters and date range.' : 'Choose a report from “Generate Report” to see a preview.'}
                  </div>
                ) : pageRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="reports-mobile-card"
                    style={{
                      background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '12px', padding: '14px 16px'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: '700', marginBottom: '8px' }}>
                      #{(safePage - 1) * PAGE_SIZE + idx + 1}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                      {previewCols.map((c) => (
                        <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>{c.header}</span>
                          <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '700' }}>{row[c.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination (client-side over the preview rows) */}
              {previewRows.length > 0 && (
                <div className="reports-pagination-container" style={{ marginTop: '10px' }}>
                  <div className="spacer-element"></div>
                  <div className="reports-pagination" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', marginInlineEnd: '8px' }}>
                      {currentReport?.preview?.truncated
                        ? `first ${previewRows.length} of ${currentReport.preview.totalRows} rows`
                        : `${previewRows.length} rows`} · page {safePage}/{totalPages}
                    </span>
                    <button className="reports-page-btn arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                      &lt;
                    </button>
                    {pageWindow.map(n => (
                      <button
                        key={n}
                        className={`reports-page-btn ${safePage === n ? 'active' : ''}`}
                        onClick={() => setCurrentPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button className="reports-page-btn arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default DataCapture;
