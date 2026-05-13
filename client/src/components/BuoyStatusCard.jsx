import React from 'react';
import { Clock } from 'lucide-react';

const BuoyStatusCard = ({ activeTab }) => {
  const isWeather = activeTab === 'Weather';

  return (
    <div
      className="flex flex-col flex-shrink-0 z-[1200] relative overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#00161A' // Fallback color
      }}
    >
      {/* Background Image - Absolute fill to eliminate gaps */}
      <img 
        src="/assets/buoy-bg.png" 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top: Buoy Illustration */}
      <div className="flex justify-center mb-6 mt-4 relative z-10">
        <div className="w-32 h-32 flex items-center justify-center">
          <img 
            src="/assets/buoy-icon.png" 
            alt="Buoy Illustration" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(29,205,221,0.4)]" 
          />
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 z-10">
        <p className="text-[12px] text-white mb-1">Location Name</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
          <p className="text-xl font-bold text-white tracking-wide">AL Aqah Buoy</p>
        </div>

        <p className="text-[12px] text-white font-medium mb-1">
          {isWeather ? 'Air Temperature' : 'Water Temperature'}
        </p>
        <div className="flex items-start justify-center">
          <span 
            className="font-black leading-none tracking-tighter"
            style={{ 
              fontSize: '82px', 
              color: '#1DCDDD', 
              textShadow: '0 0 30px rgba(29,205,221,0.6)' 
            }}
          >
            {isWeather ? '22.4' : '25.1'}
          </span>
          <span className="text-2xl font-bold text-[#1DCDDD] mt-2 ml-1" style={{ textShadow: '0 0 20px rgba(29,205,221,0.5)' }}>°C</span>
        </div>
      </div>

      <div className="flex justify-between items-center z-10 mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-1.5 text-[11px] text-white">
          <Clock size={12} />
          <span>Updated 2 min ago</span>
        </div>
        <span className="text-[11px] text-white">
          Data Interval: {isWeather ? '10 min' : '30 min'}
        </span>
      </div>
    </div>
  );
};

export default BuoyStatusCard;
