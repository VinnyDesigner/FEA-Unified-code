import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Filter, X, ChevronDown, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const buoys = ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah'];
const viewTypes = ['Graph and Table View', 'Graph View', 'Table View'];

const AnalyticsFilters = ({ isMobile = false, selectedBuoy = 'Al Aqah Buoy', setSelectedBuoy, selectedView = 'Graph and Table View', setSelectedView }) => {
  const { t } = useTranslation();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isBuoyDropdownOpen, setIsBuoyDropdownOpen] = useState(false);

  // Temporary selection state until "Apply Filters" is clicked
  const [tempSelectedView, setTempSelectedView] = useState(selectedView);
  const [tempSelectedBuoy, setTempSelectedBuoy] = useState(selectedBuoy);

  // Filter menu selections
  const [selectedInfoType, setSelectedInfoType] = useState('Sonde Information');
  const [selectedPredefined, setSelectedPredefined] = useState('Combo of Salinity and pH');
  const [selectedParams, setSelectedParams] = useState(['Bluegreen Algae', 'Water Temperature']);
  const [selectedDuration, setSelectedDuration] = useState('Monthly');
  const [selectedChartType, setSelectedChartType] = useState('Line Chart');
  const [hasThreshold, setHasThreshold] = useState(false);

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
        left: window.innerWidth < 450 ? 16 : rect.right + window.scrollX - 380
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

  // Trigger Style (Inactive tab pill — matches "Buoys Analytics" tab)
  const dropdownClass = "flex items-center justify-between px-5 py-2.5 text-white text-[13px] font-medium w-full transition-all outline-none select-none cursor-pointer whitespace-nowrap";
  const tabTriggerStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
  };
  const labelClass = "text-white text-[12px] font-bold ml-1 tracking-tight uppercase opacity-85";

  // Dropdown list styling (Matching Screenshots 1, 2, and 3: rounded 28px glassmorphism overlay card)
  const glassDropdownStyle = {
    borderRadius: '21px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
    width: '340px',
  };

  // CTA button styling matching Reports page "Download Report" CTA style
  const applyButtonStyle = {
    background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
    borderRadius: '29.455px',
    boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '14px',
    padding: '10px 24px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div className="w-full lg:w-auto">
      <div className={`flex ${isMobile ? 'flex-col gap-4 w-full' : 'flex-row items-end gap-4'}`}>
        
        {/* View Type Dropdown */}
        <div className="flex-1 flex flex-col min-w-[160px]">
          <button 
            ref={viewBtnRef}
            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            className={dropdownClass}
            style={tabTriggerStyle}
          >
            <span className="truncate">{selectedView}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isViewDropdownOpen ? 'rotate-180' : ''} text-white/70`} />
          </button>

          {isViewDropdownOpen && createPortal(
            <div 
              ref={viewDropdownRef}
              className="fixed z-[9999] p-6 flex flex-col gap-6"
              style={{
                ...glassDropdownStyle,
                top: viewPos.top,
                left: viewPos.left
              }}
            >
              {/* Radio Group List */}
              <div className="flex flex-col gap-5">
                {viewTypes.map((type) => {
                  const isChecked = selectedView === type;
                  return (
                    <button
                      key={type}
                      className="flex items-center gap-4 text-left outline-none cursor-pointer group"
                      onClick={() => {
                        setTempSelectedView(type);
                        if (setSelectedView) setSelectedView(type);
                        setIsViewDropdownOpen(false);
                      }}
                    >
                      {/* Custom Radio Circle */}
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                        }`}
                      />
                      <span className="text-white text-[15px] font-semibold leading-none">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Location/Buoy Dropdown */}
        <div className="flex-1 flex flex-col min-w-[160px]">
          <button 
            ref={buoyBtnRef}
            onClick={() => setIsBuoyDropdownOpen(!isBuoyDropdownOpen)}
            className={dropdownClass}
            style={tabTriggerStyle}
          >
            <span className="truncate">{selectedBuoy}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isBuoyDropdownOpen ? 'rotate-180' : ''} text-white/70`} />
          </button>

          {isBuoyDropdownOpen && createPortal(
            <div 
              ref={buoyDropdownRef}
              className="fixed z-[9999] p-6 flex flex-col gap-6"
              style={{
                ...glassDropdownStyle,
                top: buoyPos.top,
                left: buoyPos.left
              }}
            >
              {/* Dropdown Title Header with Divider */}
              <div className="flex flex-col mb-1">
                <span className="text-white text-[16px] font-bold pb-2 border-b border-white/10">All Stations</span>
              </div>

              {/* Radio Group List */}
              <div className="flex flex-col gap-5">
                {buoys.map((buoy) => {
                  const isChecked = selectedBuoy === buoy;
                  return (
                    <button
                      key={buoy}
                      className="flex items-center gap-4 text-left outline-none cursor-pointer group"
                      onClick={() => {
                        setTempSelectedBuoy(buoy);
                        if (setSelectedBuoy) setSelectedBuoy(buoy);
                        setIsBuoyDropdownOpen(false);
                      }}
                    >
                      {/* Radio Circle with Checkmark inside when checked */}
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                        }`}
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-[15px] font-semibold leading-none">{buoy}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Filter Button */}
        <div className="flex flex-col">
          <button 
            ref={filterBtnRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-6 h-[44px] text-white text-[14px] font-bold tracking-wide flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-1.5 select-none"
            style={{
              background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
              borderRadius: '29.455px',
              boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
            }}
          >
            <Filter size={14} className="text-white" />
            <span className="whitespace-nowrap text-white">Filter</span>
          </button>

          {isFilterOpen && createPortal(
            <div 
              ref={filterMenuRef}
              className="fixed z-[9999] p-6 flex flex-col gap-6"
              style={{
                ...glassDropdownStyle,
                top: filterPos.top,
                left: filterPos.left,
                width: '380px'
              }}
            >
              {/* Select Type of Information Dropdown */}
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] font-bold tracking-wide">Select Type of Information</span>
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-[12px] text-white text-[14px] font-semibold">
                  <span>{selectedInfoType}</span>
                  <ChevronDown size={14} className="text-white/70" />
                </div>
              </div>

              {/* Pre Defined Parameter Dropdown */}
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] font-bold tracking-wide">Pre Defined Parameter</span>
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-[12px] text-white text-[14px] font-semibold">
                  <span>{selectedPredefined}</span>
                  <ChevronDown size={14} className="text-white/70" />
                </div>
              </div>

              {/* Parameters Input Chips */}
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] font-bold tracking-wide">Parameters</span>
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/20 rounded-[12px] text-white text-[14px]">
                  <div className="flex flex-wrap gap-2 items-center">
                    {selectedParams.map((param) => (
                      <span key={param} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold select-none border border-white/5 text-white/90">
                        {param} 
                        <span 
                          className="w-4.5 h-4.5 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParams(selectedParams.filter(p => p !== param));
                          }}
                        >
                          <X size={10} className="text-white" />
                        </span>
                      </span>
                    ))}
                  </div>
                  <ChevronDown size={14} className="text-white/70 ml-2" />
                </div>
              </div>

              {/* Duration Input */}
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] font-bold tracking-wide">Duration</span>
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-[12px] text-white text-[14px] font-semibold">
                  <span>{selectedDuration}</span>
                  <ChevronDown size={14} className="text-white/70" />
                </div>
              </div>

              {/* Chart Type Radio */}
              <div className="flex flex-col gap-2">
                <span className="text-white text-[13px] font-bold tracking-wide">Chart Type</span>
                <div className="flex items-center gap-6">
                  {['Bar Chart', 'Line Chart', 'Scatter Chart'].map((type) => {
                    const isChecked = selectedChartType === type;
                    return (
                      <button
                        key={type}
                        className="flex items-center gap-2 outline-none cursor-pointer group"
                        onClick={() => setSelectedChartType(type)}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                        }`}>
                          {isChecked && <div className="w-[8px] h-[8px] bg-[#009FAC] rounded-full" />}
                        </div>
                        <span className="text-white text-xs font-semibold leading-none">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Threshold checkbox */}
              <button
                className="flex items-center gap-3 outline-none cursor-pointer group text-left"
                onClick={() => setHasThreshold(!hasThreshold)}
              >
                <div className={`w-[18px] h-[18px] rounded-[4px] border-2 transition-all flex items-center justify-center ${
                  hasThreshold ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                }`}>
                  {hasThreshold && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#009FAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-white text-[14px] font-semibold leading-none">Threshold Value</span>
              </button>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-end gap-6 pt-2 border-t border-white/5">
                <button
                  className="text-white/80 hover:text-white font-semibold text-[15px] cursor-pointer outline-none transition-colors"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Cancel
                </button>
                <button
                  style={applyButtonStyle}
                  className="hover:scale-[1.03] active:scale-[0.97]"
                  onClick={() => {
                    setIsFilterOpen(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>

      </div>
    </div>
  );
};

export default AnalyticsFilters;
