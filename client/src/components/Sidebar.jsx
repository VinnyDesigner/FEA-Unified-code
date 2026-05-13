import React from 'react';
import { LogOut, User } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate, NavLink } from 'react-router-dom';

const navItems = [
  { icon: '/assets/nav/home.png', label: 'Dashboard', path: '/dashboard' },
  { icon: '/assets/nav/analytics.png', label: 'MIS Analytics', path: '/mis-analytics' },
  { icon: '/assets/nav/reports.png', label: 'Reports', path: '/reports' },
  { icon: '/assets/nav/help.png', label: 'Frequently Asked Questions', path: '/faq' },
];

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-[72px] min-w-[72px] max-w-[72px] h-full flex flex-col items-center py-6 justify-between flex-shrink-0 z-[1100] pointer-events-auto">
      
      {/* Top: Logo */}
      <div className="flex flex-col items-center">
        <div className="w-[56px] h-[56px] flex items-center justify-center mb-2">
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Middle nav icons - Pill */}
      <div 
        className="flex flex-col items-center py-[12px] gap-[14px]"
        style={{
          borderRadius: '59px',
          border: '1px solid rgba(0, 0, 0, 0.10)',
          background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
          boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
          backdropFilter: 'blur(4.4px)',
          width: '54px',
        }}
      >
        {navItems.map(({ icon: IconSrc, label, path }) => (
          <NavLink
            key={label}
            to={path}
            title={label}
            className={({ isActive }) => `flex items-center justify-center transition-all w-[38px] h-[38px]`}
            style={({ isActive }) => isActive ? {
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
              boxShadow: '3px 3px 38px 0 #009FAC inset',
              backdropFilter: 'blur(4.4px)',
            } : {}}
          >
            {({ isActive }) => (
              <img 
                src={IconSrc} 
                alt={label} 
                className="w-5 h-5 object-contain transition-opacity duration-300" 
                style={{ opacity: isActive ? 1 : 0.6 }}
              />
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom: Logout, User Profile */}
      <div 
        className="flex flex-col items-center py-[12px] gap-[14px]"
        style={{
          borderRadius: '59px',
          border: '1px solid rgba(0, 0, 0, 0.10)',
          background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
          boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
          backdropFilter: 'blur(4.4px)',
          width: '54px',
        }}
      >
        <button
          title="Logout"
          onClick={() => navigate('/signin')}
          className="flex items-center justify-center transition-all hover:opacity-80"
          style={{ width: '36px', height: '36px' }}
        >
          <LogOut size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
        </button>
        <button
          title="User Profile"
          className="flex items-center justify-center transition-all hover:opacity-80"
          style={{ width: '38px', height: '38px' }}
        >
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(29, 205, 221, 0.06) 0%, rgba(29, 205, 221, 0.24) 100%)',
              boxShadow: '3px 3px 38px 0 #009FAC inset',
              backdropFilter: 'blur(4.4px)',
            }}
          >
             <User size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
