import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AuthLayout = ({ children }) => {
  const { lang, toggleLanguage } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="login-container" style={{ direction: 'ltr' }}>
      <div className="bg-overlay"></div>

      <div className="login-panel" style={{
        position: 'relative',
        paddingTop: isMobile ? '76px' : '96px',
        direction: lang === 'ar' ? 'rtl' : 'ltr'
      }}>
        <div className="login-header-bar" style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          top: '24px',
          left: '32px',
          right: '32px',
          boxSizing: 'border-box',
          zIndex: 100
        }}>
          <div className="login-logo-area" style={{ margin: 0, width: 'auto', flexShrink: 1 }}>
            <img
              src="/assets/AQMS/logo.png"
              alt="Logo"
              className="login-logo-img"
              style={{
                display: 'block',
                height: isMobile ? '36px' : '48px',
                width: 'auto',
                maxWidth: '60vw',
                objectFit: 'contain'
              }}
            />
          </div>

          <div
            className={`lang-switcher-container ${lang}`}
            onClick={toggleLanguage}
            style={{
              width: '64px',
              height: '28px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
              direction: 'ltr',
              flexShrink: 0
            }}
            title="Change Language / تغيير اللغة"
          >
            {lang === 'en' && (
              <span style={{ position: 'absolute', left: '8px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700', fontSize: '10px', zIndex: 1 }}>ع</span>
            )}
            {lang === 'ar' && (
              <span style={{ position: 'absolute', right: '8px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700', fontSize: '9px', fontFamily: "'Roboto', sans-serif", zIndex: 1 }}>En</span>
            )}
            <div style={{
              position: 'absolute',
              top: '1px',
              left: '1px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00b8c8 0%, #008c9a 100%)',
              border: '1px solid rgba(0, 0, 0, 0.15)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: lang === 'en' ? 'translateX(36px)' : 'translateX(0)',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '10px', lineHeight: 1 }}>
                {lang === 'en' ? 'En' : 'ع'}
              </span>
            </div>
          </div>
        </div>

        <div className="login-form-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
