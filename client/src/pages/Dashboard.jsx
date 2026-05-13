import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import MetricsGrid from '../components/MetricsGrid';
import BuoyStatusCard from '../components/BuoyStatusCard';
import TemperatureChart from '../components/TemperatureChart';
import MapView from '../components/MapView';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';

import { motion } from 'framer-motion';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Sonde');
  const [selectedBuoy, setSelectedBuoy] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mobile Bottom Sheet State (Framer Motion)
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const handleDragEnd = (_, info) => {
    // Negative offset means dragging up
    if (info.offset.y < -100) {
      setIsBottomSheetExpanded(true);
    } else if (info.offset.y > 100) {
      setIsBottomSheetExpanded(false);
    }
  };

  return (
    <div className="w-screen h-screen lg:overflow-hidden p-0 lg:p-[8px] flex flex-col lg:flex-row gap-0 lg:gap-[12px] lg:bg-[#072227]">
      {/* Mobile/Tablet Navigation */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative h-full flex flex-col lg:block overflow-y-auto lg:overflow-hidden no-scrollbar">
        
        {/* --- RESPONSIVE LAYOUT (Mobile & Tablet < 1024px) --- */}
        <div className="lg:hidden fixed inset-0 overflow-hidden bg-transparent">
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>

          {/* Fixed Map Section (Background) */}
          <div className="fixed top-[64px] left-0 right-0 bottom-0 z-0">
            <MapView onBuoySelect={setSelectedBuoy} isMobile={true} />
          </div>

          {/* Draggable Bottom Sheet */}
          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            animate={{
              y: isBottomSheetExpanded ? "0%" : "65%"
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 32
            }}
            className={`fixed left-0 right-0 bottom-0 z-[5000] no-scrollbar pointer-events-auto ${isBottomSheetExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{
              height: '90vh',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.44) 100%)',
              boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              touchAction: 'none'
            }}
          >
            {/* Drag Handle Area */}
            <div className="w-full flex justify-center pt-3 pb-5 sticky top-0 z-[60] bg-transparent">
              <div 
                className="w-10 h-[5px] rounded-full bg-black/30 opacity-50 transition-opacity"
                style={{ cursor: 'grab' }}
              />
            </div>

            <div 
              className="p-4 flex flex-col gap-6 pb-20 max-w-2xl mx-auto"
              style={{ touchAction: isBottomSheetExpanded ? 'auto' : 'none' }}
            >
              {/* Summary Card */}
              <BuoyStatusCard activeTab={activeTab} isMobile={true} />

              {/* Dashboard Content Container */}
              <div className="flex flex-col gap-6">
                <div className="text-center">
                  <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} isMobile={true} />
                </div>

                <MetricsGrid activeTab={activeTab} isMobile={true} />
                
                <div className="w-full h-[200px] mb-4">
                  <TemperatureChart activeTab={activeTab} isMobile={true} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- DESKTOP LAYOUT (>= 1024px) --- */}
        <div className="hidden lg:block w-full h-full relative">
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
    </div>
  );
};

export default Dashboard;
