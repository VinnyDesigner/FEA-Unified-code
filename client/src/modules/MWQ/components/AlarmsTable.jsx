import React, { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAlarms } from '../../../lib/queries';
import { getAlarmLabel } from '../../../lib/i18n/alarmCodes';

const AlarmsTable = ({ isMobile = false }) => {
  const { t } = useTranslation();
  const [alarmsData, setAlarmsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlarms({ module: 'MWQ', limit: 50 })
      .then((data) => setAlarmsData(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/50 text-[14px] font-semibold">Loading alarms…</span>
      </div>
    );
  }

  if (alarmsData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/50 text-[14px] font-semibold">No alarms recorded</span>
      </div>
    );
  }

  const formatDateTime = (raw) => {
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');
    } catch (_) {
      return raw;
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 w-full pb-4">
        {alarmsData.map((row, index) => (
          <div key={index} className="bg-white/5 border border-white/10 rounded-[20px] p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-start gap-2">
              <span className="text-white font-bold text-[14px]">{row.buoyName ?? row.stationName ?? '—'}</span>
              <span className="text-white/60 text-[12px]">{formatDateTime(row.raisedAt ?? row.dateTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#00CFE8] font-semibold text-[13px]">{getAlarmLabel(row.alarmCode, t)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <div className="flex flex-col min-h-0 w-full">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(29, 205, 221, 0.2); border-radius: 10px; transition: all 0.3s ease; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(29, 205, 221, 0.4); }
          `}} />
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 h-[50px]">
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">Date &amp; Time <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" /></div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">Station Name <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" /></div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">Alert Type <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" /></div>
                </th>
                <th className="px-6 py-3 text-white text-[14px] font-bold text-left whitespace-nowrap leading-tight sticky top-0 bg-transparent w-[20%]">
                  <div className="flex items-center gap-2">Severity <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {alarmsData.map((row, index) => (
                <tr key={index} className="border-b border-white/10 h-[56px] transition-colors">
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{formatDateTime(row.raisedAt ?? row.dateTime)}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.buoyName ?? row.stationName ?? '—'}</td>
                  <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{getAlarmLabel(row.alarmCode, t)}</td>
                  <td className="px-6 py-3 text-white/80 text-[13px] leading-normal">{row.severity ?? '—'}</td>
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
