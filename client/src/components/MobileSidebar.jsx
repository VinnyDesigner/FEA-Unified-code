import React from 'react';
import { X, LogOut, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const navItems = [
  { icon: '/assets/nav/home.png', label: 'Dashboard', path: '/dashboard' },
  { icon: '/assets/nav/analytics.png', label: 'MIS Analytics', path: '/mis-analytics' },
  { icon: '/assets/nav/reports.png', label: 'Reports', path: '/reports' },
  { icon: '/assets/nav/help.png', label: 'Frequently Asked Questions', path: '/faq' },
];

const MobileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-[280px] z-[1200] flex flex-col p-6 transition-transform duration-300 ease-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, #072227 0%, #05191D 100%)',
          boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
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
          {navItems.map(({ icon, label, path }) => (
            <NavLink
              key={label}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'bg-[#1DCDDD]/10 border border-[#1DCDDD]/20' : 'hover:bg-white/5'}`}
            >
              {({ isActive }) => (
                <>
                  <img 
                    src={icon} 
                    alt={label} 
                    className="w-5 h-5 object-contain" 
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  />
                  <span className={`text-[15px] ${isActive ? 'text-[#1DCDDD] font-semibold' : 'text-white/80'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4 p-4 text-white/80">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User size={20} />
            </div>
            <span className="text-[15px] font-medium">User Profile</span>
          </div>
          <button 
            onClick={() => navigate('/signin')}
            className="flex items-center gap-4 p-4 text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="text-[15px]">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
