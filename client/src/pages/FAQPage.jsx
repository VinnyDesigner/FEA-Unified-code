import React from 'react';
import Sidebar from '../components/Sidebar';
import FAQAccordion from '../components/FAQAccordion';

const FAQPage = () => {
  return (
    <div 
      className="w-screen h-screen overflow-hidden p-[8px] flex gap-[12px]"
    >
      {/* Sidebar */}
      <div className="w-[64px] h-full flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Main Content Area (Unified Glass Container) */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"
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

        {/* Content Section (Unified Inner Container) - Scrollable for long list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <FAQAccordion />
        </div>

      </div>
    </div>
  );
};

export default FAQPage;
