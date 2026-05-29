import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoWide from '../../../assets/logo.png';
import logoAr from '../../../assets/logo-ar-new.png';

const AuthLayout = () => {
  const { i18n } = useTranslation();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLanguageToggle = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
  };

  const isRtl = i18n.language === 'ar';
  const isDesktop = windowWidth >= 1024;

  return (
    <div 
      dir="ltr"
      className="w-screen h-screen overflow-hidden flex flex-row relative select-none"
      style={isDesktop ? {
        backgroundImage: 'url("/assets/mwqLoginBg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {
        background: 'radial-gradient(circle at 50% 50%, #004D54 0%, #001112 100%)'
      }}
    >
      {/* Left/Main Column - Spans 38% on desktop and 100% on mobile/tablet */}
      <div 
        className="flex flex-col z-10 relative shrink-0 bg-transparent animate-fadeIn"
        style={{
          width: isDesktop ? '38%' : '100%',
          height: '100%'
        }}
      >
        {/* Confined Header (Logo & Language Switcher) */}
        <header dir={isRtl ? "rtl" : "ltr"} className="flex items-center justify-between w-full h-[80px] px-6 md:px-10 z-50 bg-transparent shrink-0">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={isRtl ? logoAr : logoWide} 
              alt="Fujairah Environment Authority Logo" 
              className="w-[180px] sm:w-[220px] md:w-[260px] h-[50px] sm:h-[60px] md:h-[70px] object-contain" 
            />
          </div>

          {/* Language Toggle */}
          <div className="flex items-center">
            <div 
              className="flex items-center rounded-full p-[4px] cursor-pointer gap-[4px]"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
                boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div 
                onClick={() => handleLanguageToggle('ar')}
                className="flex items-center justify-center w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] md:w-[42px] md:h-[42px] transition-all"
                style={isRtl ? {
                  borderRadius: '50px',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
                  boxShadow: '3px 3px 38px 0 #009FAC inset',
                } : { borderRadius: '50px' }}
              >
                <span className={`text-[13px] md:text-[15px] font-bold ${isRtl ? 'text-white' : 'text-white/60'}`}>
                  ع
                </span>
              </div>
              <div 
                onClick={() => handleLanguageToggle('en')}
                className="flex items-center justify-center w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] md:w-[42px] md:h-[42px] transition-all"
                style={!isRtl ? {
                  borderRadius: '50px',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
                  boxShadow: '3px 3px 38px 0 #009FAC inset',
                } : { borderRadius: '50px' }}
              >
                <span className={`text-[13px] md:text-[15px] font-bold ${!isRtl ? 'text-white' : 'text-white/60'}`}>
                  En
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Card Area - Left-aligned on Desktop, centered on Mobile & Tablet */}
        <div 
          className={`flex-grow flex items-center ${isDesktop ? 'justify-start px-4 sm:px-6 md:pl-12 lg:pl-16 xl:pl-20' : 'justify-center px-4 sm:px-6'} pb-8 md:pb-0 bg-transparent w-full h-full`}
          dir="ltr"
        >
          <div dir={isRtl ? "rtl" : "ltr"} className="w-full max-w-[480px] flex justify-center">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right Column Spacer - Only rendered on Desktop to expose full screen buoy graphic */}
      {isDesktop && (
        <div 
          className="h-full pointer-events-none bg-transparent" 
          style={{
            width: '62%'
          }}
        />
      )}
    </div>
  );
};

export default AuthLayout;
