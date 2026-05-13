import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const captureRateData = [
  {
    station: 'Al Aqah New',
    conductivity: '57994.83',
    temp: '25',
    salinity: '38.76',
    chlorophyll: '17.71',
    oxygenSat: '103.37',
    dissolvedOxygen: '5.82',
    turbidity: '9.94',
    ph: '7.91',
    depth: '0.49',
    algae: '0.68',
    expected: '48',
    received: '47',
    rate: '98'
  },
  {
    station: 'North Dibbah',
    conductivity: '57860.9',
    temp: '25.04',
    salinity: '38.66',
    chlorophyll: '33.94',
    oxygenSat: '104.97',
    dissolvedOxygen: '5.92',
    turbidity: '10.63',
    ph: '7.91',
    depth: '0.53',
    algae: '0.7',
    expected: '48',
    received: '48',
    rate: '100'
  },
  {
    station: 'OSB',
    conductivity: '58000.74',
    temp: '25.04',
    salinity: '38.76',
    chlorophyll: '15.04',
    oxygenSat: '107.78',
    dissolvedOxygen: '7.11',
    turbidity: '9.81',
    ph: '7.92',
    depth: '0.49',
    algae: '0.71',
    expected: '48',
    received: '46',
    rate: '96'
  },
  {
    station: 'NSB',
    conductivity: '578559.4',
    temp: '25.13',
    salinity: '38.65',
    chlorophyll: '15.73',
    oxygenSat: '109.25',
    dissolvedOxygen: '7.2',
    turbidity: '9.56',
    ph: '7.92',
    depth: '0.47',
    algae: '0.73',
    expected: '48',
    received: '45',
    rate: '94'
  }
];

const DataCaptureRateTable = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Frame Container - Compact Padding & Hidden Scrollbar */}
      <div className="flex-1 flex min-h-0 mb-4">
        
        {/* 1. Left Fixed Column */}
        <div className="flex-shrink-0 flex flex-col border-r border-white/10 w-[180px]">
          <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
            Station Name <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
          </div>
          <div className="flex-1">
            {captureRateData.map((row, index) => (
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
                  'Specific Conductivity',
                  'Water Temperature',
                  'Salinity',
                  'Chlorophyll',
                  'Oxygen Saturation',
                  'Dissolved Oxygen',
                  'Turbidity',
                  'pH',
                  'Depth',
                  'Blue Green Algae',
                  'Expected Records',
                  'Received Records'
                ].map((label, idx) => (
                  <th key={idx} className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 z-10 bg-transparent">
                    <div className="flex items-center gap-2">
                      {label} <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {captureRateData.map((row, index) => (
                <tr key={index} className="border-b border-white/10 h-[50px] hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.conductivity}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.temp}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.salinity}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.chlorophyll}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.oxygenSat}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.dissolvedOxygen}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.turbidity}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.ph}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.depth}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.algae}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.expected}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Right Fixed Column */}
        <div className="flex-shrink-0 flex flex-col border-l border-white/10 w-[180px]">
          <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
            Data Capture Rate <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
          </div>
          <div className="flex-1">
            {captureRateData.map((row, index) => (
              <div key={index} className="px-6 py-3 text-white/90 text-[14px] font-bold border-b border-white/10 h-[50px] flex items-center">
                {row.rate}%
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Pagination Footer */}
      <div className="flex justify-end items-center gap-2 mt-4">
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
          <span className="text-xl">‹</span>
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
          <span className="text-xl">›</span>
        </button>
      </div>
    </div>
  );
};

export default DataCaptureRateTable;
