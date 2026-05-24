import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import DashboardHeader from '../components/DashboardHeader';
import MetricsGrid from '../components/MetricsGrid';
import BuoyStatusCard from '../components/BuoyStatusCard';
import TemperatureChart from '../components/TemperatureChart';
import MapView from '../components/MapView';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';

import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Compass, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const stations = [
  { id: 1, name: 'AL Aqah Buoy', nameKey: 'alAqah', position: [25.4725, 56.4162], temp: '25.1', color: 'orange', updated: '2 min ago', updatedKey: '2min', interval: '30 min', intervalKey: '30min' },
  { id: 2, name: 'Fujairah Buoy 1', nameKey: 'fujairah1', position: [25.1288, 56.3572], temp: '24.9', color: 'yellow', updated: '5 min ago', updatedKey: '5min', interval: '30 min', intervalKey: '30min' },
  { id: 3, name: 'Fujairah Buoy 2', nameKey: 'fujairah2', position: [25.2041, 56.3738], temp: '25.3', color: 'cyan', updated: '1 min ago', updatedKey: '1min', interval: '30 min', intervalKey: '30min' },
  { id: 4, name: 'Coastal Buoy A', nameKey: 'coastal', position: [25.3100, 56.3950], temp: '24.8', color: 'pink', updated: '8 min ago', updatedKey: '8min', interval: '30 min', intervalKey: '30min' },
];

const Dashboard = () => {
  const mapRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Sonde');
  const [selectedBuoy, setSelectedBuoy] = useState(stations[0]);
  const [selectedMetric, setSelectedMetric] = useState(activeTab === 'Sonde' ? 'Water Temperature (°c)' : 'Air Temperature (°c)');
  const [selectedDateRange, setSelectedDateRange] = useState('Last 24 Hours');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { i18n } = useTranslation();
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(false);
  const isRtl = i18n.language === 'ar';

  // Responsive state for Tablet vs Desktop vs Mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const panelWidth = isTablet ? 450 : 520;
  const currentPanelWidth = isTablet ? windowWidth * 0.8 : panelWidth;
  const isDesktop = !isMobile && !isTablet;

  // Mobile Bottom Sheet State (Framer Motion)
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  useEffect(() => {
    setSelectedMetric(activeTab === 'Sonde' ? 'Water Temperature (°c)' : 'Air Temperature (°c)');
  }, [activeTab]);

  const handleDragEnd = (_, info) => {
    // Negative offset means dragging up
    if (info.offset.y < -100) {
      setIsBottomSheetExpanded(true);
    } else if (info.offset.y > 100) {
      setIsBottomSheetExpanded(false);
    }
  };

  return (
    <div className="w-screen h-screen md:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {/* Mobile/Tablet Navigation */}
      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}

      {/* Desktop/Tablet Global Header */}
      {!isMobile && (
        <div className="hidden md:block z-[2000]">
          <GlobalHeader />
        </div>
      )}

      {/* Main Content Area (Below Header) */}
      <div className="flex-1 relative md:h-[calc(100vh-80px)] flex md:flex-row flex-col md:mt-[80px] min-h-0 overflow-hidden">
        {/* Desktop/Tablet Sidebar */}
        <Sidebar selectedBuoy={selectedBuoy} activeTab={activeTab} />

        {/* Main Dashboard Content */}
        <div className="flex-1 relative h-full md:pl-[92px] md:pr-[8px] md:pb-[8px] overflow-hidden">
        
        {/* --- RESPONSIVE LAYOUT (Mobile < 768px) --- */}
        {isMobile && (
          <div className="fixed inset-0 overflow-hidden bg-transparent">
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Fixed Map Section (Background) */}
            <div className="fixed top-[64px] left-0 right-0 bottom-0 z-0">
              <MapView onBuoySelect={setSelectedBuoy} selectedBuoy={selectedBuoy} isMobile={true} />
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
              <div className="w-full flex justify-center pt-3 pb-0 sticky top-0 z-[60] bg-transparent">
                <div style={{ cursor: 'grab' }} className="text-black/40 transition-opacity">
                  {isBottomSheetExpanded ? <ChevronDown size={24} strokeWidth={2.5} /> : <ChevronUp size={24} strokeWidth={2.5} />}
                </div>
              </div>

              <div 
                className="pt-2 px-4 flex flex-col gap-6 pb-20 max-w-2xl mx-auto"
                style={{ touchAction: isBottomSheetExpanded ? 'auto' : 'none' }}
              >
                {/* Summary Card */}
                <BuoyStatusCard activeTab={activeTab} selectedBuoy={selectedBuoy} isMobile={true} />

                {/* Dashboard Content Container */}
                <div className="flex flex-col gap-6">
                  <div className="w-full">
                    <DashboardHeader 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      stations={stations}
                      selectedBuoy={selectedBuoy}
                      setSelectedBuoy={setSelectedBuoy}
                    />
                  </div>

                  {activeTab === 'Windrose' ? (
                    <div className="w-full flex justify-center py-4">
                      <img src="/windrose.png" alt="Windrose" className="max-w-full rounded-2xl shadow-xl" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <>
                      <div className="w-full h-[200px] mb-4">
                        <TemperatureChart 
                          activeTab={activeTab} 
                          selectedBuoy={selectedBuoy} 
                          selectedMetric={selectedMetric} 
                          isMobile={true} 
                          selectedDateRange={selectedDateRange}
                        />
                      </div>

                      <MetricsGrid 
                        activeTab={activeTab} 
                        selectedMetric={selectedMetric} 
                        setSelectedMetric={setSelectedMetric} 
                        isMobile={true} 
                        selectedBuoy={selectedBuoy}
                        selectedDateRange={selectedDateRange}
                      />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- DESKTOP & TABLET LAYOUT (>= 768px) --- */}
        {!isMobile && (
          <div className="w-full h-full relative">
            {/* MapContainer */}
            <div className="w-full h-full rounded-[28px] overflow-hidden relative" style={{ background: '#f4f3f0' }}>
              <MapView ref={mapRef} onBuoySelect={setSelectedBuoy} selectedBuoy={selectedBuoy} />
            </div>

            {/* Map controls floating to the left/right of the right panel */}
            <div 
              className="absolute flex flex-col gap-2.5 transition-all duration-300"
              style={{
                zIndex: isTablet ? 10 : 1000,
                top: isTablet ? '16px' : (isDesktop ? '24px' : '32px'),
                right: isRtl ? 'auto' : (isTablet ? '16px' : (isRightPanelCollapsed ? (isDesktop ? '24px' : '32px') : `${panelWidth + (isDesktop ? 24 : 32)}px`)),
                left: isRtl ? (isTablet ? '16px' : (isRightPanelCollapsed ? (isDesktop ? '24px' : '32px') : `${panelWidth + (isDesktop ? 24 : 32)}px`)) : 'auto',
              }}
            >
              {/* Compass/Recenter button */}
              <button
                onClick={() => {
                  if (mapRef.current && selectedBuoy) {
                    mapRef.current.setView(selectedBuoy.position, 11);
                  }
                }}
                className={`${isDesktop ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center bg-white border border-white/20 text-[#072227] shadow-lg cursor-pointer hover:bg-gray-50 active:scale-95 transition-all`}
                title="Recenter Map"
              >
                <Compass size={isDesktop ? 16 : 20} className="text-[#072227]" />
              </button>
              {/* Zoom In button */}
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className={`${isDesktop ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center bg-white border border-white/20 text-[#072227] shadow-lg cursor-pointer hover:bg-gray-50 active:scale-95 transition-all`}
                title="Zoom In"
              >
                <Plus size={isDesktop ? 16 : 20} className="text-[#072227]" />
              </button>
              {/* Zoom Out button */}
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className={`${isDesktop ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center bg-white border border-white/20 text-[#072227] shadow-lg cursor-pointer hover:bg-gray-50 active:scale-95 transition-all`}
                title="Zoom Out"
              >
                <Minus size={isDesktop ? 16 : 20} className="text-[#072227]" />
              </button>
            </div>

            {/* Buoy Status Card (Floating Left on desktop/tablet) */}
            {(!isTablet || isRightPanelCollapsed) && (
              <div className={`absolute ltr:left-[16px] rtl:right-[16px] bottom-[16px] ${isTablet ? 'w-[340px] h-[480px]' : 'w-[250px] h-[360px]'} z-[15]`}>
                <BuoyStatusCard activeTab={activeTab} selectedBuoy={selectedBuoy} selectedMetric={selectedMetric} isDesktop={isDesktop} />
              </div>
            )}

            {/* Collapsible Vertical Right Panel (Desktop/Tablet) — parent does NOT scroll */}
            <motion.div 
              className="absolute z-[15] flex flex-col"
              style={{
                top: isTablet ? '10%' : '16px',
                bottom: isTablet ? 'auto' : '16px',
                height: isTablet ? '80%' : 'calc(100% - 32px)',
                width: `${currentPanelWidth}px`,
                left: isRtl ? '16px' : 'auto',
                right: isRtl ? 'auto' : '16px',
                borderRadius: '28px',
                border: '1.5px solid rgba(255, 255, 255, 0.45)',
                background: 'radial-gradient(136.65% 89.92% at 50.22% 50.31%, rgba(220, 240, 245, 0.45) 0%, rgba(140, 210, 220, 0.55) 100%)',
                boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset, 0 20px 50px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                padding: '0',
                overflow: 'visible'  /* Allows toggle button to be visible outside borders */
              }}
              initial={{ x: 0 }}
              animate={{ x: isRightPanelCollapsed ? (isRtl ? -(currentPanelWidth + 16) : (currentPanelWidth + 16)) : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Collapse / Expand Toggle Button */}
              <button
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className="absolute top-1/2 -translate-y-1/2 z-[20] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.03]"
                style={{
                  width: '28px',
                  height: '76px',
                  left: isRtl ? 'auto' : '-28px',
                  right: isRtl ? '-28px' : 'auto',
                  borderRadius: isRtl ? '0 20px 20px 0' : '20px 0 0 20px',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.44) 100%)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.10)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.10)',
                  borderLeft: isRtl ? 'none' : '1px solid rgba(0, 0, 0, 0.10)',
                  borderRight: isRtl ? '1px solid rgba(0, 0, 0, 0.10)' : 'none',
                  boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
                  backdropFilter: 'blur(7px)',
                  WebkitBackdropFilter: 'blur(7px)'
                }}
              >
                {isRightPanelCollapsed ? (
                  isRtl ? (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#072227]"><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#072227]"><path d="M16 5v14L5 12z" /></svg>
                  )
                ) : (
                  isRtl ? (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#072227]"><path d="M16 5v14L5 12z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#072227]"><path d="M8 5v14l11-7z" /></svg>
                  )
                )}
              </button>

              {/* ① Dropdowns row — fixed, never scrolls */}
              <div className="flex-shrink-0 mb-3 pt-5 px-5" style={{ position: 'relative', overflow: 'visible', zIndex: 50 }}>
                <DashboardHeader 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  stations={stations}
                  selectedBuoy={selectedBuoy}
                  setSelectedBuoy={setSelectedBuoy}
                />
              </div>

              {activeTab === 'Windrose' ? (
                <div className="flex-1 flex justify-center items-center overflow-hidden px-5 pb-5 mt-4">
                  <img src="/windrose.png" alt="Windrose" className="max-w-full max-h-full rounded-[24px]" style={{ objectFit: 'contain' }} />
                </div>
              ) : (
                <>
                  {/* Scrollbar CSS for metrics section — always visible */}
                  <style>{`
                    .panel-metrics-scrollbar::-webkit-scrollbar { width: 6px; }
                    .panel-metrics-scrollbar::-webkit-scrollbar-track { background: rgba(0,159,172,0.06); border-radius: 10px; }
                    .panel-metrics-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,159,172,0.45); border-radius: 10px; }
                    .panel-metrics-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,159,172,0.7); }
                  `}</style>

                  {/* ② Metric Cards — collapsible, independent scrollbar */}
                  <div
                    className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out px-5"
                    style={{ maxHeight: isMetricsCollapsed ? '0px' : '290px', opacity: isMetricsCollapsed ? 0 : 1 }}
                  >
                    {/* Scrollable Container with 1px padding and always-visible scrollbar */}
                    <div className="overflow-y-auto overflow-x-hidden panel-metrics-scrollbar" style={{ maxHeight: '290px', padding: '1px' }}>
                      <MetricsGrid
                        activeTab={activeTab}
                        selectedMetric={selectedMetric}
                        setSelectedMetric={setSelectedMetric}
                        selectedBuoy={selectedBuoy}
                        selectedDateRange={selectedDateRange}
                      />
                    </div>
                  </div>

                  {/* ── Separator with collapse toggle ── */}
                  <div className="flex-shrink-0 flex items-center gap-2 mx-5 my-2">
                    <div className="flex-1 h-[1.5px]" style={{ background: '#ffffff' }} />
                    <button
                      onClick={() => setIsMetricsCollapsed(!isMetricsCollapsed)}
                      title={isMetricsCollapsed ? 'Expand metrics' : 'Collapse metrics'}
                      className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 cursor-pointer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.18)',
                        border: '1px solid #ffffff',
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      {isMetricsCollapsed
                        ? <ChevronDown size={12} className="text-white" />
                        : <ChevronUp size={12} className="text-white" />}
                    </button>
                    <div className="flex-1 h-[1.5px]" style={{ background: '#ffffff' }} />
                  </div>

                  {/* ③ Chart section — takes all remaining height */}
                  <div className="flex-1 min-h-0 overflow-hidden px-5 pb-5">
                    <TemperatureChart
                      activeTab={activeTab}
                      selectedBuoy={selectedBuoy}
                      selectedMetric={selectedMetric}
                      setSelectedMetric={setSelectedMetric}
                      selectedDateRange={selectedDateRange}
                      setSelectedDateRange={setSelectedDateRange}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
