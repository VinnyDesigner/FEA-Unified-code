import React from 'react';
import { Menu, User } from 'lucide-react';
import logo from '../assets/logo.png';

const MobileHeader = ({ onMenuClick }) => {
  return (
    <header 
      className="fixed top-0 left-0 right-0 h-[64px] flex items-center justify-between px-4 z-[1000] lg:hidden"
      style={{
        background: 'linear-gradient(180deg, #072227 0%, #05191D 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Left: Hamburger */}
      <button 
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Center: Logo */}
      <div className="flex items-center gap-2">
        <img src={logo} alt="FEA Logo" className="h-8 object-contain" />
      </div>

      {/* Right: Profile */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80">
        <User size={20} />
      </button>
    </header>
  );
};

export default MobileHeader;
