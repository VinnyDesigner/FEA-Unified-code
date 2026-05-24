import React from 'react';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const tableData = [
  { dateTime: '10-05-2026, 12:00:00', station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '2634', max: '5831', duration: 'February - 2025' },
  { dateTime: '10-05-2026, 12:30:00', station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1973', max: '97496', duration: 'March - 2025' },
  { dateTime: '10-05-2026, 13:00:00', station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1942', max: '898042', duration: 'April - 2025' },
  { dateTime: '10-05-2026, 13:30:00', station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1941', max: '8742915', duration: 'May - 2025' },
];

const AnalyticsTable = ({ isMobile = false, selectedBuoys = ['Al Aqah Buoy'] }) => {
  const { t } = useTranslation();
  const gridTemplate = "grid grid-cols-[1.5fr_1.1fr_1.3fr_1fr_1fr_1.3fr_0.8fr] items-center w-full";

  // Normalize selectedBuoys to an array
  const activeBuoys = Array.isArray(selectedBuoys) ? selectedBuoys : [selectedBuoys];

  // Generate dynamic table data rows
  const dynamicRows = activeBuoys.flatMap((buoy, idx) => {
    return [
      { dateTime: '10-05-2026, 12:00:00', station: buoy, parameter: 'Blue Green Algae', min: Math.round(2634 * (idx % 2 === 0 ? 1.0 : 0.85)).toString(), max: Math.round(5831 * (idx % 2 === 0 ? 1.0 : 0.9)).toString(), duration: 'February - 2025' },
      { dateTime: '10-05-2026, 12:30:00', station: buoy, parameter: 'Blue Green Algae', min: Math.round(1973 * (idx % 2 === 0 ? 1.0 : 0.85)).toString(), max: Math.round(97496 * (idx % 2 === 0 ? 1.0 : 0.9)).toString(), duration: 'March - 2025' },
      { dateTime: '10-05-2026, 13:00:00', station: buoy, parameter: 'Blue Green Algae', min: Math.round(1942 * (idx % 2 === 0 ? 1.0 : 0.85)).toString(), max: Math.round(898042 * (idx % 2 === 0 ? 1.0 : 0.9)).toString(), duration: 'April - 2025' },
      { dateTime: '10-05-2026, 13:30:00', station: buoy, parameter: 'Blue Green Algae', min: Math.round(1941 * (idx % 2 === 0 ? 1.0 : 0.85)).toString(), max: Math.round(8742915 * (idx % 2 === 0 ? 1.0 : 0.9)).toString(), duration: 'May - 2025' },
    ];
  });

  return (
    <>
      {/* --- MOBILE VIEW: Analytics Cards (< 768px) --- */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {dynamicRows.map((row, index) => (
          <div 
            key={index} 
            className="flex flex-col gap-[14px] p-[18px] relative overflow-hidden"
            style={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Date & Time */}
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.dateTime', 'Date & Time')}</span>
              <span className="text-[16px] font-bold text-white">{row.dateTime}</span>
            </div>

            {/* Station */}
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.station')}</span>
              <span className="text-[16px] font-bold text-white">{row.station}</span>
            </div>

            {/* Parameter */}
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.parameters')}</span>
              <span className="text-[15px] font-semibold text-white/90">{row.parameter}</span>
            </div>

            {/* Min/Max Values Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.minValue')}</span>
                <span className="text-[16px] font-bold text-[#1DCDDD]">{row.min}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.maxValue')}</span>
                <span className="text-[16px] font-bold text-[#1DCDDD]">{row.max}</span>
              </div>
            </div>

            {/* Duration & Details Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">{t('analytics.duration')}</span>
                <span className="text-[14px] font-medium text-white/60 italic">{row.duration}</span>
              </div>
              <button className="flex items-center gap-1 text-[#1DCDDD] font-bold text-[15px] hover:text-white transition-colors">
                {t('analytics.showMore')}
                <ChevronRight size={18} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLET/DESKTOP VIEW: Table (>= 768px) --- */}
      <div 
        className={`hidden md:flex flex-col w-full ${!isMobile ? 'flex-1 min-h-0 max-h-[420px]' : ''} overflow-hidden relative`}
        style={{
          borderRadius: '12px',
          background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.14) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.10)',
        }}
      >
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-0 flex flex-col">
          <div className="min-w-[850px] lg:min-w-0 w-full flex-1 min-h-0 flex flex-col">
            {/* Fixed Header Frame */}
            <div className={`${gridTemplate} text-left text-white text-[14px] font-bold border-b border-white/10 px-4 py-4 sticky top-0 z-20 bg-transparent flex-shrink-0 ltr:text-left rtl:text-right`}>
              <div className="flex items-center gap-2">
                {t('analytics.dateTime', 'Date & Time')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                {t('analytics.station')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                {t('analytics.parameters')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                {t('analytics.minValue')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                {t('analytics.maxValue')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                {t('analytics.duration')} <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="ltr:text-right rtl:text-left">{t('analytics.details', 'Details')}</div>
            </div>

            {/* Scrollable Body Frame */}
            <div className={`overflow-y-auto overflow-x-hidden ${!isMobile ? 'flex-1' : ''} no-scrollbar pt-2`}>
              {dynamicRows.map((row, index) => (
                <div 
                  key={index} 
                  className={`${gridTemplate} group border-b border-white/5 transition-colors px-4 py-5 text-[14px]`}
                >
                  <div className="text-white/90 font-medium">{row.dateTime}</div>
                  <div className="text-white/70">{row.station}</div>
                  <div className="text-white/70">{row.parameter}</div>
                  <div className="text-white/90 font-bold">{row.min}</div>
                  <div className="text-white/90 font-bold">{row.max}</div>
                  <div className="text-white/60">{row.duration}</div>
                  <div className="ltr:text-right rtl:text-left">
                    <button className="text-[#1DCDDD] hover:text-white underline underline-offset-4 decoration-1 font-semibold transition-all">
                      {t('analytics.showMore')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsTable;
