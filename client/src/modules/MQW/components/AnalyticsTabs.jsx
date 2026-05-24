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
    <div className="w-full lg:w-auto">
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
        className="flex gap-3 w-full overflow-x-auto subtle-scrollbar flex-nowrap"
        style={{
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`transition-all duration-300 whitespace-nowrap text-center flex-1 min-w-max outline-none cursor-pointer ${
                isTablet ? 'px-[19.2px] py-[8px] text-[9.6px]' : 'px-6 py-2.5 text-xs'
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
