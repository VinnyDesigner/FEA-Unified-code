import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsFilters from '../components/AnalyticsFilters';
import SensorDataFilters from '../components/SensorDataFilters';
import BuoysChart from '../components/BuoysChart';
import AnalyticsTable from '../components/AnalyticsTable';
import SensorDataTable from '../components/SensorDataTable';
import DataCaptureRateTable from '../components/DataCaptureRateTable';

const MISAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('Buoys Analytics');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden p-0 lg:p-[8px] flex flex-col lg:flex-row lg:gap-[12px] lg:bg-[#072227]">
      {/* Mobile/Tablet Navigation */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* --- RESPONSIVE LAYOUT (Mobile & Tablet < 1024px) --- */}
      <div className="lg:hidden flex-1 flex flex-col w-full min-h-screen bg-[#072227] overflow-y-auto no-scrollbar pt-[64px]">
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
              Marine Water Quality Monitoring Dashboard - MIS Analytics
            </h1>
            <p className="text-[13px] md:text-[15px] text-gray-400 mt-3 max-w-[90%] md:max-w-none">
              Dedicated parameter records for performance tracking and environmental analysis.
            </p>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col gap-6">
            <div className="w-full overflow-x-auto no-scrollbar pb-1">
              <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={true} />
            </div>
            <div className="w-full">
              {activeTab === 'Buoys Analytics' ? <AnalyticsFilters isMobile={true} /> : <SensorDataFilters isMobile={true} />}
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
            {activeTab === 'Buoys Analytics' ? (
              <div className="flex flex-col gap-6">
                {/* Chart Section */}
                <div className="w-full">
                  <BuoysChart isMobile={true} />
                </div>

                {/* Table Section */}
                <div className="w-full">
                  <AnalyticsTable isMobile={true} />
                </div>
              </div>
                        ) : (activeTab === 'Data Capture Rate' || activeTab === 'Valid Data Capture Rate') ? (
              <DataCaptureRateTable isMobile={true} activeTab={activeTab} />
            ) : (
              <SensorDataTable isMobile={true} />
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
            Marine Water Quality Monitoring Dashboard - MIS Analytics
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Dedicated parameter records for performance tracking and environmental analysis.
          </p>
        </div>

        {/* Controls Row (Inside Panel) */}
        <div className="flex items-center justify-between mb-8">
          <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'Buoys Analytics' ? <AnalyticsFilters /> : <SensorDataFilters />}
        </div>

        {/* Content Section (Unified Inner Container) */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Main Data Panel */}
          <div 
            className="flex-1 flex flex-col p-6 min-h-0"
            style={{
              borderRadius: '30px',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden'
            }}
          >
            {activeTab === 'Buoys Analytics' ? (
              <>
                {/* Chart Section */}
                <div className="flex-shrink-0 h-[52%] min-h-0 w-full flex flex-col">
                  <BuoysChart />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .no-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  <AnalyticsTable />
                </div>
              </>
                        ) : (activeTab === 'Data Capture Rate' || activeTab === 'Valid Data Capture Rate') ? (
              <DataCaptureRateTable activeTab={activeTab} />
            ) : (
              <SensorDataTable />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MISAnalyticsPage;
