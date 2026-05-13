import React from 'react';

const DashboardHeader = ({ activeTab, setActiveTab, isMobile = false }) => {
  return (
    <div className={`flex ${isMobile ? 'flex-col items-center gap-4' : 'items-start justify-between'} w-full m-0 p-0`}>
      <div className={isMobile ? 'text-center' : ''}>
        <h2 className={`${isMobile ? 'text-[17px]' : 'text-lg'} font-bold text-[#072227] leading-tight`}>Marine Water Quality Monitoring Dashboard</h2>
        <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} text-gray-500 mt-1 px-4`}>Real-time coastal water insights for smarter environmental protection.</p>
      </div>
      
      <div className={`flex gap-3 flex-shrink-0 ${isMobile ? '' : 'ml-4'}`}>
        {['Sonde', 'Weather'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${isMobile ? 'px-6 h-[38px]' : 'px-7 py-2'} text-xs transition-all duration-300`}
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
                      color: '#000000',
                      fontWeight: '500',
                    }
              }
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHeader;
