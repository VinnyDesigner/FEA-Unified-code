import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDataCaptureRateMqw } from '../../../lib/queries';
import { durationToRange } from '../../../lib/duration';

// Client-side page size for the capture-rate table.
const PAGE_SIZE = 10;

const DataCaptureRateTable = ({
  isMobile = false,
  activeTab = 'Data Capture Rate',
  selectedBuoy,
  selectedDuration = 'Last Month'
}) => {
  const { t } = useTranslation();
  const [captureRateData, setCaptureRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const isValidMode = activeTab === 'Valid Data Capture Rate';

  const buoyId = selectedBuoy != null && typeof selectedBuoy === 'object' ? selectedBuoy.id : selectedBuoy;

  useEffect(() => {
    setLoading(true);
    setPage(0);
    const { from, to } = durationToRange(selectedDuration);
    getDataCaptureRateMqw({ buoyId, from, to })
      .then((data) => setCaptureRateData(Array.isArray(data) ? data : []))
      .catch(() => setCaptureRateData([]))
      .finally(() => setLoading(false));
  }, [activeTab, buoyId, selectedDuration]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-white/50 text-[14px] font-semibold">Loading…</span>
      </div>
    );
  }

  if (captureRateData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-white/50 text-[14px] font-semibold">Data capture rates not yet computed — extend seed via W4</span>
      </div>
    );
  }

  const mapRow = (row) => ({
    station: row.buoyName ?? row.station ?? '—',
    conductivity: row.conductivity ?? '—',
    temp: row.temp ?? '—',
    salinity: row.salinity ?? '—',
    chlorophyll: row.chlorophyll ?? '—',
    oxygenSat: row.oxygenSat ?? '—',
    dissolvedOxygen: row.dissolvedOxygen ?? '—',
    turbidity: row.turbidity ?? '—',
    ph: row.ph ?? '—',
    depth: row.depth ?? '—',
    algae: row.algae ?? '—',
    expected: row.expectedRecords ?? row.expected ?? '—',
    received: isValidMode ? (row.validRecords ?? row.received ?? '—') : (row.receivedRecords ?? row.received ?? '—'),
    rate: isValidMode ? (row.validCaptureRatePct ?? row.captureRatePct ?? row.rate ?? '—') : (row.captureRatePct ?? row.rate ?? '—'),
  });

  const allRows = captureRateData.map(mapRow);
  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const tableRows = allRows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex md:hidden flex-col gap-4 w-full">
        {tableRows.map((row, index) => (
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
            <div className="pb-3 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">{t('analytics.station')}</span>
                <span className="text-[18px] font-bold text-white">{row.station}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.specificConductivity')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.conductivity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.waterTemperature')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.temp}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.salinity')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.salinity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.chlorophyll')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.chlorophyll}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('analytics.oxygenSaturation')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.oxygenSat}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.dissolvedOxygen')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.dissolvedOxygen}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.turbidity')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.turbidity}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.ph')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.ph}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.depth')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.depth}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/60">{t('dashboard.blueGreenAlgae')}</span>
                <span className="text-[14px] font-bold text-white/90">{row.algae}</span>
              </div>
            </div>
            <div className="mt-2 pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/70">{t('analytics.expectedRecords')}</span>
                <span className="text-[16px] font-bold text-white">{row.expected}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white/70">{isValidMode ? t('analytics.validRecords') : t('analytics.receivedRecords')}</span>
                <span className="text-[16px] font-bold text-white">{row.received}</span>
              </div>
              <div className="col-span-2 flex flex-col pt-1">
                <span className="text-[12px] font-medium text-white/70">{isValidMode ? t('analytics.validDataCaptureRate') : t('analytics.dataCaptureRate')}</span>
                <span className="text-[20px] font-bold text-[#1DCDDD]">{row.rate !== '—' ? `${row.rate}%` : '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <div className="flex-1 flex min-h-0 mb-4">
          <div className="flex-shrink-0 flex flex-col border-r border-white/10 w-[180px]">
            <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
              {t('analytics.stationName')} <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
            </div>
            <div className="flex-1">
              {tableRows.map((row, index) => (
                <div key={index} className="px-6 py-3 text-white/90 text-[14px] font-bold border-b border-white/10 h-[50px] flex items-center whitespace-nowrap">
                  {row.station}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar flex flex-col min-w-0">
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar { height: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(29, 205, 221, 0.2); border-radius: 10px; transition: all 0.3s ease; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(29, 205, 221, 0.4); }
            `}} />
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="border-b border-white/10 h-[50px]">
                  {[
                    t('dashboard.specificConductivity'),
                    t('dashboard.waterTemperature'),
                    t('dashboard.salinity'),
                    t('dashboard.chlorophyll'),
                    t('analytics.oxygenSaturation'),
                    t('dashboard.dissolvedOxygen'),
                    t('dashboard.turbidity'),
                    t('dashboard.ph'),
                    t('dashboard.depth'),
                    t('dashboard.blueGreenAlgae'),
                    t('analytics.expectedRecords'),
                    isValidMode ? t('analytics.validRecords') : t('analytics.receivedRecords')
                  ].map((label, idx) => (
                    <th key={idx} className="px-6 py-3 text-white text-[14px] font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 z-10 bg-transparent">
                      <div className="flex items-center gap-2">
                        {label} <ArrowUpDown size={14} className="flex-shrink-0 text-white/60" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={index} className="border-b border-white/10 h-[50px] transition-colors">
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.conductivity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.temp}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.salinity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.chlorophyll}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.oxygenSat}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.dissolvedOxygen}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.turbidity}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.ph}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.depth}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.algae}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.expected}</td>
                    <td className="px-6 py-3 text-white/90 text-[14px] whitespace-nowrap">{row.received}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-shrink-0 flex flex-col border-l border-white/10 w-[180px]">
            <div className="px-6 py-3 text-white text-[14px] font-bold border-b border-white/10 flex items-center gap-2 h-[50px] leading-tight sticky top-0 z-10 bg-transparent">
              {isValidMode ? t('analytics.validDataCaptureRate') : t('analytics.dataCaptureRate')} <ArrowUpDown size={14} className="text-white/60 flex-shrink-0" />
            </div>
            <div className="flex-1">
              {tableRows.map((row, index) => (
                <div key={index} className="px-6 py-3 text-white/90 text-[14px] font-bold border-b border-white/10 h-[50px] flex items-center">
                  {row.rate !== '—' ? `${row.rate}%` : '—'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center md:justify-end items-center gap-2 mt-auto pt-6 pb-3">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="w-10 h-10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.30)',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
            boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
            color: '#FFFFFF'
          }}
        >
          <ChevronLeft size={18} className="rtl:rotate-180" />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage >= pageCount - 1}
          className="w-10 h-10 flex items-center justify-center transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.30)',
            background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
            boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
            color: '#FFFFFF'
          }}
        >
          <ChevronRight size={18} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default DataCaptureRateTable;
