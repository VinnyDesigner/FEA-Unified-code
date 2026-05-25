import React, { useState, useEffect } from 'react';
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
import AlarmsTable from '../components/AlarmsTable';
import BatteryHealthView from '../components/BatteryHealthView';
import { useTranslation } from 'react-i18next';
import DownloadDropdown from '../components/DownloadDropdown';

const MISAnalyticsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Live Data');
  const [selectedBuoy, setSelectedBuoy] = useState('Al Aqah Buoy');
  const [selectedBuoys, setSelectedBuoys] = useState([]);
  const [selectedView, setSelectedView] = useState('Graph and Table View');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stationHealthTab, setStationHealthTab] = useState('Alarms');
  const [selectedParams, setSelectedParams] = useState([
    'Specific Conductivity',
    'Water Temperature',
    'Salinity',
    'Chlorophyll',
    'Oxygen Saturation',
    'Dissolved Oxygen',
    'Turbidity',
    'pH',
    'Depth',
    'Blue-Green Algae'
  ]);
  const [chartType, setChartType] = useState('Line Chart');
  const [selectedDuration, setSelectedDuration] = useState('Last Day');
  const [selectedInfoType, setSelectedInfoType] = useState('Sonde Information');
  const [selectedPredefined, setSelectedPredefined] = useState('Salinity (ppt) - pH');
  const [thresholdValue, setThresholdValue] = useState(false);
  const [stationHealthDuration, setStationHealthDuration] = useState('Live Data');
  const [stationHealthBuoy, setStationHealthBuoy] = useState('');

  const handleDownloadAction = (option) => {
    alert(`${option} successfully requested!`);
  };

  // Responsive state for Tablet vs Desktop vs Mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (activeTab === 'Buoys Analytics') {
      if (selectedPredefined === 'Water Temperature (ºC) - Turbidity (NTU)') {
        setSelectedParams(['Water Temperature', 'Turbidity']);
      } else if (selectedPredefined === 'Salinity (ppt) - pH') {
        setSelectedParams(['Salinity', 'pH']);
      } else if (selectedPredefined === 'Depth (m) - Blue Green Algae (ug)') {
        setSelectedParams(['Depth', 'Bluegreen Algae']);
      } else if (selectedPredefined === 'Dissolved Oxygen (mg/l) - pH') {
        setSelectedParams(['Dissolved Oxygen', 'pH']);
      } else if (selectedPredefined === 'Specific Conductivity (uS) - Chlorophyll (ug)') {
        setSelectedParams(['Specific Conductivity', 'Chlorophyll']);
      } else if (selectedPredefined === 'Oxygen Saturation (%) - Salinity (ppt)') {
        setSelectedParams(['Oxygen Saturation', 'Salinity']);
      }
    } else if (activeTab === 'Live Data') {
      setSelectedParams([
        'Specific Conductivity',
        'Water Temperature',
        'Salinity',
        'Chlorophyll',
        'Oxygen Saturation',
        'Dissolved Oxygen',
        'Turbidity',
        'pH',
        'Depth',
        'Blue-Green Algae'
      ]);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = !window.matchMedia('(min-width: 768px)').matches;
  const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;

  return (
    <div className="w-screen h-screen md:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {/* Mobile Navigation (< 768px) */}
      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}

      {/* Desktop/Tablet Global Header (>= 768px) */}
      <div className="hidden md:block z-[2000]">
        <GlobalHeader />
      </div>

      {/* Main Content Area (Below Header) */}
      <div className="flex-1 relative md:h-[calc(100vh-80px)] flex md:flex-row flex-col md:mt-[80px] min-h-0 overflow-hidden">
        {/* Desktop/Tablet Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 relative h-full md:pl-[92px] md:pr-[8px] md:pb-[8px] overflow-hidden flex flex-col">
          
          {/* --- RESPONSIVE MOBILE LAYOUT (< 768px) --- */}
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
                  <h1 className="text-[28px] md:text-[32px] font-bold text-white tracking-tight leading-[1.2]">
                    {activeTab === 'Live Data' ? t('analytics.liveData', 'Live Data') : activeTab === 'Buoys Analytics' ? t('analytics.buoysAnalytics', 'Buoys Analytics') : t('analytics.stationHealth', 'Station Health')}
                  </h1>
                  <p className="text-[13px] md:text-[15px] text-gray-400 mt-3 max-w-[90%] md:max-w-none">
                    {t('analytics.pageSubtitle')}
                  </p>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col gap-3.5 md:gap-6">
                  <div className="w-full pb-1">
                    <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={isMobile} />
                  </div>
                  <div className="w-full">
                    {activeTab === 'Live Data' ? (
                      <AnalyticsFilters 
                        isMobile={true} 
                        selectedBuoy={selectedBuoy} 
                        setSelectedBuoy={setSelectedBuoy} 
                        selectedView={selectedView} 
                        setSelectedView={setSelectedView} 
                        selectedParams={selectedParams}
                        setSelectedParams={setSelectedParams}
                        chartType={chartType}
                        setChartType={setChartType}
                        selectedDuration={selectedDuration}
                        setSelectedDuration={setSelectedDuration}
                      />
                    ) : activeTab === 'Buoys Analytics' ? (
                      <AnalyticsFilters 
                        isMobile={true} 
                        isBuoysAnalytics={true}
                        selectedBuoy={selectedBuoys} 
                        setSelectedBuoy={setSelectedBuoys} 
                        selectedView={selectedView} 
                        setSelectedView={setSelectedView} 
                        selectedParams={selectedParams}
                        setSelectedParams={setSelectedParams}
                        chartType={chartType}
                        setChartType={setChartType}
                        selectedDuration={selectedDuration}
                        setSelectedDuration={setSelectedDuration}
                        selectedInfoType={selectedInfoType}
                        setSelectedInfoType={setSelectedInfoType}
                        selectedPredefined={selectedPredefined}
                        setSelectedPredefined={setSelectedPredefined}
                        thresholdValue={thresholdValue}
                        setThresholdValue={setThresholdValue}
                      />
                    ) : (
                      <SensorDataFilters 
                        isMobile={true} 
                        activeSubTab={stationHealthTab}
                        setActiveSubTab={setStationHealthTab}
                        selectedBuoy={stationHealthBuoy}
                        setSelectedBuoy={setStationHealthBuoy}
                        selectedDate={stationHealthDuration}
                        setSelectedDate={setStationHealthDuration}
                      />
                    )}
                  </div>
                </div>

                {/* Main Data Container (Glass UI) */}
                <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-y-auto no-scrollbar"
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
                          <BuoysChart isMobile={true} showHeader={false} selectedParams={selectedParams} selectedBuoy={selectedBuoy} chartType={chartType} selectedDuration={selectedDuration} />
                        </div>
                      )}

                      {/* Table Section */}
                      {selectedView !== 'Graph View' && (
                        <div className="w-full">
                          <SensorDataTable isMobile={true} selectedBuoy={selectedBuoy} selectedParams={selectedParams} selectedDuration={selectedDuration} />
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'Buoys Analytics' ? (
                    <div className="flex flex-col gap-6 min-h-[300px]">
                      {selectedBuoys.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full w-full">
                          <span className="text-white/50 text-[15px] font-semibold tracking-wide">No Reports Generated Yet</span>
                        </div>
                      ) : (
                        <>
                          {/* Chart Section */}
                          {selectedView !== 'Table View' && (
                            <div className="w-full">
                              <BuoysChart isMobile={true} showHeader={false} selectedParams={selectedParams} selectedBuoy={selectedBuoys} chartType={chartType} selectedDuration={selectedDuration} isBuoysAnalytics={true} thresholdValue={thresholdValue} />
                            </div>
                          )}

                          {/* Divider line between chart and table in Buoys tab */}
                          {selectedView !== 'Graph View' && selectedView !== 'Table View' && (
                            <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25) 10%, rgba(255, 255, 255, 0.25) 90%, transparent)' }} />
                          )}

                          {/* Table Section */}
                          {selectedView !== 'Graph View' && (
                            <div className="w-full">
                              <SensorDataTable isMobile={true} selectedBuoy={selectedBuoys} selectedParams={selectedParams} selectedDuration={selectedDuration} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    stationHealthTab === 'Alarms' ? (
                      <AlarmsTable isMobile={true} />
                    ) : stationHealthTab === 'Battery Health' ? (
                      <BatteryHealthView isMobile={true} selectedBuoy={stationHealthBuoy} selectedDuration={stationHealthDuration} />
                    ) : (
                      <DataCaptureRateTable isMobile={true} activeTab={stationHealthTab} />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- DESKTOP & TABLET LAYOUT (>= 768px) --- */}
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
                  {activeTab === 'Live Data' ? t('analytics.liveData', 'Live Data') : activeTab === 'Buoys Analytics' ? t('analytics.buoysAnalytics', 'Buoys Analytics') : t('analytics.stationHealth', 'Station Health')}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {t('analytics.pageSubtitle')}
                </p>
              </div>

              {/* Controls Row (Inside Panel) */}
              <div className="flex items-center justify-between mb-6">
                <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} isTablet={isTablet} isMobile={isMobile} />
                {activeTab === 'Live Data' ? (
                  <AnalyticsFilters 
                    isMobile={isMobile}
                    isTablet={isTablet}
                    selectedBuoy={selectedBuoy} 
                    setSelectedBuoy={setSelectedBuoy} 
                    selectedView={selectedView} 
                    setSelectedView={setSelectedView} 
                    selectedParams={selectedParams}
                    setSelectedParams={setSelectedParams}
                    chartType={chartType}
                    setChartType={setChartType}
                    selectedDuration={selectedDuration}
                    setSelectedDuration={setSelectedDuration}
                  />
                ) : activeTab === 'Buoys Analytics' ? (
                  <AnalyticsFilters 
                    isMobile={isMobile}
                    isTablet={isTablet}
                    isBuoysAnalytics={true}
                    selectedBuoy={selectedBuoys} 
                    setSelectedBuoy={setSelectedBuoys} 
                    selectedView={selectedView} 
                    setSelectedView={setSelectedView} 
                    selectedParams={selectedParams}
                    setSelectedParams={setSelectedParams}
                    chartType={chartType}
                    setChartType={setChartType}
                    selectedDuration={selectedDuration}
                    setSelectedDuration={setSelectedDuration}
                    selectedInfoType={selectedInfoType}
                    setSelectedInfoType={setSelectedInfoType}
                    selectedPredefined={selectedPredefined}
                    setSelectedPredefined={setSelectedPredefined}
                    thresholdValue={thresholdValue}
                    setThresholdValue={setThresholdValue}
                  />
                ) : (
                  <SensorDataFilters 
                    activeSubTab={stationHealthTab}
                    setActiveSubTab={setStationHealthTab}
                    selectedBuoy={stationHealthBuoy}
                    setSelectedBuoy={setStationHealthBuoy}
                    selectedDate={stationHealthDuration}
                    setSelectedDate={setStationHealthDuration}
                    isTablet={isTablet}
                    isMobile={isMobile}
                  />
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
                      <div className="flex-shrink-0 flex justify-between items-center px-6 pt-3.5 pb-1.5">
                        <h2 className="text-[18px] font-bold text-white leading-tight">{t('analytics.blueGreenAlgae', 'Blue-Green Algae')}</h2>
                        <DownloadDropdown t={t} onDownload={handleDownloadAction} />
                      </div>

                      {/* Scrollable body: chart + table */}
                      <div className={selectedView === 'Graph and Table View' && !isTablet ? "flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6" : "flex-1 overflow-y-auto analytics-panel-scroll min-h-0 px-6 pb-6"}>
                        {/* Chart (no header — handled above) */}
                        {selectedView !== 'Table View' && (
                          <div className={selectedView === 'Graph and Table View' ? "flex-shrink-0" : "w-full"}>
                            <BuoysChart 
                              showHeader={false} 
                              selectedParams={selectedParams} 
                              selectedBuoy={selectedBuoy} 
                              chartType={chartType} 
                              selectedDuration={selectedDuration} 
                              height={selectedView === 'Graph and Table View' && !isTablet ? '150px' : (isTablet ? '250px' : undefined)}
                              isGraphAndTableView={selectedView === 'Graph and Table View'}
                              isTablet={isTablet}
                            />
                          </div>
                        )}

                        {/* Gap + Table */}
                        {selectedView !== 'Graph View' && (
                          <div className={selectedView === 'Graph and Table View' ? "flex-1 min-h-0 mt-3 flex flex-col overflow-hidden" : "mt-6"}>
                            <SensorDataTable 
                              selectedBuoy={selectedBuoy} 
                              selectedParams={selectedParams} 
                              selectedDuration={selectedDuration} 
                              isGraphAndTableView={selectedView === 'Graph and Table View'}
                              isTablet={isTablet}
                              isMobile={isMobile}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : activeTab === 'Buoys Analytics' ? (
                    <div className="flex flex-col h-full min-h-0">
                      {/* Sticky Header: Title + Download — never scrolls */}
                      <div className="flex-shrink-0 flex justify-between items-center px-6 pt-3.5 pb-1.5">
                        <h2 className="text-[18px] font-bold text-white leading-tight">{t('analytics.buoysOverview')}</h2>
                        <DownloadDropdown t={t} onDownload={handleDownloadAction} />
                      </div>

                      {/* Scrollable body: chart + legend + table */}
                      <div className={selectedView === 'Graph and Table View' && !isTablet ? "flex-1 flex flex-col min-h-0 overflow-hidden px-6 pb-6" : "flex-1 overflow-y-auto analytics-panel-scroll min-h-0 px-6 pb-6"}>
                        {selectedBuoys.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center h-full w-full">
                            <span className="text-white/50 text-[16px] font-semibold tracking-wide">No Reports Generated Yet</span>
                          </div>
                        ) : (
                          <>
                            {/* Chart (no header — handled above) */}
                            {selectedView !== 'Table View' && (
                              <div className={selectedView === 'Graph and Table View' ? "flex-shrink-0" : "w-full"}>
                                <BuoysChart 
                                  showHeader={false} 
                                  selectedParams={selectedParams} 
                                  selectedBuoy={selectedBuoys} 
                                  chartType={chartType} 
                                  selectedDuration={selectedDuration} 
                                  height={selectedView === 'Graph and Table View' && !isTablet ? '150px' : (isTablet ? '250px' : undefined)}
                                  isGraphAndTableView={selectedView === 'Graph and Table View'}
                                  isBuoysAnalytics={true}
                                  thresholdValue={thresholdValue}
                                  isTablet={isTablet}
                                />
                              </div>
                            )}

                            {/* Divider line between chart and table in Buoys tab */}
                            {selectedView !== 'Graph View' && selectedView !== 'Table View' && (
                              <div className="w-full h-px my-4 flex-shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25) 10%, rgba(255, 255, 255, 0.25) 90%, transparent)' }} />
                            )}

                            {/* Gap + Table */}
                            {selectedView !== 'Graph View' && (
                              <div className={selectedView === 'Graph and Table View' ? "flex-1 min-h-0 mt-2 flex flex-col overflow-hidden" : "mt-4"}>
                                <SensorDataTable 
                                  selectedBuoy={selectedBuoys} 
                                  selectedParams={selectedParams} 
                                  selectedDuration={selectedDuration} 
                                  isGraphAndTableView={selectedView === 'Graph and Table View'}
                                  isTablet={isTablet}
                                  isMobile={isMobile}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 flex-1 min-h-0 overflow-y-auto analytics-panel-scroll">
                      {stationHealthTab === 'Alarms' ? (
                        <AlarmsTable />
                      ) : stationHealthTab === 'Battery Health' ? (
                        <BatteryHealthView selectedBuoy={stationHealthBuoy} selectedDuration={stationHealthDuration} />
                      ) : (
                        <DataCaptureRateTable activeTab={stationHealthTab} />
                      )}
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

export default MISAnalyticsPage;
