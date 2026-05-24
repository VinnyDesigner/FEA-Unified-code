import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const DashboardHeader = ({ activeTab, setActiveTab, stations = [], selectedBuoy, setSelectedBuoy }) => {
  const { t } = useTranslation();
  
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tempTab, setTempTab] = useState(activeTab);

  const locationBtnRef = useRef(null);
  const tabBtnRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const tabDropdownRef = useRef(null);

  useEffect(() => {
    if (isTabDropdownOpen) {
      setTempTab(activeTab);
    }
  }, [isTabDropdownOpen, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLocationOpen && 
          locationBtnRef.current && !locationBtnRef.current.contains(event.target) &&
          locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
      if (isTabDropdownOpen && 
          tabBtnRef.current && !tabBtnRef.current.contains(event.target) &&
          tabDropdownRef.current && !tabDropdownRef.current.contains(event.target)) {
        setIsTabDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationOpen, isTabDropdownOpen]);

  // Shared pill button — used by both Location and Sonde
  const pillBase = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
    backdropFilter: 'blur(10px)',
    height: '36px',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
  };

  // Dropdown card — min-width ensures CTAs never wrap
  const dropdownCard = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    zIndex: 9999,
    minWidth: '220px',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.30) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  // Apply Filters CTA — matches design system (ProfilePage, SignIn, etc.)
  const applyBtnStyle = {
    background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
    borderRadius: '29px',
    boxShadow: '0 0 50px 0 rgba(0, 159, 172, 0.30), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '12px',
    padding: '8px 20px',
    cursor: 'pointer',
    outline: 'none',
    border: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  };

  const tabLabel =
    activeTab === 'Sonde' ? t('dashboard.sonde') :
    activeTab === 'Weather' ? t('dashboard.weather') :
    t('dashboard.windrose');

  return (
    <div className="flex items-center justify-between w-full pb-2">

      {/* ── Location — 45% left ── */}
      <div className="relative" style={{ width: '45%', zIndex: isLocationOpen ? 100 : 1 }}>
        <button
          ref={locationBtnRef}
          onClick={() => { setIsLocationOpen(!isLocationOpen); setIsTabDropdownOpen(false); }}
          style={pillBase}
        >
          <span className="truncate text-[#072227] text-[12px] font-semibold">
            {selectedBuoy?.nameKey
              ? t(`stations.${selectedBuoy.nameKey}`)
              : (selectedBuoy?.name || t('dashboard.selectStation'))}
          </span>
          <ChevronDown
            size={13}
            className={`flex-shrink-0 ml-2 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''} text-[#072227]/70`}
          />
        </button>

        {isLocationOpen && (
          <div ref={locationDropdownRef} style={{ ...dropdownCard, left: 0, right: 'auto' }}>
            {stations.map((station) => {
              const isChecked = selectedBuoy?.id === station.id;
              return (
                <button
                  key={station.id}
                  className="flex items-center gap-3.5 text-left outline-none cursor-pointer group w-full border-none bg-transparent"
                  onClick={() => {
                    if (setSelectedBuoy) setSelectedBuoy(station);
                    setIsLocationOpen(false);
                  }}
                >
                  <div className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                  }`}>
                    {isChecked && <div className="w-[7px] h-[7px] bg-[#009FAC] rounded-full" />}
                  </div>
                  <span className="text-white text-[13px] font-semibold group-hover:text-[#1DCDDD] transition-colors">
                    {station.nameKey ? t(`stations.${station.nameKey}`) : station.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sonde/Tab — 35% right ── */}
      <div className="relative" style={{ width: '35%', zIndex: isTabDropdownOpen ? 100 : 1 }}>
        <button
          ref={tabBtnRef}
          onClick={() => { setIsTabDropdownOpen(!isTabDropdownOpen); setIsLocationOpen(false); }}
          style={pillBase}
        >
          <span className="text-[#072227] text-[12px] font-semibold truncate">{tabLabel}</span>
          <ChevronDown
            size={13}
            className={`flex-shrink-0 ml-2 transition-transform duration-300 ${isTabDropdownOpen ? 'rotate-180' : ''} text-[#072227]/70`}
          />
        </button>

        {isTabDropdownOpen && (
          <div ref={tabDropdownRef} style={{ ...dropdownCard, left: 'auto', right: 0 }}>
            {['Sonde', 'Weather', 'Windrose'].map((tab) => {
              const isChecked = tempTab === tab;
              return (
                <button
                  key={tab}
                  className="flex items-center gap-3.5 text-left outline-none cursor-pointer group w-full border-none bg-transparent"
                  onClick={() => setTempTab(tab)}
                >
                  <div className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isChecked ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                  }`}>
                    {isChecked && <div className="w-[7px] h-[7px] bg-[#009FAC] rounded-full" />}
                  </div>
                  <span className="text-white text-[13px] font-semibold group-hover:text-[#1DCDDD] transition-colors">
                    {tab === 'Sonde' ? t('dashboard.sonde') :
                     tab === 'Weather' ? t('dashboard.weather') :
                     t('dashboard.windrose')}
                  </span>
                </button>
              );
            })}

            {/* CTA row */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 w-full">
              <button
                onClick={() => setIsTabDropdownOpen(false)}
                className="text-white/60 hover:text-white text-[12px] font-semibold bg-transparent border-none cursor-pointer outline-none transition-colors flex-shrink-0"
              >
                {t('reports.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setActiveTab(tempTab);
                  setIsTabDropdownOpen(false);
                }}
                style={applyBtnStyle}
                className="hover:scale-[1.03] active:scale-[0.97]"
              >
                {t('common.applyFilters', 'Apply Filters')}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardHeader;
