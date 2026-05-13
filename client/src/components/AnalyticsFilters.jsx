import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, MapPin, Filter, X, ChevronDown } from 'lucide-react';

const AnalyticsFilters = ({ isMobile = false }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);

  const updateFilterPos = useCallback(() => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      if (window.innerWidth < 1024) {
        // Mobile/Tablet: Centered or full-width relative to screen
        setFilterPos({
          top: rect.bottom + window.scrollY + 8,
          left: window.innerWidth > 450 ? (window.innerWidth - 420) / 2 : 16
        });
      } else {
        setFilterPos({
          top: rect.bottom + window.scrollY + 8,
          left: rect.right + window.scrollX - 420
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isFilterOpen) {
      updateFilterPos();
      window.addEventListener('scroll', updateFilterPos);
      window.addEventListener('resize', updateFilterPos);
    }
    return () => {
      window.removeEventListener('scroll', updateFilterPos);
      window.removeEventListener('resize', updateFilterPos);
    };
  }, [isFilterOpen, updateFilterPos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterOpen && 
          filterBtnRef.current && !filterBtnRef.current.contains(event.target) &&
          filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const labelClass = "text-white text-[14px] font-bold mb-2";
  const selectBoxClass = "flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-[12px] text-white text-[14px] font-medium w-full";

  const filterStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
    color: '#FFFFFF',
    fontWeight: '400',
    backdropFilter: 'blur(10px)'
  };

  return (
    <div className={`grid grid-cols-2 lg:flex lg:flex-row items-center gap-3 w-full lg:w-auto`}>
      {/* Date Picker 1 */}
      <div 
        className="flex items-center gap-2 px-4 py-2 text-[11px] md:text-xs transition-all cursor-pointer w-full lg:w-auto justify-center lg:justify-start"
        style={filterStyle}
      >
        <Calendar size={14} className="text-white/70" />
        <span className="whitespace-nowrap">09-02-2025</span>
      </div>

      {/* Date Picker 2 */}
      <div 
        className="flex items-center gap-2 px-4 py-2 text-[11px] md:text-xs transition-all cursor-pointer w-full lg:w-auto justify-center lg:justify-start"
        style={filterStyle}
      >
        <Calendar size={14} className="text-white/70" />
        <span className="whitespace-nowrap">09-02-2026</span>
      </div>

      {/* Location Dropdown */}
      <div 
        className="flex items-center gap-2 px-4 py-2 text-[11px] md:text-xs transition-all cursor-pointer w-full lg:w-auto justify-center lg:justify-start"
        style={filterStyle}
      >
        <MapPin size={14} className="text-white/70" />
        <span className="whitespace-nowrap">Al Aqah New</span>
      </div>

      {/* Filter Button */}
      <button 
        ref={filterBtnRef}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="flex items-center gap-2 px-4 py-2 text-[11px] md:text-xs font-bold transition-all hover:brightness-110 active:scale-95 w-full lg:w-auto justify-center lg:justify-start"
        style={filterStyle}
      >
        <Filter size={14} className="text-white/70" />
        Filter
      </button>

      {/* Filter Menu via Portal */}
      {isFilterOpen && createPortal(
        <div 
          ref={filterMenuRef}
          className="fixed z-[9999] p-6 md:p-8 flex flex-col gap-6 shadow-2xl"
          style={{
            top: filterPos.top,
            left: filterPos.left,
            width: window.innerWidth < 450 ? 'calc(100% - 32px)' : '420px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0.40) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Parameters */}
          <div className="flex flex-col">
            <label className={labelClass}>Parameters</label>
            <div className={selectBoxClass}>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[13px]">
                  Bluegreen Algae <X size={14} className="cursor-pointer" />
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[13px]">
                  Water Temperature <X size={14} className="cursor-pointer" />
                </span>
              </div>
              <ChevronDown size={14} className="text-white/70" />
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col">
            <label className={labelClass}>Duration</label>
            <div className={selectBoxClass}>
              <span>Monthly</span>
              <ChevronDown size={14} className="text-white/70" />
            </div>
          </div>

          {/* Chart Type */}
          <div className="flex flex-col">
            <label className={labelClass}>Chart Type</label>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {['Bar Chart', 'Line Chart', 'Scatter Chart'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${type === 'Line Chart' ? 'border-[#1DCDDD]' : 'border-white/30 group-hover:border-white/50'}`}>
                    {type === 'Line Chart' && <div className="w-[8px] h-[8px] bg-[#1DCDDD] rounded-full" />}
                  </div>
                  <span className="text-white text-[14px] font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-white/30 group-hover:border-white/50 transition-all" />
            <span className="text-white text-[14px] font-medium">Threshold Value</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 sm:gap-8 mt-4">
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="text-white text-[16px] font-semibold hover:text-[#19D9F3] transition-colors"
            >
              Cancel
            </button>
            <button 
              className="w-full sm:w-auto px-10 h-[44px] text-white text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
                borderRadius: '29.455px',
                boxShadow: '0 0 40px 0 rgba(0, 159, 172, 0.30), 0 0 1px 4px rgba(255, 255, 255, 0.10)'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AnalyticsFilters;
