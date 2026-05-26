import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Calendar, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ReportsFilterForm = ({ isDesktop = false, onApply }) => {
  const { t } = useTranslation();
  const isRtl = document.documentElement.dir === 'rtl';

  const getTransLabel = (val) => {
    if (!val) return val;
    const map = {
      'Al Aqah New': 'stations.alAqahNew',
      'North Dibbah': 'stations.northDibbah',
      'OSB': 'stations.osb',
      'NSB': 'stations.nsb',
      'Sonde Information': 'analytics.sondeInformation',
      'Weather Information': 'analytics.weatherInformation',
      'Specific Conductivity': 'analytics.specificConductivity',
      'Water Temperature': 'analytics.waterTemperature',
      'Salinity': 'analytics.salinity',
      'Chlorophyll': 'analytics.chlorophyll',
      'Oxygen Saturation': 'analytics.oxygenSaturation',
      'Dissolved Oxygen': 'analytics.dissolvedOxygen',
      'Turbidity': 'analytics.turbidity',
      'pH': 'analytics.ph',
      'Depth': 'analytics.depth',
      'Blue-Green Algae': 'analytics.blueGreenAlgae'
    };
    return map[val] ? t(map[val], val) : val;
  };

  
  const initialState = {
    station: [],
    monitoringType: '',
    parameter: [],
    startDate: '',
    endDate: ''
  };

  const [formData, setFormData] = useState(initialState);
  
  const isFormValid = formData.station.length > 0 && formData.monitoringType && formData.parameter.length > 0 && formData.startDate && formData.endDate;
  
  const toggleSelection = (key, val) => {
    setFormData(prev => {
      const arr = prev[key] || [];
      if (arr.includes(val)) {
        return { ...prev, [key]: arr.filter(item => item !== val) };
      } else {
        return { ...prev, [key]: [...arr, val] };
      }
    });
  };
  
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
    const isRtl = document.documentElement.dir === 'rtl';
    if (stationBtnRef.current) {
      const rect = stationBtnRef.current.getBoundingClientRect();
      setStationPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (monitoringTypeBtnRef.current) {
      const rect = monitoringTypeBtnRef.current.getBoundingClientRect();
      setMonitoringTypePos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (parameterBtnRef.current) {
      const rect = parameterBtnRef.current.getBoundingClientRect();
      setParameterPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
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
    if (onApply) onApply(null);
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
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          opacity: 0 !important;
          background: transparent !important;
          cursor: pointer;
          -webkit-appearance: none;
        }
        input[type="date"]::-webkit-inner-spin-button,
        input[type="date"]::-webkit-clear-button {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Filters Row: 6 Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 relative z-30 items-end">
          
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
              <span className="truncate">
                {formData.station.length === 0 
                  ? t('analytics.selectStation', 'Select Station') 
                  : formData.station.length === 1 
                    ? getTransLabel(formData.station[0]) 
                    : isRtl ? `${formData.station.length} محددة` : `${formData.station.length} Selected`}
              </span>
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
                    className={`flex items-center gap-2 ${isRtl ? 'text-right' : 'text-left'} text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection('station', station);
                    }}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${formData.station.includes(station) ? 'bg-[#009FAC]' : 'border border-white/40'}`}>
                      {formData.station.includes(station) && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {getTransLabel(station)}
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
              <span className="truncate">{formData.monitoringType ? getTransLabel(formData.monitoringType) : t('analytics.selectPredefinedParameter', 'Select Type')}</span>
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
                    className={`${isRtl ? 'text-right' : 'text-left'} text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer`}
                    onClick={() => {
                      setFormData({ ...formData, monitoringType: type });
                      setIsMonitoringTypeOpen(false);
                    }}
                  >
                    {getTransLabel(type)}
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
              <span className="truncate">
                {formData.parameter.length === 0 
                  ? t('analytics.selectParametersTitle', 'Select Parameter') 
                  : formData.parameter.length === 1 
                    ? getTransLabel(formData.parameter[0]) 
                    : isRtl ? `${formData.parameter.length} محددة` : `${formData.parameter.length} Selected`}
              </span>
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
                    className={`flex items-center gap-2 ${isRtl ? 'text-right' : 'text-left'} text-white text-[13.5px] font-semibold hover:text-[#1DCDDD] transition-colors bg-transparent border-none outline-none cursor-pointer whitespace-nowrap`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection('parameter', param);
                    }}
                  >
                    <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors ${formData.parameter.includes(param) ? 'bg-[#009FAC]' : 'border border-white/40'}`}>
                      {formData.parameter.includes(param) && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {getTransLabel(param)}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* Start Date */}
            <div className="flex flex-col flex-1">
              <label className={labelClass}>{t('reports.startDate', 'Start Date')}</label>
              <div className="relative mt-2">
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ colorScheme: 'dark' }}
                  className="relative w-full h-[38px] md:h-[40px] px-4 ltr:pl-12 rtl:pr-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-pointer ltr:text-left rtl:text-right"
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
                  className="relative w-full h-[38px] md:h-[40px] px-4 ltr:pl-12 rtl:pr-12 bg-white/5 backdrop-blur-xl rounded-[12px] border border-white/20 text-white text-[14px] font-medium outline-none cursor-pointer ltr:text-left rtl:text-right"
                />
                <Calendar size={14} className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex flex-col">
              <button 
                className={`w-full h-[38px] md:h-[40px] text-white text-[13px] md:text-[14px] font-bold tracking-wide flex items-center justify-center gap-1 transition-transform outline-none border-none ${isFormValid ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                style={{
                  background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
                }}
                disabled={!isFormValid}
                onClick={() => isFormValid && onApply && onApply(formData)}
              >
                {t('common.apply', 'Apply')}
              </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReportsFilterForm;
