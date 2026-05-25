import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
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

const createCustomIcon = (value, color) => {
  const isYellow = (color === '#fcd34d');
  const textColor = isYellow ? '#854d0e' : 'white';
  return L.divIcon({
    className: 'custom-map-marker-icon',
    html: `<div class="custom-marker-pill" style="background:${color}; color:${textColor};">${value}</div>`,
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
  { icon: <PM25Icon />,                    name: 'PM2.5',         val: '9',    unit: '\u00B5g/m\u00B3', statusColor: '#fcd34d' },
  { icon: <PM10Icon />,                    name: 'PM10',          val: '18',   unit: '\u00B5g/m\u00B3', statusColor: '#f97316' },
  { icon: <ChemicalIcon label="CO" />,     name: 'CO',            val: '0.3',  unit: 'ppb',             statusColor: '#84cc16' },
  { icon: <ChemicalIcon label="O\u2083" />,name: 'O\u2083',       val: '38',   unit: 'ppb',             statusColor: '#fcd34d' },
  { icon: <ChemicalIcon label="NO\u2082" />,name:'NO\u2082',      val: '12',   unit: 'ppb',             statusColor: '#fcd34d' },
  { icon: <ChemicalIcon label="SO\u2082" />,name:'SO\u2082',      val: '03',   unit: 'ppb',             statusColor: '#f97316' },
  { icon: <ChemicalIcon label="CO\u2082" />,name:'CO\u2082',      val: '04',   unit: 'ppm',             statusColor: '#fcd34d' },
  { icon: <ChemicalIcon label="CH\u2084" />,name:'CH\u2084',      val: '0.1',  unit: 'ppb',             statusColor: '#f97316' },
  { icon: <ChemicalIcon label="H\u2082S" />,name:'H\u2082S',      val: '0.02', unit: 'ppm',             statusColor: '#fcd34d' },
];

const LiveData = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const [selectedStations, setSelectedStations] = useState(['City Centre']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Graph View');

  // Concentration parameter multi-select states
  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);

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
      categories: ['1:00PM', '2:00PM', '3:00PM', '4:00PM', '5:00PM', '6:00PM', '7:00PM', '8:00PM', '9:00PM', '10:00PM', '11:00PM', '12:00PM', '1:00AM'],
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      labels: {
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
              <span style="width:10px; height:10px; background:#f97316; border-radius:50%; display:inline-block;"></span>
              <strong style="color:#111; font-size:0.875rem;">${this.y} AQI</strong>
              <span style="color:#6b7280; font-size:0.75rem; margin-left:4px;">20 Feb, 2:00PM</span>
            </div>
            <div style="color:#6b7280; font-size:0.72rem; font-weight:500;">PM10 - 50 ug/m³</div>
          </div>
        `;
      }
    },
    plotOptions: {
      spline: {
        lineWidth: 3,
        color: '#f97316',
        marker: {
          enabled: true,
          radius: 4,
          fillColor: '#f97316',
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        states: { hover: { lineWidth: 4 } }
      }
    },
    series: [{
      name: 'AQI Index',
      data: [150, 160, 120, 130, 180, 170, 90, 45, 90, 90, 85, 95, 78]
    }]
  };

  /* ── Highcharts Settings: Last 24hrs Concentration ── */
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
      categories: ['1:00PM', '2:00PM', '3:00PM', '4:00PM', '5:00PM', '6:00PM', '7:00PM', '8:00PM', '9:00PM', '10:00PM', '11:00PM', '12:00PM'],
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      labels: {
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      max: 250,
      tickInterval: 50,
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
      { name: 'SO2',   data: [50, 4, 60, 40, 100, 50, 40, 50, 30, 55, 40, 40], color: '#3b82f6' },
      { name: 'NO2',   data: [15, 2, 45, 50, 40, 50, 50, 80, 70, 55, 40, 30], color: '#0ea5e9' },
      { name: 'CO',    data: [110, 80, 120, 95, 130, 85, 115, 70, 125, 90, 105, 80], color: '#0f766e' },
      { name: 'PM10',  data: [200, 90, 240, 150, 135, 160, 245, 110, 120, 180, 140, 230], color: '#0d9488' },
      { name: 'PM2.5', data: [40, 25, 90, 40, 35, 60, 45, 30, 110, 50, 70, 45], color: '#06b6d4' }
    ].filter(s => selectedParams.includes(s.name))
  };

  return (
    <div className="aqms-live-data-container">
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
              <h1>{t('live.title')}</h1>
              <p className="header-date">24 Feb 2026 11:30:42</p>
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
          {/* ── TOP GRID: AQI + Pollutants ──────────────────── */}
          <div className="top-grid">
        {/* AQI Card */}
        <div className="aqi-card">
          <div className="aqi-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pin-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3" fill="currentColor"/>
            </svg>
            {t('live.city_centre')}
          </div>

          {/* Refresh button */}
          <button className="aqi-refresh-circle-btn" title="Refresh AQI data">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-3.7M22 12.5a10 10 0 0 1-18.8 3.7"/>
            </svg>
          </button>

          <div className="aqi-info">
            <div className="aqi-label">{t('live.aqi_index')}</div>
            <div className="aqi-value">78</div>
          </div>
          <div className="aqi-footer">
            <div className="status-badge">{t('live.moderate')}</div>
            <div className="live-indicator">
              <div className="dot animate-pulse"></div> {t('live.live_aqi')}
            </div>
          </div>
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

          <div className="wind-section" style={{ zIndex: 1, position: 'relative' }}>
            <div className="wind-label">{t('live.wind_speed')}</div>
            <div className="wind-val">16 <span className="wind-unit">Km/h</span></div>
          </div>

          <div className="wind-divider" style={{ zIndex: 1, position: 'relative' }} />

          <div className="wind-section" style={{ zIndex: 1, position: 'relative' }}>
            <div className="wind-label">{t('live.wind_direction')}</div>
            <div className="wind-val">267{'\u00BA'} <span className="wind-unit">w</span></div>
          </div>

          <div className="wind-pill" style={{ zIndex: 1, position: 'relative' }}>{t('live.light_breeze')}</div>
        </div>

        {/* Environmental Grid (2x2) */}
        <div className="env-grid">
          {/* Temperature */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.temperature')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">24.59<span className="env-card-unit">{'\u00BAC'}</span></div>
                <div className="env-card-desc">{t('live.ideal_temp')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Temperature.png" alt="Temperature" />
            </div>
          </div>

          {/* Atmospheric Pressure */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.atmospheric_pressure')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">1008<span className="env-card-unit">mbar</span></div>
                <div className="env-card-desc">{t('live.balanced_pressure')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Atmospheric.png" alt="Atmospheric Pressure" />
            </div>
          </div>

          {/* Solar Radiation */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.solar_radiation')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">1632<span className="env-card-unit">w/m{'\u00B2'}</span></div>
                <div className="env-card-desc">{t('live.high_solar')}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Solar.png" alt="Solar Radiation" />
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.relative_humidity')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">72.2<span className="env-card-unit">%</span></div>
                <div className="env-card-desc">{t('live.humidity_normal')}</div>
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
            {/* Markers styled matching the reference precisely */}
            <Marker position={[25.1288, 56.3265]} icon={createCustomIcon('77', '#fcd34d')}>
              <Tooltip permanent direction="top" offset={[0, -10]} className="custom-map-tooltip-styled">
                Fujairah Stadium
              </Tooltip>
            </Marker>
            <Marker position={[25.1450, 56.3400]} icon={createCustomIcon('45', '#84cc16')} />
            <Marker position={[25.1100, 56.3300]} icon={createCustomIcon('120', '#f97316')} />
            <Marker position={[25.1350, 56.3050]} icon={createCustomIcon('45', '#84cc16')} />
            <Marker position={[25.1200, 56.3550]} icon={createCustomIcon('150', '#ef4444')} />
            <Marker position={[25.1050, 56.3450]} icon={createCustomIcon('180', '#ef4444')} />
            <Marker position={[25.1150, 56.3150]} icon={createCustomIcon('120', '#f97316')} />
          </MapContainer>

          {/* Floating controls */}
          <div className="map-controls">
            <button className="map-btn" title="Fullscreen">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            <button className="map-btn" title="Zoom In" style={{ fontSize: '1.2rem', fontWeight: '700' }}>+</button>
            <button className="map-btn" title="Zoom Out" style={{ fontSize: '1.2rem', fontWeight: '700' }}>−</button>
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
    </div>
  );
};

export default LiveData;


