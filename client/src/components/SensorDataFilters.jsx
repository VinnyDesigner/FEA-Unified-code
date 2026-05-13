import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Calendar } from 'lucide-react';

const SensorDataFilters = () => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dateBtnRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateDropdownPos = useCallback(() => {
    if (dateBtnRef.current) {
      const rect = dateBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 380 // Align to right of button (approx width 380)
      });
    }
  }, []);

  useEffect(() => {
    if (isDateOpen) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos);
      window.addEventListener('resize', updateDropdownPos);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isDateOpen, updateDropdownPos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDateOpen && 
          dateBtnRef.current && !dateBtnRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateOpen]);

  const timeRanges = [
    'Last Hour', 'Today', 'Last One Week', 'Last Two Week', 
    'Last One Month', 'Last Two Months', 'Last Three Months', 'Choose Period'
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Sonde Information Dropdown */}
      <button 
        className="flex items-center gap-2 px-4 py-2 text-xs transition-all hover:brightness-110 active:scale-95"
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.30)',
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
          boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
          color: '#FFFFFF',
          fontWeight: '400',
          backdropFilter: 'blur(10px)'
        }}
      >
        Sonde Information
        <ChevronDown size={14} className="text-white/70" />
      </button>

      {/* Date Selector */}
      <button 
        ref={dateBtnRef}
        onClick={() => setIsDateOpen(!isDateOpen)}
        className="flex items-center gap-2 px-4 py-2 text-xs transition-all hover:brightness-110 active:scale-95"
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.30)',
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
          boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
          color: '#FFFFFF',
          fontWeight: '400',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Calendar size={14} className="text-white/70" />
        Today
        <ChevronDown size={14} className={`transition-transform duration-300 ${isDateOpen ? 'rotate-180' : ''} text-white/70`} />
      </button>

      {/* Date Range Menu via Portal */}
      {isDateOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] p-8 flex flex-col gap-5 shadow-2xl"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: '380px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0.40) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col gap-4">
            {timeRanges.map((range) => (
              <label key={range} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all ${range === 'Today' ? 'border-white' : 'border-white/30 group-hover:border-white/50'}`}>
                  {range === 'Today' && <div className="w-[10px] h-[10px] bg-white rounded-full" />}
                </div>
                <span className="text-white text-[15px] font-medium">{range}</span>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-8 mt-4">
            <button 
              onClick={() => setIsDateOpen(false)}
              className="text-white text-[16px] font-semibold hover:text-[#19D9F3] transition-colors"
            >
              Cancel
            </button>
            <button 
              className="px-10 h-[44px] text-white text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
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

export default SensorDataFilters;
