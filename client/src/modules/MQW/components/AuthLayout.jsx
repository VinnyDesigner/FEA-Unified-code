import React from 'react';
import { Outlet } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import heroBg from '../../../assets/hero-bg.png';
import logo from '../../../assets/logo-auth.png';

import GlobalHeader from './GlobalHeader';

const AuthLayout = () => {
  return (
    <div 
      className="w-screen min-h-screen overflow-y-auto overflow-x-hidden lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-transparent"
    >
      <GlobalHeader />
      
      {/* Left Panel — full width on mobile & tablet, 45% on desktop */}
      <div className="w-full flex-grow lg:h-full lg:w-[45%] flex flex-col z-10 pt-[80px]">

        {/* Card Area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8 lg:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Right Panel (Hero Image) */}
      {/* Mobile & Tablet: Hidden. Desktop: fixed-height side column with object-cover */}
      <div className="hidden lg:block w-full lg:flex-shrink-0 lg:h-full lg:w-[55%]">
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
