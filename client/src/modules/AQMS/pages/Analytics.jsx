import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../components/Dropdown';
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

const Analytics = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const [selectedStations, setSelectedStations] = useState(['City Centre']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Graph View');
  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);

  const options = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 520,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [20, 20, 20, 20],
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
      max: 120,
      tickInterval: 20,
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
    },
    series: [
      {
        name: 'SO2',
        data: [50, 4, 60, 40, 100, 50, 40, 50, 30, 55, 40, 40, 105, 50, 15, 60, 30, 25, 60, 60, 40, 35, 105, 50, 30],
        color: '#84cc16'
      },
      {
        name: 'H2S',
        data: [15, 2, 45, 50, 40, 50, 50, 80, 70, 55, 40, 30, 25, 25, 20, 25, 40, 45, 30, 35, 25, 25, 30, 25, 60],
        color: '#06b6d4'
      }
    ]
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

                {/* Parameter Dropdown (Multi-select) */}
                <div 
                  className="popover-item parameter-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'parameter' ? null : 'parameter');
                  }}
                >
                  <span className="popover-item-label neutral-label">
                    {selectedParams.length === 0 
                      ? 'Select Parameter' 
                      : selectedParams.length === 5 
                        ? 'All Parameters' 
                        : selectedParams.join(', ')}
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

      {selectedView === 'Tabular View' ? (
        <div className="tabular-form-container">
          <div className="tabular-card">
            <table className="tabular-table">
              <thead>
                <tr>
                  <th>
                    Date and Time 
                    <span className="sort-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </th>
                  <th>
                    Station Name 
                    <span className="sort-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </th>
                  <th>
                    Parameter 
                    <span className="sort-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>SO2, H2S</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>H2S</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>NO2</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>CO</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>O3</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>PM2.5</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>PM10</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>CH4</td></tr>
                <tr><td>24 Feb 2026 11:30:42</td><td>City Center</td><td>NMHC</td></tr>
              </tbody>
            </table>
            
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
      ) : (
        <>
          {/* ── CHART CARD ──────────────────────────────────── */}
          <div className="chart-card-styled">
        {/* Controls top-right */}
        <div className="chart-card-header">
          <div className="spacer-element"></div>
          
          {/* Download Button Dropdown */}
          <button className="chart-download-dropdown-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight: '6px'}}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Highcharts React element */}
        <div className="chart-canvas-wrapper">
          <HighchartsReactComponent
            highcharts={Highcharts}
            options={options}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>

        {/* Legend matching reference exactly */}
        <div className="chart-legend-container">
          <div className="legend-item">
            <span className="legend-box" style={{ background: '#84cc16' }}></span>
            SO2
          </div>
          <div className="legend-item">
            <span className="legend-box" style={{ background: '#06b6d4' }}></span>
            H2S
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
