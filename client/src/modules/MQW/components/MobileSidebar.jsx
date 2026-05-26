import React from 'react';
import { X, LogOut, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../../assets/logo.png';
import LanguageSelector from './LanguageSelector';

const navItems = [
  { icon: '/assets/nav/home.png', labelKey: 'nav.dashboard', path: '/MQW/dashboard' },
  { icon: '/assets/nav/analytics.png', labelKey: 'nav.misAnalytics', path: '/MQW/mis-analytics' },
  { icon: '/assets/nav/reports.png', labelKey: 'nav.reports', path: '/MQW/reports' },
  { icon: '/assets/nav/help.png', labelKey: 'nav.faq', path: '/MQW/faq' },
];

const MobileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside 
        className={`fixed top-0 ltr:left-0 rtl:right-0 bottom-0 w-[280px] z-[1200] flex flex-col p-6 transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #072227 0%, #05191D 100%)',
          boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between mb-10">
          <img src={logo} alt="Logo" className="h-8 object-contain" />
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-4">
          {navItems.map(({ icon, labelKey, path }) => (
            <NavLink
              key={labelKey}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'bg-[#1DCDDD]/10 border border-[#1DCDDD]/20' : 'hover:bg-white/5'}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={icon} 
                    alt={t(labelKey)} 
                    className="w-5 h-5 object-contain" 
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  />
                  <span className={`text-[15px] ${isActive ? 'text-[#1DCDDD] font-semibold' : 'text-white/80'}`}>
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-white/10">
          <LanguageSelector />
          
          <div className="text-[11px] text-white/40 font-bold uppercase tracking-wider px-4 mt-2">
            {t('nav.userProfile') || 'User Profile'}
          </div>

          {/* Option 1: My Profile Link */}
          <NavLink
            to="/MQW/profile"
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all ${
              isActive ? 'bg-[#1DCDDD]/10 border border-[#1DCDDD]/20 text-[#1DCDDD]' : 'hover:bg-white/5 text-white/80'
            }`}
          >
            <User size={18} className="flex-shrink-0" />
            <span className="text-[14.5px] font-semibold">{t('nav.myProfile', 'My Profile')}</span>
          </NavLink>

          {/* Option 2: User Management Link */}
          <NavLink
            to="/MQW/user-management"
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all ${
              isActive ? 'bg-[#1DCDDD]/10 border border-[#1DCDDD]/20 text-[#1DCDDD]' : 'hover:bg-white/5 text-white/80'
            }`}
          >
            <User size={18} className="flex-shrink-0" />
            <span className="text-[14.5px] font-semibold">{t('nav.userManagement', 'User Management')}</span>
          </NavLink>

          {/* Logout Link */}
          <button 
            onClick={() => {
              onClose();
              navigate('/MQW/signin');
            }}
            className="flex items-center gap-4 px-4 py-2.5 text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-xl text-left"
          >
            <LogOut size={18} className="rtl:rotate-180 flex-shrink-0" />
            <span className="text-[14.5px] font-semibold">{t('nav.logout') || 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
