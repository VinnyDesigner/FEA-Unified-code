import React from 'react';
import { useTranslation } from 'react-i18next';

const tabs = [
  'Live Data',
  'Buoys Analytics',
  'Station Health'
];

const AnalyticsTabs = ({ activeTab = 'Live Data', onTabChange, isMobile = false, isTablet = false }) => {
  const { t } = useTranslation();
  
  const tabKeyMap = {
    'Live Data': 'analytics.liveData',
    'Buoys Analytics': 'analytics.buoysAnalytics',
    'Station Health': 'analytics.stationHealth'
  };

  return (
    <div className={isMobile ? 'w-full mb-0' : 'flex-1 min-w-[150px] max-w-[60%] lg:max-w-[70%] pr-2 md:pr-4'}>
      <style>{`
        .subtle-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .subtle-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .subtle-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 159, 172, 0.3);
          border-radius: 2px;
        }
        .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 159, 172, 0.5);
        }
        .subtle-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 159, 172, 0.3) rgba(255, 255, 255, 0.05);
        }
      `}</style>
      <div 
        className={`flex overflow-x-auto subtle-scrollbar flex-nowrap ${isMobile ? 'gap-1.5 justify-between w-full pb-2' : (isTablet ? 'gap-2 pb-2' : 'gap-3')}`}
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`transition-all duration-300 whitespace-nowrap text-center outline-none cursor-pointer ${
                isMobile ? 'px-2 py-1 flex items-center justify-center h-[36px] text-[10px] flex-1' : (isTablet ? 'px-4 py-2 text-[11px] min-w-max' : 'px-6 py-2.5 text-xs min-w-max')
              }`}
              style={
                isActive
                  ? {
                      borderRadius: '20px',
                      border: '1px solid #009FAC',
                      background: '#BBE6E9',
                      boxShadow: '0 4px 24px 0 rgba(0, 159, 172, 0.50) inset',
                      backdropFilter: 'blur(12px)',
                      color: '#000000',
                      fontWeight: '600',
                    }
                  : {
                      borderRadius: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.30)',
                      background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
                      boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
                      color: '#FFFFFF',
                      fontWeight: '400',
                    }
              }
            >
              {tabKeyMap[tab] ? t(tabKeyMap[tab]) : tab}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsTabs;
