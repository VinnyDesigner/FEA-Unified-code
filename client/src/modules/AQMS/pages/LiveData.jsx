import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import Dropdown from '../components/Dropdown';
import { useLanguage } from '../contexts/LanguageContext';

const createCustomIcon = (value, color) => {
  const textColor = (color === '#fcd34d') ? '#854d0e' : 'white';
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="width:28px;height:28px;background:${color};color:${textColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${value}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
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
  { icon: <ChemicalIcon label="H\u2082S" />,name:'H\u2082S',      val: '0.02', unit: 'ppm',             statusColor: '#84cc16' },
];

const LiveData = () => {
  const { t } = useLanguage();
  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          <h1>{t('live.title')}</h1>
          <p>24 Feb 2026 11:30:42</p>
        </div>
        <div className="filters-bar">
          <Dropdown
            label={t('live.view_type')}
            options={[t('live.tabular_view'), t('live.map_view'), t('live.grid_view')]}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
          />
          <Dropdown
            label={t('live.stations')}
            options={[t('live.city_centre'), t('live.mobile_station'), t('live.qidfa'), t('live.lafarge_cems')]}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
          />
          <Dropdown
            label={t('live.date')}
            options={[t('live.today'), t('live.daily'), t('live.monthly'), t('live.yearly')]}
            align="right"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
        </div>
      </div>

      {/* ── TOP GRID: AQI + Pollutants ──────────────────── */}
      <div className="top-grid">
        {/* AQI Card */}
        <div className="aqi-card">
          <div className="aqi-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            </svg>
            {t('live.city_centre')}
          </div>

          {/* Refresh button */}
          <div style={{
            position: 'absolute', top: '14px', right: '14px',
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-3.7M22 12.5a10 10 0 0 1-18.8 3.7"/>
            </svg>
          </div>

          <div className="aqi-info">
            <div className="aqi-label">{t('live.aqi_index')}</div>
            <div className="aqi-value">78</div>
          </div>
          <div className="aqi-footer">
            <div className="status-badge">{t('live.moderate')}</div>
            <div className="live-indicator">
              <div className="dot"></div> {t('live.live_aqi')}
            </div>
          </div>
        </div>

        {/* Pollutants Card */}
        <div className="pollutants-wrapper">
          <h2 className="pollutants-title">{t('live.pollutant_metrics')}</h2>
          <div className="pollutants-list">
            {pollutants.map((p, i) => (
              <div className="pollutant-card" key={i}>
                {p.icon}
                <div className="p-name">{p.name}</div>
                <div className="p-val">{p.val}</div>
                <div className="p-unit">{p.unit}</div>
                <div className="p-status" style={{ background: p.statusColor }} />
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
            <div className="wind-val">267{'\u00BA'} <span className="wind-unit">W</span></div>
          </div>

          <div className="wind-pill" style={{ zIndex: 1, position: 'relative' }}>{t('live.light_breeze')}</div>
        </div>

        {/* Environmental Grid (2x2) */}
        <div className="env-grid">
          {/* Temperature */}
          <div className="env-card">
            <div className="env-card-header">
              <div className="env-label">{t('live.temperature')}</div>
            </div>
            <div className="env-card-body">
              <div className="env-info">
                <div className="env-val">24.59<span className="env-unit">{'\u00BAC'}</span></div>
                <div className="env-desc">{t('live.ideal_temp')}</div>
              </div>
              <img className="env-icon" src="/assets/AQMS/icons/Temperature.png" alt="Temperature" />
            </div>
          </div>

          {/* Atmospheric Pressure */}
          <div className="env-card">
            <div className="env-card-header">
              <div className="env-label">{t('live.atmospheric_pressure')}</div>
            </div>
            <div className="env-card-body">
              <div className="env-info">
                <div className="env-val">1008<span className="env-unit">mbar</span></div>
                <div className="env-desc">{t('live.balanced_pressure')}</div>
              </div>
              <img className="env-icon" src="/assets/AQMS/icons/Atmospheric.png" alt="Atmospheric Pressure" />
            </div>
          </div>

          {/* Solar Radiation */}
          <div className="env-card">
            <div className="env-card-header">
              <div className="env-label">{t('live.solar_radiation')}</div>
            </div>
            <div className="env-card-body">
              <div className="env-info">
                <div className="env-val" style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  1632
                  <span style={{ fontSize: '1rem', fontWeight: '500', lineHeight: '1', marginLeft: '2px' }}>
                    w/m{'\u00B2'}
                  </span>
                </div>
                <div className="env-desc">{t('live.high_solar')}</div>
              </div>
              <img className="env-icon" src="/assets/AQMS/icons/Solar.png" alt="Solar Radiation" />
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="env-card">
            <div className="env-card-header">
              <div className="env-label">{t('live.relative_humidity')}</div>
            </div>
            <div className="env-card-body">
              <div className="env-info">
                <div className="env-val">72.2<span className="env-unit" style={{ fontSize: '1rem', marginLeft: '2px', fontWeight: '500' }}>%</span></div>
                <div className="env-desc">{t('live.humidity_normal')}</div>
              </div>
              <img className="env-icon" src="/assets/AQMS/icons/Humidity.png" alt="Relative Humidity" />
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
            <Marker position={[25.1288, 56.3265]} icon={createCustomIcon('77', '#fcd34d')} />
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
            <button className="map-btn" title="Zoom In" style={{ fontSize: '1.1rem', fontWeight: '700' }}>+</button>
            <button className="map-btn" title="Zoom Out" style={{ fontSize: '1.1rem', fontWeight: '700' }}>−</button>
          </div>

          <div style={{
            position: 'absolute', bottom: '12%', left: '6%',
            fontSize: '2rem', fontWeight: '800', color: '#111',
            textShadow: '0 1px 8px rgba(255,255,255,0.9)',
            zIndex: 1000, pointerEvents: 'none'
          }}>{t('live.fujairah')}</div>
        </div>
      </div>
    </>
  );
};

export default LiveData;
