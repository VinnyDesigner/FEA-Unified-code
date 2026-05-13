import React from 'react';
import { ArrowUpDown, ChevronRight } from 'lucide-react';

const tableData = [
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '2634', max: '5831', duration: 'February - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1973', max: '97496', duration: 'March - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1942', max: '890842', duration: 'April - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1941', max: '8742915', duration: 'May - 2025' },
];

const AnalyticsTable = ({ isMobile = false }) => {
  const gridTemplate = "grid grid-cols-[1.3fr_1.8fr_1.3fr_1.3fr_1.6fr_1fr] items-center w-full";

  return (
    <>
      {/* --- MOBILE VIEW: Analytics Cards (< 768px) --- */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {tableData.map((row, index) => (
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
            {/* Station */}
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">Station</span>
              <span className="text-[18px] font-bold text-white">{row.station}</span>
            </div>

            {/* Parameter */}
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">Parameter</span>
              <span className="text-[16px] font-semibold text-white/90">{row.parameter}</span>
            </div>

            {/* Min/Max Values Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">Min Value</span>
                <span className="text-[18px] font-bold text-[#1DCDDD]">{row.min}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">Max Value</span>
                <span className="text-[18px] font-bold text-[#1DCDDD]">{row.max}</span>
              </div>
            </div>

            {/* Duration & Details Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/70 uppercase tracking-wide">Duration</span>
                <span className="text-[14px] font-medium text-white/60 italic">{row.duration}</span>
              </div>
              <button className="flex items-center gap-1 text-[#1DCDDD] font-bold text-[15px] hover:text-white transition-colors">
                Show More
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLET/DESKTOP VIEW: Table (>= 768px) --- */}
      <div className={`hidden md:flex flex-col w-full ${!isMobile ? 'h-[420px] max-h-[420px]' : ''} overflow-hidden relative rounded-[20px] border border-white/5`}>
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[850px] lg:min-w-0 w-full flex flex-col">
            {/* Fixed Header Frame */}
            <div className={`${gridTemplate} text-left text-white text-[14px] font-bold border-b border-white/10 px-4 py-4 sticky top-0 z-20 bg-transparent flex-shrink-0`}>
              <div className="flex items-center gap-2">
                Station <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                Parameters <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                Min Value <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                Max Value <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                Duration <ArrowUpDown size={16} className="text-white/60" />
              </div>
              <div className="text-right">Details</div>
            </div>

            {/* Scrollable Body Frame */}
            <div className={`overflow-y-auto overflow-x-hidden ${!isMobile ? 'flex-1' : ''} no-scrollbar pt-2`}>
              {tableData.map((row, index) => (
                <div 
                  key={index} 
                  className={`${gridTemplate} group border-b border-white/5 hover:bg-white/5 transition-colors px-4 py-5 text-[14px]`}
                >
                  <div className="text-white/90 font-medium">{row.station}</div>
                  <div className="text-white/70">{row.parameter}</div>
                  <div className="text-white/90 font-bold">{row.min}</div>
                  <div className="text-white/90 font-bold">{row.max}</div>
                  <div className="text-white/60">{row.duration}</div>
                  <div className="text-right">
                    <button className="text-[#1DCDDD] hover:text-white underline underline-offset-4 decoration-1 font-semibold transition-all">
                      Show More
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
