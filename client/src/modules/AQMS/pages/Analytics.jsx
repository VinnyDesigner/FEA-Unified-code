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
  'Lafarge Cems': '#ec4899'
};

const getParamUnit = (param) => {
  const units = {
    'SO2': 'ppb', 'NO2': 'ppb', 'CO': 'ppb', 'PM10': 'µg/m³', 'PM2.5': 'µg/m³',
    'O3': 'ppb', 'CO2': 'ppm', 'CH4': 'ppb', 'H2S': 'ppb', 'NMHC': 'ppb',
    'Temperature': '°C', 'Humidity': '%', 'Wind Speed': 'Km/h'
  };
  return units[param] || 'ppb';
};

const generateChartData = (station, parameter) => {
  const seed = (station.charCodeAt(0) || 1) + (parameter.charCodeAt(0) || 1);
  const baseMap = {
    'SO2': 15, 'NO2': 25, 'CO': 0.4, 'PM10': 45, 'PM2.5': 20,
    'CO2': 400, 'O3': 35, 'CH4': 1.8, 'H2S': 2, 'NMHC': 1.2,
    'Temperature': 26, 'Humidity': 65, 'Wind Speed': 12
  };
  const base = baseMap[parameter] || 15;
  const fluctuation = base * 0.4;
  
  const data = [];
  for (let i = 0; i < 25; i++) {
    const val = base + Math.sin((i + seed) * 0.5) * fluctuation + Math.cos((i * 2 + seed) * 0.3) * (fluctuation * 0.3);
    data.push(parseFloat(val.toFixed(parameter === 'CO' || parameter === 'CH4' || parameter === 'NMHC' ? 2 : 1)));
  }
  return data;
};

const Analytics = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  // Set highly comparative initial states as requested
  const [selectedStations, setSelectedStations] = useState(['City Centre', 'Mobile Station', 'Qidfa']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Graphical View');
  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);
  
  // Custom date range states
  const [startDate, setStartDate] = useState('2026-02-01');
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [endDate, setEndDate] = useState('2026-02-24');
  const [activeAccordionIdx, setActiveAccordionIdx] = useState(null);

  const generateTabularData = () => {
    const times = [
      '24 Feb 2026 11:30',
      '24 Feb 2026 11:35',
      '24 Feb 2026 11:40',
      '24 Feb 2026 11:45',
      '24 Feb 2026 11:50',
      '24 Feb 2026 11:55',
      '24 Feb 2026 12:00',
      '24 Feb 2026 12:05',
      '24 Feb 2026 12:10'
    ];
    
    const data = [];
    times.forEach(time => {
      selectedStations.forEach(station => {
        const values = {};
        selectedParams.forEach(param => {
          const seed = (station.charCodeAt(0) || 1) + (param.charCodeAt(0) || 1) + time.charCodeAt(time.length - 1);
          const baseMap = {
            'SO2': 15, 'NO2': 25, 'CO': 0.4, 'PM10': 45, 'PM2.5': 20,
            'CO2': 400, 'O3': 35, 'CH4': 1.8, 'H2S': 2, 'NMHC': 1.2,
            'Temperature': 26, 'Humidity': 65, 'Wind Speed': 12
          };
          const base = baseMap[param] || 15;
          const val = base + Math.sin(seed * 0.5) * (base * 0.2);
          values[param] = parseFloat(val.toFixed(param === 'CO' || param === 'CH4' || param === 'NMHC' ? 2 : 1)) + ' ' + getParamUnit(param);
        });
        data.push({
          time,
          station: station === 'Lafarge Cems' ? t('live.lafarge_cems', 'Lafarge Cems') :
                   station === 'City Centre' ? t('live.city_centre', 'City Centre') :
                   station === 'Mobile Station' ? t('live.mobile_station', 'Mobile Station') :
                   station === 'Qidfa' ? t('live.qidfa', 'Qidfa') : station,
          values
        });
      });
    });
    return data;
  };

  const chartOptionsBase = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 200, /* Reduced from 300 to make the graph sleek and compact */
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

  return (
    <div className="aqms-analytics-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          {selectedView === 'Tabular View' ? (
            <>
              <h1 className="tabular-title">Tabular Form</h1>
              <p className="tabular-date">24 Feb 2026 11:30:42</p>
            </>
          ) : (
            <>
              <h1>{t('nav.analytics', 'Analytics')}</h1>
              <p className="header-date">24 Feb 2026 11:30:42</p>
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
                      {["City Centre", "Mobile Station", "Qidfa", "Lafarge Cems"].map(option => {
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
              {generateTabularData().map((row, idx) => {
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
                    <th>Date & Time</th>
                    <th>Station Name</th>
                    {selectedParams.map(param => (
                      <th key={param}>{param}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generateTabularData().map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.time}</td>
                      <td>{row.station}</td>
                      {selectedParams.map(param => (
                        <td key={param}>{row.values[param] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="tabular-pagination-container">
              <button className="tab-page-btn">&lt;</button>
              <button className="tab-page-btn">1</button>
              <button className="tab-page-btn">2</button>
              <button className="tab-page-btn active">3</button>
              <button className="tab-page-btn">4</button>
              <button className="tab-page-btn">5</button>
              <button className="tab-page-btn">&gt;</button>
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
                      data: generateChartData(station, param),
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
                        <div className="graph-card-header">
                          <h3 className="graph-param-title">{param}</h3>
                          <span className="graph-unit-label">{getParamUnit(param)}</span>
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
              data: generateChartData(station, param),
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
                <div className="graph-card-header">
                  <h3 className="graph-param-title">{param}</h3>
                  <span className="graph-unit-label">{getParamUnit(param)}</span>
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
      </div>
    </div>
  );
};

export default Analytics;
