import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import MetricsGrid from '../components/MetricsGrid';
import BuoyStatusCard from '../components/BuoyStatusCard';
import TemperatureChart from '../components/TemperatureChart';
import MapView from '../components/MapView';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Sonde');
  const [selectedBuoy, setSelectedBuoy] = useState(null);

  return (
    <div 
      className="w-screen h-screen overflow-hidden p-[8px] flex gap-[12px]"
    >
      {/* Sidebar (outside map) */}
      <div className="w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* MainContent */}
      <div className="flex-1 relative h-full">
        
        {/* MapContainer */}
        <div className="w-full h-full rounded-[28px] overflow-hidden relative">
          <MapView onBuoySelect={setSelectedBuoy} />
        </div>

        {/* Dashboard Overlay Container (Layout Wrapper) */}
        <div 
          className="absolute left-[8px] right-[8px] bottom-[8px] z-[15] flex items-end"
          style={{ height: '460px' }}
        >
          {/* Summary Buoy Card (Left Section - Tall) */}
          <div className="w-[340px] flex-shrink-0 flex items-end relative h-full">
            <BuoyStatusCard activeTab={activeTab} />
          </div>

          {/* Dashboard Content Section (Right Section - Shorter Glass Panel) */}
          <div 
            className="flex-1 flex flex-col pt-[16px] pb-[10px] px-[16px]"
            style={{ 
              height: '380px',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.44) 100%)',
              boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
              backdropFilter: 'blur(7px)',
              overflow: 'hidden'
            }}
          >
            <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Content Row */}
            <div className="flex gap-[20px] items-stretch flex-1 min-h-0 pt-2">
              {/* Metrics Grid */}
              <div className="w-[52%] h-full">
                <MetricsGrid activeTab={activeTab} />
              </div>

              {/* Chart Panel */}
              <div className="flex-1 h-full min-w-0">
                <TemperatureChart activeTab={activeTab} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
