import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { icon: '/assets/nav/home.png', labelKey: 'nav.dashboard', path: '/MQW/dashboard' },
  { icon: '/assets/nav/analytics.png', labelKey: 'nav.misAnalytics', path: '/MQW/mis-analytics' },
  { icon: '/assets/nav/reports.png', labelKey: 'nav.reports', path: '/MQW/reports' },
  { icon: '/assets/nav/help.png', labelKey: 'nav.faq', path: '/MQW/faq' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('My Profile');
  const [profilePos, setProfilePos] = useState({ top: 0, left: 0 });

  const profileBtnRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleProfileDropdown = () => {
    if (!isProfileOpen && profileBtnRef.current) {
      const rect = profileBtnRef.current.getBoundingClientRect();
      setProfilePos({
        top: rect.top + window.scrollY - 30,
        left: rect.right + window.scrollX + 12
      });
    }
    setIsProfileOpen(!isProfileOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isProfileOpen &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  if (windowWidth < 768) {
    return null;
  }

  const pillStyle = {
    borderRadius: '40px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
    boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
    backdropFilter: 'blur(10px)',
    width: '60px',
  };

  // Glassmorphic dropdown styling matching filters modal
  const glassDropdownStyle = {
    borderRadius: '21px',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
    width: '230px',
  };

  return (
    <aside 
      className="hidden md:flex w-[92px] min-w-[92px] flex-col items-center pb-[8px] flex-shrink-0 z-[1100] pointer-events-auto bg-transparent fixed left-0 top-[80px] bottom-0 gap-6" 
      style={{ height: 'calc(100vh - 80px)' }}
    >
      
      {/* Top Navigation Pill (Extended Height) */}
      <div 
        className="flex flex-col items-center py-[20px] gap-[18px] w-[60px] flex-grow justify-start"
        style={pillStyle}
      >
        {navItems.map(({ icon: IconSrc, labelKey, path }) => (
          <NavLink
            key={labelKey}
            to={path}
            title={t(labelKey)}
            className="flex items-center justify-center transition-all w-[42px] h-[42px] group relative"
            style={({ isActive }) => isActive ? {
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
              boxShadow: '3px 3px 38px 0 #009FAC inset',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <img 
                  src={IconSrc} 
                  alt={t(labelKey)} 
                  className="w-5 h-5 object-contain transition-opacity duration-300" 
                  style={{ opacity: isActive ? 1 : 0.6 }}
                />
                <span className="absolute left-[70px] bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Profile & Logout Pill */}
      <div 
        className="flex flex-col items-center py-[20px] gap-[18px] w-[60px] flex-shrink-0"
        style={pillStyle}
      >
        {/* Logout Button */}
        <button
          title={t('nav.logout') || 'Logout'}
          onClick={() => navigate('/MQW/signin')}
          className="flex items-center justify-center transition-all w-[42px] h-[42px] group relative text-white"
        >
          <LogOut size={20} strokeWidth={2.5} className="transition-opacity duration-300 opacity-60 group-hover:opacity-100" />
          <span className="absolute left-[70px] bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
            {t('nav.logout') || 'Logout'}
          </span>
        </button>

        {/* User Profile Trigger Button */}
        <button
          ref={profileBtnRef}
          onClick={toggleProfileDropdown}
          title={t('nav.userProfile') || 'Profile'}
          className="flex items-center justify-center transition-all w-[42px] h-[42px] group relative"
          style={{
            borderRadius: '50px',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
            boxShadow: '3px 3px 38px 0 #009FAC inset',
          }}
        >
          <User size={20} color="#ffffff" strokeWidth={2.5} />
          <span className="absolute left-[70px] bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
            {t('nav.userProfile') || 'Profile'}
          </span>
        </button>
      </div>

      {/* Profile Dropdown Options Card Portal */}
      {isProfileOpen && createPortal(
        <div 
          ref={profileDropdownRef}
          className="fixed z-[9999] p-5 flex flex-col gap-4"
          style={{
            ...glassDropdownStyle,
            top: profilePos.top,
            left: profilePos.left
          }}
        >
          <div className="flex flex-col gap-4">
            {/* Option 1: My Profile */}
            <button
              onClick={() => {
                setSelectedOption('My Profile');
                setIsProfileOpen(false);
                navigate('/MQW/profile');
              }}
              className="flex items-center gap-3.5 text-left outline-none cursor-pointer group"
            >
              <div 
                className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedOption === 'My Profile' ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                }`}
              >
                {selectedOption === 'My Profile' && <div className="w-[8px] h-[8px] bg-[#009FAC] rounded-full" />}
              </div>
              <span className="text-white text-[14.5px] font-semibold leading-none">{t('nav.myProfile')}</span>
            </button>

            {/* Option 2: User Management */}
            <button
              onClick={() => {
                setSelectedOption('User Management');
                setIsProfileOpen(false);
                navigate('/MQW/user-management');
              }}
              className="flex items-center gap-3.5 text-left outline-none cursor-pointer group"
            >
              <div 
                className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedOption === 'User Management' ? 'border-white bg-white' : 'border-white/40 bg-transparent group-hover:border-white/60'
                }`}
              >
                {selectedOption === 'User Management' && <div className="w-[8px] h-[8px] bg-[#009FAC] rounded-full" />}
              </div>
              <span className="text-white text-[14.5px] font-semibold leading-none">{t('nav.userManagement')}</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};

export default Sidebar;
