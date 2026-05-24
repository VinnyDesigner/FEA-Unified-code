import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ReportsFilterForm = ({ isDesktop = false }) => {
  const { t } = useTranslation();
  
  const initialState = {
    station: 'Al Aqah New',
    monitoringType: 'Sonde Information',
    parameter: 'Blue-Green Algae',
    startDate: '2026-01-01',
    endDate: '2026-01-30'
  };

  const [formData, setFormData] = useState(initialState);
  
  // Dropdown visibility states
  const [isStationOpen, setIsStationOpen] = useState(false);
  const [isMonitoringTypeOpen, setIsMonitoringTypeOpen] = useState(false);
  const [isParameterOpen, setIsParameterOpen] = useState(false);

  // Dropdown portal layout positioning states
  const [stationPos, setStationPos] = useState({ top: 0, left: 0, width: 0 });
  const [monitoringTypePos, setMonitoringTypePos] = useState({ top: 0, left: 0, width: 0 });
  const [parameterPos, setParameterPos] = useState({ top: 0, left: 0, width: 0 });
  
  // Element references for positioning
  const stationBtnRef = useRef(null);
  const monitoringTypeBtnRef = useRef(null);
  const parameterBtnRef = useRef(null);
  
  const dropdownRef = useRef(null);

  const stations = ['Al Aqah New', 'North Dibbah', 'OSB', 'NSB'];
  const monitoringTypes = ['Sonde Information', 'Weather Information'];
  const parameters = [
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

  // Callback to calculate exact coordinates for rendering float panels via react-portal
  const updatePositions = useCallback(() => {
    if (stationBtnRef.current) {
      const rect = stationBtnRef.current.getBoundingClientRect();
      setStationPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (monitoringTypeBtnRef.current) {
      const rect = monitoringTypeBtnRef.current.getBoundingClientRect();
      setMonitoringTypePos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (parameterBtnRef.current) {
      const rect = parameterBtnRef.current.getBoundingClientRect();
      setParameterPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // Window scroll and resize dynamic alignment handlers
  useEffect(() => {
    if (isStationOpen || isMonitoringTypeOpen || isParameterOpen) {
      updatePositions();
      window.addEventListener('scroll', updatePositions);
      window.addEventListener('resize', updatePositions);
    }
    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isStationOpen, isMonitoringTypeOpen, isParameterOpen, updatePositions]);

  // Click outside menu dismiss handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        (!stationBtnRef.current || !stationBtnRef.current.contains(event.target)) &&
        (!monitoringTypeBtnRef.current || !monitoringTypeBtnRef.current.contains(event.target)) &&
        (!parameterBtnRef.current || !parameterBtnRef.current.contains(event.target))
      ) {
        setIsStationOpen(false);
        setIsMonitoringTypeOpen(false);
        setIsParameterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setFormData(initialState);
    setIsStationOpen(false);
    setIsMonitoringTypeOpen(false);
    setIsParameterOpen(false);
  };

  const dropdownClass = "flex items-center justify-between px-4 py-2 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium w-full mt-2 transition-all hover:bg-white/10 hover:border-white/30 outline-none cursor-pointer";
  const labelClass = "text-white text-[14px] font-bold ml-1 tracking-tight";

  const glassMenuStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
  };

  return (
    <div 
      className={isDesktop ? "p-0" : "p-5 md:p-8 rounded-[24px] md:rounded-[30px] border border-white/10"}
      style={isDesktop ? {} : {
        background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Row 1: 3 Dropdowns - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 relative z-30">
          
          {/* Station dropdown */}
          <div className="flex flex-col relative">
            <label className={labelClass}>{t('analytics.station')}</label>
            <button 
              ref={stationBtnRef}
              className={`${dropdownClass} h-[38px] md:h-[40px] mt-2`}
              onClick={() => {
                setIsMonitoringTypeOpen(false);
                setIsParameterOpen(false);
                setIsStationOpen(!isStationOpen);
              }}
            >
              <span>{formData.station === 'Al Aqah New' ? t('analytics.stationName') : formData.station}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isStationOpen ? 'rotate-180' : ''} text-white/70`} />
            </button>

            {/* Station Dropdown Menu via Portal */}
            {isStationOpen && createPortal(
              <div 
                ref={dropdownRef}
                className="fixed z-[9999] p-4 flex flex-col gap-3.5 shadow-2xl overflow-hidden pointer-events-auto"
                style={{
                  ...glassMenuStyle,
                  top: stationPos.top,
                  left: stationPos.left,
                  width: stationPos.width,
                }}
              >
                {stations.map((station) => (
                  <button
                    key={station}
                    className="text-left text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer"
                    onClick={() => {
                      setFormData({ ...formData, station });
                      setIsStationOpen(false);
                    }}
                  >
                    {station === 'Al Aqah New' ? t('analytics.stationName') : station}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* Monitoring Type dropdown */}
          <div className="flex flex-col relative">
            <label className={labelClass}>{t('reports.monitoringType', 'Monitoring Type')}</label>
            <button 
              ref={monitoringTypeBtnRef}
              className={`${dropdownClass} h-[38px] md:h-[40px] mt-2`}
              onClick={() => {
                setIsStationOpen(false);
                setIsParameterOpen(false);
                setIsMonitoringTypeOpen(!isMonitoringTypeOpen);
              }}
            >
              <span>{formData.monitoringType === 'Sonde Information' ? t('analytics.sondeInformation') : formData.monitoringType}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isMonitoringTypeOpen ? 'rotate-180' : ''} text-white/70`} />
            </button>

            {/* Monitoring Type Dropdown Menu via Portal */}
            {isMonitoringTypeOpen && createPortal(
              <div 
                ref={dropdownRef}
                className="fixed z-[9999] p-4 flex flex-col gap-3.5 shadow-2xl overflow-hidden pointer-events-auto"
                style={{
                  ...glassMenuStyle,
                  top: monitoringTypePos.top,
                  left: monitoringTypePos.left,
                  width: monitoringTypePos.width,
                }}
              >
                {monitoringTypes.map((type) => (
                  <button
                    key={type}
                    className="text-left text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer"
                    onClick={() => {
                      setFormData({ ...formData, monitoringType: type });
                      setIsMonitoringTypeOpen(false);
                    }}
                  >
                    {type === 'Sonde Information' ? t('analytics.sondeInformation') : type}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* Parameters dropdown */}
          <div className="flex flex-col relative">
            <label className={labelClass}>{t('analytics.parameters')}</label>
            <button 
              ref={parameterBtnRef}
              className={`${dropdownClass} h-[38px] md:h-[40px] mt-2`}
              onClick={() => {
                setIsStationOpen(false);
                setIsMonitoringTypeOpen(false);
                setIsParameterOpen(!isParameterOpen);
              }}
            >
              <span className="truncate">{formData.parameter}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isParameterOpen ? 'rotate-180' : ''} text-white/70`} />
            </button>

            {/* Parameters Dropdown Menu via Portal */}
            {isParameterOpen && createPortal(
              <div 
                ref={dropdownRef}
                className="fixed z-[9999] p-4 flex flex-col gap-3.5 shadow-2xl overflow-y-auto max-h-[260px] analytics-panel-scroll pointer-events-auto"
                style={{
                  ...glassMenuStyle,
                  top: parameterPos.top,
                  left: parameterPos.left,
                  width: parameterPos.width,
                }}
              >
                {parameters.map((param) => (
                  <button
                    key={param}
                    className="text-left text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setFormData({ ...formData, parameter: param });
                      setIsParameterOpen(false);
                    }}
                  >
                    {param}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

        </div>

        {/* Row 2: Date Pickers & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row gap-5 md:gap-6 flex-1 w-full lg:max-w-[50%]">
            
            {/* Start Date */}
            <div className="flex flex-col flex-1">
              <label className={labelClass}>{t('reports.startDate', 'Start Date')}</label>
              <div className="relative mt-2">
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ colorScheme: 'dark' }}
                  className="w-full h-[38px] md:h-[40px] px-4 ltr:pl-12 rtl:pr-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-pointer ltr:text-left rtl:text-right"
                />
                <Calendar size={14} className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
              </div>
            </div>

            {/* End Date */}
            <div className="flex flex-col flex-1">
              <label className={labelClass}>{t('reports.endDate', 'End Date')}</label>
              <div className="relative mt-2">
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ colorScheme: 'dark' }}
                  className="w-full h-[38px] md:h-[40px] px-4 ltr:pl-12 rtl:pr-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-pointer ltr:text-left rtl:text-right"
                />
                <Calendar size={14} className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-row items-center justify-end gap-6 md:gap-8 pt-4 md:pt-0 border-t border-white/5 md:border-none">
            <button 
              onClick={handleReset}
              className="text-white text-[16px] font-semibold hover:text-[#19D9F3] transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button 
              className="px-6 md:px-10 h-[40px] text-white text-[14px] md:text-[15px] font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer outline-none border-none"
              style={{
                background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
                borderRadius: '29.455px',
                boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
              }}
            >
              {t('reports.downloadReport', 'Download Report')}
              <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsFilterForm;
