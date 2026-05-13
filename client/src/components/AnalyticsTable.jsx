import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const tableData = [
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '2634', max: '5831', duration: 'February - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1973', max: '97496', duration: 'March - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1942', max: '890842', duration: 'April - 2025' },
  { station: 'Al Aqah New', parameter: 'Blue Green Algae', min: '1941', max: '8742915', duration: 'May - 2025' },
];

const AnalyticsTable = () => {
  const gridTemplate = "grid grid-cols-[1.3fr_1.8fr_1.3fr_1.3fr_1.6fr_1fr] items-center w-full";

  return (
    <div className="w-full h-[420px] max-h-[420px] overflow-hidden flex flex-col relative rounded-[20px] border border-white/5">
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
      <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar pt-2">
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
  );
};

export default AnalyticsTable;
