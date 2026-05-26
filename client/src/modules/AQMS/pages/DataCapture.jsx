import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useLanguage } from '../contexts/LanguageContext';

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

const generateChartData = (station, parameter) => {
  const seed = (station.charCodeAt(0) || 1) + (parameter.charCodeAt(0) || 1);
  const baseMap = {
    'SO2': 15, 'H2S': 2, 'NO2': 25, 'CO': 0.4, 'O3': 35, 'PM2.5': 20, 'PM10': 45
  };
  const base = baseMap[parameter] || 10;
  const data = [];
  for (let i = 0; i < 25; i++) {
    const sinVal = Math.sin((i + seed) * 0.4) * (base * 0.25);
    const cosVal = Math.cos((i - seed) * 0.7) * (base * 0.1);
    const noise = (Math.sin(i * 1.5) * 0.05) * base;
    let val = base + sinVal + cosVal + noise;
    if (val < 0) val = 0;
    data.push(parseFloat(val.toFixed(parameter === 'CO' ? 2 : 1)));
  }
  return data;
};

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
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const [selectedStations, setSelectedStations] = useState(['City Centre']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Tabular View');

  // Reports-specific multi-select filters
  const [stationValue, setStationValue] = useState(['City Centre']);
  const [paramValue, setParamValue] = useState(['SO2', 'H2S']);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-30');

  const [stationOpen, setStationOpen] = useState(false);
  const [paramOpen, setParamOpen] = useState(false);

  // Multi-level download dropdown states
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [activeDownloadCategory, setActiveDownloadCategory] = useState(null);
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

  // Mobile responsive accordion states
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (no) => {
    setExpandedCards(prev => ({
      ...prev,
      [no]: !prev[no]
    }));
  };

  return (
    <div className="aqms-reports-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{t('nav.reports', 'Reports')}</h1>
          <p className="header-date">24 Feb 2026 11:30:42</p>
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
                 : stationValue.length === 4
                   ? t('filter.all_stations', 'All Stations')
                   : stationValue.map(s => t(`live.${s.toLowerCase().replace(/ /g, '_')}`, s)).join(', ')}
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${stationOpen ? 'open' : ''}`}>
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>

             {stationOpen && (
               <div className="reports-sub-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                 {["City Centre", "Mobile Station", "Qidfa", "Lafarge CEMS"].map(option => {
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
                 : paramValue.length === 7
                   ? t('filter.all_parameters', 'All Parameters')
                   : paramValue.join(', ')}
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${paramOpen ? 'open' : ''}`}>
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>

             {paramOpen && (
               <div className="reports-sub-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                 {["SO2", "H2S", "NO2", "CO", "O3", "PM2.5", "PM10"].map(option => {
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
                                setSelectedReportName(item);
                                setShowReport(true);
                                setGenerateDropdownOpen(false);
                                setActiveReportCategory(null);
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
                                setSelectedReportName(item);
                                setShowReport(true);
                                setGenerateDropdownOpen(false);
                                setActiveReportCategory(null);
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
                onClick={() => {
                  setDownloadOpen(!downloadOpen);
                  setActiveDownloadCategory(null);
                }}
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
                      onClick={() => {
                        handleDownload("Report", format);
                        setDownloadOpen(false);
                      }}
                    >
                      {format}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                    data: generateChartData(station, param),
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
                      categories: [
                        '9:30PM', '', '10:00PM', '', '10:30PM', '', '11:00PM', '',
                        '11:30PM', '', '12:00AM', '', '12:30AM', '', '1:00AM', '',
                        '1:30AM', '', '2:00AM', '', '2:30AM', '', '3:00AM', '', '3:30AM'
                      ],
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.sno', 'S.No')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.station_name', 'Station Name')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.parameter', 'Parameter')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.expected_records', 'No.Of Expected Records')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.valid_records', 'No.Of Valid Records')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                      <th style={{ position: 'sticky', top: 0, background: '#e0f2f4', zIndex: 10, boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          {t('datacapture.percent_avail', 'Percent Availability')}
                          <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 1, station: "City Center", param: "SO2, H2S", expected: 24, valid: 24, percent: "100.00" },
                      { no: 2, station: "City Center", param: "H2S", expected: 24, valid: 24, percent: "100.00" },
                      { no: 3, station: "City Center", param: "NO2", expected: 24, valid: 24, percent: "100.00" },
                      { no: 4, station: "City Center", param: "CO", expected: 24, valid: 24, percent: "100.00" },
                      { no: 5, station: "City Center", param: "O3", expected: 24, valid: 24, percent: "100.00" },
                      { no: 6, station: "City Center", param: "PM2.5", expected: 24, valid: 24, percent: "100.00" },
                      { no: 7, station: "City Center", param: "PM10", expected: 24, valid: 24, percent: "100.00" },
                      { no: 8, station: "City Center", param: "CH4", expected: 24, valid: 24, percent: "100.00" },
                      { no: 9, station: "City Center", param: "NMHC", expected: 24, valid: 24, percent: "100.00" }
                    ].map(row => (
                      <tr key={row.no}>
                        <td>{row.no}</td>
                        <td>{row.station === 'City Center' || row.station === 'City Centre' ? t('live.city_centre', 'City Centre') : row.station}</td>
                        <td>{row.param}</td>
                        <td>{row.expected}</td>
                        <td>{row.valid}</td>
                        <td>{row.percent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Accordion Cards View */}
              <div className="reports-mobile-accordion-list" style={{ flex: 1, marginTop: '8px' }}>
                {[
                  { no: 1, station: "City Center", param: "SO2, H2S", expected: 24, valid: 24, percent: "100.00" },
                  { no: 2, station: "City Center", param: "H2S", expected: 24, valid: 24, percent: "100.00" },
                  { no: 3, station: "City Center", param: "NO2", expected: 24, valid: 24, percent: "100.00" },
                  { no: 4, station: "City Center", param: "CO", expected: 24, valid: 24, percent: "100.00" },
                  { no: 5, station: "City Center", param: "O3", expected: 24, valid: 24, percent: "100.00" },
                  { no: 6, station: "City Center", param: "PM2.5", expected: 24, valid: 24, percent: "100.00" },
                  { no: 7, station: "City Center", param: "PM10", expected: 24, valid: 24, percent: "100.00" },
                  { no: 8, station: "City Center", param: "CH4", expected: 24, valid: 24, percent: "100.00" },
                  { no: 9, station: "City Center", param: "NMHC", expected: 24, valid: 24, percent: "100.00" }
                ].map(row => {
                  const isExpanded = !!expandedCards[row.no];
                  return (
                    <div 
                      key={row.no} 
                      className={`reports-mobile-card ${isExpanded ? 'expanded' : ''}`}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* CARD HEADER */}
                      <div 
                        className="reports-mobile-card-header"
                        onClick={() => toggleCard(row.no)}
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? '#e0f2f4' : '#ffffff',
                          transition: 'background 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '800' }}>
                              {row.station === 'City Center' || row.station === 'City Centre' ? t('live.city_centre', 'City Centre') : row.station}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: '#009fac',
                              background: 'rgba(0, 159, 172, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontWeight: '700'
                            }}>
                              {row.param}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>
                            24 Feb 2026 11:30:42
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: '#0d9488',
                            background: '#ccfbf1',
                            padding: '2px 8px',
                            borderRadius: '9999px'
                          }}>
                            {row.percent}%
                          </span>
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#6b7280" 
                            strokeWidth="2.5"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* EXPANDED CONTENT */}
                      {isExpanded && (
                        <div 
                          className="reports-mobile-card-body"
                          style={{
                            padding: '16px',
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            background: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          {/* Pollutants details */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>{t('datacapture.parameter', 'Parameter')}</span>
                              <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '700' }}>{row.param}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>{isRtl ? 'نطاق التاريخ' : 'Date Range'}</span>
                              <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '700' }}>{startDate} {isRtl ? 'إلى' : 'to'} {endDate}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>{t('datacapture.expected_records', 'Expected Records')}</span>
                              <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '700' }}>{row.expected}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }}>{t('datacapture.valid_records', 'Valid Records')}</span>
                              <span style={{ fontSize: '0.85rem', color: '#1f2937', fontWeight: '700' }}>{row.valid}</span>
                            </div>
                          </div>

                          <div style={{ borderTop: '1px dashed rgba(0,0,0,0.08)', margin: '4px 0' }}></div>

                          {/* Pollutant stack with units - Responsive 3-column grid layout */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {isRtl ? 'قيم الملوثات' : 'Pollutant Values'}
                            </div>
                            <div className="reports-pollutants-grid">
                              {[
                                { name: 'SO2', val: '12.4', unit: 'ppb' },
                                { name: 'NO2', val: '24.1', unit: 'ppb' },
                                { name: 'CO', val: '0.45', unit: 'ppm' },
                                { name: 'PM10', val: '32.0', unit: 'µg/m³' },
                                { name: 'PM2.5', val: '15.2', unit: 'µg/m³' }
                              ].map(poll => (
                                <div 
                                  key={poll.name} 
                                  className="reports-pollutant-grid-item"
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px 6px',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1.5px solid rgba(0, 159, 172, 0.08)',
                                    textAlign: 'center'
                                  }}
                                >
                                  <span style={{ fontSize: '0.72rem', color: '#4b5563', fontWeight: '700', marginBottom: '4px' }}>{poll.name}</span>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#111827', fontWeight: '800' }}>{poll.val}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: '500', marginLeft: '1px' }}>{poll.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Pagination placed exactly at bottom-right */}
              <div className="reports-pagination-container" style={{ marginTop: '10px' }}>
                <div className="spacer-element"></div>
                <div className="reports-pagination">
                  <button className="reports-page-btn arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                    &lt;
                  </button>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={`reports-page-btn ${currentPage === n ? 'active' : ''}`}
                      onClick={() => setCurrentPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button className="reports-page-btn arrow" onClick={() => setCurrentPage(p => Math.min(5, p + 1))}>
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default DataCapture;
