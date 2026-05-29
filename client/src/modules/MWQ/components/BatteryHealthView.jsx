import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getMqwBatteryHealth } from '../../../lib/queries';
import { durationToRange } from '../../../lib/duration';

const CHART_COLORS = ['#EF4444', '#A855F7', '#10B981', '#F59E0B'];

const CircularBarometer = ({ label, value = 0 }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-6 relative overflow-hidden flex-shrink-0 animate-fadeIn"
      style={{
        borderRadius: '22px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(2, 2, 2, 0.06)',
        backdropFilter: 'blur(10px)',
        width: '100%',
        height: '100%',
        minHeight: '240px'
      }}
    >
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <path d="M 30.3 89.7 A 42 42 0 0 1 30.3 30.3" fill="none" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
          <path d="M 30.3 30.3 A 42 42 0 0 1 89.7 30.3" fill="none" stroke="#F59E0B" strokeWidth="5" />
          <path d="M 89.7 30.3 A 42 42 0 0 1 89.7 89.7" fill="none" stroke="#10B981" strokeWidth="5" strokeLinecap="round" />
          {[...Array(15)].map((_, i) => {
            const angle = 135 + (i * 19.2);
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + 44 * Math.cos(rad);
            const y1 = 60 + 44 * Math.sin(rad);
            const x2 = 60 + 48 * Math.cos(rad);
            const y2 = 60 + 48 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />;
          })}
          {[{ label: '0', val: 0 }, { label: '4', val: 4 }, { label: '8', val: 8 }, { label: '10', val: 10 }, { label: '12', val: 12 }, { label: '14', val: 14 }].map((item, idx) => {
            const angle = 135 + (item.val * 19.2);
            const rad = (angle * Math.PI) / 180;
            const tx = 60 + 34 * Math.cos(rad);
            const ty = 60 + 34 * Math.sin(rad);
            return (
              <text key={idx} x={tx} y={ty} fill="rgba(255,255,255,0.6)" fontSize="6.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                {item.label}
              </text>
            );
          })}
          <polygon points="60,60 57,60 60,20 63,60" fill="#FFFFFF" transform="rotate(130, 60, 60)" />
          <circle cx="60" cy="60" r="4.5" fill="#FFFFFF" />
          <circle cx="60" cy="60" r="2" fill="#000000" />
        </svg>
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-[28px] font-black text-white leading-none">{value != null ? Number(value).toFixed(1) : '—'}</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[15px] font-bold text-white block leading-tight">{label}</span>
        <span className="text-[11px] text-white/50 uppercase tracking-wider block mt-0.5">Battery Voltage</span>
      </div>
    </div>
  );
};

const BatteryHealthView = ({ isMobile = false, selectedBuoy, selectedDuration = 'Last Day' }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = durationToRange(selectedDuration);
    getMqwBatteryHealth({ buoyId: selectedBuoy?.id ?? selectedBuoy, from, to })
      .then((data) => {
        if (!data || !Array.isArray(data)) { setGroups([]); return; }
        const byBuoy = {};
        data.forEach((item) => {
          const name = item.buoyName ?? item.station ?? 'Unknown';
          if (!byBuoy[name]) byBuoy[name] = [];
          byBuoy[name].push(item);
        });
        setGroups(Object.entries(byBuoy).map(([name, series], i) => ({ name, series, color: CHART_COLORS[i % CHART_COLORS.length] })));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [selectedBuoy?.id ?? selectedBuoy, selectedDuration]);

  const formatTick = (raw) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch (_) { return raw; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/50 text-[14px] font-semibold">Loading battery data…</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/50 text-[14px] font-semibold">No battery health data available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto analytics-panel-scroll">
      {groups.map(({ name, series, color }, idx) => {
        const currentVoltage = series.length > 0 ? series[series.length - 1].volt : null;
        const chartData = series.map((item) => ({
          time: item.observationTime ?? item.time,
          volt: item.volt != null ? Number(item.volt) : null,
        }));
        return (
          <div key={idx} className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row'} w-full animate-fadeIn${idx === groups.length - 1 ? ' pb-6' : ''}`}>
            <div
              className={`${isMobile ? 'w-full p-4' : 'w-[70%] p-6'} flex flex-col min-h-[240px]`}
              style={{
                borderRadius: '22px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-[16px] font-bold">{name} Battery Health</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="w-3 h-1.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] font-bold text-white/80">Batt Volt Min</span>
                </div>
              </div>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(tick, i) => (i === 0 || i === chartData.length - 1) ? formatTick(tick) : ''}
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0, 22, 26, 0.85)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volt"
                      stroke={color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#FFFFFF', stroke: color, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`${isMobile ? 'w-full' : 'w-[30%] pl-6'} flex flex-col`}>
              <CircularBarometer label={name} value={currentVoltage} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BatteryHealthView;
