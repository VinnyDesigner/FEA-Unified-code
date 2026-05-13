import React from 'react';

const tabs = [
  'Buoys Analytics',
  'Sensor Data',
  'Data Capture Rate',
  'Valid Data Capture Rate'
];

const AnalyticsTabs = ({ activeTab = 'Buoys Analytics', onTabChange, isMobile = false }) => {
  return (
    <div 
      className={`flex gap-3 w-full ${isMobile ? 'no-scrollbar' : ''}`}
      style={isMobile ? {
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        gap: '12px',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      } : {}}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={`px-6 py-2.5 text-xs transition-all duration-300 whitespace-nowrap`}
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
                    flex: isMobile ? '0 0 auto' : 'none',
                    minWidth: isMobile ? 'max-content' : 'auto'
                  }
                : {
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.30)',
                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
                    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
                    color: '#FFFFFF',
                    fontWeight: '400',
                    flex: isMobile ? '0 0 auto' : 'none',
                    minWidth: isMobile ? 'max-content' : 'auto'
                  }
            }
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

export default AnalyticsTabs;
