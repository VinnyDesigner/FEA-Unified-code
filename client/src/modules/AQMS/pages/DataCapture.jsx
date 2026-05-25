import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';


const DataCapture = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const [selectedStations, setSelectedStations] = useState(['City Centre']);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedView, setSelectedView] = useState('Tabular View');

  // Reports-specific multi-select filters
  const [stationValue, setStationValue] = useState(['City Centre']);
  const [paramValue, setParamValue] = useState(['SO2', 'H2S']);
  const [startDate, setStartDate] = useState('1 Jan 2026');
  const [endDate, setEndDate] = useState('30 Jan 2026');

  const [stationOpen, setStationOpen] = useState(false);
  const [paramOpen, setParamOpen] = useState(false);

  // Multi-level download dropdown states
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [activeDownloadCategory, setActiveDownloadCategory] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const downloadMenu = [
    {
      category: "1. Average Reports",
      items: [
        "Basic Data Export",
        "Average Data Trend Report",
        "Data Flag"
      ]
    },
    {
      category: "2. Statistical Reports",
      items: [
        "Concentration Distribution",
        "Data Recovery report",
        "Frequency distribution",
        "Max hourly values",
        "Network data Recovery report",
        "Statistical Report",
        "Violation of standards"
      ]
    },
    {
      category: "3. Summary Reports",
      items: [
        "24 hour avg summary reports",
        "8 hour rolling avg report",
        "Daily parameter report",
        "Daily summary report",
        "Monthly report"
      ]
    },
    {
      category: "4. Met Reports",
      items: [
        "Meteorological summary report",
        "Met data availability report",
        "Hourly met report",
        "Daily/ Monthly met report"
      ]
    }
  ];

  return (
    <div className="aqms-reports-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{showReport ? t('nav.data_summary', 'Data Summary') : t('nav.reports', 'Reports')}</h1>
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

      {/* ── REPORTS CARD ────────────────────────────────── */}
      {/* ── REPORTS CARD ────────────────────────────────── */}
      <div className="reports-card-styled">
        {!showReport ? (
          <>
            <div className="reports-card-header">
              <div className="spacer-element"></div>

              {/* Generate Report button */}
              <button
                className="chart-download-dropdown-btn"
                style={{
                  background: '#009fac',
                  color: 'white',
                  borderColor: '#009fac',
                  padding: '6px 20px',
                  borderRadius: '20px',
                  fontWeight: '700'
                }}
                onClick={() => setShowReport(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '6px' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Generate Report
              </button>
            </div>

            {/* 2x2 Grid Form Content */}
            <div className="reports-grid-form">
              {/* Station dropdown */}
              <div className="reports-form-group">
                <label className="reports-form-label">Station</label>
                <div className="reports-form-input-wrapper" onClick={() => {
                  setStationOpen(!stationOpen);
                  setParamOpen(false);
                }}>
                  <span className="reports-form-value-text">
                    {stationValue.length === 0
                      ? 'Select Station'
                      : stationValue.length === 4
                        ? 'All Stations'
                        : stationValue.join(', ')}
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
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Parameters dropdown */}
              <div className="reports-form-group">
                <label className="reports-form-label">Parameters</label>
                <div className="reports-form-input-wrapper" onClick={() => {
                  setParamOpen(!paramOpen);
                  setStationOpen(false);
                }}>
                  <span className="reports-form-value-text">
                    {paramValue.length === 0
                      ? 'Select Parameter'
                      : paramValue.length === 7
                        ? 'All Parameters'
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
                <label className="reports-form-label">Start Date</label>
                <div className="reports-form-input-wrapper">
                  <span className="reports-form-date-inner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {startDate}
                  </span>
                </div>
              </div>

              {/* End Date input */}
              <div className="reports-form-group">
                <label className="reports-form-label">End Date</label>
                <div className="reports-form-input-wrapper">
                  <span className="reports-form-date-inner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {endDate}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="reports-card-header">
              {/* Back to Filters button */}
              <button
                className="chart-parameter-dropdown-btn"
                onClick={() => setShowReport(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  color: '#4b5563',
                  height: '32px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(90deg)' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Back to Filters
              </button>

              <div className="spacer-element"></div>

              {/* Download Option Dropdown kept separately on this page */}
              <div style={{ position: 'relative' }}>
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
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }} className={downloadOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {downloadOpen && (
                  <div
                    className="reports-sub-dropdown-menu"
                    style={{
                      minWidth: '220px',
                      right: 0,
                      left: 'auto',
                      overflow: 'visible',
                      padding: '8px 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {downloadMenu.map(menu => (
                      <div
                        key={menu.category}
                        className="popover-item"
                        style={{
                          position: 'relative',
                          padding: '10px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setActiveDownloadCategory(menu.category)}
                        onMouseLeave={() => setActiveDownloadCategory(null)}
                        onClick={() => setActiveDownloadCategory(activeDownloadCategory === menu.category ? null : menu.category)}
                      >
                        <span className="popover-item-label neutral-label" style={{ fontSize: '0.85rem' }}>{menu.category}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ transform: 'rotate(-90deg)', marginLeft: '8px' }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>

                        {activeDownloadCategory === menu.category && (
                          <div
                            className="popover-sub-menu"
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 'calc(100% + 4px)',
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
                                style={{ padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer' }}
                                onClick={() => {
                                  console.log(`Downloading report: ${item}`);
                                  setDownloadOpen(false);
                                  setActiveDownloadCategory(null);
                                }}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Glassmorphic Data Table matching screenshot exactly */}
            <div className="reports-table-wrapper" style={{ flex: 1, overflowX: 'auto', marginTop: '14px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        S.No
                        <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Station Name
                        <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Parameter
                        <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        No.Of Expected Records
                        <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        No.Of Valid Records
                        <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>▲▼</span>
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Percent Availability
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
                      <td>{row.station}</td>
                      <td>{row.param}</td>
                      <td>{row.expected}</td>
                      <td>{row.valid}</td>
                      <td>{row.percent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Bottom Pagination placed exactly at bottom-right */}
        <div className="reports-pagination-container">
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
      </div>
    </div>
  );
};

export default DataCapture;
