import React, { useState, useEffect, useRef } from 'react';

const DownloadDropdown = ({ t, onDownload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = ['Download InExcel', 'Download in Word', 'Download in Pdf'];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 md:px-6 py-2 text-[13px] md:text-[14px] transition-all hover:brightness-110 active:scale-95 cursor-pointer outline-none"
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.30)',
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
          boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
          color: '#FFFFFF',
          fontWeight: '400',
          backdropFilter: 'blur(10px)'
        }}
      >
        {t('common.download', 'Download')}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[180px] py-2 flex flex-col shadow-2xl rounded-[16px] border border-white/10"
          style={{
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0.40) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.25) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                setIsOpen(false);
                onDownload(option);
              }}
              className="text-left px-4 py-2 text-white text-[13px] md:text-[14px] hover:bg-white/10 transition-colors border-none outline-none cursor-pointer bg-transparent"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadDropdown;
