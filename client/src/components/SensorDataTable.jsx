import React from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

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

const SensorDataTable = ({ isMobile = false }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* --- MOBILE VIEW: Sensor Data Cards (< 768px) --- */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {sensorData.map((row, index) => (
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
            {/* Header: Station & Time */}
            <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">Station</span>
                <span className="text-[18px] font-bold text-white">{row.station}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">Date & Time</span>
                <span className="text-[15px] font-semibold text-[#1DCDDD]">{row.dateTime}</span>
              </div>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Specific Conductivity</span>
                <span className="text-[16px] font-bold text-white/90">{row.conductivity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Water Temp</span>
                <span className="text-[16px] font-bold text-white/90">{row.temp}°C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Salinity</span>
                <span className="text-[16px] font-bold text-white/90">{row.salinity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Chlorophyll</span>
                <span className="text-[16px] font-bold text-white/90">{row.chlorophyll}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Oxygen Saturation</span>
                <span className="text-[16px] font-bold text-white/90">{row.oxygenSat}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Dissolved Oxygen</span>
                <span className="text-[16px] font-bold text-white/90">{row.dissolvedOxygen}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Turbidity</span>
                <span className="text-[16px] font-bold text-white/90">{row.turbidity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">pH</span>
                <span className="text-[16px] font-bold text-white/90">{row.ph}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Depth</span>
                <span className="text-[16px] font-bold text-white/90">{row.depth}m</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/60">Blue Green Algae</span>
                <span className="text-[16px] font-bold text-white/90">{row.algae}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLET/DESKTOP VIEW: Table (>= 768px) --- */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <div className="flex-1 flex min-h-0 mb-4">
          
          {/* 1. Left Fixed Column */}
          <div className="flex-shrink-0 flex flex-col border-r border-white/10 w-[180px]">
            <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
              Station Name <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
            </div>
            <div className="flex-1">
              {sensorData.map((row, index) => (
                <div key={index} className="px-6 py-3 text-white/90 text-[14px] font-bold border-b border-white/10 h-[50px] flex items-center whitespace-nowrap">
                  {row.station}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Middle Scrollable Columns - Table Auto for dynamic width */}
          <div className="flex-1 overflow-x-auto scrollbar-hide flex flex-col min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style dangerouslySetInnerHTML={{__html: `
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}} />
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="border-b border-white/10 h-[50px]">
                  {[
                    'Date & Time',
                    'Specific Conductivity',
                    'Water Temperature',
                    'Salinity',
                    'Chlorophyll',
                    'Oxygen Saturation',
                    'Dissolved Oxygen',
                    'Turbidity',
                    'pH',
                    'Depth'
                  ].map((label, idx) => (
                    <th key={idx} className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 z-10 bg-transparent">
                      <div className="flex items-center gap-2">
                        {label} <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensorData.map((row, index) => (
                  <tr key={index} className="border-b border-white/10 h-[50px] hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap font-medium">{row.dateTime}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.conductivity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.temp}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.salinity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.chlorophyll}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.oxygenSat}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.dissolvedOxygen}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.turbidity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.ph}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.depth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Right Fixed Column */}
          <div className="flex-shrink-0 flex flex-col border-l border-white/10 w-[180px]">
            <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
              Blue Green Algae <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
            </div>
            <div className="flex-1">
              {sensorData.map((row, index) => (
                <div key={index} className="px-6 py-3 text-white/90 text-[14px] border-b border-white/10 h-[50px] flex items-center">
                  {row.algae}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-center md:justify-end items-center gap-2 mt-auto pt-6 pb-3">
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
          <ChevronLeft size={18} />
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
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SensorDataTable;
