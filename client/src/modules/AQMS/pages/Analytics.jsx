import React, { useState } from 'react';
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
  const [activeMetric, setActiveMetric] = useState('Min');
  const { t } = useLanguage();

  const options = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: null,
      style: { fontFamily: "'Inter', sans-serif" },
      spacing: [10, 10, 10, 10],
    },
    title: { text: null },
    xAxis: {
      categories: [
        '9:30PM', '', '10:00PM', '', '10:30PM', '', '11:00PM', '',
        '11:30PM', '', '12:00AM', '', '12:30AM', '', '1:00AM', '',
        '1:30AM', '', '2:00AM', '', '2:30AM', '', '3:00AM', '', '3:30AM'
      ],
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.1)',
      labels: {
        style: { fontSize: '0.72rem', color: '#6b7280' },
        step: 1
      },
      tickColor: 'rgba(0,0,0,0.1)',
    },
    yAxis: {
      min: 0,
      max: 120,
      tickInterval: 20,
      title: { text: null },
      gridLineColor: 'rgba(0,0,0,0.06)',
      gridLineDashStyle: 'Solid',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 8,
      borderColor: 'rgba(0,0,0,0.08)',
      shadow: true,
      style: { fontSize: '0.8rem' }
    },
    plotOptions: {
      spline: {
        lineWidth: 2.5,
        marker: { enabled: false, symbol: 'circle', radius: 3 },
        states: { hover: { lineWidth: 3 } }
      }
    },
    series: [
      {
        name: 'SO2',
        data: [50, 4, 60, 40, 100, 50, 40, 50, 30, 55, 40, 40, 105, 50, 15, 60, 30, 25, 60, 60, 40, 35, 105, 50, 50],
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
    <>
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{t('nav.summary')}</h1>
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
            options={['SO2', 'H2S', 'NO2', 'CH4', 'CM2']}
            isMulti={true}
            defaultSelected={['SO2', 'H2S']}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
          />
          <Dropdown
            label={t('analytics.report_type')}
            options={[t('analytics.daily_summary'), t('analytics.hourly_summary')]}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          />
          <Dropdown
            label={t('live.date')}
            options={[t('live.today'), t('live.daily'), t('live.monthly'), t('live.yearly')]}
            align="right"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
        </div>
      </div>

      {/* ── CHART CARD ──────────────────────────────────── */}
      <div className="chart-card">
        {/* Controls top-right */}
        <div className="chart-controls-top">
          <div style={{
            display: 'flex', padding: '8px 20px 8px 10px',
            alignItems: 'center', height: '54px', boxSizing: 'border-box',
            borderRadius: '40px', border: '1px solid #FFF',
            background: 'rgba(255, 255, 255, 0.30)',
            boxShadow: '0 4px 34px 0 rgba(0, 0, 0, 0.21)'
          }}>
            {['Min', 'Max', 'Avg'].map(m => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                style={{
                  padding: '0 16px', height: '38px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none',
                  background: activeMetric === m ? 'white' : 'transparent',
                  borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', color: '#374151',
                  boxShadow: activeMetric === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s'
                }}
              >{t(`analytics.${m.toLowerCase()}`)}</button>
            ))}
          </div>

          {/* Download */}
          <div className="filter-btn" style={{ gap: '6px', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {t('analytics.download')}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0, paddingTop: '12px' }}>
          <HighchartsReactComponent
            highcharts={Highcharts}
            options={options}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: '28px', marginTop: '12px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 500 }}>
            <span style={{ width: '12px', height: '12px', background: '#84cc16', display: 'inline-block', borderRadius: '2px' }}></span>
            SO2
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 500 }}>
            <span style={{ width: '12px', height: '12px', background: '#06b6d4', display: 'inline-block', borderRadius: '2px' }}></span>
            H2S
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
