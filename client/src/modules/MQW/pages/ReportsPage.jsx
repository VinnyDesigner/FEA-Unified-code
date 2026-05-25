import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import ReportsFilterForm from '../components/ReportsFilterForm';
import { useTranslation } from 'react-i18next';
import BuoysChart from '../components/BuoysChart';
import SensorDataTable from '../components/SensorDataTable';
import DownloadDropdown from '../components/DownloadDropdown';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [appliedFilters, setAppliedFilters] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = !window.matchMedia('(min-width: 768px)').matches;

  const handleApply = (filters) => {
    setAppliedFilters(filters);
  };

  const handleDownloadAction = (option) => {
    alert(`${option} successfully requested!`);
  };

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
            <div className="flex-1 flex flex-col w-full h-full bg-transparent overflow-hidden p-3 pt-[76px] pb-3">
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>

              <div className="p-5 flex-1 flex flex-col gap-5 min-h-0"
                style={{
                  borderRadius: '28px',
                  border: '1.5px solid rgba(255, 255, 255, 0.20)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3), inset 3px 3px 4px rgba(255,255,255,0.17)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
                }}
              >
                {/* Header Section */}
                <div className="flex flex-col">
                  <h1 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-[1.2]">
                    Reports
                  </h1>
                  <p className="text-[14px] md:text-[16px] text-gray-400 mt-3 max-w-[95%] md:max-w-[80%] leading-relaxed">
                    {t('reports.pageSubtitle')}
                  </p>
                </div>

                {/* Content Section */}
                <div className="flex flex-col min-h-0">
                  <ReportsFilterForm onApply={handleApply} />
                  
                  {/* Results Section */}
                  <div className="flex-1 mt-6 flex flex-col gap-6">
                    {!appliedFilters ? (
                      <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <span className="text-white/50 text-[15px] font-semibold tracking-wide">No Reports Generated Yet</span>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-[20px] flex flex-col relative z-[5] mt-2 mb-4"
                        style={{
                          background: 'radial-gradient(136.25% 136.25% at 50% 100%, rgba(29, 205, 221, 0.15) 0%, rgba(29, 205, 221, 0.03) 100%), rgba(255, 255, 255, 0.05)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <div className="flex flex-col min-h-0">
                          {/* Sticky Header: Title + Download */}
                          <div className="flex-shrink-0 flex justify-between items-center px-4 pt-4 pb-2">
                            <h2 className="text-[16px] md:text-[18px] font-bold text-white leading-tight">{appliedFilters.parameter}</h2>
                            <DownloadDropdown t={t} onDownload={handleDownloadAction} />
                          </div>

                          {/* Body: chart + table */}
                          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0 overflow-y-auto no-scrollbar">
                            <div className="w-full">
                              <BuoysChart 
                                isMobile={true} 
                                showHeader={false} 
                                selectedParams={[appliedFilters.parameter]} 
                                selectedBuoy={[appliedFilters.station]} 
                                chartType="Line" 
                                selectedDuration="Monthly" 
                              />
                            </div>
                            <div className="w-full h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25) 10%, rgba(255, 255, 255, 0.25) 90%, transparent)' }} />
                            <div className="w-full">
                              <SensorDataTable 
                                isMobile={true} 
                                selectedBuoy={[appliedFilters.station]} 
                                selectedParams={[appliedFilters.parameter]} 
                                selectedDuration="Monthly" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
              <div className="flex flex-col mb-4">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Reports
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t('reports.pageSubtitle')}
                </p>
              </div>

              {/* Content Section */}
              <div className="flex-grow flex flex-col min-h-0 pt-2 overflow-y-auto no-scrollbar">
                <ReportsFilterForm isDesktop={true} onApply={handleApply} />
                
                {/* Results Section */}
                <div className="flex-grow mt-6 flex flex-col gap-6">
                  {!appliedFilters ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                      <span className="text-white/50 text-[16px] font-semibold tracking-wide">No Reports Generated Yet</span>
                    </div>
                  ) : (
                      <div className="flex-1 rounded-[20px] flex flex-col relative z-[5] mb-2"
                        style={{
                          background: 'radial-gradient(136.25% 136.25% at 50% 100%, rgba(29, 205, 221, 0.15) 0%, rgba(29, 205, 221, 0.03) 100%), rgba(255, 255, 255, 0.05)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <div className="flex flex-col h-full min-h-0">
                          {/* Sticky Header: Title + Download */}
                          <div className="flex-shrink-0 flex justify-between items-center px-6 pt-3.5 pb-1.5">
                            <h2 className="text-[18px] font-bold text-white leading-tight">{appliedFilters.parameter}</h2>
                            <DownloadDropdown t={t} onDownload={handleDownloadAction} />
                          </div>

                          {/* Body: chart + table */}
                          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6">
                            <div className="flex-shrink-0">
                              <BuoysChart 
                                isMobile={false} 
                                showHeader={false} 
                                selectedParams={[appliedFilters.parameter]} 
                                selectedBuoy={[appliedFilters.station]} 
                                chartType="Line" 
                                selectedDuration="Monthly" 
                                height="150px"
                                isGraphAndTableView={true}
                                isTablet={false}
                              />
                            </div>
                            <div className="flex-1 min-h-0 mt-3 flex flex-col overflow-hidden">
                              <SensorDataTable 
                                isMobile={false} 
                                selectedBuoy={[appliedFilters.station]} 
                                selectedParams={[appliedFilters.parameter]} 
                                selectedDuration="Monthly" 
                                isGraphAndTableView={true}
                                isTablet={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
