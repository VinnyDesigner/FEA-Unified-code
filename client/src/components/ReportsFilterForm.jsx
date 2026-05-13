import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Calendar, ChevronRight } from 'lucide-react';

const ReportsFilterForm = () => {
  const initialState = {
    station: 'Al Aqah New',
    monitoringType: 'Sonde Information',
    parameter: 'Blue Green Algae',
    type: 'Raw',
    startDate: '2026-01-01',
    endDate: '2026-01-30'
  };

  const [formData, setFormData] = useState(initialState);
  const [isStationOpen, setIsStationOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  
  const stationBtnRef = useRef(null);
  const dropdownRef = useRef(null);

  const stations = ['Al Aqah New', 'North Dibbah', 'OSB', 'NSB'];

  const updateDropdownPos = useCallback(() => {
    if (stationBtnRef.current) {
      const rect = stationBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    if (isStationOpen) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos);
      window.addEventListener('resize', updateDropdownPos);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isStationOpen, updateDropdownPos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isStationOpen && 
          stationBtnRef.current && !stationBtnRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStationOpen]);

  const handleReset = () => {
    setFormData(initialState);
    setIsStationOpen(false);
  };

  const dropdownClass = "flex items-center justify-between px-4 py-3.5 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium w-full mt-2 transition-all hover:bg-white/10 hover:border-white/30 outline-none";
  const labelClass = "text-white text-[14px] font-bold ml-1 tracking-tight";

  return (
    <div 
      className="p-8 rounded-[30px] border border-white/10"
      style={{
        background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex flex-col gap-8">
        {/* Row 1: 4 Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-30">
          <div className="flex flex-col relative">
            <label className={labelClass}>Station</label>
            <button 
              ref={stationBtnRef}
              className={dropdownClass}
              onClick={() => setIsStationOpen(!isStationOpen)}
            >
              {formData.station}
              <ChevronDown size={14} className={`transition-transform duration-300 ${isStationOpen ? 'rotate-180' : ''} text-white/70`} />
            </button>

            {/* Station Dropdown Menu via Portal */}
            {isStationOpen && createPortal(
              <div 
                ref={dropdownRef}
                className="fixed z-[9999] p-4 flex flex-col gap-4 shadow-2xl overflow-hidden pointer-events-auto"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {stations.map((station) => (
                  <button
                    key={station}
                    className="text-left text-white text-[14px] font-bold hover:text-[#1DCDDD] transition-colors"
                    onClick={() => {
                      setFormData({ ...formData, station });
                      setIsStationOpen(false);
                    }}
                  >
                    {station}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Monitoring Type</label>
            <button className={dropdownClass}>
              {formData.monitoringType}
              <ChevronDown size={14} className="text-white/70" />
            </button>
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Parameters</label>
            <button className={dropdownClass}>
              {formData.parameter}
              <ChevronDown size={14} className="text-white/70" />
            </button>
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Type</label>
            <button className={dropdownClass}>
              {formData.type}
              <ChevronDown size={14} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Row 2: Date Pickers & Actions */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 flex-1 w-full lg:max-w-[50%]">
            <div className="flex flex-col flex-1">
              <label className={labelClass}>Start Date</label>
              <div className="relative mt-1.5">
                <input 
                  type="text" 
                  value="1 Jan 2026" 
                  readOnly
                  className="w-full px-4 py-3.5 pl-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-default"
                />
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <label className={labelClass}>End Date</label>
              <div className="relative mt-2">
                <input 
                  type="text" 
                  value="30 Jan 2026" 
                  readOnly
                  className="w-full px-4 py-3.5 pl-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-default"
                />
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-8 pb-0.5">
            <button 
              onClick={handleReset}
              className="text-white text-[16px] font-semibold hover:text-[#19D9F3] transition-colors"
            >
              Cancel
            </button>
            <button 
              className="px-10 h-[44px] text-white text-[15px] font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
                borderRadius: '29.455px',
                boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
              }}
            >
              Download Report
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsFilterForm;
