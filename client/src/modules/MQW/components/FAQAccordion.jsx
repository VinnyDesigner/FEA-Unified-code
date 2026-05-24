import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getFaqData = (t) => [
  {
    question: t('faq.q1', "What is the Marine Water Quality application?"),
    answer: t('faq.a1', "This application provides real-time and historical data on marine water quality across Fujairah to support environmental monitoring and decision-making.")
  },
  {
    question: t('faq.q2', "Who manages this application?"),
    answer: t('faq.a2', "The application is managed by the Fujairah Environment Authority (FEA) to ensure sustainable coastal management.")
  },
  {
    question: t('faq.q3', "What type of data is available in the app?"),
    answer: t('faq.a3', "The app provides metrics such as Specific Conductivity, Water Temperature, Salinity, Chlorophyll, Dissolved Oxygen, Turbidity, pH, and Blue Green Algae levels.")
  },
  {
    question: t('faq.q4', "How frequently is the data updated?"),
    answer: t('faq.a4', "Data is typically updated in near real-time, depending on the transmission frequency of the monitoring buoys stationed along the coast.")
  },
  {
    question: t('faq.q5', "How accurate is the data?"),
    answer: t('faq.a5', "The data is collected using high-precision environmental sensors (sondes) that are regularly calibrated and maintained for maximum accuracy.")
  },
  {
    question: t('faq.q6', "What do the water quality indicators mean?"),
    answer: t('faq.a6', "Each indicator represents a specific chemical or physical property of the water that helps environmental scientists assess the overall health of the marine ecosystem.")
  },
  {
    question: t('faq.q7', "How can I view water quality data for a specific location?"),
    answer: t('faq.a7', "You can use the interactive Map View on the Dashboard to click on specific station markers or use the Station dropdown in the Analytics sections.")
  },
  {
    question: t('faq.q8', "Can I download or export data?"),
    answer: t('faq.a8', "Yes, you can generate and download detailed environmental reports through the dedicated Reports section of the application.")
  },
  {
    question: t('faq.q9', "What do the color indicators on the map represent?"),
    answer: t('faq.a9', "Colors typically represent the current status of water quality parameters relative to established safety and environmental standards (e.g., Green for Good, Red for Critical).")
  }
];

const FAQAccordion = ({ isMobile = false }) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);
  const faqData = getFaqData(t);

  return (
    <div className="flex flex-col gap-3.5 md:gap-4 pb-10">
      {faqData.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index}
            onClick={() => setOpenIndex(isOpen ? -1 : index)}
            className={`transition-all duration-300 border cursor-pointer ${
              isOpen 
                ? 'bg-white/10 border-white/20 p-5 md:p-8 rounded-[20px] md:rounded-[30px] shadow-[0_4px_30px_rgba(0,0,0,0.1)]' 
                : 'bg-transparent border-transparent p-5 md:px-8 md:py-4 rounded-[20px]'
            }`}
            style={isOpen ? {
              backdropFilter: 'blur(4.400000095367432px)',
              boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
            } : {}}
          >
            <div 
              className="w-full flex items-center justify-between text-left group gap-4"
            >
              <span className={`text-[14px] font-bold transition-colors ${
                isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
              }`}>
                {item.question}
              </span>
              {isOpen ? (
                <ChevronUp size={20} className="text-[#1DCDDD] flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-white/40 group-hover:text-white/60 flex-shrink-0" />
              )}
            </div>
            
            {isOpen && (
              <div 
                className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white/70 text-[12px] leading-relaxed max-w-[95%] md:max-w-[90%]">
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
