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

          {/* Centered Dashboard Title */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{
              color: '#111827',
              fontFamily: lang === 'ar' ? "'Noto Sans Arabic', sans-serif" : "'Roboto', sans-serif",
              fontSize: lang === 'ar' ? '2.1rem' : '1.9rem',
              fontWeight: '900',
              letterSpacing: '-0.5px',
              textAlign: 'center'
            }}>
              {t('nav.dashboard_title', 'Air Quality Monitoring Dashboard')}
            </span>
          </div>

          {/* Right: User + CTA */}
          <div className="nav-right">
            {/* Premium Sliding Language Switcher Toggle */}
            <div 
              onClick={toggleLanguage}
              style={{
                width: '108px',
                height: '44px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #009fac 0%, #008794 100%)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                padding: '2px',
                cursor: 'pointer',
                userSelect: 'none',
                marginInlineEnd: '16px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.1)',
                direction: 'ltr' // Always force LTR on language switcher container to match mockup
              }}
              title="Change Language / تغيير اللغة"
            >
              {/* Static background 'ع' when language is English */}
              {lang === 'en' && (
                <span 
                  style={{
                    position: 'absolute',
                    left: '2px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: '500',
                    fontSize: '18px',
                    zIndex: 1
                  }}
                >
                  ع
                </span>
              )}
              
              {/* Static background 'En' when language is Arabic */}
              {lang === 'ar' && (
                <span 
                  style={{
                    position: 'absolute',
                    right: '2px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: '500',
                    fontSize: '14px',
                    fontFamily: "'Roboto', sans-serif",
                    zIndex: 1
                  }}
                >
                  En
                </span>
              )}

              {/* Sliding 3D Raised Circular knob button containing active language label */}
              <div 
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00b8c8 0%, #008c9a 100%)',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.25), inset 0 2px 2px rgba(255, 255, 255, 0.4), inset 0 -2px 2px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: lang === 'en' ? 'translateX(64px)' : 'translateX(0)',
                  zIndex: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* Centered Active Label inside the knob */}
                <span 
                  style={{
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: lang === 'en' ? '15px' : '18px',
                    fontFamily: lang === 'en' ? "'Roboto', sans-serif" : 'inherit',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    lineHeight: 1
                  }}
                >
                  {lang === 'en' ? 'En' : 'ع'}
                </span>
              </div>
            </div>

            <div ref={profileRef} className={`dropdown ${profileOpen ? 'active' : ''}`}>
              <div className="user-pill" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="user-avatar">
                  <svg viewBox="0 0 24 24" fill="#475569">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span>{t('profile.user_name', 'Jahangir Mian')}</span>
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
