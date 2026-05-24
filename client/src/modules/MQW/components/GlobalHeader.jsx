import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import logoWide from '../../../assets/logo.png';
import logoEmblem from '../../../assets/logo-auth.png';

const GlobalHeader = () => {
  const { t, i18n } = useTranslation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  const handleLanguageToggle = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header 
      className="flex items-center justify-between w-full h-[80px] pl-[16px] pr-[16px] z-50 absolute top-0 left-0 right-0 pointer-events-auto bg-transparent"
    >
      {/* Left: Logo */}
      <div className="flex items-center w-1/4">
        <div className="flex items-center justify-start" style={{ height: '76px' }}>
          {isTablet ? (
            /* Circular Emblem Logo - Only visible in Tab responsive design (tablet) */
            <img 
              src={logoEmblem} 
              alt="Fujairah Environment Authority Emblem" 
              className="h-[49px] w-[49px] object-cover object-left" 
              style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.4))' }}
            />
          ) : !isMobile ? (
            /* Full Wide Bilingual Logo - Only visible on Desktop */
            <img 
              src={logoWide} 
              alt="Fujairah Environment Authority Logo" 
              className="w-[285px] h-[76px] object-contain" 
            />
          ) : null}
        </div>
      </div>

      {/* Center: Title */}
      <div className="flex flex-col items-center justify-center w-2/4 text-center relative">
        <h1 
          className={`font-bold text-white tracking-wide ${isTablet ? 'whitespace-nowrap' : ''} relative z-10`} 
          style={{ 
            fontSize: isTablet ? '16px' : '20px', 
            lineHeight: '1.1', 
            textShadow: '0 1px 2px rgba(0,0,0,0.3)' 
          }}
        >
          {t('dashboard.title')}
        </h1>
      </div>

      {/* Right: Language Toggle */}
      <div className="flex items-center justify-end w-1/4">
        <div 
          className="flex items-center rounded-full p-[4px] cursor-pointer gap-[4px]"
          style={{
            border: '1px solid rgba(0, 0, 0, 0.10)',
            background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
            boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div 
            onClick={() => handleLanguageToggle('ar')}
            className="flex items-center justify-center w-[42px] h-[42px] transition-all"
            style={i18n.language === 'ar' ? {
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
              boxShadow: '3px 3px 38px 0 #009FAC inset',
            } : { borderRadius: '50px' }}
          >
            <span className={`text-[15px] font-bold ${i18n.language === 'ar' ? 'text-white' : 'text-white/60'}`}>
              ع
            </span>
          </div>
          <div 
            onClick={() => handleLanguageToggle('en')}
            className="flex items-center justify-center w-[42px] h-[42px] transition-all"
            style={i18n.language === 'en' ? {
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
              boxShadow: '3px 3px 38px 0 #009FAC inset',
            } : { borderRadius: '50px' }}
          >
            <span className={`text-[15px] font-bold ${i18n.language === 'en' ? 'text-white' : 'text-white/60'}`}>
              En
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
