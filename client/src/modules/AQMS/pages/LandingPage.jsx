import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/index.css';
import '../styles/LandingPage.css';

// Custom marker icon creation function
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

const createCustomIcon = (value, bgColor) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${bgColor}; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 14px;">${value}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, lang, toggleLanguage } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const heroSectionRef = useRef(null);
  const mapSectionRef = useRef(null);
  const footerSectionRef = useRef(null);

  React.useEffect(() => {
    document.body.classList.add('aqms-theme');
    return () => {
      document.body.classList.remove('aqms-theme');
    };
  }, []);

  React.useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add('aqms-menu-open');
    } else {
      document.body.classList.remove('aqms-menu-open');
    }
    return () => document.body.classList.remove('aqms-menu-open');
  }, [mobileNavOpen]);

  const scrollToHero = (e) => {
    e.preventDefault();
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  const scrollToMap = (e) => {
    e?.preventDefault();
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  const scrollToFooter = (e) => {
    e.preventDefault();
    footerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  // Highcharts options for Hourly Trend
  const trendOptions = {
    chart: { type: 'area', backgroundColor: 'transparent', height: 160, margin: [10, 0, 20, 30] },
    title: { text: '' },
    xAxis: { categories: ['1:00PM', '2:00PM', '3:00PM', '4:00PM', '5:00PM', '6:00PM', '7:00PM'], visible: true, lineWidth: 0, tickWidth: 0, reversed: lang === 'ar' },
    yAxis: { title: { text: '' }, gridLineColor: '#eee', labels: { style: { fontSize: '9px', color: '#999' } }, opposite: lang === 'ar' },
    legend: { enabled: false },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [ [0, 'rgba(252, 211, 77, 0.6)'], [1, 'rgba(252, 211, 77, 0.1)'] ]
        },
        marker: { radius: 2 },
        lineWidth: 2,
        states: { hover: { lineWidth: 2 } },
        threshold: null
      }
    },
    series: [{ name: t('landing.map.aqi_index', 'AQI'), data: [50, 60, 45, 75, 42, 60, 45], color: '#f59e0b' }],
    credits: { enabled: false }
  };

  return (
    <div className="landing-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`nav-overlay ${mobileNavOpen ? 'active' : ''}`} onClick={() => setMobileNavOpen(false)}></div>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <img src="/assets/AQMS/logo.png" alt="Fujairah Environment Authority" />
        </div>
        <div className={`landing-links ${mobileNavOpen ? 'active' : ''}`}>
          <div className="drawer-header">
            <h3>Menu</h3>
            <button className="close-btn" onClick={() => setMobileNavOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <a href="#" onClick={scrollToHero}>{t('landing.nav.our_air_quality')}</a>
          <a href="#" onClick={scrollToMap}>{t('landing.nav.live_air_quality')}</a>
          <a href="#" onClick={scrollToFooter}>{t('landing.nav.contact_us')}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={toggleLanguage} 
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '2px solid rgba(0,0,0,0.2)',
              background: 'transparent',
              color: '#333',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button className="landing-login-btn" onClick={() => navigate('/AQMS/login')}>
            {t('login.title', 'Login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={heroSectionRef} className="landing-hero">
        <div className="landing-content">
          <h1>{t('landing.hero.title')}<br />{t('landing.hero.subtitle')}</h1>
          
          <button className="landing-cta" onClick={() => navigate('/AQMS/live-data')}>
            {t('landing.hero.view_live')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Stats Grid */}
          <div className="landing-stats">
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.current_aqi')}</div>
              <div className="stat-value">42</div>
              <div className="stat-desc">{t('landing.stats.good')}</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.active_stations')}</div>
              <div className="stat-value">12</div>
              <div className="stat-desc">{t('landing.stats.monitoring')}</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-label">{t('landing.stats.coverage_area')}</div>
              <div className="stat-value">100%</div>
              <div className="stat-desc">{t('landing.stats.fujairah')}</div>
            </div>
          </div>
        </div>

        {/* Decorative Radar/Map Overlays */}
        <div className="landing-radar left-radar">
          <div className="radar-circle"><div className="radar-text">AQI</div></div>
        </div>
        <div className="landing-radar right-radar">
           <div className="radar-circle"><div className="radar-text">AQI</div></div>
        </div>
        <svg className="landing-map-overlay" viewBox="0 0 100 200" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
          <path d="M50,10 L80,15 L90,40 L85,60 L95,80 L80,100 L70,120 L80,140 L70,160 L50,180 L40,190 L30,170 L20,150 L25,130 L15,110 L25,90 L15,70 L20,50 L30,30 Z" />
          <path d="M50,10 L30,30" strokeDasharray="2,2"/>
        </svg>

        <div className="landing-arrow-down" onClick={scrollToMap} style={{ cursor: 'pointer', padding: '20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 10 12 15 17 10"></polyline>
            <polyline points="7 14 12 19 17 14"></polyline>
          </svg>
        </div>
      </main>

      {/* EXTENDED SECTION: Live Air Quality Map */}
      <section className="landing-map-section" ref={mapSectionRef}>
        <div className="map-section-header">
          <h2>{t('landing.map.title')}</h2>
          <p>{t('landing.map.desc')}</p>
        </div>

        <div className="map-dashboard-container">
          
          <div className="map-background">
            <MapContainer center={[25.1288, 56.3265]} zoom={11} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[25.1288, 56.3265]} icon={createCustomIcon('45', '#84cc16')} />
              <Marker position={[25.1450, 56.3400]} icon={createCustomIcon('32', '#84cc16')} />
              <Marker position={[25.1100, 56.3300]} icon={createCustomIcon('35', '#84cc16')} />
              <Marker position={[25.1350, 56.3050]} icon={createCustomIcon('48', '#84cc16')} />
              <Marker position={[25.1200, 56.3550]} icon={createCustomIcon('78', '#fcd34d')} />
              <Marker position={[25.1050, 56.3450]} icon={createCustomIcon('67', '#fcd34d')} />
              <Marker position={[25.1150, 56.3150]} icon={createCustomIcon('42', '#84cc16')} />
              <Marker position={[25.0950, 56.3250]} icon={createCustomIcon('79', '#fcd34d')} />
            </MapContainer>
          </div>

          {/* Top Selectors */}
          <div className="map-top-selectors" style={{ left: lang === 'ar' ? 'auto' : '396px', right: lang === 'ar' ? '396px' : 'auto' }}>
            <div className="custom-select">
              {t('landing.map.city_centre')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div className="custom-select small">
              {t('landing.map.aqi_index', 'AQI')}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          {/* Left Panel: City Centre Specifics */}
          <div className="map-panel-left" style={{ left: lang === 'ar' ? 'auto' : '20px', right: lang === 'ar' ? '20px' : 'auto' }}>
            <div className="city-card">
              <div className="city-card-header">
                <div className="aqi-circle good">
                  <div className="aqi-val">45</div>
                  <div className="aqi-status">{t('landing.stats.good')}</div>
                </div>
                <h3>{t('landing.map.city_centre')}</h3>
                <div className="subtitle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginInlineEnd: '4px' }}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                  {t('landing.map.aqi_index')}
                </div>
              </div>
              
              <div className="pollutants-grid">
                <div className="p-item">
                  <div className="p-head"><span className="p-dot good"></span> {t('landing.stats.good')}</div>
                  <div className="p-body">
                    <div className="p-sym">CO</div>
                    <div className="p-val-container">
                      <div className="p-val">229</div>
                      <span className="p-unit">µg/m³</span>
                    </div>
                  </div>
                </div>
                <div className="p-item moderate">
                  <div className="p-head"><span className="p-dot moderate"></span> {t('landing.dash.moderate')}</div>
                  <div className="p-body">
                    <div className="p-sym">NO2</div>
                    <div className="p-val-container">
                      <div className="p-val">11</div>
                      <span className="p-unit">ppb</span>
                    </div>
                  </div>
                </div>
                <div className="p-item">
                  <div className="p-head"><span className="p-dot good"></span> {t('landing.stats.good')}</div>
                  <div className="p-body">
                    <div className="p-sym">O3</div>
                    <div className="p-val-container">
                      <div className="p-val">24</div>
                      <span className="p-unit">ppb</span>
                    </div>
                  </div>
                </div>
                <div className="p-item">
                  <div className="p-head"><span className="p-dot good"></span> {t('landing.stats.good')}</div>
                  <div className="p-body">
                    <div className="p-sym">PM10</div>
                    <div className="p-val-container">
                      <div className="p-val">95</div>
                      <span className="p-unit">µg/m³</span>
                    </div>
                  </div>
                </div>
                <div className="p-item moderate">
                  <div className="p-head"><span className="p-dot moderate"></span> {t('landing.dash.moderate')}</div>
                  <div className="p-body">
                    <div className="p-sym">PM2.5</div>
                    <div className="p-val-container">
                      <div className="p-val">15</div>
                      <span className="p-unit">µg/m³</span>
                    </div>
                  </div>
                </div>
                <div className="p-item">
                  <div className="p-head"><span className="p-dot good"></span> {t('landing.stats.good')}</div>
                  <div className="p-body">
                    <div className="p-sym">SO2</div>
                    <div className="p-val-container">
                      <div className="p-val">24</div>
                      <span className="p-unit">µg/m³</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">{t('landing.map.last_updated')}: 2026-02-17 12:51:02</div>
            </div>
          </div>

          <div className="map-panel-right" style={{ left: lang === 'ar' ? '20px' : 'auto', right: lang === 'ar' ? 'auto' : '20px' }}>
            <div className="filter-card">
              <label className="radio-label f-row">
                <input type="radio" name="layer" defaultChecked />
                <span className="custom-radio"></span>
                {t('landing.map.primary')}
              </label>
              <label className="radio-label f-row">
                <input type="radio" name="layer" />
                <span className="custom-radio"></span>
                {t('landing.map.secondary')}
              </label>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label className="radio-label">
                  <input type="radio" name="type" defaultChecked />
                  <span className="custom-radio"></span>
                  {t('landing.map.aqi_index', 'AQI')}
                </label>
                <label className="radio-label">
                  <input type="radio" name="type" />
                  <span className="custom-radio"></span>
                  {t('landing.map.weather')}
                </label>
              </div>

              <div className="f-chips">
                <div className="f-chip active">AQI</div>
                <div className="f-chip">PM10</div>
                <div className="f-chip">SO2</div>
                <div className="f-chip">CO</div>
                <div className="f-chip">NO2</div>
              </div>

              <div className="aqi-scale-container">
                <div className="aqi-scale-bar" style={{ background: lang === 'ar' ? 'linear-gradient(to left, #84cc16, #fcd34d, #f97316, #ef4444, #8b5cf6, #7f1d1d)' : 'linear-gradient(to right, #84cc16, #fcd34d, #f97316, #ef4444, #8b5cf6, #7f1d1d)' }}></div>
                <div className="aqi-scale-labels" style={{ flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }}>
                  <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span><span>500</span>
                </div>
              </div>
            </div>

            <div className="map-controls" style={{ alignSelf: lang === 'ar' ? 'flex-start' : 'flex-end' }}>
              <button className="ctrl-btn" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
              </button>
              <button className="ctrl-btn" onClick={() => {}}>+</button>
              <button className="ctrl-btn" onClick={() => {}}>−</button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Dashboards */}
      <section className="bottom-dashboards" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <div className="dash-card">
          <h4>{t('landing.dash.safety_level')}</h4>
          <div className="gauge-placeholder" style={{ position: 'relative', width: '100%', height: '120px' }}>
            <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e5e7eb" strokeWidth="20" />
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="20" strokeDasharray="282.7" strokeDashoffset="141.35" />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <text x="10" y="120" fontSize="12" fill="#6b7280" textAnchor="middle">0</text>
              <text x="190" y="120" fontSize="12" fill="#6b7280" textAnchor="middle">500</text>
              
              {/* Needle */}
              <g transform={`translate(100, 100) rotate(${lang === 'ar' ? -50 : -45})`}>
                <polygon points="-5,0 5,0 0,-70" fill="#374151" />
                <circle cx="0" cy="0" r="8" fill="#374151" />
                <circle cx="0" cy="0" r="3" fill="white" />
              </g>
            </svg>
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{t('landing.stats.good')}</div>
            </div>
          </div>
        </div>

        <div className="dash-card">
          <h4>{t('landing.dash.pollutant')}</h4>
          <div className="pollutant-highlight">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <div>
                <div className="name">{t('landing.dash.pm10')}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>{t('landing.dash.respirable')}</div>
              </div>
            </div>
            <div className="val">95 µg/m³</div>
          </div>
          
          <h5 style={{ fontSize: '0.75rem', color: '#666', marginBottom: '10px' }}>{t('landing.dash.causes')}</h5>
          <div className="p-tags">
            <span className="p-tag active">{t('landing.dash.suburban')}</span>
            <span className="p-tag">{t('landing.dash.natural')}</span>
          </div>
        </div>

        <div className="dash-card">
          <h4>{t('landing.dash.measures')}</h4>
          <ul className="measures-list">
            <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" style={{marginInlineEnd: '8px'}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> {t('landing.dash.measures.windows')}</li>
            <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" style={{marginInlineEnd: '8px'}}><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path></svg> {t('landing.dash.measures.outdoor')}</li>
            <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" style={{marginInlineEnd: '8px'}}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> {t('landing.dash.measures.mask')}</li>
            <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="2" style={{marginInlineEnd: '8px'}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {t('landing.dash.measures.purifier')}</li>
          </ul>
        </div>

        <div className="dash-card trend-card">
          <div className="trend-header">
            <h4>{t('landing.dash.trend')}</h4>
          </div>
          <div className="chart-wrapper">
            <HighchartsReactComponent highcharts={Highcharts} options={trendOptions} />
          </div>
          <div className="trend-legend">
            <div className="t-leg"><span className="t-dot" style={{background: '#10b981'}}></span> {t('landing.stats.good')}</div>
            <div className="t-leg"><span className="t-dot" style={{background: '#f59e0b'}}></span> {t('landing.dash.moderate')}</div>
            <div className="t-leg"><span className="t-dot" style={{background: '#f97316'}}></span> {t('landing.dash.unhealthy_sg')}</div>
            <div className="t-leg"><span className="t-dot" style={{background: '#ef4444'}}></span> {t('landing.dash.unhealthy')}</div>
            <div className="t-leg"><span className="t-dot" style={{background: '#8b5cf6'}}></span> {t('landing.dash.very_unhealthy')}</div>
            <div className="t-leg"><span className="t-dot" style={{background: '#7f1d1d'}}></span> {t('landing.dash.hazardous')}</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerSectionRef} className="landing-footer">
        <div className="f-left">
          <img src="/assets/AQMS/logo.png" alt="Logo" className="f-logo" />
        </div>
        <div className="f-center">
          <span>{t('landing.footer.copyright')}</span>
          <a href="#">{t('landing.footer.terms')}</a>
          <a href="#">{t('landing.footer.privacy')}</a>
          <a href="#">{t('landing.footer.support')}</a>
        </div>
        <div className="f-right">
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
          <a href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
