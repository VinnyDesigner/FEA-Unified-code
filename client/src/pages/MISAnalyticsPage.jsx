import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsFilters from '../components/AnalyticsFilters';
import SensorDataFilters from '../components/SensorDataFilters';
import BuoysChart from '../components/BuoysChart';
import AnalyticsTable from '../components/AnalyticsTable';
import SensorDataTable from '../components/SensorDataTable';
import DataCaptureRateTable from '../components/DataCaptureRateTable';
import { useTranslation } from 'react-i18next';

const MISAnalyticsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Live Data');
  const [selectedBuoy, setSelectedBuoy] = useState('Al Aqah Buoy');
  const [selectedView, setSelectedView] = useState('Graph and Table View');
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

            <div className="p-5 md:p-8 flex-1 flex flex-col gap-8 md:min-h-[calc(100vh-64px)]"
              style={{
                background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
              }}
            >
              {/* Header Section */}
              <div className="flex flex-col">
                <h1 className="text-[28px] md:text-[32px] font-bold text-white tracking-tight leading-[1.2]">
                  {`Marine Water Quality Dashboard - ${activeTab === 'Live Data' ? t('analytics.liveData', 'Live Data') : activeTab === 'Buoys Analytics' ? t('analytics.buoysAnalytics', 'Buoys Analytics') : t('analytics.stationHealth', 'Station Health')}`}
                </h1>
                <p className="text-[13px] md:text-[15px] text-gray-400 mt-3 max-w-[90%] md:max-w-none">
                  {t('analytics.pageSubtitle')}
                </p>
              </div>

              {/* Controls Row */}
              <div className="flex flex-col gap-6">
                <div className="w-full pb-1">
                  <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
                <div className="w-full">
                  {activeTab === 'Live Data' ? (
                    <AnalyticsFilters 
                      isMobile={true} 
                      selectedBuoy={selectedBuoy} 
                      setSelectedBuoy={setSelectedBuoy} 
                      selectedView={selectedView} 
                      setSelectedView={setSelectedView} 
                    />
                  ) : activeTab === 'Buoys Analytics' ? (
                    <AnalyticsFilters 
                      isMobile={true} 
                      selectedBuoy={selectedBuoy} 
                      setSelectedBuoy={setSelectedBuoy} 
                      selectedView={selectedView} 
                      setSelectedView={setSelectedView} 
                    />
                  ) : (
                    <SensorDataFilters isMobile={true} />
                  )}
                </div>
              </div>

              {/* Main Data Container (Glass UI) */}
              <div className="flex-1 flex flex-col p-4 md:p-6 mb-10 md:min-h-[500px] h-full"
                style={{
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {activeTab === 'Live Data' ? (
                  <div className="flex flex-col gap-6">
                    {/* Chart Section */}
                    {selectedView !== 'Table View' && (
                      <div className="w-full">
                        <BuoysChart isMobile={true} showHeader={false} />
                      </div>
                    )}

                    {/* Table Section */}
                    {selectedView !== 'Graph View' && (
                      <div className="w-full">
                        <SensorDataTable isMobile={true} selectedBuoy={selectedBuoy} />
                      </div>
                    )}
                  </div>
                ) : activeTab === 'Buoys Analytics' ? (
                  <div className="flex flex-col gap-6">
                    {/* Chart Section */}
                    {selectedView !== 'Table View' && (
                      <div className="w-full">
                        <BuoysChart isMobile={true} showHeader={false} />
                      </div>
                    )}

                    {/* Table Section */}
                    {selectedView !== 'Graph View' && (
                      <div className="w-full">
                        <AnalyticsTable />
                      </div>
                    )}
                  </div>
                ) : (
                  <SensorDataTable isMobile={true} selectedBuoy={selectedBuoy} />
                )}
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
            <div className="flex flex-col mb-6">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {`Marine Water Quality Monitoring Dashboard - ${activeTab === 'Live Data' ? t('analytics.liveData', 'Live Data') : activeTab === 'Buoys Analytics' ? t('analytics.buoysAnalytics', 'Buoys Analytics') : t('analytics.stationHealth', 'Station Health')}`}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {t('analytics.pageSubtitle')}
              </p>
            </div>

            {/* Controls Row (Inside Panel) */}
            <div className="flex items-center justify-between mb-8">
              <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === 'Live Data' ? (
                <AnalyticsFilters 
                  selectedBuoy={selectedBuoy} 
                  setSelectedBuoy={setSelectedBuoy} 
                  selectedView={selectedView} 
                  setSelectedView={setSelectedView} 
                />
              ) : activeTab === 'Buoys Analytics' ? (
                <AnalyticsFilters 
                  selectedBuoy={selectedBuoy} 
                  setSelectedBuoy={setSelectedBuoy} 
                  selectedView={selectedView} 
                  setSelectedView={setSelectedView} 
                />
              ) : (
                <SensorDataFilters />
              )}
            </div>

            {/* Content Section (Unified Inner Container) */}
            <div className="flex-1 flex flex-col min-h-0">

              {/* Main Data Panel */}
              <div 
                className="flex-1 flex flex-col min-h-0"
                style={{
                  borderRadius: '30px',
                  border: '1px solid rgba(0, 0, 0, 0.10)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden',
                }}
              >
                <style>{`
                  .analytics-panel-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .analytics-panel-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                  }
                  .analytics-panel-scroll::-webkit-scrollbar-thumb {
                    background: rgba(29, 205, 221, 0.2);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                  }
                  .analytics-panel-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(29, 205, 221, 0.4);
                  }
                `}</style>

                {activeTab === 'Live Data' ? (
                  <div className="flex flex-col h-full min-h-0">
                    {/* Sticky Header: Title + Download — never scrolls */}
                    <div className="flex-shrink-0 flex justify-between items-center px-6 pt-6 pb-4">
                      <h2 className="text-[18px] font-bold text-white leading-tight">Live Data</h2>
                      <button
                        className="flex items-center gap-2 px-6 py-2 text-[14px] transition-all hover:brightness-110 active:scale-95"
                        style={{
                          borderRadius: '24px',
                          border: '1px solid rgba(255, 255, 255, 0.30)',
                          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
                          boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
                          color: '#FFFFFF',
                          fontWeight: '400',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {t('common.download')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>

                    {/* Scrollable body: chart + table */}
                    <div className="flex-1 overflow-y-auto analytics-panel-scroll min-h-0 px-6 pb-6">
                      {/* Chart (no header — handled above) */}
                      {selectedView !== 'Table View' && (
                        <div className="w-full">
                          <BuoysChart showHeader={false} />
                        </div>
                      )}

                      {/* Gap + Table */}
                      {selectedView !== 'Graph View' && (
                        <div className="mt-6">
                          <SensorDataTable selectedBuoy={selectedBuoy} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeTab === 'Buoys Analytics' ? (
                  <div className="flex flex-col h-full min-h-0">
                    {/* Sticky Header: Title + Download — never scrolls */}
                    <div className="flex-shrink-0 flex justify-between items-center px-6 pt-6 pb-4">
                      <h2 className="text-[18px] font-bold text-white leading-tight">{t('analytics.buoysOverview')}</h2>
                      <button
                        className="flex items-center gap-2 px-6 py-2 text-[14px] transition-all hover:brightness-110 active:scale-95"
                        style={{
                          borderRadius: '24px',
                          border: '1px solid rgba(255, 255, 255, 0.30)',
                          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
                          boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
                          color: '#FFFFFF',
                          fontWeight: '400',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {t('common.download')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>

                    {/* Scrollable body: chart + legend + table */}
                    <div className="flex-1 overflow-y-auto analytics-panel-scroll min-h-0 px-6 pb-6">
                      {/* Chart (no header — handled above) */}
                      {selectedView !== 'Table View' && (
                        <div className="w-full">
                          <BuoysChart showHeader={false} />
                        </div>
                      )}

                      {/* Gap + Table */}
                      {selectedView !== 'Graph View' && (
                        <div className="mt-6">
                          <AnalyticsTable />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex-1 min-h-0 overflow-y-auto analytics-panel-scroll">
                    <DataCaptureRateTable activeTab={activeTab} />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MISAnalyticsPage;
