import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const alarmsData = [
  {
    dateTime: '10-05-2026, 12:00:00',
    stationName: 'Al Aqah New',
    alertType: 'Comm Alert',
    alertDescription: 'Triggered when communication with the marine monitoring station/buoy is lost or data transmission is interrupted.'
  },
  {
    dateTime: '10-05-2026, 12:30:00',
    stationName: 'North Dibbah',
    alertType: 'GPS Alert',
    alertDescription: 'Triggered when the monitoring station enclosure door is opened or left open.'
  },
  {
    dateTime: '10-05-2026, 13:00:00',
    stationName: 'OSB',
    alertType: 'Enclosure Door Open Alert',
    alertDescription: 'Triggered when GPS signal is lost or the station location changes from the configured position.'
  },
  {
    dateTime: '10-05-2026, 13:30:00',
    stationName: 'NSB',
    alertType: 'GPS Alert',
    alertDescription: 'Triggered when the monitoring station enclosure door is opened or left open.'
  }
];

const AlarmsTable = ({ isMobile = false }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* --- MOBILE VIEW: Cards (< 768px) --- */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {alarmsData.map((row, index) => (
          <div 
            key={index} 
            className="flex flex-col gap-3 p-4 relative overflow-hidden"
            style={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Station & Time */}
            <div className="flex justify-between items-start pb-2 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wide">Station</span>
                <span className="text-[15px] font-bold text-white">{row.stationName}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wide">Date & Time</span>
                <span className="text-xs font-semibold text-[#1DCDDD]">{row.dateTime}</span>
              </div>
            </div>

            {/* Alert Details */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Alert Type:</span>
                <span className="text-xs font-bold text-red-400">{row.alertType}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide mb-1">Description</span>
                <span className="text-xs text-white/80 leading-normal">{row.alertDescription}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLET/DESKTOP VIEW: Table (>= 768px) --- */}
      <div className="hidden md:flex flex-col min-h-0 w-full">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
              height: 6px;
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(29, 205, 221, 0.2);
              border-radius: 10px;
              transition: all 0.3s ease;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(29, 205, 221, 0.4);
            }
          `}} />
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 h-[50px]">
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">
                    Date & Time <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                  </div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">
                    Station Name <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                  </div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">
                    Alert Type <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                  </div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[40%]">
                  <div className="flex items-center gap-2">
                    Alert Description <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {alarmsData.map((row, index) => (
                <tr key={index} className="border-b border-white/10 h-[56px] transition-colors">
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.dateTime}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.stationName}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.alertType}</td>
                  <td className="px-6 py-3 text-white/80 text-[13px] leading-normal">{row.alertDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlarmsTable;
