import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMqwSensorData } from '../../../lib/queries';
import { durationToRange } from '../../../lib/duration';

const paramDefs = [
  { filterName: 'Specific Conductivity', key: 'conductivity', label: 'dashboard.specificConductivity' },
  { filterName: 'Water Temperature', key: 'temp', label: 'dashboard.waterTemperature', suffix: '°C' },
  { filterName: 'Salinity', key: 'salinity', label: 'dashboard.salinity' },
  { filterName: 'Chlorophyll', key: 'chlorophyll', label: 'dashboard.chlorophyll' },
  { filterName: 'Oxygen Saturation', key: 'oxygenSat', label: 'analytics.oxygenSaturation', suffix: '%' },
  { filterName: 'Dissolved Oxygen', key: 'dissolvedOxygen', label: 'dashboard.dissolvedOxygen' },
  { filterName: 'Turbidity', key: 'turbidity', label: 'dashboard.turbidity' },
  { filterName: 'pH', key: 'ph', label: 'dashboard.ph' },
  { filterName: 'Depth', key: 'depth', label: 'dashboard.depth', suffix: 'm' },
  { filterName: 'Bluegreen Algae', key: 'algae', label: 'dashboard.blueGreenAlgae' },
];

const LIMIT = 100;

const formatDateTime = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  } catch (_) {
    return raw;
  }
};

// Normalize selectedBuoy to a list of ids, accepting:
//   array of {id, buoyName} | array of bare ids
//   single {id, buoyName} | single bare id/string
const normalizeBuoyIds = (selectedBuoy) => {
  if (!selectedBuoy) return [];
  const items = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];
  return items
    .map((item) => (item != null && typeof item === 'object' ? item.id : item))
    .filter((id) => id != null && id !== '');
};

const SortIcon = ({ columnKey, sortKey, sortDir }) => {
  if (sortKey !== columnKey) {
    return <ArrowUpDown size={14} className="text-white/40 flex-shrink-0" />;
  }
  return sortDir === 'asc'
    ? <ChevronUp size={14} className="text-[#1DCDDD] flex-shrink-0" />
    : <ChevronDown size={14} className="text-[#1DCDDD] flex-shrink-0" />;
};

const SensorDataTable = ({
  isMobile = false,
  selectedBuoy,
  selectedParams = [],
  selectedDuration = 'Last Day',
  startDate = null,
  endDate = null,
  isGraphAndTableView = false,
  isTablet = false
}) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Derive a stable list of buoy ids
  const buoyIds = useMemo(() => normalizeBuoyIds(selectedBuoy), [selectedBuoy]);
  const buoyIdsKey = buoyIds.join(',');

  useEffect(() => {
    setOffset(0);
    setSortKey(null);
    setSortDir('asc');
  }, [buoyIdsKey, selectedDuration, startDate, endDate]);

  useEffect(() => {
    if (buoyIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    // An explicit startDate/endDate (e.g. from ReportsPage) overrides the duration.
    const { from, to } = (startDate && endDate)
      ? { from: startDate, to: endDate }
      : durationToRange(selectedDuration);
    Promise.all(
      buoyIds.map((id) => getMqwSensorData({ buoyId: id, from, to, limit: LIMIT, offset }))
    )
      .then((results) => {
        const combined = results.flatMap((data) => (Array.isArray(data) ? data : []));
        setRows(combined);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [buoyIdsKey, offset, selectedDuration, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle column header click: toggle asc/desc for same key, reset to asc for new key
  const handleSort = (key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  };

  const activeParams = selectedParams && selectedParams.length > 0
    ? paramDefs.filter((def) => selectedParams.includes(def.filterName))
    : paramDefs;

  // Sort rows without mutating state
  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const dir = sortDir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      if (sortKey === '__datetime') {
        const aVal = new Date(a.observationTime ?? a.dateTime ?? 0).getTime();
        const bVal = new Date(b.observationTime ?? b.dateTime ?? 0).getTime();
        return (aVal - bVal) * dir;
      }
      if (sortKey === '__station') {
        const aVal = (a.station ?? a.buoyName ?? '').toLowerCase();
        const bVal = (b.station ?? b.buoyName ?? '').toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      }
      // Numeric parameter column
      const aRaw = a[sortKey];
      const bRaw = b[sortKey];
      const aNum = aRaw != null ? Number(aRaw) : NaN;
      const bNum = bRaw != null ? Number(bRaw) : NaN;
      const aValid = !isNaN(aNum);
      const bValid = !isNaN(bNum);
      if (aValid && bValid) return (aNum - bNum) * dir;
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    });
  }, [rows, sortKey, sortDir]);

  const rowHeightClass = isTablet ? 'h-[36px]' : (isGraphAndTableView ? 'h-[36px]' : 'h-[50px]');
  const cellPaddingClass = isTablet ? 'px-4 py-2' : (isGraphAndTableView ? 'px-4 py-1.5' : 'px-5 py-3');
  const textClass = isTablet ? 'text-[12px]' : 'text-[14px]';
  const headerBgClass = isGraphAndTableView ? 'backdrop-blur-md bg-[#1a4a4e]/40' : 'bg-transparent';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-white/50 text-[14px] font-semibold">Loading…</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-white/50 text-[14px] font-semibold">No sensor data available</span>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isGraphAndTableView ? 'overflow-hidden' : ''}`}>
      {isMobile && (
        <div className="flex flex-col gap-4 w-full">
          {sortedRows.map((row, index) => (
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
              <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">{t('analytics.dateTime')}</span>
                  <span className="text-[15px] font-semibold text-[#1DCDDD]">{formatDateTime(row.observationTime ?? row.dateTime)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-white/50 uppercase tracking-wide">{t('analytics.location', 'Location')}</span>
                  <span className="text-[15px] font-semibold text-white/90">{row.station ?? row.buoyName ?? '—'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {activeParams.map((param, idx) => {
                  const value = row[param.key] ?? '—';
                  const displayValue = param.suffix && value !== '—' ? `${value}${param.suffix}` : value;
                  return (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[12px] font-medium text-white/60">{t(param.label)}</span>
                      <span className="text-[16px] font-bold text-white/90">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isMobile && (
        <div className={`flex flex-1 flex-col min-h-0 ${isGraphAndTableView ? 'overflow-hidden' : ''}`}>
          <div
            className={`flex-1 overflow-auto custom-scrollbar relative ${isGraphAndTableView ? 'mb-0' : 'mb-4'}`}
          >
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(29, 205, 221, 0.2); border-radius: 10px; transition: all 0.3s ease; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(29, 205, 221, 0.4); }
            `}} />
            <table className="w-full border-collapse table-auto">
              <thead className="sticky top-0 z-50">
                <tr className={`border-b border-white/10 ${rowHeightClass} ${headerBgClass}`}>
                  <th
                    className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 left-0 z-30 w-[180px] min-w-[180px] border-b border-r border-white/10 cursor-pointer select-none`}
                    style={{ background: '#1C4B50' }}
                    onClick={() => handleSort('__datetime')}
                  >
                    <div className="flex items-center gap-2">
                      {t('analytics.dateTime')}
                      <SortIcon columnKey="__datetime" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>
                  <th
                    className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 left-[180px] z-30 w-[150px] min-w-[150px] border-b border-r border-white/10 cursor-pointer select-none`}
                    style={{ background: '#1C4B50' }}
                    onClick={() => handleSort('__station')}
                  >
                    <div className="flex items-center gap-2">
                      {t('analytics.location', 'Station Name')}
                      <SortIcon columnKey="__station" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>
                  {activeParams.map((param, idx) => (
                    <th
                      key={idx}
                      className={`${cellPaddingClass} text-white ${textClass} font-bold ltr:text-left rtl:text-right whitespace-nowrap leading-tight sticky top-0 z-20 border-b border-r border-white/10 cursor-pointer select-none`}
                      style={{ background: '#1C4B50' }}
                      onClick={() => handleSort(param.key)}
                    >
                      <div className="flex items-center gap-2">
                        {t(param.label)}
                        <SortIcon columnKey={param.key} sortKey={sortKey} sortDir={sortDir} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, index) => {
                  const dt = formatDateTime(row.observationTime ?? row.dateTime);
                  const station = row.station ?? row.buoyName ?? '—';
                  return (
                    <tr key={index} className={`border-b border-white/10 transition-colors ${rowHeightClass}`}>
                      <td
                        className={`${cellPaddingClass} text-white/90 ${textClass} font-bold whitespace-nowrap sticky left-0 z-10 w-[180px] min-w-[180px] border-b border-r border-white/10`}
                        style={{ background: '#1C4B50' }}
                      >
                        {isTablet && dt.includes(' ') ? (
                          <div className="flex flex-col leading-tight">
                            <span>{dt.split(' ')[0]}</span>
                            <span className="opacity-70 text-[10px] mt-0.5">{dt.split(' ')[1]}</span>
                          </div>
                        ) : dt}
                      </td>
                      <td
                        className={`${cellPaddingClass} text-white/90 ${textClass} font-bold whitespace-nowrap sticky left-[180px] z-10 w-[150px] min-w-[150px] border-b border-r border-white/10`}
                        style={{ background: '#1C4B50' }}
                      >
                        {station}
                      </td>
                      {activeParams.map((param, idx) => {
                        const value = row[param.key] ?? '—';
                        const displayValue = param.suffix && value !== '—' ? `${value}${param.suffix}` : value;
                        return (
                          <td key={idx} className={`${cellPaddingClass} text-white/90 ${textClass} whitespace-nowrap border-b border-r border-white/10`}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isGraphAndTableView && (
        <div className="flex justify-end items-center gap-2 mt-auto pt-6 pb-3">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
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
            onClick={() => setOffset(offset + LIMIT)}
            disabled={rows.length < LIMIT}
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
      )}

      {isTablet && (
        <div className="flex justify-center items-center py-2 mt-1 opacity-60">
          <ChevronLeft size={14} className="text-[#1DCDDD] animate-pulse" />
          <span className="text-[11px] text-white font-semibold tracking-widest uppercase mx-3">Swipe horizontally to view more table columns</span>
          <ChevronRight size={14} className="text-[#1DCDDD] animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SensorDataTable;
