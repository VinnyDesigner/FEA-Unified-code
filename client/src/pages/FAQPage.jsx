import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import FAQAccordion from '../components/FAQAccordion';

const FAQPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden p-0 lg:p-[8px] flex flex-col lg:flex-row lg:gap-[12px] lg:bg-[#072227]">
      {/* Mobile/Tablet Navigation */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* --- RESPONSIVE LAYOUT (Mobile & Tablet < 1024px) --- */}
      <div className="lg:hidden flex-1 flex flex-col w-full min-h-screen bg-[#072227] overflow-y-auto no-scrollbar pt-[64px]">
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <div className="p-5 md:p-10 flex-1 flex flex-col gap-8 md:min-h-[calc(100vh-64px)]"
          style={{
            background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
          }}
        >
          {/* Header Section */}
          <div className="flex flex-col mb-4">
            <h1 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-[1.2]">
              Frequently Asked Questions
            </h1>
            <p className="text-[14px] md:text-[16px] text-gray-400 mt-3 max-w-[95%] md:max-w-[80%] leading-relaxed opacity-75">
              Everything you need to know—answered clearly and concisely.
            </p>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <FAQAccordion isMobile={true} />
          </div>
        </div>
      </div>

      {/* --- DESKTOP LAYOUT (>= 1024px) --- */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 h-full relative"
        style={{
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
          boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
          backdropFilter: 'blur(7px)',
          padding: '24px',
          overflow: 'hidden'
        }}
      >
        {/* Header Section (Inside Panel) */}
        <div className="flex flex-col mb-10">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Everything you need to know—answered clearly and concisely.
          </p>
        </div>

        {/* Content Section (Unified Inner Container) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <FAQAccordion />
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
