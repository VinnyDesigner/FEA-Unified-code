import React from 'react';
import { Clock, Activity } from 'lucide-react';

const BuoyStatusCard = ({ activeTab, isMobile = false }) => {
  const isWeather = activeTab === 'Weather';

  if (isMobile) {
    return (
      <>
        {/* --- MOBILE VERTICAL CARD (< 768px) --- */}
        <div
          className="flex md:hidden flex-col flex-shrink-0 z-[1200] relative overflow-hidden shadow-2xl"
          style={{
            width: '100%',
            height: '310px',
            borderRadius: '24px',
            padding: '20px 16px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: '#00161A'
          }}
        >
          <img 
            src="/assets/buoy-bg.png" 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
          />
          <div className="flex justify-center relative z-10 mb-1">
            <div className="w-24 h-24 flex items-center justify-center">
              <img src="/assets/buoy-icon.png" alt="Buoy" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(29,205,221,0.5)]" />
            </div>
          </div>
          <div className="flex flex-col items-center z-10 text-center">
            <p className="text-[13px] text-white/70 mb-0.5">Location Name</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              <p className="text-[24px] font-bold text-white tracking-wide">AL Aqah Buoy</p>
            </div>
            <div className="w-full h-[1px] bg-white/10 mb-2" />
            <p className="text-white/80 text-[14px] mb-0.5">{isWeather ? 'Air Temperature' : 'Water Temperature'}</p>
            <div className="flex items-baseline justify-center mb-2">
              <span className="font-bold leading-none" style={{ fontSize: '48px', color: '#1DCDDD', textShadow: '0 0 30px rgba(29,205,221,0.6)' }}>
                {isWeather ? '22.4' : '25.1'}
              </span>
              <span className="text-xl font-bold text-[#1DCDDD] ml-1">°C</span>
            </div>
            <div className="w-full h-[1px] bg-white/10 mb-3" />
          </div>
          <div className="flex items-stretch justify-between z-10">
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60"><Clock size={13} /><span>Updated</span></div>
              <span className="text-[14px] font-semibold text-white">2 min ago</span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60"><Activity size={13} /><span>Data Interval</span></div>
              <span className="text-[14px] font-semibold text-white">{isWeather ? '10 min' : '30 min'}</span>
            </div>
          </div>
        </div>

        {/* --- TABLET HORIZONTAL CARD (768px - 1023px) --- */}
        <div
          className="hidden md:flex items-center flex-shrink-0 z-[1200] relative overflow-hidden shadow-2xl"
          style={{
            width: '100%',
            height: '160px',
            borderRadius: '24px',
            padding: '20px 24px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: '#00161A'
          }}
        >
          <img src="/assets/buoy-bg.png" alt="Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90" />
          
          {/* Left: Icon */}
          <div className="relative z-10 w-24 flex-shrink-0">
            <img src="/assets/buoy-icon.png" alt="Buoy" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(29,205,221,0.5)]" />
          </div>

          {/* Center: Content */}
          <div className="flex-1 flex flex-col items-center z-10 px-6 border-r border-white/10">
            <div className="flex flex-col items-center">
              <p className="text-[14px] text-white/60">Location Name</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                <p className="text-[28px] font-bold text-white tracking-wide uppercase">AL Aqah Buoy</p>
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-white/10 my-2" />

            <div className="flex items-center gap-6">
              <p className="text-white/80 text-[16px]">{isWeather ? 'Air Temp' : 'Water Temp'}</p>
              <div className="flex items-baseline">
                <span className="font-bold" style={{ fontSize: '48px', color: '#1DCDDD', textShadow: '0 0 30px rgba(29,205,221,0.6)' }}>
                  {isWeather ? '22.4' : '25.1'}
                </span>
                <span className="text-2xl font-bold text-[#1DCDDD] ml-1">°C</span>
              </div>
            </div>
          </div>

          {/* Right: Info Section */}
          <div className="w-48 flex-shrink-0 flex flex-col justify-center gap-4 pl-6 z-10">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-white/60" />
              <div className="flex flex-col">
                <span className="text-[12px] text-white/60">Updated</span>
                <span className="text-[15px] font-semibold text-white leading-tight">2 min ago</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-white/60" />
              <div className="flex flex-col">
                <span className="text-[12px] text-white/60">Data Interval</span>
                <span className="text-[15px] font-semibold text-white leading-tight">{isWeather ? '10 min' : '30 min'}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- DESKTOP RENDER ---
  return (
    <div
      className="flex flex-col flex-shrink-0 z-[1200] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '28px',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#00161A'
      }}
    >
      {/* Background Image */}
      <img 
        src="/assets/buoy-bg.png" 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
      />

      {/* Top: Buoy Illustration */}
      <div className="flex justify-center relative z-10 mb-6 mt-4">
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
          <p className="text-xl font-bold text-white tracking-wide uppercase">AL Aqah Buoy</p>
        </div>

        <p className="text-white font-medium text-[12px] mb-1">
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
          <span className="text-2xl mt-2 font-bold text-[#1DCDDD] ml-1" style={{ textShadow: '0 0 20px rgba(29,205,221,0.5)' }}>°C</span>
        </div>
      </div>

      <div className="flex justify-between items-center z-10 pt-3 border-t border-white/10 mt-auto pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-white">
          <Clock size={12} />
          <span>Updated 2 min ago</span>
        </div>
        <span className="text-[10px] text-white">
          Interval: {isWeather ? '10 min' : '30 min'}
        </span>
      </div>
    </div>
  );
};

export default BuoyStatusCard;
