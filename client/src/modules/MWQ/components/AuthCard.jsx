import React from 'react';

const AuthCard = ({ children, title, subtitle }) => {
  return (
    <div 
      className="w-[95%] sm:w-[90%] max-w-[480px] p-5 sm:p-7 md:p-10 flex flex-col items-center"
      style={{
        borderRadius: '59px',
        border: '1px solid rgba(0, 0, 0, 0.10)',
        background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
        boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
        backdropFilter: 'blur(4.400000095367432px)',
        WebkitBackdropFilter: 'blur(4.400000095367432px)'
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
