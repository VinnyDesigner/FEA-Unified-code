import React from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const sensorData = [
  {
    station: 'Al Aqah New',
    dateTime: '17-02-2026 9:30',
    conductivity: '57994.83',
    temp: '25',
    salinity: '38.76',
    chlorophyll: '17.71',
    oxygenSat: '103.37',
    dissolvedOxygen: '5.82',
    turbidity: '9.94',
    ph: '7.91',
    depth: '0.49',
    algae: '0.68'
  },
  {
    station: 'North Dibbah',
    dateTime: '17-02-2026 10:00',
    conductivity: '57860.9',
    temp: '25.04',
    salinity: '38.66',
    chlorophyll: '33.94',
    oxygenSat: '104.97',
    dissolvedOxygen: '5.92',
    turbidity: '10.63',
    ph: '7.91',
    depth: '0.53',
    algae: '0.7'
  },
  {
    station: 'OSB',
    dateTime: '17-02-2026 10:30',
    conductivity: '58000.74',
    temp: '25.04',
    salinity: '38.76',
    chlorophyll: '15.04',
    oxygenSat: '107.78',
    dissolvedOxygen: '7.11',
    turbidity: '9.81',
    ph: '7.92',
    depth: '0.49',
    algae: '0.71'
  },
  {
    station: 'NSB',
    dateTime: '17-02-2026 11:00',
    conductivity: '578559.4',
    temp: '25.13',
    salinity: '38.65',
    chlorophyll: '15.73',
    oxygenSat: '109.25',
    dissolvedOxygen: '7.2',
    turbidity: '9.56',
    ph: '7.92',
    depth: '0.47',
    algae: '0.73'
  }
];

const paramDefs = [
  { filterName: 'Specific Conductivity', key: 'conductivity', label: 'dashboard.specificConductivity' },
  { filterName: 'Water Temperature', key: 'temp', label: 'dashboard.waterTemperature', suffix: '°C' },
  { filterName: 'Salinity', key: 'salinity', label: 'dashboard.salinity' },
  { filterName: 'Chlorophyll', key: 'chlorophyll', label: 'dashboard.chlorophyll' },
  { filterName: 'Oxygen Saturation', key: 'oxygenSat', label: 'analytics.oxygenSaturation', suffix: '%' },
  { filterName: 'Dissolved Oxygen', key: 'dissolvedOxygen', label: 'dashboard.dissolvedOxygen' },
  { filterName: 'Turbidity', key: 'turbidity', label: 'dashboard.turbidity' },
  { filterName: 'pH', key: 'ph', label: 'dashboard.ph' },
  { filterName: 'Depth', key: 'depth', label: 'dashboard.depth', suffix: 'm' },
  { filterName: 'Bluegreen Algae', key: 'algae', label: 'dashboard.blueGreenAlgae' },
  { filterName: 'Blue-Green Algae', key: 'algae', label: 'dashboard.blueGreenAlgae' }
];

const SensorDataTable = ({ 
  isMobile = false, 
  selectedBuoy = 'Al Aqah Buoy', 
  selectedParams = [], 
  selectedDuration = 'Last Day',
  isGraphAndTableView = false,
  isTablet = false
}) => {
  const { t } = useTranslation();
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  const handleScroll = (e) => {
    setScrollLeft(e.currentTarget.scrollLeft);
    setScrollTop(e.currentTarget.scrollTop);
  };

  const getFilteredData = () => {
    const activeBuoys = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];

    const getBuoyMultiplier = (buoyName) => {
      if (buoyName === 'Near Shore Buoy') return 0.85;
      if (buoyName === 'Offshore Buoy') return 1.15;
      if (buoyName === 'North Dibbah') return 0.95;
      return 1.0;
    };

    let allProcessed = [];

    activeBuoys.forEach((buoy) => {
      const multiplier = getBuoyMultiplier(buoy);
      const buoyProcessed = sensorData.map(row => {
        const newRow = { ...row, station: buoy };
        paramDefs.forEach(param => {
          if (row[param.key]) {
            const val = parseFloat(row[param.key]);
            if (!isNaN(val)) {
              newRow[param.key] = (val * multiplier).toFixed(2);
            }
          }
        });
        return newRow;
      });
      allProcessed.push(...buoyProcessed);
    });

    if (selectedDuration === 'Live Data' || selectedDuration === 'Last Day') {
      // Return all 4 points or duplicate to ensure scrolling is fully functional
      return [...allProcessed, ...allProcessed.map(r => ({ ...r, dateTime: r.dateTime.replace('17-02-2026', '16-02-2026') }))];
    } else if (selectedDuration === 'Last Week' || selectedDuration === 'Last Month' || selectedDuration === 'Last Three Months') {
      return [...allProcessed, ...allProcessed.map(r => ({ ...r, dateTime: r.dateTime.replace('17-02-2026', '15-02-2026') }))];
    }
    return allProcessed;
  };

  const displayedData = getFilteredData();

  const activeParams = selectedParams && selectedParams.length > 0
    ? paramDefs.filter(def => selectedParams.includes(def.filterName))
    : paramDefs.filter((def, index, self) => self.findIndex(d => d.key === def.key) === index);

  const rowHeightClass = isTablet ? 'h-[36px]' : (isGraphAndTableView ? 'h-[36px]' : 'h-[50px]');
  const cellPaddingClass = isTablet ? 'px-4 py-2' : (isGraphAndTableView ? 'px-4 py-1.5' : 'px-5 py-3');
  const textClass = isTablet ? 'text-[12px]' : 'text-[14px]';
  const headerBgClass = isGraphAndTableView ? 'backdrop-blur-md bg-[#1a4a4e]/40' : 'bg-transparent';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isGraphAndTableView ? 'overflow-hidden' : ''}`}>
      {/* --- MOBILE VIEW: Sensor Data Cards (< 768px) --- */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {displayedData.map((row, index) => (
          <div 
            key={index} 
            className="flex flex-col gap-[14px] p-[18px] relative overflow-hidden"
            style={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header: Time + Location */}
            <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">{t('analytics.dateTime')}</span>
                <span className="text-[15px] font-semibold text-[#1DCDDD]">{row.dateTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">{t('analytics.location', 'Location')}</span>
                <span className="text-[15px] font-semibold text-white/90">{row.station}</span>
              </div>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {activeParams.map((param, idx) => {
                const value = row[param.key];
                const displayValue = param.suffix ? `${value}${param.suffix}` : value;
                return (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[12px] font-medium text-white/60">{t(param.label)}</span>
                    <span className="text-[16px] font-bold text-white/90">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLET/DESKTOP VIEW: Table (>= 768px) --- */}
      <div className={`hidden md:flex flex-1 flex-col min-h-0 ${isGraphAndTableView ? 'overflow-hidden' : ''}`}>
        <div 
          className={`flex-1 overflow-auto custom-scrollbar relative ${isGraphAndTableView ? 'mb-0' : 'mb-4'}`}
          onScroll={handleScroll}
          style={{
            borderRadius: '12px',
            background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.10)',
          }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
              height: 6px;
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(29, 205, 221, 0.2);
              border-radius: 10px;
              transition: all 0.3s ease;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(29, 205, 221, 0.4);
            }
          `}} />
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className={`border-b border-white/10 ${rowHeightClass}`}>
                {/* Sticky Column 1 Header (Date & Time) */}
                <th 
                  className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 left-0 z-30 w-[180px] min-w-[180px] border-b border-white/10`}
                  style={{
                    background: (scrollTop > 0 || scrollLeft > 0) ? 'rgba(20, 58, 62, 0.98)' : 'transparent',
                    backdropFilter: (scrollTop > 0 || scrollLeft > 0) ? 'blur(20px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {t('analytics.dateTime')} <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
                  </div>
                </th>
                {/* Sticky Column 2 Header (Location / Station Name) */}
                <th 
                  className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 left-[180px] z-30 w-[150px] min-w-[150px] border-b border-white/10`}
                  style={{
                    background: (scrollTop > 0 || scrollLeft > 0) ? 'rgba(20, 58, 62, 0.98)' : 'transparent',
                    backdropFilter: (scrollTop > 0 || scrollLeft > 0) ? 'blur(20px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {t('analytics.location', 'Station Name')} <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
                  </div>
                </th>
                {/* Scrollable Parameter Headers */}
                {activeParams.map((param, idx) => (
                  <th 
                    key={idx} 
                    className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 z-20 border-b border-white/10`}
                    style={{
                      background: scrollTop > 0 ? 'rgba(20, 58, 62, 0.98)' : 'transparent',
                      backdropFilter: scrollTop > 0 ? 'blur(20px)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {t(param.label)} <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedData.map((row, index) => (
                <tr key={index} className={`border-b border-white/10 transition-colors ${rowHeightClass}`}>
                  {/* Sticky Column 1 Cell (Date & Time) */}
                  <td 
                    className={`${cellPaddingClass} text-white/90 ${textClass} font-bold whitespace-nowrap sticky left-0 z-10 w-[180px] min-w-[180px] border-b border-white/10`}
                    style={{
                      background: scrollLeft > 0 ? 'rgba(20, 58, 62, 0.98)' : 'transparent',
                      backdropFilter: scrollLeft > 0 ? 'blur(20px)' : 'none',
                    }}
                  >
                    {isTablet && row.dateTime.includes(' ') ? (
                      <div className="flex flex-col leading-tight">
                        <span>{row.dateTime.split(' ')[0]}</span>
                        <span className="opacity-70 text-[10px] mt-0.5">{row.dateTime.split(' ')[1]}</span>
                      </div>
                    ) : (
                      row.dateTime
                    )}
                  </td>
                  {/* Sticky Column 2 Cell (Location / Station Name) */}
                  <td 
                    className={`${cellPaddingClass} text-white/90 ${textClass} font-bold whitespace-nowrap sticky left-[180px] z-10 w-[150px] min-w-[150px] border-b border-white/10`}
                    style={{
                      background: scrollLeft > 0 ? 'rgba(20, 58, 62, 0.98)' : 'transparent',
                      backdropFilter: scrollLeft > 0 ? 'blur(20px)' : 'none',
                    }}
                  >
                    {row.station}
                  </td>
                  {/* Parameter Cells */}
                  {activeParams.map((param, idx) => {
                    const value = row[param.key];
                    const displayValue = param.suffix ? `${value}${param.suffix}` : value;
                    return (
                      <td 
                        key={idx} 
                        className={`${cellPaddingClass} text-white/90 ${textClass} whitespace-nowrap border-b border-white/10`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {!isGraphAndTableView && (
        <div className="flex justify-end items-center gap-2 mt-auto pt-6 pb-3">
          <button 
            className="w-10 h-10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.30)',
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
              boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
              color: '#FFFFFF'
            }}
          >
            <ChevronLeft size={18} className="rtl:rotate-180" />
          </button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button 
              key={page}
              className="w-10 h-10 flex items-center justify-center text-[14px] font-bold transition-all hover:brightness-110 active:scale-95 shadow-lg"
              style={
                page === 1 
                  ? {
                      borderRadius: '12px',
                      background: '#BBE6E9',
                      boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25) inset',
                      color: '#000000',
                    }
                  : {
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.30)',
                      background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
                      boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
                      color: '#FFFFFF',
                    }
              }
            >
              {page}
            </button>
          ))}
          <button 
            className="w-10 h-10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.30)',
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
              boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
              color: '#FFFFFF'
            }}
          >
            <ChevronRight size={18} className="rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* Tablet Horizontal Scrolling Clue */}
      {isTablet && (
        <div className="flex justify-center items-center py-2 mt-1 opacity-60">
          <ChevronLeft size={14} className="text-[#1DCDDD] animate-pulse" />
          <span className="text-[11px] text-white font-semibold tracking-widest uppercase mx-3">Swipe horizontally to view more table columns</span>
          <ChevronRight size={14} className="text-[#1DCDDD] animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SensorDataTable;
