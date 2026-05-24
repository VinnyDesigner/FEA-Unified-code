import React, { useState } from 'react';
import Dropdown from '../components/Dropdown';
import { useLanguage } from '../contexts/LanguageContext';

const data = [
  { id: 1, station: 'City Center', param: 'SO2, H2S', expected: 24, records: 24, percent: '100.00' },
  { id: 2, station: 'City Center', param: 'H2S',      expected: 24, records: 24, percent: '100.00' },
  { id: 3, station: 'City Center', param: 'NO2',      expected: 24, records: 24, percent: '100.00' },
  { id: 4, station: 'City Center', param: 'CO',       expected: 24, records: 24, percent: '100.00' },
  { id: 5, station: 'City Center', param: 'O3',       expected: 24, records: 24, percent: '100.00' },
  { id: 6, station: 'City Center', param: 'PM2.5',    expected: 24, records: 24, percent: '100.00' },
  { id: 7, station: 'City Center', param: 'PM10',     expected: 24, records: 24, percent: '100.00' },
  { id: 8, station: 'City Center', param: 'CH4',      expected: 24, records: 24, percent: '100.00' },
  { id: 9, station: 'City Center', param: 'NMHC',     expected: 24, records: 24, percent: '100.00' },
];

const SortIcon = () => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '4px', verticalAlign: 'middle', opacity: 0.5 }}>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 0L7.46 6H0.54L4 0Z"/>
    </svg>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ marginTop: '-2px' }}>
      <path d="M4 8L0.54 2H7.46L4 8Z"/>
    </svg>
  </span>
);

const DataCapture = () => {
  const [activeTab, setActiveTab] = useState('capture');
  const [currentPage, setCurrentPage] = useState(3);
  const { t } = useLanguage();

  const recordsLabel = activeTab === 'capture' ? t('datacapture.collected_records') : t('datacapture.valid_records');

  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{t('datacapture.title')}</h1>
          <p>24 Feb 2026 11:30:42</p>
        </div>
        <div className="filters-bar">
          <Dropdown
            label={t('live.stations')}
            options={[t('live.city_centre'), t('live.mobile_station'), t('live.qidfa'), t('live.lafarge_cems')]}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
          />
          <Dropdown
            label={t('analytics.parameters')}
            options={['SO2', 'H2S', 'NO2', 'CO', 'O3', 'PM2.5']}
            isMulti={true}
            defaultSelected={['SO2', 'H2S']}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/></svg>}
          />
          <Dropdown
            label={t('live.date')}
            options={[t('live.today'), t('live.daily'), t('live.monthly'), t('live.yearly')]}
            align="right"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
        </div>
      </div>

      {/* ── TABLE CARD ──────────────────────────────────── */}
      <div className="table-card">
        {/* Sub tabs */}
        <div className="sub-tabs">
          <button
            className={`sub-tab ${activeTab === 'capture' ? 'active' : ''}`}
            onClick={() => setActiveTab('capture')}
          >
            {t('datacapture.tab1')}
          </button>
          <button
            className={`sub-tab ${activeTab === 'valid' ? 'active' : ''}`}
            onClick={() => setActiveTab('valid')}
          >
            {t('datacapture.tab2')}
          </button>
        </div>

        {/* Scrollable table area */}
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('datacapture.sno')} <SortIcon /></th>
                <th>{t('datacapture.station_name')} <SortIcon /></th>
                <th>{t('datacapture.parameter')} <SortIcon /></th>
                <th>{t('datacapture.expected_records')} <SortIcon /></th>
                <th>{recordsLabel} <SortIcon /></th>
                <th>{t('datacapture.percent_avail')} <SortIcon /></th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.station}</td>
                  <td>{row.param}</td>
                  <td>{row.expected}</td>
                  <td>{row.records}</td>
                  <td>{row.percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="page-btn nav" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`page-btn ${currentPage === n ? 'active' : ''}`}
              onClick={() => setCurrentPage(n)}
            >
              {n}
            </button>
          ))}
          <button className="page-btn nav" onClick={() => setCurrentPage(p => Math.min(5, p + 1))}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default DataCapture;
