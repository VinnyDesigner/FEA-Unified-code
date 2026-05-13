import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsFilters from '../components/AnalyticsFilters';
import SensorDataFilters from '../components/SensorDataFilters';
import BuoysChart from '../components/BuoysChart';
import AnalyticsTable from '../components/AnalyticsTable';
import SensorDataTable from '../components/SensorDataTable';
import DataCaptureRateTable from '../components/DataCaptureRateTable';

const MISAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('Buoys Analytics');

  return (
    <div 
      className="w-screen h-screen overflow-hidden p-[8px] flex gap-[12px]"
    >
      {/* Sidebar */}
      <div className="w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Main Content Area (Unified Glass Container) */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"
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
              <DataCaptureRateTable />
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
