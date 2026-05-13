import React from 'react';

const MetricCard = ({ label, value, icon: Icon, isSelected, isMobile = false }) => {
  return (
    <div
      className="flex flex-col justify-between"
      style={{
        height: isMobile ? '84px' : '100%',
        minHeight: 'unset',
        maxHeight: 'unset',
        background: isSelected ? '#BBE6E9' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '10px' : '12px',
        border: isSelected ? '1px solid #009FAC' : '1px solid rgba(255,255,255,0.4)',
        boxShadow: isSelected 
          ? '0 4px 24px 0 rgba(0, 159, 172, 0.50) inset' 
          : '0 4px 15px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className={isMobile ? 'mb-1' : 'mb-2'}>
        {typeof Icon === 'string' ? (
          <img src={Icon} alt={label} className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} object-contain`} />
        ) : (
          <Icon size={isMobile ? 20 : 24} className={isSelected ? 'text-[#009FAC]' : 'text-[#072227]'} strokeWidth={1.5} />
        )}
      </div>
      <div>
        <p className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} font-medium text-gray-600 mb-0.5 leading-tight`}>{label}</p>
        <p className={`${isMobile ? 'text-[13px]' : 'text-[14px]'} font-bold text-[#072227] leading-none`}>{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;
