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
      <div className="flex flex-col min-h-0 w-full">
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
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{t(`stations.${row.stationName.replace(/ /g, '')}`, row.stationName)}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{t(`alarms.${row.alertType.charAt(0).toLowerCase() + row.alertType.slice(1).replace(/ /g, '')}`, row.alertType)}</td>
                  <td className="px-6 py-3 text-white/80 text-[13px] leading-normal">{t(row.alertDescription.includes('communication') ? 'alarms.commAlertDesc' : row.alertDescription.includes('door') ? 'alarms.gpsAlertDesc1' : 'alarms.gpsAlertDesc2', row.alertDescription)}</td>
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
