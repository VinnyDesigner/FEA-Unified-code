import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Layout = ({ children }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Handle Body Scroll Lock ─────────────────────────────────────
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add('aqms-menu-open');
    } else {
      document.body.classList.remove('aqms-menu-open');
    }
    return () => document.body.classList.remove('aqms-menu-open');
  }, [mobileNavOpen]);

  // ── Apply per-route background on body ──────────────────────────
  useEffect(() => {
    const isLiveData = location.pathname === '/AQMS/live-data';
    document.body.style.backgroundImage = isLiveData
      ? "url('/assets/AQMS/innerpageBG.jpg')"
      : "url('/assets/AQMS/innerBg-2.jpg')";
    document.body.style.backgroundSize   = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    return () => {
      // Clean up body style overrides when route changes or component unmounts
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [location.pathname]);

  return (
    <div className="aqms-theme w-full min-h-screen">
      <div className={`nav-overlay ${mobileNavOpen ? 'active' : ''}`} onClick={() => setMobileNavOpen(false)}></div>
      <div className="app-container">
        {/* ── TOP NAV ─────────────────────────────────────── */}
        <header className="top-nav">
          {/* Logo and Hamburger */}
          <div className="logo-container">
            <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <img 
              src="/assets/AQMS/logo-dark.png" 
              alt="Fujairah Environment Authority" 
              className="logo-img" 
            />
          </div>

          {/* Navigation Tabs */}
          <nav className={`nav-tabs ${mobileNavOpen ? 'active' : ''}`}>
            <div className="drawer-header">
              <h3>Menu</h3>
              <button className="close-btn" onClick={() => setMobileNavOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <NavLink
              to="/AQMS/live-data"
              className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}
              onClick={() => setMobileNavOpen(false)}
            >
              {t('nav.live_data')}
            </NavLink>
            <NavLink
              to="/AQMS/analytics"
              className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}
              onClick={() => setMobileNavOpen(false)}
            >
              {t('nav.summary')}
            </NavLink>
            <NavLink
              to="/AQMS/data-capture"
              className={({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')}
              onClick={() => setMobileNavOpen(false)}
            >
              {t('nav.data_capture')}
            </NavLink>
          </nav>

          {/* Right: User + CTA */}
          <div className="nav-right">
            <button 
              onClick={toggleLanguage} 
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.4)',
                color: '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                marginInlineEnd: '12px'
              }}
            >
              {lang === 'en' ? 'AR' : 'EN'}
            </button>

            <div ref={profileRef} className={`dropdown ${profileOpen ? 'active' : ''}`}>
              <div className="user-pill" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="user-avatar">
                  <svg viewBox="0 0 24 24" fill="#475569">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                Jahangir Mian
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div className="dropdown-menu dropdown-menu-right">
                <div className="dropdown-header">{t('profile.settings')}</div>
                <div className="dropdown-list">
                  <div className="dropdown-item">{t('profile.help')}</div>
                  <div className="dropdown-item highlight" onClick={() => navigate('/AQMS/login')}>{t('profile.logout')}</div>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={() => navigate('/AQMS')}>{t('nav.back_to_map')}</button>
          </div>
        </header>

        {/* ── MAIN CONTENT ────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
