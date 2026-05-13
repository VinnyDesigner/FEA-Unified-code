import React from 'react';
import { Outlet } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import heroBg from '../assets/hero-bg.png';
import logo from '../assets/logo.png';

const AuthLayout = () => {
  return (
    <div 
      className="w-screen min-h-screen overflow-y-auto overflow-x-hidden lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row"
      style={{
        background: 'radial-gradient(60.93% 60.93% at 50% 40.46%, #009FAC 0%, #000000 100%)'
      }}
    >
      {/* Left Panel — full width on mobile & tablet, 45% on desktop */}
      <div className="w-full lg:h-full lg:w-[45%] flex flex-col z-10">

        {/* ── Mobile top bar: centred, constrained to card width ── */}
        <div className="flex md:hidden w-full justify-center pt-5 pb-4 flex-shrink-0">
          <div className="w-[90%] max-w-[520px] flex justify-between items-center">
            <img src={logo} alt="Fujairah Environment Authority" className="h-10 w-auto object-contain" />
            <LanguageSelector />
          </div>
        </div>

        {/* ── Tablet top bar: full-width, logo left / language right ── */}
        <div className="hidden md:flex lg:hidden w-full px-8 pt-6 pb-5 justify-between items-center flex-shrink-0">
          <img src={logo} alt="Fujairah Environment Authority" className="h-12 w-auto object-contain" />
          <LanguageSelector />
        </div>

        {/* ── Desktop top bar: inside panel, logo left / language right ── */}
        <div className="hidden lg:flex w-full px-8 pt-8 pb-5 justify-between items-center flex-shrink-0">
          <img src={logo} alt="Fujairah Environment Authority" className="h-12 w-auto object-contain" />
          <LanguageSelector />
        </div>

        {/* Card Area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8 lg:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Right Panel (Hero Image) */}
      {/* Mobile & Tablet: full-width img, auto height — NO cropping */}
      {/* Desktop: fixed-height side column with object-cover */}
      <div className="w-full lg:flex-shrink-0 lg:h-full lg:w-[55%]">
        <img
          src={heroBg}
          alt="Environmental monitoring"
          className="w-full h-auto lg:w-full lg:h-full lg:object-cover"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
