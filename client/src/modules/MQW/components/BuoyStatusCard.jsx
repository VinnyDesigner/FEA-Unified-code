import React, { useState } from 'react';
import { Clock, Activity, RefreshCw, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BuoyStatusCard = ({ activeTab, selectedBuoy, isMobile = false, isDesktop = false }) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  const buoyName = selectedBuoy ? selectedBuoy.name : 'AL Aqah Buoy';
  const buoyNameKey = selectedBuoy && selectedBuoy.nameKey ? selectedBuoy.nameKey : 
                      (selectedBuoy?.name === 'Fujairah Buoy 1' ? 'fujairah1' :
                       selectedBuoy?.name === 'Fujairah Buoy 2' ? 'fujairah2' :
                       selectedBuoy?.name === 'Coastal Buoy A' ? 'coastal' :
                       'alAqah');
  const updatedTime = selectedBuoy && selectedBuoy.updatedKey ? t(`dashboard.updatedTime.${selectedBuoy.updatedKey}`) : (selectedBuoy ? selectedBuoy.updated : t('dashboard.updatedTime.2min'));
  const dataInterval = selectedBuoy && selectedBuoy.intervalKey ? t(`dashboard.intervalVal.${selectedBuoy.intervalKey}`) : (selectedBuoy ? selectedBuoy.interval : t('dashboard.intervalVal.30min'));

  // Dynamic coordinates mapping based on current selected buoy
  const getBuoyCoordinates = (name) => {
    switch (name) {
      case 'Fujairah Buoy 1':
        return { long: '48.912', lat: '23.402' };
      case 'Fujairah Buoy 2':
        return { long: '48.745', lat: '23.315' };
      case 'Coastal Buoy A':
        return { long: '48.889', lat: '23.441' };
      default:
        return { long: '48.836', lat: '23.371' };
    }
  };

  // Dynamic alarm states based on current selected buoy
  const getAlarmStates = (name) => {
    switch (name) {
      case 'Fujairah Buoy 1':
        return { comm: true, gps: true, door: false }; // True means Normal (Green), False means Alarm (Red)
      case 'Fujairah Buoy 2':
        return { comm: true, gps: false, door: true };
      case 'Coastal Buoy A':
        return { comm: true, gps: true, door: true };
      default:
        return { comm: false, gps: true, door: true }; // AL Aqah Buoy has Comm Status active alarm (Red), other two normal
    }
  };

  const coordinates = getBuoyCoordinates(buoyName);
  const alarms = getAlarmStates(buoyName);

  // Common glassmorphic style for Alarm Pills matching filters design
  const alarmBtnStyle = (isNormal) => ({
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: isNormal 
      ? '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(255,255,255,0.05)' 
      : '0 4px 12px rgba(239, 68, 68, 0.25), inset 0 2px 4px rgba(255,255,255,0.05)',
    borderRadius: '30px',
    padding: isDesktop ? '4px 8px' : '8px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isDesktop ? '4px' : '8px',
    color: '#FFFFFF',
    fontSize: isDesktop ? '10px' : '12.5px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  });

  const renderAlarmIcon = (isNormal) => {
    if (isNormal) {
      return (
        <Bell 
          size={isDesktop ? 12 : 14} 
          className="text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
          fill="#10B981" 
        />
      );
    }
    return (
      <div className="relative flex items-center justify-center">
        <Bell 
          size={isDesktop ? 12 : 14} 
          className="text-[#EF4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-bounce" 
          fill="#EF4444" 
        />
      </div>
    );
  };

  const renderAlarmPills = () => (
    <div className="flex flex-col items-center w-full z-10">
      <div className="flex gap-2 mb-2 justify-center w-full max-w-[340px]">
        {/* Comm Status Pill */}
        <div className="flex-1 flex justify-center min-w-0">
          <button style={alarmBtnStyle(alarms.comm)} className="w-full truncate hover:scale-[1.02] active:scale-[0.98] outline-none">
            {renderAlarmIcon(alarms.comm)}
            <span className="truncate">{t('dashboard.commStatus')}</span>
          </button>
        </div>
        
        {/* GPS Alarm Pill */}
        <div className="flex-1 flex justify-center min-w-0">
          <button style={alarmBtnStyle(alarms.gps)} className="w-full truncate hover:scale-[1.02] active:scale-[0.98] outline-none">
            {renderAlarmIcon(alarms.gps)}
            <span className="truncate">{t('dashboard.gpsAlarm')}</span>
          </button>
        </div>
      </div>

      {/* Enclosure Door Open Pill */}
      <div className="flex justify-center w-full mb-2 max-w-[340px]">
        <button style={alarmBtnStyle(alarms.door)} className="w-[85%] hover:scale-[1.02] active:scale-[0.98] outline-none">
          {renderAlarmIcon(alarms.door)}
          <span className="truncate">{t('dashboard.enclosureDoorOpen')}</span>
        </button>
      </div>
    </div>
  );

  // 3D Card Flip CSS Classes & Inline Styles
  const containerStyle = {
    perspective: '1000px',
    width: '100%',
    height: '100%',
    minHeight: isMobile ? '420px' : '100%',
    position: 'relative',
  };

  const cardInnerStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const faceStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    pointerEvents: isFlipped ? 'none' : 'auto',
  };

  const backFaceStyle = {
    ...faceStyle,
    transform: 'rotateY(180deg)',
    backgroundColor: '#00161A',
    pointerEvents: isFlipped ? 'auto' : 'none',
  };

  const renderBackFace = (cardHeightClass) => (
    <div style={backFaceStyle} className={`relative flex flex-col justify-center items-center ${cardHeightClass}`}>
      {/* Real Buoy Photograph Background */}
      <img 
        src="/assets/buoy-real.jpg" 
        alt="Real Buoy Photograph" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Dark overlay gradient for pristine text readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.75) 100%)'
        }}
      />

      {/* Printer/Flip Icon in Top Right - Raw White Icon to match mockup exactly */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(false); }}
        className="absolute top-6 right-6 z-[100] text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all outline-none bg-transparent border-0 cursor-pointer"
        style={{ pointerEvents: 'auto' }}
      >
        <RefreshCw size={20} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:rotate-180" />
      </button>

      {/* Location Details Centered at the Bottom - Perfect replication of attached image */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center text-center px-4">
        <h2 className="text-[32px] font-bold text-white tracking-wide flex items-center justify-center gap-2.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-[0_0_12px_#10B981] inline-block animate-pulse" />
          {t(`stations.${buoyNameKey}`)}
        </h2>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={cardInnerStyle}>
        
        {/* ====================================================
            FRONT FACE (All responsive breakpoints)
           ==================================================== */}
        <div style={faceStyle} className="bg-[#00161A]">
          
          {/* MOBILE RENDER */}
          {isMobile && (
            <div
              className="flex md:hidden flex-col w-full h-full relative"
              style={{
                padding: '24px 20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '28px',
              }}
            >
              <img 
                src="/assets/buoy-bg.png" 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
              />
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(true); }}
                className="absolute top-5 right-5 z-[100] text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all outline-none bg-transparent border-0 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <RefreshCw size={20} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:rotate-180" />
              </button>

              {/* Buoy image — large, top */}
              <div className="flex justify-center relative z-10 mb-4 mt-2">
                <div className="w-28 h-28 flex items-center justify-center">
                  <img 
                    src="/assets/buoy-icon.png" 
                    alt="Buoy Illustration" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(29,205,221,0.4)]" 
                  />
                </div>
              </div>

              {/* Name & coords — centered below image */}
              <div className="flex flex-col items-center z-10 text-center">
                <p className="text-[11px] text-white/50 font-medium mb-1 tracking-wider uppercase">{t('dashboard.locationName') || 'Location Name'}</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
                  <p className="text-[20px] font-bold text-white tracking-wide">{t(`stations.${buoyNameKey}`)}</p>
                </div>
                <div 
                  className="px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3 text-[11px] text-white/80 font-medium"
                  style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(4px)' }}
                >
                  <span>{t('dashboard.longitude')}: {coordinates.long}</span>
                  <span>{t('dashboard.latitude')}: {coordinates.lat}</span>
                </div>
              </div>

              {/* Spacer pushes pills to the bottom */}
              <div className="flex-1" />

              {/* Alarm pills — anchored to bottom */}
              {renderAlarmPills()}

              {/* Footer */}
              <div className="flex justify-between items-center z-10 pt-3 border-t border-white/10 mt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                  <Clock size={12} />
                  <span>{t('dashboard.updated')} {updatedTime}</span>
                </div>
                <span className="text-[10px] text-white/60">
                  {t('dashboard.dataInterval')}: {dataInterval}
                </span>
              </div>
            </div>
          )}

          {/* DESKTOP & TABLET RENDER */}
          {!isMobile && (
            <div
              className="flex flex-col w-full h-full relative"
              style={{
                padding: isDesktop ? '16px' : '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '28px',
              }}
            >
              <img 
                src="/assets/buoy-bg.png" 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
              />
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(true); }}
                className="absolute top-4 right-4 z-[100] text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all outline-none bg-transparent border-0 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <RefreshCw size={isDesktop ? 16 : 20} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:rotate-180" />
              </button>

              {/* Buoy image — large, upper section */}
              <div className={`flex justify-center relative z-10 ${isDesktop ? 'mb-2 mt-2' : 'mb-4 mt-6'}`}>
                <div className={`${isDesktop ? 'w-20 h-20' : 'w-32 h-32'} flex items-center justify-center`}>
                  <img 
                    src="/assets/buoy-icon.png" 
                    alt="Buoy Illustration" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(29,205,221,0.4)]" 
                  />
                </div>
              </div>

              {/* Location name label + buoy name + coords — middle section */}
              <div className={`flex flex-col items-center z-10 text-center ${isDesktop ? 'mb-2' : 'mb-4'}`}>
                <p className={`text-white/50 font-medium tracking-wider uppercase ${isDesktop ? 'text-[9px] mb-1' : 'text-[11px] mb-2'}`}>
                  {t('dashboard.locationName') || 'Location Name'}
                </p>
                <div className={`flex items-center justify-center gap-2 ${isDesktop ? 'mb-2' : 'mb-3'}`}>
                  <div className={`rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] animate-pulse ${isDesktop ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
                  <h2 className={`${isDesktop ? 'text-xl font-bold' : 'text-3xl font-extrabold'} text-white tracking-wide`}>
                    {t(`stations.${buoyNameKey}`)}
                  </h2>
                </div>
                <div 
                  className={`${isDesktop ? 'px-3.5 py-1 text-[10px]' : 'px-5 py-1.5 text-[12.5px]'} rounded-full border border-white/10 flex items-center gap-3.5 text-white/85 font-medium shadow-inner`}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(4px)' }}
                >
                  <span>{t('dashboard.longitude')}: {coordinates.long}</span>
                  <span>{t('dashboard.latitude')}: {coordinates.lat}</span>
                </div>
              </div>

              {/* Spacer — pushes pills to the bottom */}
              <div className="flex-1" />

              {/* Alarm pills — anchored to bottom */}
              {renderAlarmPills()}

              {/* Footer */}
              <div className={`flex justify-between items-center z-10 pt-3 border-t border-white/10 mt-3 ${isDesktop ? 'text-[9.5px]' : 'text-[11.5px]'}`}>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Clock size={isDesktop ? 11 : 13} />
                  <span>{t('dashboard.updated')} {updatedTime}</span>
                </div>
                <span className="text-white/60">
                  {t('dashboard.dataInterval')}: {dataInterval}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ====================================================
            BACK FACE (All responsive breakpoints)
           ==================================================== */}
        {renderBackFace('w-full h-full')}

      </div>
    </div>
  );
};

export default BuoyStatusCard;
