import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import ReportsFilterForm from '../components/ReportsFilterForm';
import { useTranslation } from 'react-i18next';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-screen h-screen lg:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {/* Mobile/Tablet Navigation */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Global Header */}
      <div className="hidden lg:block z-[2000]">
        <GlobalHeader />
      </div>

      {/* Main Content Area (Below Header) */}
      <div className="flex-1 relative lg:h-[calc(100vh-80px)] flex lg:flex-row flex-col lg:mt-[80px] min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 relative h-full w-full lg:ml-[80px] lg:pl-[12px] lg:pr-[8px] lg:pb-[8px] overflow-hidden flex flex-col">
          
          {/* --- RESPONSIVE LAYOUT (Mobile & Tablet < 1024px) --- */}
          <div className="lg:hidden flex-1 flex flex-col w-full min-h-screen bg-transparent overflow-y-auto no-scrollbar pt-[64px]">
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="p-5 md:p-10 flex-1 flex flex-col gap-10 md:min-h-[calc(100vh-64px)]"
              style={{
                background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
              }}
            >
              {/* Header Section */}
              <div className="flex flex-col">
                <h1 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-[1.2]">
                  {t('reports.pageTitle')}
                </h1>
                <p className="text-[14px] md:text-[16px] text-gray-400 mt-3 max-w-[95%] md:max-w-[80%] leading-relaxed">
                  {t('reports.pageSubtitle')}
                </p>
              </div>

              {/* Content Section */}
              <div className="flex flex-col min-h-0">
                <ReportsFilterForm />
                
                {/* Empty space below for results */}
                <div className="flex-1 min-h-[100px]" />
              </div>
            </div>
          </div>

          {/* --- DESKTOP LAYOUT (>= 1024px) --- */}
          <div className="hidden lg:flex flex-1 flex-col min-w-0 h-full relative"
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
              boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
              backdropFilter: 'blur(7px)',
              padding: '24px',
              overflow: 'hidden'
            }}
          >
            {/* Header Section (Inside Panel) */}
            <div className="flex flex-col mb-10">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {t('reports.pageTitle')}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {t('reports.pageSubtitle')}
              </p>
            </div>

            {/* Content Section (Unified Inner Container) */}
            <div className="flex-1 flex flex-col min-h-0">
              <ReportsFilterForm />
              
              {/* Empty space below as per reference - ready for chart or table results */}
              <div className="flex-1" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
