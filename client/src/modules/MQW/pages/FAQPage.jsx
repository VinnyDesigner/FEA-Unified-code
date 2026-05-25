import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import FAQAccordion from '../components/FAQAccordion';
import { useTranslation } from 'react-i18next';


const FAQPage = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  return (
    <div className="w-screen h-screen lg:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {/* Mobile/Tablet Navigation */}
      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}

      {/* Desktop Global Header */}
      {!isMobile && (
        <div className="hidden md:block z-[2000]">
          <GlobalHeader />
        </div>
      )}

      {/* Main Content Area (Below Header) */}
      <div className="flex-1 relative md:h-[calc(100vh-80px)] flex md:flex-row flex-col md:mt-[80px] min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar />}

        {/* Main Content Wrapper */}
        <div className="flex-1 relative h-full md:pl-[92px] md:pr-[8px] md:pb-[8px] overflow-hidden flex flex-col">

          {/* --- RESPONSIVE LAYOUT (Mobile & Tablet < 768px) --- */}
          {isMobile && (
            <div className="flex-1 flex flex-col w-full min-h-screen bg-transparent overflow-y-auto no-scrollbar pt-[64px]">
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>

              <div className="p-5 md:p-10 flex-1 flex flex-col gap-8 md:min-h-[calc(100vh-64px)]"
                style={{
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
                }}
              >
                {/* Header Section */}
                <div className="flex flex-col mb-4">
                  <h1 className="text-[14px] font-bold text-white tracking-tight leading-[1.2]">
                    {t('faq.pageTitle', 'Frequently Asked Questions')}
                  </h1>
                  <p className="text-[12px] text-gray-400 mt-1 max-w-[95%] md:max-w-[80%] leading-relaxed opacity-75">
                    {t('faq.pageSubtitle', 'Everything you need to know—answered clearly and concisely.')}
                  </p>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  <FAQAccordion isMobile={true} />
                </div>
              </div>
            </div>

          )}

          {/* --- DESKTOP LAYOUT (>= 768px) --- */}
          {!isMobile && (
            <div className="flex-grow flex flex-col min-w-0 h-full relative animate-fadeIn"
              style={{
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.3) 0%, rgba(28, 78, 81, 0.44) 100%)',
                boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
                backdropFilter: 'blur(7px)',
                WebkitBackdropFilter: 'blur(7px)',
                padding: '20px 24px',
                overflow: 'hidden'
              }}
            >
              {/* Header Section (Inside Card) */}
              <div className="flex flex-col mb-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {t('faq.pageTitle', 'Frequently Asked Questions')}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t('faq.pageSubtitle', 'Everything you need to know—answered clearly and concisely.')}
                </p>
              </div>

              {/* FAQ Accordions (Inside Card, Scrollable) */}
              <div className="flex-grow overflow-y-auto no-scrollbar pt-2">
                <div className="w-full max-w-[850px]">
                  <FAQAccordion />
                </div>
              </div>


            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FAQPage;
