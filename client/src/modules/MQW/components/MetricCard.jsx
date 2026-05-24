import React from 'react';

const MetricCard = ({ label, value, icon: Icon, isSelected, onClick, isMobile = false }) => {
  const cardStyle = {
    borderRadius: '20px',
    border: isSelected ? '1px solid #009FAC' : '1px solid rgba(255, 255, 255, 0.10)',
    background: isSelected ? '#BBE6E9' : 'rgba(255, 255, 255, 0.60)',
    boxShadow: isSelected 
      ? 'inset 0 4px 24px 0 rgba(0, 159, 172, 0.50)' 
      : 'inset 0 4px 4px 0 rgba(255, 255, 255, 0.40)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '12px 14px',
    gap: '6px'
  };

  return (
    <div
      onClick={onClick}
      className="select-none cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={cardStyle}
    >
      {/* Row 1: Icon */}
      <div className="flex items-center justify-start flex-shrink-0">
        {typeof Icon === 'string' ? (
          <img 
            src={Icon} 
            alt={label} 
            className={`${isMobile ? 'w-5 h-5' : 'w-[22px] h-[22px]'} object-contain`}
          />
        ) : (
          <Icon size={isMobile ? 18 : 22} className={isSelected ? 'text-[#009FAC]' : 'text-[#072227]'} strokeWidth={1.5} />
        )}
      </div>

      {/* Row 2 & 3: Text */}
      <div className="flex flex-col gap-0.5 min-w-0 ltr:text-left rtl:text-right">
        <p
          className="font-bold leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ 
            fontSize: '12px',
            color: isSelected ? '#009FAC' : '#4A5568'
          }}
          title={label}
        >
          {label}
        </p>
        <p 
          className="font-bold leading-none"
          style={{
            fontSize: '14px',
            marginTop: '2px',
            color: '#072227'
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default MetricCard;
