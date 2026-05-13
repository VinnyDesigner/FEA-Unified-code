import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqData = [
  {
    question: "What is the Marine Water Quality application?",
    answer: "This application provides real-time and historical data on marine water quality across Fujairah to support environmental monitoring and decision-making."
  },
  {
    question: "Who manages this application?",
    answer: "The application is managed by the Fujairah Environment Authority (FEA) to ensure sustainable coastal management."
  },
  {
    question: "What type of data is available in the app?",
    answer: "The app provides metrics such as Specific Conductivity, Water Temperature, Salinity, Chlorophyll, Dissolved Oxygen, Turbidity, pH, and Blue Green Algae levels."
  },
  {
    question: "How frequently is the data updated?",
    answer: "Data is typically updated in near real-time, depending on the transmission frequency of the monitoring buoys stationed along the coast."
  },
  {
    question: "How accurate is the data?",
    answer: "The data is collected using high-precision environmental sensors (sondes) that are regularly calibrated and maintained for maximum accuracy."
  },
  {
    question: "What do the water quality indicators mean?",
    answer: "Each indicator represents a specific chemical or physical property of the water that helps environmental scientists assess the overall health of the marine ecosystem."
  },
  {
    question: "How can I view water quality data for a specific location?",
    answer: "You can use the interactive Map View on the Dashboard to click on specific station markers or use the Station dropdown in the Analytics sections."
  },
  {
    question: "Can I download or export data?",
    answer: "Yes, you can generate and download detailed environmental reports through the dedicated Reports section of the application."
  },
  {
    question: "What do the color indicators on the map represent?",
    answer: "Colors typically represent the current status of water quality parameters relative to established safety and environmental standards (e.g., Green for Good, Red for Critical)."
  }
];

const FAQAccordion = ({ isMobile = false }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3.5 md:gap-4 pb-10">
      {faqData.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index}
            className={`transition-all duration-300 border ${
              isOpen 
                ? 'bg-white/10 border-white/20 p-5 md:p-8 rounded-[20px] md:rounded-[30px] shadow-[0_4px_30px_rgba(0,0,0,0.1)]' 
                : 'bg-transparent border-transparent p-5 md:px-8 md:py-4 rounded-[20px]'
            }`}
            style={isOpen ? {
              backdropFilter: 'blur(20px)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
            } : {}}
          >
            <button 
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="w-full flex items-center justify-between text-left group gap-4"
            >
              <span className={`text-[16px] md:text-[18px] font-bold transition-colors ${
                isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
              }`}>
                {item.question}
              </span>
              {isOpen ? (
                <ChevronUp size={20} className="text-[#1DCDDD] flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-white/40 group-hover:text-white/60 flex-shrink-0" />
              )}
            </button>
            
            {isOpen && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-white/70 text-[14px] md:text-[15px] leading-relaxed max-w-[95%] md:max-w-[90%]">
                  {item.answer}
                </p>
              </div>
            )}

            {!isOpen && index !== faqData.length - 1 && (
              <div className="absolute bottom-0 left-5 md:left-8 right-5 md:right-8 h-px bg-white/5 hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
