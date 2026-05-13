import React from 'react';

const AuthCard = ({ children, title, subtitle }) => {
  return (
    <div 
      className="w-[95%] sm:w-[90%] max-w-[480px] p-5 sm:p-7 md:p-10 flex flex-col items-center"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)'
      }}
    >
      <div className="text-center w-full mb-5 sm:mb-7 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-white mb-2 font-sans tracking-wide leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] sm:text-[13px] font-medium text-white tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="w-full flex flex-col gap-4 sm:gap-5">
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
