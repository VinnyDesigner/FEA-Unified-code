import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const buoys = ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
const viewTypes = ['Graph and Table View', 'Graph View', 'Table View'];

const AnalyticsFilters = ({ 
  isMobile = false, 
  isTablet = false,
  isBuoysAnalytics = false,
  selectedBuoy = 'Al Aqah Buoy', 
  setSelectedBuoy, 
  selectedView = 'Graph and Table View', 
  setSelectedView,
  selectedParams = ['Bluegreen Algae', 'Water Temperature'],
  setSelectedParams,
  chartType = 'Line Chart',
  setChartType,
  selectedDuration = 'Monthly',
  setSelectedDuration,
  selectedInfoType = 'Sonde Information',
  setSelectedInfoType,
  selectedPredefined = 'Salinity (ppt) - pH',
  setSelectedPredefined,
  thresholdValue = false,
  setThresholdValue
}) => {
  const { t } = useTranslation();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isBuoyDropdownOpen, setIsBuoyDropdownOpen] = useState(false);

  // Temporary selection states until "Apply Filters" is clicked
  const [tempSelectedView, setTempSelectedView] = useState(selectedView);
  const [tempSelectedBuoy, setTempSelectedBuoy] = useState(selectedBuoy);

  useEffect(() => {
    setTempSelectedBuoy(selectedBuoy);
  }, [selectedBuoy]);

  // Filter menu selections
  const [localInfoType, localSetInfoType] = useState('Sonde Information');
  const infoType = selectedInfoType !== undefined ? selectedInfoType : localInfoType;
  const setInfoType = setSelectedInfoType !== undefined ? setSelectedInfoType : localSetInfoType;

  const [localPredefined, localSetPredefined] = useState('Salinity (ppt) - pH');
  const predefined = selectedPredefined !== undefined ? selectedPredefined : localPredefined;
  const setPredefined = setSelectedPredefined !== undefined ? setSelectedPredefined : localSetPredefined;

  const [localSelectedParams, localSetSelectedParams] = useState(['Bluegreen Algae', 'Water Temperature']);
  const params = selectedParams !== undefined ? selectedParams : localSelectedParams;
  const setParams = setSelectedParams !== undefined ? setSelectedParams : localSetSelectedParams;

  const [localDuration, localSetDuration] = useState('Monthly');
  const duration = selectedDuration !== undefined ? selectedDuration : localDuration;
  const setDuration = setSelectedDuration !== undefined ? setSelectedDuration : localSetDuration;

  const [localChartType, localSetChartType] = useState('Line Chart');
  const currentChartType = chartType !== undefined ? chartType : localChartType;
  const setCurrentChartType = setChartType !== undefined ? setChartType : localSetChartType;

  // 'main', 'parameters', or 'predefined' sub-steps inside the popover
  const [activeFilterStep, setActiveFilterStep] = useState('main');
  const [tempSelectedParams, setTempSelectedParams] = useState(params);
  const [tempDuration, setTempDuration] = useState(duration);
  const [tempChartType, setTempChartType] = useState(currentChartType);
  const [tempInfoType, setTempInfoType] = useState(infoType);
  const [tempPredefined, setTempPredefined] = useState(predefined);

  // Track selection mode: 'predefined' or 'custom'
  const [tempFilterSelectionMode, setTempFilterSelectionMode] = useState('predefined');

  const [openSelect, setOpenSelect] = useState(null);

  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const [viewPos, setViewPos] = useState({ top: 0, left: 0 });
  const [buoyPos, setBuoyPos] = useState({ top: 0, left: 0 });

  const filterBtnRef = useRef(null);
  const viewBtnRef = useRef(null);
  const buoyBtnRef = useRef(null);

  const filterMenuRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const buoyDropdownRef = useRef(null);

  const updatePositions = useCallback(() => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      setFilterPos({
        top: rect.bottom + window.scrollY + 10,
        left: window.innerWidth < 450 ? 16 : rect.right + window.scrollX - 350
      });
    }
    if (viewBtnRef.current) {
      const rect = viewBtnRef.current.getBoundingClientRect();
      setViewPos({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX
      });
    }
    if (buoyBtnRef.current) {
      const rect = buoyBtnRef.current.getBoundingClientRect();
      setBuoyPos({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX
      });
    }
  }, []);

  useEffect(() => {
    if (isFilterOpen || isViewDropdownOpen || isBuoyDropdownOpen) {
      updatePositions();
      window.addEventListener('scroll', updatePositions);
      window.addEventListener('resize', updatePositions);
    }
    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isFilterOpen, isViewDropdownOpen, isBuoyDropdownOpen, updatePositions]);

  // Sync temp selections when dropdowns open
  useEffect(() => {
    if (isViewDropdownOpen) setTempSelectedView(selectedView);
  }, [isViewDropdownOpen, selectedView]);

  useEffect(() => {
    if (isBuoyDropdownOpen) setTempSelectedBuoy(selectedBuoy);
  }, [isBuoyDropdownOpen, selectedBuoy]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterOpen && filterBtnRef.current && !filterBtnRef.current.contains(event.target) && filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (isViewDropdownOpen && viewBtnRef.current && !viewBtnRef.current.contains(event.target) && viewDropdownRef.current && !viewDropdownRef.current.contains(event.target)) {
        setIsViewDropdownOpen(false);
      }
      if (isBuoyDropdownOpen && buoyBtnRef.current && !buoyBtnRef.current.contains(event.target) && buoyDropdownRef.current && !buoyDropdownRef.current.contains(event.target)) {
        setIsBuoyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen, isViewDropdownOpen, isBuoyDropdownOpen]);

  // Sync state whenever filters open
  useEffect(() => {
    if (isFilterOpen) {
      setTempSelectedParams(params);
      setTempDuration(duration);
      setTempChartType(currentChartType);
      setTempInfoType(infoType);
      setTempPredefined(predefined);
      setTempSelectedView(selectedView);
      setActiveFilterStep('main');
      setOpenSelect(null);
    }
  }, [isFilterOpen, params, duration, currentChartType, infoType, predefined, selectedView]);

  // Style helpers
  const dropdownClass = `flex items-center justify-between ${
    isTablet ? 'px-[19.2px] py-[8px] text-[9.6px]' : 'px-5 py-2.5 text-[13px]'
  } text-white font-semibold w-full transition-all outline-none select-none cursor-pointer whitespace-nowrap`;
  const tabTriggerStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
  };

  const glassDropdownStyle = {
    borderRadius: '30px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
  };

  const applyButtonStyle = {
    background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
    borderRadius: '29px',
    boxShadow: '0 0 40px 0 rgba(0, 159, 172, 0.40), 0 0 1px 2px rgba(255, 255, 255, 0.15), 0 -3px 2px 0 rgba(0, 0, 0, 0.2) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.2) inset',
    color: '#FFFFFF',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    outline: 'none',
    border: 'none'
  };

  const getBuoyTriggerLabel = () => {
    if (isBuoysAnalytics && Array.isArray(selectedBuoy)) {
      if (selectedBuoy.length === 0) return "Select Station...";
      if (selectedBuoy.length === buoys.length) return "All Stations";
      if (selectedBuoy.length === 1) return selectedBuoy[0];
      return `${selectedBuoy.length} Stations`;
    }
    return selectedBuoy;
  };

  const viewTypeDropdown = (
    <div className={`flex-shrink-0 ${isTablet ? 'min-w-[136px]' : 'min-w-[170px]'}`}>
      <button 
            ref={viewBtnRef}
            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            className={dropdownClass}
            style={tabTriggerStyle}
          >
            <span>{selectedView}</span>
            <ChevronDown size={isTablet ? 11 : 14} className={`transition-transform duration-300 ${isViewDropdownOpen ? 'rotate-180' : ''} text-white/70 ml-2`} />
          </button>

          {isViewDropdownOpen && createPortal(
            <div 
              ref={viewDropdownRef}
              className="fixed z-[9999] p-5 flex flex-col gap-5"
              style={{
                ...glassDropdownStyle,
                top: viewPos.top,
                left: viewPos.left,
                width: '200px'
              }}
            >
              <div className="flex flex-col gap-4">
                {viewTypes.map((type) => {
                  const isChecked = selectedView === type;
                  return (
                    <button
                      key={type}
                      className="flex items-center gap-3 text-left outline-none cursor-pointer group"
                      onClick={() => {
                        if (setSelectedView) setSelectedView(type);
                        setIsViewDropdownOpen(false);
                      }}
                    >
                      <div 
                        className={`w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                        }`}
                      >
                        {isChecked && <div className="w-[6px] h-[6px] bg-[#009FAC] rounded-full" />}
                      </div>
                      <span className="text-white text-[13px] font-semibold">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
    </div>
  );

  const buoyDropdown = (
    <div className={`flex-shrink-0 ${isTablet ? 'min-w-[136px]' : 'min-w-[170px]'}`}>
      <button 
            ref={buoyBtnRef}
            onClick={() => setIsBuoyDropdownOpen(!isBuoyDropdownOpen)}
            className={dropdownClass}
            style={tabTriggerStyle}
          >
            <span>{getBuoyTriggerLabel()}</span>
            <ChevronDown size={isTablet ? 11 : 14} className={`transition-transform duration-300 ${isBuoyDropdownOpen ? 'rotate-180' : ''} text-white/70 ml-2`} />
          </button>

          {isBuoyDropdownOpen && createPortal(
            <div 
              ref={buoyDropdownRef}
              className="fixed z-[9999] p-5 flex flex-col gap-4"
              style={{
                ...glassDropdownStyle,
                top: buoyPos.top,
                left: buoyPos.left,
                width: '230px'
              }}
            >
              <div className="flex flex-col mb-0.5">
                <span className="text-white text-[13.5px] font-bold pb-2 border-b border-white/10">Stations</span>
              </div>

              <div className="flex flex-col gap-4">
                {buoys.map((buoy) => {
                  const isChecked = isBuoysAnalytics && Array.isArray(selectedBuoy)
                    ? selectedBuoy.includes(buoy)
                    : selectedBuoy === buoy;

                  return (
                    <button
                      key={buoy}
                      className="flex items-center gap-3.5 text-left outline-none cursor-pointer group w-full border-none bg-transparent"
                      onClick={() => {
                        if (isBuoysAnalytics && Array.isArray(selectedBuoy)) {
                          const newSelection = selectedBuoy.includes(buoy)
                            ? selectedBuoy.filter(b => b !== buoy)
                            : [...selectedBuoy, buoy];
                          if (setSelectedBuoy) setSelectedBuoy(newSelection);
                        } else {
                          if (setSelectedBuoy) setSelectedBuoy(buoy);
                          setIsBuoyDropdownOpen(false);
                        }
                      }}
                    >
                      {isBuoysAnalytics ? (
                        /* Checkbox styling for multi-select station filter */
                        <div 
                          className={`w-[17px] h-[17px] rounded-[4px] border-2 transition-all flex items-center justify-center ${
                            isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                          }`}
                        >
                          {isChecked && (
                            <svg width="8" height="6" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      ) : (
                        /* Radio styling for single-select live data station filter */
                        <div 
                          className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                          }`}
                        >
                          {isChecked && <div className="w-[7px] h-[7px] bg-[#009FAC] rounded-full" />}
                        </div>
                      )}
                      <span className="text-white text-[13px] font-semibold">{buoy}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
    </div>
  );

  const filterButton = (
    <div className="flex flex-col">
      <button 
            ref={filterBtnRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`${
              isTablet ? 'px-[19.2px] py-[8px] text-[9.6px] h-auto' : 'px-6 h-[38px] text-[13px]'
            } text-white font-bold tracking-wide flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none`}
            style={applyButtonStyle}
          >
            <Filter size={isTablet ? 10 : 13} className="text-white" />
            <span className="whitespace-nowrap text-white">Filter</span>
          </button>

          {isFilterOpen && createPortal(
            <div 
              ref={filterMenuRef}
              className="fixed z-[9999] p-5 flex flex-col gap-4 animate-fadeIn"
              style={{
                ...glassDropdownStyle,
                top: filterPos.top,
                left: filterPos.left,
                width: '350px'
              }}
            >
              {activeFilterStep === 'predefined' && isBuoysAnalytics ? (
                // --- PRE DEFINED PARAMETERS SELECTION VIEW (RADIO LIST MATCHING FigMA SPEC EXACTLY) ---
                <>
                  <div className="flex flex-col gap-1.5 mb-1.5 text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Select Predefined Parameter</span>
                  </div>

                  <div className="flex flex-col gap-4 py-2">
                    {[
                      'Water Temperature (ºC) - Turbidity (NTU)',
                      'Salinity (ppt) - pH',
                      'Depth (m) - Blue Green Algae (ug)',
                      'Dissolved Oxygen (mg/l) - pH',
                      'Specific Conductivity (uS) - Chlorophyll (ug)',
                      'Oxygen Saturation (%) - Salinity (ppt)'
                    ].map((opt) => {
                      const isChecked = tempPredefined === opt;
                      return (
                        <button
                          key={opt}
                          className="flex items-center gap-3.5 text-left outline-none cursor-pointer group w-full border-none bg-transparent"
                          onClick={() => setTempPredefined(opt)}
                        >
                          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                          }`}>
                            {isChecked && <div className="w-[8px] h-[8px] bg-[#009FAC] rounded-full" />}
                          </div>
                          <span className="text-white text-[13px] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-1">
                    <button
                      className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                      onClick={() => setActiveFilterStep('main')}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...applyButtonStyle,
                        fontSize: '12px',
                        padding: '7px 18px',
                        borderRadius: '20px'
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => {
                        // Map parameters based on selected predefined option
                        if (tempPredefined === 'Water Temperature (ºC) - Turbidity (NTU)') {
                          setTempSelectedParams(['Water Temperature', 'Turbidity']);
                        } else if (tempPredefined === 'Salinity (ppt) - pH') {
                          setTempSelectedParams(['Salinity', 'pH']);
                        } else if (tempPredefined === 'Depth (m) - Blue Green Algae (ug)') {
                          setTempSelectedParams(['Depth', 'Bluegreen Algae']);
                        } else if (tempPredefined === 'Dissolved Oxygen (mg/l) - pH') {
                          setTempSelectedParams(['Dissolved Oxygen', 'pH']);
                        } else if (tempPredefined === 'Specific Conductivity (uS) - Chlorophyll (ug)') {
                          setTempSelectedParams(['Specific Conductivity', 'Chlorophyll']);
                        } else if (tempPredefined === 'Oxygen Saturation (%) - Salinity (ppt)') {
                          setTempSelectedParams(['Oxygen Saturation', 'Salinity']);
                        }
                        setTempFilterSelectionMode('predefined');
                        setActiveFilterStep('main');
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              ) : isBuoysAnalytics && activeFilterStep === 'main' ? (
                // --- CUSTOM BUOYS FILTER OPTIONS (WITH PREDEFINED VS CUSTOM TOGGLING) ---
                <>
                  {/* Select Type of Information */}
                  <div className="flex flex-col gap-1.5 relative text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Select Type of Information</span>
                    <div 
                      onClick={() => setOpenSelect(openSelect === 'infoType' ? null : 'infoType')}
                      className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                    >
                      <span>{tempInfoType}</span>
                      <ChevronDown size={13} className={`text-white/60 transition-transform ${openSelect === 'infoType' ? 'rotate-180' : ''}`} />
                    </div>
                    {openSelect === 'infoType' && (
                      <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#153437] border border-white/10 rounded-[10px] z-50 py-1 shadow-2xl">
                        {['Sonde Information', 'Weather Information'].map((opt) => (
                          <div 
                            key={opt}
                            onClick={() => {
                              setTempInfoType(opt);
                              setOpenSelect(null);
                            }}
                            className="px-3.5 py-2 hover:bg-white/10 text-white text-[13px] font-medium cursor-pointer transition-colors"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pre Defined Parameter (Active/Disabled toggle) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Pre Defined Parameter</span>
                      <button 
                        onClick={() => setTempFilterSelectionMode('predefined')}
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all cursor-pointer border-none outline-none ${
                          tempFilterSelectionMode === 'predefined' 
                            ? 'bg-[#1DCDDD] text-white font-bold' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 font-semibold'
                        }`}
                      >
                        Active
                      </button>
                    </div>
                    <div 
                      onClick={() => {
                        setTempFilterSelectionMode('predefined');
                        setOpenSelect(null);
                        setActiveFilterStep('predefined');
                      }}
                      className={`flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-all select-none ${
                        tempFilterSelectionMode !== 'predefined' ? 'opacity-30 cursor-not-allowed bg-white/0 border-white/5' : ''
                      }`}
                    >
                      <span className="truncate">{tempPredefined}</span>
                      <ChevronDown size={13} className="text-white/60 flex-shrink-0 ml-1" />
                    </div>
                  </div>

                  {/* Parameters (Active/Disabled toggle) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Parameters</span>
                      <button 
                        onClick={() => setTempFilterSelectionMode('custom')}
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all cursor-pointer border-none outline-none ${
                          tempFilterSelectionMode === 'custom' 
                            ? 'bg-[#1DCDDD] text-white font-bold' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 font-semibold'
                        }`}
                      >
                        Active
                      </button>
                    </div>
                    <div 
                      onClick={() => {
                        setTempFilterSelectionMode('custom');
                        setOpenSelect(null);
                        setActiveFilterStep('parameters');
                      }}
                      className={`flex items-center justify-between px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-[10px] text-white text-[12px] cursor-pointer hover:bg-white/10 transition-all min-h-[38px] ${
                        tempFilterSelectionMode !== 'custom' ? 'opacity-30 cursor-not-allowed bg-white/0 border-white/5' : ''
                      }`}
                    >
                      <div className="flex flex-wrap gap-1.5 items-center max-w-[260px]">
                        {tempSelectedParams.length === 0 ? (
                          <span className="text-white/40">Select Parameters...</span>
                        ) : (
                          tempSelectedParams.map((param) => (
                            <span key={param} className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[11px] font-bold border border-white/5 text-white/90">
                              {param} 
                              <span 
                                className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors animate-scaleIn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (tempFilterSelectionMode === 'custom') {
                                    setTempSelectedParams(tempSelectedParams.filter(p => p !== param));
                                  }
                                }}
                              >
                                <X size={8} className="text-white" />
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown size={13} className="text-white/60 ml-1.5 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col gap-1.5 relative text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Duration</span>
                    <div 
                      onClick={() => {
                        setOpenSelect(null);
                        setActiveFilterStep('duration');
                      }}
                      className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                    >
                      <span>{tempDuration}</span>
                      <ChevronDown size={13} className="text-white/60" />
                    </div>
                  </div>

                  {/* Chart Type Radio */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Chart Type</span>
                    <div className="flex items-center gap-4">
                      {['Bar Chart', 'Line Chart', 'Scatter Chart'].map((type) => {
                        const isChecked = tempChartType === type;
                        return (
                          <button
                            key={type}
                            className="flex items-center gap-1.5 outline-none cursor-pointer group border-none bg-transparent"
                            onClick={() => setTempChartType(type)}
                          >
                            <div className={`w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                            }`}>
                              {isChecked && <div className="w-[6px] h-[6px] bg-[#009FAC] rounded-full" />}
                            </div>
                            <span className="text-white text-[11px] font-bold leading-none">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* View Type — tablet only, shown inside filter popup */}
                  {isTablet && (
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-white text-[10px] font-bold tracking-wider uppercase opacity-75">View</span>
                      <div className="flex flex-col gap-2.5">
                        {viewTypes.map((type) => {
                          const isChecked = tempSelectedView === type;
                          return (
                            <button
                              key={type}
                              className="flex items-center gap-2.5 text-left outline-none cursor-pointer group border-none bg-transparent"
                              onClick={() => setTempSelectedView(type)}
                            >
                              <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-all ${
                                isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                              }`}>
                                {isChecked && <div className="w-[6px] h-[6px] bg-[#009FAC] rounded-full" />}
                              </div>
                              <span className="text-white text-[10.5px] font-semibold">{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-1">
                    <button
                      className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...applyButtonStyle,
                        fontSize: '12px',
                        padding: '7px 18px',
                        borderRadius: '20px'
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => {
                        // Apply whichever parameters selection mode is currently active!
                        if (tempFilterSelectionMode === 'predefined') {
                          let paramsToSet = [];
                          if (tempPredefined === 'Water Temperature (ºC) - Turbidity (NTU)') {
                            paramsToSet = ['Water Temperature', 'Turbidity'];
                          } else if (tempPredefined === 'Salinity (ppt) - pH') {
                            paramsToSet = ['Salinity', 'pH'];
                          } else if (tempPredefined === 'Depth (m) - Blue Green Algae (ug)') {
                            paramsToSet = ['Depth', 'Bluegreen Algae'];
                          } else if (tempPredefined === 'Dissolved Oxygen (mg/l) - pH') {
                            paramsToSet = ['Dissolved Oxygen', 'pH'];
                          } else if (tempPredefined === 'Specific Conductivity (uS) - Chlorophyll (ug)') {
                            paramsToSet = ['Specific Conductivity', 'Chlorophyll'];
                          } else if (tempPredefined === 'Oxygen Saturation (%) - Salinity (ppt)') {
                            paramsToSet = ['Oxygen Saturation', 'Salinity'];
                          }
                          setParams(paramsToSet);
                        } else {
                          setParams(tempSelectedParams);
                        }
                        setDuration(tempDuration);
                        setCurrentChartType(tempChartType);
                        setInfoType(tempInfoType);
                        setPredefined(tempPredefined);
                        if (isTablet && setSelectedView) setSelectedView(tempSelectedView);
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              ) : activeFilterStep === 'main' ? (
                // --- STANDARD FILTER OPTIONS (LIVE DATA TAB) ---
                <>

                  {/* Parameters Input Chips */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-white text-[10px] font-bold tracking-wider uppercase opacity-75">Parameters</span>
                    <div 
                      onClick={() => {
                        setTempSelectedParams(tempSelectedParams);
                        setActiveFilterStep('parameters');
                      }}
                      className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-[10px] text-white text-[12px] cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div className="flex flex-wrap gap-1.5 items-center max-w-[240px]">
                        {tempSelectedParams.length === 0 ? (
                          <span className="text-white/40">Select Parameters...</span>
                        ) : (
                          tempSelectedParams.map((param) => (
                            <span key={param} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[10.5px] font-semibold border border-white/5 text-white/90 animate-scaleIn">
                              {param} 
                              <span 
                                className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTempSelectedParams(tempSelectedParams.filter(p => p !== param));
                                }}
                              >
                                <X size={8} className="text-white" />
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown size={13} className="text-white/60 ml-2" />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col gap-1.5 relative text-left">
                    <span className="text-white text-[10px] font-bold tracking-wider uppercase opacity-75">Duration</span>
                    <div 
                      onClick={() => {
                        setOpenSelect(null);
                        setActiveFilterStep('duration');
                      }}
                      className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                    >
                      <span>{tempDuration}</span>
                      <ChevronDown size={13} className="text-white/60" />
                    </div>
                  </div>

                  {/* Chart Type Radio */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-white text-[10px] font-bold tracking-wider uppercase opacity-75">Chart Type</span>
                    <div className="flex items-center gap-4">
                      {['Bar Chart', 'Line Chart', 'Scatter Chart'].map((type) => {
                        const isChecked = tempChartType === type;
                        return (
                          <button
                            key={type}
                            className="flex items-center gap-1.5 outline-none cursor-pointer group border-none bg-transparent"
                            onClick={() => setTempChartType(type)}
                          >
                            <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                            }`}>
                              {isChecked && <div className="w-[6px] h-[6px] bg-[#009FAC] rounded-full" />}
                            </div>
                            <span className="text-white text-[10.5px] font-semibold leading-none">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* View Type — tablet only, shown inside filter popup */}
                  {isTablet && (
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-white text-[10px] font-bold tracking-wider uppercase opacity-75">View</span>
                      <div className="flex flex-col gap-2.5">
                        {viewTypes.map((type) => {
                          const isChecked = tempSelectedView === type;
                          return (
                            <button
                              key={type}
                              className="flex items-center gap-2.5 text-left outline-none cursor-pointer group border-none bg-transparent"
                              onClick={() => setTempSelectedView(type)}
                            >
                              <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-all ${
                                isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                              }`}>
                                {isChecked && <div className="w-[6px] h-[6px] bg-[#009FAC] rounded-full" />}
                              </div>
                              <span className="text-white text-[10.5px] font-semibold">{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-1">
                    <button
                      className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...applyButtonStyle,
                        fontSize: '12px',
                        padding: '7px 18px',
                        borderRadius: '20px'
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => {
                        setParams(tempSelectedParams);
                        setDuration(tempDuration);
                        setCurrentChartType(tempChartType);
                        setInfoType(tempInfoType);
                        if (isTablet && setSelectedView) setSelectedView(tempSelectedView);
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              ) : activeFilterStep === 'parameters' ? (
                // --- CUSTOM PARAMETERS LIST SUB-VIEW ---
                <>
                  <div className="flex flex-col gap-1 mb-1 text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Select Parameters</span>
                  </div>

                  <div className="flex flex-col gap-3 pt-1 max-h-[220px] overflow-y-auto analytics-panel-scroll text-left">
                    {(() => {
                      const allParams = [
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
                      ];
                      const isAllChecked = tempSelectedParams.length === allParams.length;
                      return (
                        <>
                          <button
                            key="All"
                            className="flex items-center gap-3 text-left outline-none cursor-pointer group border-none bg-transparent"
                            onClick={() => {
                              if (isAllChecked) {
                                setTempSelectedParams([]);
                              } else {
                                setTempSelectedParams(allParams);
                              }
                            }}
                          >
                            <div 
                              className={`w-[16px] h-[16px] rounded-[3px] border-2 transition-all flex items-center justify-center ${
                                isAllChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                              }`}
                            >
                              {isAllChecked && (
                                <svg width="8" height="6" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span className="text-white text-[13px] font-semibold leading-none">All</span>
                          </button>

                          {allParams.map((param) => {
                            const isChecked = tempSelectedParams.includes(param);
                            return (
                              <button
                                key={param}
                                className="flex items-center gap-3 text-left outline-none cursor-pointer group border-none bg-transparent"
                                onClick={() => {
                                  if (isChecked) {
                                    setTempSelectedParams(tempSelectedParams.filter(p => p !== param));
                                  } else {
                                    setTempSelectedParams([...tempSelectedParams, param]);
                                  }
                                }}
                              >
                                <div 
                                  className={`w-[16px] h-[16px] rounded-[3px] border-2 transition-all flex items-center justify-center ${
                                    isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                                  }`}
                                >
                                  {isChecked && (
                                    <svg width="8" height="6" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <span className="text-white text-[14px] font-bold group-hover:text-[#1DCDDD] transition-colors leading-none">{param}</span>
                              </button>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-2">
                    <button
                      className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                      onClick={() => setActiveFilterStep('main')}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...applyButtonStyle,
                        fontSize: '12px',
                        padding: '7px 18px',
                        borderRadius: '20px'
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => {
                        setTempFilterSelectionMode('custom');
                        setActiveFilterStep('main');
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              ) : activeFilterStep === 'duration' ? (
                // --- CUSTOM DURATION SELECTION SUB-VIEW (RADIO LIST MATCHING DESIGN SPEC EXACTLY) ---
                <>
                  <div className="flex flex-col gap-1.5 mb-1.5 text-left">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Select Duration</span>
                  </div>

                  <div className="flex flex-col gap-4 py-2 text-left">
                    {[
                      'Live Data',
                      'Last Day',
                      'Last Week',
                      'Last Month',
                      'Last Three Months'
                    ].map((opt) => {
                      const isChecked = tempDuration === opt;
                      return (
                        <button
                          key={opt}
                          className="flex items-center gap-3.5 text-left outline-none cursor-pointer group w-full border-none bg-transparent"
                          onClick={() => setTempDuration(opt)}
                        >
                          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                          }`}>
                            {isChecked && <div className="w-[8px] h-[8px] bg-[#009FAC] rounded-full" />}
                          </div>
                          <span className="text-white text-[14px] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-1">
                    <button
                      className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                      onClick={() => setActiveFilterStep('main')}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...applyButtonStyle,
                        fontSize: '12px',
                        padding: '7px 18px',
                        borderRadius: '20px'
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => {
                        setActiveFilterStep('main');
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              ) : null}
            </div>,
            document.body
          )}
    </div>
  );

  if (isTablet) {
    return (
      <div className="w-full lg:w-auto">
        <div className="flex flex-row items-center justify-end gap-4">
          {buoyDropdown}
          {filterButton}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-auto">
      <div className={`flex ${isMobile ? 'flex-col gap-4 w-full' : 'flex-row items-center gap-4'}`}>
        {viewTypeDropdown}
        {buoyDropdown}
        {filterButton}
      </div>
    </div>
  );
};

export default AnalyticsFilters;
