import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Calendar, MapPin, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SensorDataFilters = ({ 
  isMobile = false,
  isTablet = false,
  activeSubTab = 'Alarms',
  setActiveSubTab,
  selectedBuoy = 'Al Aqah Buoy',
  setSelectedBuoy,
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate
}) => {
  const { t } = useTranslation();

  
  const getTransLabel = (val) => {
    if (!val) return val;
    const map = {
      'Near Shore Buoy': 'stations.nearShore',
      'Offshore Buoy': 'stations.offshore',
      'Al Aqah Buoy': 'stations.alAqah',
      'North Dibbah': 'stations.northDibbah',
      'All Stations': 'stations.allStations',
      'Graph and Table View': 'analytics.graphAndTable',
      'Graph View': 'analytics.graphView',
      'Table View': 'analytics.tableView',
      'Line Chart': 'chart.lineChart',
      'Bar Chart': 'chart.barChart',
      'Area Chart': 'chart.areaChart',
      'Scatter Plot': 'chart.scatterPlot',
      'Scatter Chart': 'chart.scatterPlot',
      'Sonde Information': 'analytics.sondeInformation',
      'Specific Conductivity': 'parameters.specificConductivity',
      'Water Temperature': 'parameters.waterTemperature',
      'Salinity': 'parameters.salinity',
      'Chlorophyll': 'parameters.chlorophyll',
      'Oxygen Saturation': 'parameters.oxygenSaturation',
      'Dissolved Oxygen': 'parameters.dissolvedOxygen',
      'Turbidity': 'parameters.turbidity',
      'pH': 'parameters.pH',
      'Depth': 'parameters.depth',
      'Blue-Green Algae': 'parameters.blueGreenAlgae',
      'Bluegreen Algae': 'parameters.blueGreenAlgae',
      'Last Day': 'analytics.lastDay',
      'Last Week': 'analytics.lastWeek',
      'Last Month': 'analytics.lastMonth',
      'Last Three Months': 'analytics.lastThreeMonths',
      'Last 24 Hours': 'analytics.last24Hours'
    };
    return map[val] ? t(map[val], val) : t('analytics.' + val.charAt(0).toLowerCase() + val.slice(1).replace(/ /g, ''), val);
  };

  
  const [isSubTabOpen, setIsSubTabOpen] = useState(false);
  const [isBuoyOpen, setIsBuoyOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openSelect, setOpenSelect] = useState(null);

  const [tempSubTab, setTempSubTab] = useState(activeSubTab);
  const [localSelectedDate, localSetSelectedDate] = useState('Today');
  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : localSelectedDate;
  const setSelectedDate = propSetSelectedDate !== undefined ? propSetSelectedDate : localSetSelectedDate;

  const [tempDate, setTempDate] = useState(selectedDate || 'Live Data');
  const [tempBuoy, setTempBuoy] = useState(selectedBuoy);

  useEffect(() => {
    if (!['Live Data', 'Last Day', 'Last Week', 'Last Month', 'Last Three Months'].includes(selectedDate)) {
      setSelectedDate('Live Data');
      setTempDate('Live Data');
    }
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    if (isFilterOpen) {
      setTempSubTab(activeSubTab);
      setTempDate(selectedDate);
      setTempBuoy(selectedBuoy);
      setOpenSelect(null);
    }
  }, [isFilterOpen, activeSubTab, selectedDate, selectedBuoy]);

  const [subTabPos, setSubTabPos] = useState({ top: 0, left: 0 });
  const [buoyPos, setBuoyPos] = useState({ top: 0, left: 0 });
  const [datePos, setDatePos] = useState({ top: 0, left: 0 });
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });

  const subTabBtnRef = useRef(null);
  const buoyBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const filterBtnRef = useRef(null);

  const subTabDropdownRef = useRef(null);
  const buoyDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const filterMenuRef = useRef(null);

  const updatePositions = useCallback(() => {
    const isRtl = document.documentElement.dir === 'rtl';
    if (subTabBtnRef.current) {
      const rect = subTabBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 220;
      setSubTabPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (buoyBtnRef.current) {
      const rect = buoyBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 220;
      setBuoyPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (dateBtnRef.current) {
      const rect = dateBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 380;
      setDatePos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 450 ? 16 : rect.right + window.scrollX - 350;
      setFilterPos({
        top: rect.bottom + window.scrollY + 10,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
  }, []);

  useEffect(() => {
    if (isSubTabOpen || isBuoyOpen || isDateOpen || isFilterOpen) {
      updatePositions();
      window.addEventListener('scroll', updatePositions);
      window.addEventListener('resize', updatePositions);
    }
    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isSubTabOpen, isBuoyOpen, isDateOpen, isFilterOpen, updatePositions]);

  useEffect(() => {
    if (isDateOpen) {
      setTempDate(selectedDate);
    }
  }, [isDateOpen, selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSubTabOpen && subTabBtnRef.current && !subTabBtnRef.current.contains(event.target) && subTabDropdownRef.current && !subTabDropdownRef.current.contains(event.target)) {
        setIsSubTabOpen(false);
      }
      if (isBuoyOpen && buoyBtnRef.current && !buoyBtnRef.current.contains(event.target) && buoyDropdownRef.current && !buoyDropdownRef.current.contains(event.target)) {
        setIsBuoyOpen(false);
      }
      if (isDateOpen && dateBtnRef.current && !dateBtnRef.current.contains(event.target) && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
      if (isFilterOpen && filterBtnRef.current && !filterBtnRef.current.contains(event.target) && filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSubTabOpen, isBuoyOpen, isDateOpen, isFilterOpen]);

  const subTabs = ['Alarms', 'Battery Health'];
  const buoys = ['All Stations', 'Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
  const timeRanges = ['Live Data', 'Last Day', 'Last Week', 'Last Month', 'Last Three Months'];

  const resolveSelectedArray = (buoyState) => {
    return Array.isArray(buoyState) 
      ? buoyState 
      : buoyState === 'All Stations' || buoyState === '4 Stations'
        ? ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah']
        : [buoyState];
  };

  const selectedArray = resolveSelectedArray(selectedBuoy);
  const tempSelectedArray = resolveSelectedArray(tempBuoy);

  const getBuoyTriggerLabel = (buoyState, isTemp) => {
    const subTabToUse = isTemp ? tempSubTab : activeSubTab;
    if (subTabToUse !== 'Battery Health') {
      if (!buoyState) return 'Select Station';
      return buoyState === '4 Stations' || buoyState === 'All Stations' ? 'All Stations' : buoyState;
    }
    const arr = isTemp ? tempSelectedArray : selectedArray;
    if (!arr || arr.length === 0 || (arr.length === 1 && !arr[0])) return 'Select Station';
    const individualStations = ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
    const allSelected = individualStations.every(s => arr.includes(s));
    if (allSelected || buoyState === 'All Stations') {
      return 'All Stations';
    }
    return arr.filter(Boolean).map(s => s.replace(' Buoy', '')).join(', ');
  };

  const filterStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
    color: '#FFFFFF',
    fontWeight: '400',
    backdropFilter: 'blur(10px)',
    height: '40px'
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

  const glassOverlayStyle = {
    borderRadius: '30px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
  };

  return (
    <div className={`flex flex-row items-center gap-2 md:gap-3 ${isMobile ? 'w-full' : 'w-auto'} lg:justify-end`}>
      
      {isTablet ? (
        <>
          <button 
            ref={filterBtnRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-1.5 px-[19.2px] py-[8px] text-[9.6px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{...filterStyle, height: 'auto'}}
          >
            <Filter size={10} className="text-white" />
            <span className="whitespace-nowrap text-white">{t("common.filter", "Filter")}</span>
          </button>

          {isFilterOpen && createPortal(
            <div 
              ref={filterMenuRef}
              className="fixed z-[9999] p-5 flex flex-col gap-4 animate-fadeIn"
              style={{
                ...glassOverlayStyle,
                top: filterPos.top,
                left: filterPos.left,
                width: '350px'
              }}
            >
              {/* Select View By (Sub Tab) */}
              <div className="flex flex-col gap-1.5 relative text-left">
                <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">{t("analytics.viewBy", "View By")}</span>
                <div 
                  onClick={() => setOpenSelect(openSelect === 'subtab' ? null : 'subtab')}
                  className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                >
                  <span>{getTransLabel(tempSubTab)}</span>
                  <ChevronDown size={13} className={`text-white/60 transition-transform ${openSelect === 'subtab' ? 'rotate-180' : ''}`} />
                </div>
                {openSelect === 'subtab' && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#153437] border border-white/10 rounded-[10px] z-50 py-1 shadow-2xl">
                    {subTabs.map((opt) => (
                      <div 
                        key={opt}
                        onClick={() => {
                          setTempSubTab(opt);
                          // Auto-adjust date if necessary based on tab
                          if (opt === 'Battery Health') {
                            setTempDate('Last Day');
                          } else {
                            setTempDate('Today');
                          }
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

              {/* Select Station Name */}
              <div className="flex flex-col gap-1.5 relative text-left">
                <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">Location</span>
                <div 
                  onClick={() => setOpenSelect(openSelect === 'buoy' ? null : 'buoy')}
                  className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={13} className="text-white/60 flex-shrink-0" />
                    <span className="truncate">{getBuoyTriggerLabel(tempBuoy, true)}</span>
                  </div>
                  <ChevronDown size={13} className={`text-white/60 transition-transform ${openSelect === 'buoy' ? 'rotate-180' : ''}`} />
                </div>
                {openSelect === 'buoy' && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#153437] border border-white/10 rounded-[10px] z-50 py-1 shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                    {buoys.map((buoy) => {
                      const isBatteryHealth = tempSubTab === 'Battery Health';
                      const individualStations = ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
                      const isChecked = buoy === 'All Stations'
                        ? individualStations.every(s => tempSelectedArray.includes(s))
                        : tempSelectedArray.includes(buoy);

                      return (
                        <div 
                          key={buoy}
                          onClick={() => {
                            if (isBatteryHealth) {
                              let nextSelected;
                              if (buoy === 'All Stations') {
                                if (individualStations.every(s => tempSelectedArray.includes(s))) {
                                  nextSelected = ['Near Shore Buoy'];
                                } else {
                                  nextSelected = individualStations;
                                }
                              } else {
                                if (tempSelectedArray.includes(buoy)) {
                                  if (tempSelectedArray.length > 1) {
                                    nextSelected = tempSelectedArray.filter(s => s !== buoy);
                                  } else {
                                    nextSelected = tempSelectedArray;
                                  }
                                } else {
                                  nextSelected = [...tempSelectedArray, buoy];
                                }
                              }
                              setTempBuoy(nextSelected);
                            } else {
                              setTempBuoy(buoy);
                              setOpenSelect(null);
                            }
                          }}
                          className="px-3.5 py-2 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3"
                        >
                          {isBatteryHealth ? (
                            <div className={`w-[16px] h-[16px] rounded-[4px] border-2 transition-all flex items-center justify-center ${
                              isChecked ? 'border-[#009FAC] bg-[#009FAC]' : 'border-white/40 bg-transparent'
                            }`}>
                              {isChecked && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          ) : (
                            <div className={`w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center transition-all ${
                              tempBuoy === buoy ? 'border-[#009FAC] bg-[#009FAC]' : 'border-white/40 bg-transparent'
                            }`}>
                              {tempBuoy === buoy && <div className="w-[6px] h-[6px] bg-white rounded-full" />}
                            </div>
                          )}
                          <span className="text-white text-[13px] font-medium">{getTransLabel(buoy)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Duration */}
              <div className="flex flex-col gap-1.5 relative text-left">
                <span className="text-white text-[11px] font-bold tracking-wider uppercase opacity-75">{t("analytics.duration", "Duration")}</span>
                <div 
                  onClick={() => setOpenSelect(openSelect === 'date' ? null : 'date')}
                  className="flex items-center justify-between px-3.5 py-2 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13px] font-semibold cursor-pointer hover:bg-white/10 transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-white/60 flex-shrink-0" />
                    <span>{tempDate}</span>
                  </div>
                  <ChevronDown size={13} className={`text-white/60 transition-transform ${openSelect === 'date' ? 'rotate-180' : ''}`} />
                </div>
                {openSelect === 'date' && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-[#153437] border border-white/10 rounded-[10px] z-50 py-1 shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                    {timeRanges.map((range) => {
                      const isChecked = tempDate === range;
                      return (
                        <div 
                          key={range}
                          onClick={() => {
                            setTempDate(range);
                            setOpenSelect(null);
                          }}
                          className="px-3.5 py-2 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3"
                        >
                          <div className={`w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'border-[#009FAC] bg-[#009FAC]' : 'border-white/40 bg-transparent'
                          }`}>
                            {isChecked && <div className="w-[6px] h-[6px] bg-white rounded-full" />}
                          </div>
                          <span className="text-white text-[13px] font-medium">{getTransLabel(range)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-end gap-5 pt-3 border-t border-white/10 mt-1">
                <button
                  className="text-white/80 hover:text-white font-semibold text-[13px] cursor-pointer outline-none transition-colors border-none bg-transparent"
                  onClick={() => setIsFilterOpen(false)}
                >{t("common.cancel", "Cancel")}</button>
                <button
                  style={{
                    ...applyButtonStyle,
                    fontSize: '12px',
                    padding: '7px 18px',
                    borderRadius: '20px'
                  }}
                  className="hover:scale-[1.03] active:scale-[0.97]"
                  onClick={() => {
                    setActiveSubTab(tempSubTab);
                    setSelectedBuoy(tempBuoy);
                    setSelectedDate(tempDate);
                    setIsFilterOpen(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>

            </div>,
            document.body
          )}
        </>
      ) : (
        <>
          {/* 1. Station Health Sub-Tab Selector Dropdown */}
          <button 
            ref={subTabBtnRef}
            onClick={() => setIsSubTabOpen(!isSubTabOpen)}
            className="flex items-center justify-between gap-2 px-3 md:px-5 py-2 text-[11px] md:text-xs font-semibold transition-all hover:brightness-110 active:scale-95 flex-1 lg:flex-none lg:w-auto min-w-0 lg:min-w-[140px]"
            style={filterStyle}
          >
            <span className="whitespace-nowrap text-ellipsis overflow-hidden">{activeSubTab}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isSubTabOpen ? 'rotate-180' : ''} text-white/70 flex-shrink-0`} />
          </button>

          {/* 2. Station Name Dropdown */}
          <button 
            ref={buoyBtnRef}
            onClick={() => setIsBuoyOpen(!isBuoyOpen)}
            className="flex items-center justify-between gap-2 px-3 md:px-5 py-2 text-[11px] md:text-xs font-semibold transition-all hover:brightness-110 active:scale-95 flex-1 lg:flex-none lg:w-auto min-w-0 lg:min-w-[150px]"
            style={filterStyle}
          >
            <div className="flex items-center gap-2 text-ellipsis overflow-hidden">
              <MapPin size={14} className="text-white/70 flex-shrink-0" />
              <span className="whitespace-nowrap text-ellipsis overflow-hidden">{getBuoyTriggerLabel(selectedBuoy, false)}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isBuoyOpen ? 'rotate-180' : ''} text-white/70 flex-shrink-0`} />
          </button>

          {/* 3. Date Selector Calendar Dropdown */}
          <button 
            ref={dateBtnRef}
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center justify-between gap-2 px-3 md:px-5 py-2 text-[11px] md:text-xs font-semibold transition-all hover:brightness-110 active:scale-95 flex-1 lg:flex-none lg:w-auto min-w-0 lg:min-w-[130px]"
            style={filterStyle}
          >
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-white/70 flex-shrink-0" />
              <span className="whitespace-nowrap">{selectedDate}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isDateOpen ? 'rotate-180' : ''} text-white/70 flex-shrink-0`} />
          </button>

          {/* Portals */}
          {isSubTabOpen && createPortal(
            <div 
              ref={subTabDropdownRef}
              className="fixed z-[9999] p-6 flex flex-col gap-5 shadow-2xl animate-fade-in"
              style={{
                ...glassOverlayStyle,
                top: subTabPos.top,
                left: subTabPos.left,
                width: window.innerWidth < 400 ? 'calc(100% - 32px)' : '380px',
              }}
            >
              <div className="flex flex-col gap-4">
                {subTabs.map((tab) => (
                  <label 
                    key={tab} 
                    className="flex items-center gap-3 cursor-pointer group select-none"
                    onClick={() => setTempSubTab(tab)}
                  >
                    <div 
                      className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all ${
                        tempSubTab === tab ? 'border-white bg-white' : 'border-white/30 group-hover:border-white/50 bg-transparent'
                      }`}
                    >
                      {tempSubTab === tab && <div className="w-[10px] h-[10px] bg-[#009FAC] rounded-full" />}
                    </div>
                    <span className="text-white text-[15px] font-medium">{tab}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-6 mt-4 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setIsSubTabOpen(false)}
                  className="text-white/80 text-[15px] font-semibold hover:text-white transition-colors cursor-pointer outline-none border-none bg-transparent"
                >{t("common.cancel", "Cancel")}</button>
                <button 
                  onClick={() => {
                    setActiveSubTab(tempSubTab);
                    setIsSubTabOpen(false);
                  }}
                  className="px-6 py-2 text-white text-[14px] font-bold tracking-wide flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={applyButtonStyle}
                >
                  Apply Filters
                </button>
              </div>
            </div>,
            document.body
          )}

          {isBuoyOpen && createPortal(
            <div 
              ref={buoyDropdownRef}
              className="fixed z-[9999] p-4 flex flex-col gap-3.5 shadow-2xl"
              style={{
                ...glassOverlayStyle,
                top: buoyPos.top,
                left: buoyPos.left,
                width: '220px',
              }}
            >
              {buoys.map((buoy) => {
                const isBatteryHealth = activeSubTab === 'Battery Health';
                const individualStations = ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
                
                const isChecked = buoy === 'All Stations'
                  ? individualStations.every(s => selectedArray.includes(s))
                  : selectedArray.includes(buoy);

                return (
                  <button
                    key={buoy}
                    onClick={() => {
                      if (isBatteryHealth) {
                        let nextSelected;
                        if (buoy === 'All Stations') {
                          if (individualStations.every(s => selectedArray.includes(s))) {
                            nextSelected = ['Near Shore Buoy'];
                          } else {
                            nextSelected = individualStations;
                          }
                        } else {
                          if (selectedArray.includes(buoy)) {
                            if (selectedArray.length > 1) {
                              nextSelected = selectedArray.filter(s => s !== buoy);
                            } else {
                              nextSelected = selectedArray;
                            }
                          } else {
                            nextSelected = [...selectedArray, buoy];
                          }
                        }
                        setSelectedBuoy(nextSelected);
                      } else {
                        setSelectedBuoy(buoy);
                        setIsBuoyOpen(false);
                      }
                    }}
                    className="w-full text-left outline-none cursor-pointer border-none bg-transparent py-1 group"
                  >
                    {isBatteryHealth ? (
                      <div className="flex items-center gap-3.5 w-full">
                        <div className={`w-[17px] h-[17px] rounded-[4px] border-2 transition-all flex items-center justify-center ${
                          isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                        }`}>
                          {isChecked && (
                            <svg width="8" height="6" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-white text-[13px] font-semibold group-hover:text-white/80 transition-colors">{getTransLabel(buoy)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3.5 w-full">
                        <div 
                          className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedBuoy === buoy ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                          }`}
                        >
                          {selectedBuoy === buoy && <div className="w-[7px] h-[7px] bg-[#009FAC] rounded-full" />}
                        </div>
                        <span className="text-white text-[13px] font-semibold group-hover:text-white/80 transition-colors">{getTransLabel(buoy)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body
          )}

          {isDateOpen && createPortal(
            <div 
              ref={dateDropdownRef}
              className="fixed z-[9999] p-6 flex flex-col gap-5 shadow-2xl"
              style={{
                ...glassOverlayStyle,
                top: datePos.top,
                left: datePos.left,
                width: window.innerWidth < 400 ? 'calc(100% - 32px)' : '380px',
              }}
            >
              <div className="flex flex-col gap-4">
                {timeRanges.map((range) => (
                  <label key={range} className="flex items-center gap-3 cursor-pointer group select-none">
                    <div 
                      onClick={() => setTempDate(range)}
                      className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all ${
                        tempDate === range ? 'border-white bg-white' : 'border-white/30 group-hover:border-white/50 bg-transparent'
                      }`}
                    >
                      {tempDate === range && <div className="w-[10px] h-[10px] bg-[#009FAC] rounded-full" />}
                    </div>
                    <span className="text-white text-[15px] font-medium" onClick={() => setTempDate(range)}>{getTransLabel(range)}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-6 mt-4 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setIsDateOpen(false)}
                  className="text-white/80 text-[15px] font-semibold hover:text-white transition-colors cursor-pointer outline-none border-none bg-transparent"
                >{t("common.cancel", "Cancel")}</button>
                <button 
                  onClick={() => {
                    setSelectedDate(tempDate);
                    setIsDateOpen(false);
                  }}
                  className="px-6 py-2 text-white text-[14px] font-bold tracking-wide flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={applyButtonStyle}
                >
                  Apply Filter
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

export default SensorDataFilters;
