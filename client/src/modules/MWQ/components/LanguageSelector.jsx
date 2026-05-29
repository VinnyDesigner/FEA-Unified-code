import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

const LanguageSelector = ({ isIconOnly = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selected = languages.find(lang => lang.code === i18n.language) || languages[0];
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang) => {
    i18n.changeLanguage(lang.code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
        style={isIconOnly ? {
          width: '36px',
          height: '36px',
        } : {
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.18) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: '7px 16px',
        }}
      >
        {isIconOnly ? (
          <Globe size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
        ) : (
          <>
            <span className="text-[14px] font-medium text-white">{selected.nativeLabel}</span>
            <ChevronDown
              size={14}
              className="text-white/70 transition-transform duration-200 ml-2"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${isIconOnly ? 'bottom-[calc(100%+8px)] left-0 rtl:left-auto rtl:right-0' : 'top-[calc(100%+8px)] right-0 rtl:right-auto rtl:left-0'} z-[9999] min-w-[160px] overflow-hidden`}
          style={{
            borderRadius: '30px',
            border: '1px solid rgba(0, 0, 0, 0.10)',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          {languages.map((lang) => {
            const isActive = selected.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: isActive ? 'rgba(29, 205, 221, 0.12)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="flex flex-col items-start">
                  <span
                    className="text-[14px] font-medium leading-tight"
                    style={{ color: isActive ? '#1DCDDD' : 'rgba(255,255,255,0.9)' }}
                  >
                    {lang.nativeLabel}
                  </span>
                  <span className="text-[11px] text-white/40 leading-tight mt-0.5">
                    {lang.label}
                  </span>
                </div>
                {isActive && (
                  <Check size={14} className="text-[#1DCDDD] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
