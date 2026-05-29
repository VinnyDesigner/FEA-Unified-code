import React from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChartModal from './ChartModal';
import { getMqwSensorData, getMqwThresholds } from '../../../lib/queries';
import { durationToRange } from '../../../lib/duration';

// Map each chart parameter (paramDefs.key) to the MWQ ParameterMaster name used by
// /mwq/thresholds so the Buoys Analytics threshold line reads a real configured max.
const THRESHOLD_PARAM_NAME = {
  conductivity: 'Conductivity',
  temp: 'Temperature',
  salinity: 'Salinity',
  chlorophyll: 'Chlorophyll',
  oxygenSat: 'Oxygen Saturation',
  dissolvedOxygen: 'Dissolved Oxygen',
  turbidity: 'Turbidity',
  ph: 'pH',
  depth: 'Depth',
  algae: 'Algae',
};

// Max number of points plotted per series for readability.
const MAX_POINTS = 24;

// Color palette used as fallback so each buoy gets a distinct color (Buoys Analytics).
const BUOY_PALETTE = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#06B6D4', '#F43F5E', '#84CC16'];

// Format an ISO dateTime into an HH:MM label for the X axis.
const formatTimeLabel = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// Sort rows ascending by dateTime and cap to the last MAX_POINTS for readability.
const prepareRows = (rows) => {
  const arr = Array.isArray(rows) ? rows : [];
  const sorted = [...arr].sort((a, b) => new Date(a?.dateTime).getTime() - new Date(b?.dateTime).getTime());
  return sorted.slice(-MAX_POINTS);
};

const paramDefs = [
  { filterName: 'Specific Conductivity', key: 'conductivity', label: 'dashboard.specificConductivity', stroke: '#10B981', fillGrad: 'colorConductivity' },
  { filterName: 'Water Temperature', key: 'temp', label: 'dashboard.waterTemperature', stroke: '#F59E0B', fillGrad: 'colorWater' },
  { filterName: 'Salinity', key: 'salinity', label: 'dashboard.salinity', stroke: '#3B82F6', fillGrad: 'colorSalinity' },
  { filterName: 'Chlorophyll', key: 'chlorophyll', label: 'dashboard.chlorophyll', stroke: '#8B5CF6', fillGrad: 'colorChlorophyll' },
  { filterName: 'Oxygen Saturation', key: 'oxygenSat', label: 'analytics.oxygenSaturation', stroke: '#EC4899', fillGrad: 'colorOxygenSat' },
  { filterName: 'Dissolved Oxygen', key: 'dissolvedOxygen', label: 'dashboard.dissolvedOxygen', stroke: '#06B6D4', fillGrad: 'colorDissolvedOxygen' },
  { filterName: 'Turbidity', key: 'turbidity', label: 'dashboard.turbidity', stroke: '#F43F5E', fillGrad: 'colorTurbidity' },
  { filterName: 'pH', key: 'ph', label: 'dashboard.ph', stroke: '#84CC16', fillGrad: 'colorPh' },
  { filterName: 'Depth', key: 'depth', label: 'dashboard.depth', stroke: '#6366F1', fillGrad: 'colorDepth' },
  { filterName: 'Blue-Green Algae', key: 'algae', label: 'dashboard.blueGreenAlgae', stroke: '#1DCDDD', fillGrad: 'colorAlgae' },
  { filterName: 'Bluegreen Algae', key: 'algae', label: 'dashboard.blueGreenAlgae', stroke: '#1DCDDD', fillGrad: 'colorAlgae' }
];

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const lowerLabel = label ? label.toLowerCase() : '';
    const isMonth = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerLabel);
    const displayTitle = isMonth ? `${t(`analytics.months.${lowerLabel}`, label)} 2025` : label;
    return (
      <div 
        className="backdrop-blur-[20px] border border-white/10 p-5 rounded-[20px] shadow-2xl min-w-[220px]"
        style={{
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.65) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.3) 100%)',
        }}
      >
        <div className="flex flex-col gap-2 ltr:text-left rtl:text-right">
          <p className="text-[13px] font-bold text-white mb-1 border-b border-white/10 pb-1">
            {displayTitle}
          </p>
          {payload.map((item, index) => (
            <p key={index} className="text-[13px] text-white flex items-center justify-between gap-4">
              <span className="opacity-95 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.stroke || item.color }} />
                {item.name}:
              </span>
              <span className="font-bold opacity-90">{item.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const BuoysChart = ({ 
  isMobile = false, 
  showHeader = true, 
  selectedParams = [], 
  chartType = 'Line Chart', 
  selectedBuoy = null,
  selectedDuration = 'Last Day',
  startDate = null,
  endDate = null,
  height,
  isGraphAndTableView = false,
  isBuoysAnalytics = false,
  thresholdValue = false,
  isTablet = false
}) => {
  const { t } = useTranslation();
  const [expandedParam, setExpandedParam] = React.useState(null);
  // Real sensor rows fetched per buoy. Shape: [{ buoy: {id, buoyName}, rows: [...] }]
  const [buoySeries, setBuoySeries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  // Thresholds keyed by ParameterMaster name → numeric max (for the Buoys Analytics line).
  const [thresholdsByName, setThresholdsByName] = React.useState({});

  React.useEffect(() => {
    let cancelled = false;
    getMqwThresholds()
      .then((list) => {
        if (cancelled) return;
        const map = {};
        (Array.isArray(list) ? list : []).forEach((th) => {
          const max = th.max != null ? Number(th.max) : NaN;
          if (th.parameterName && !Number.isNaN(max)) map[th.parameterName] = max;
        });
        setThresholdsByName(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Resolve the configured threshold max for a chart parameter (or null if none).
  const thresholdForParam = (paramKey) => {
    const name = THRESHOLD_PARAM_NAME[paramKey];
    const v = name ? thresholdsByName[name] : undefined;
    return v != null && !Number.isNaN(v) ? v : null;
  };

  // Normalize selectedBuoy into an array of buoy objects { id, buoyName }.
  // Accepts: single object, array of objects, bare id (number/string), or array of ids.
  const normalizedBuoys = React.useMemo(() => {
    const raw = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];
    return raw
      .filter((b) => b !== null && b !== undefined && b !== '')
      .map((b) => {
        if (b && typeof b === 'object') {
          return { id: b.id ?? null, buoyName: b.buoyName ?? String(b.id ?? '') };
        }
        return { id: b, buoyName: String(b) };
      });
  }, [selectedBuoy]);

  // Stable key for the fetch effect: ids + duration.
  const buoyIdsKey = normalizedBuoys.map((b) => b.id ?? '').join(',');

  React.useEffect(() => {
    let cancelled = false;
    const buoysToFetch = normalizedBuoys.filter((b) => b.id !== null && b.id !== undefined && b.id !== '');

    // Guard against missing ids: resolve to empty without fetching (Promise keeps
    // state updates off the synchronous effect body).
    // An explicit startDate/endDate (e.g. from ReportsPage) overrides the duration.
    const { from, to } = (startDate && endDate)
      ? { from: startDate, to: endDate }
      : durationToRange(selectedDuration);
    const work = buoysToFetch.length === 0
      ? Promise.resolve([])
      : Promise.all(
          buoysToFetch.map((b) =>
            getMqwSensorData({ buoyId: b.id, from, to, limit: 100, offset: 0 })
              .then((data) => ({ buoy: b, rows: prepareRows(data) }))
              .catch(() => ({ buoy: b, rows: [] }))
          )
        );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(buoysToFetch.length > 0);
    work
      .then((results) => {
        if (!cancelled) setBuoySeries(results);
      })
      .catch(() => {
        if (!cancelled) setBuoySeries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoyIdsKey, selectedDuration, startDate, endDate]);

  const activeParams = selectedParams && selectedParams.length > 0
    ? paramDefs.filter(def => selectedParams.includes(def.filterName))
    : paramDefs.filter((def, index, self) => self.findIndex(d => d.key === def.key) === index);

  // deduplicate active parameters by unique key
  const uniqueActiveParams = activeParams.filter((def, index, self) => self.findIndex(d => d.key === def.key) === index);

  // Real sensor fields available from /mwq/sensor-data (after the PARAM_KEY_MAP fix,
  // conductivity/temp/algae also flow through, so the chart matches the table).
  const REAL_FIELDS = new Set(['salinity', 'ph', 'chlorophyll', 'oxygenSat', 'dissolvedOxygen', 'turbidity', 'depth', 'conductivity', 'temp', 'algae']);

  // Build recharts series data from the fetched real rows.
  const chartData = React.useMemo(() => {
    if (isBuoysAnalytics) {
      // Align by index across buoys into combined rows keyed `${param.key}_${buoyName}`.
      const maxLen = buoySeries.reduce((m, s) => Math.max(m, s.rows.length), 0);
      const out = [];
      for (let i = 0; i < maxLen; i += 1) {
        const row = {};
        // X label from the first buoy that has this index.
        const refRow = buoySeries.find((s) => s.rows[i])?.rows[i];
        row.month = formatTimeLabel(refRow?.dateTime);
        buoySeries.forEach((s) => {
          const r = s.rows[i];
          if (!r) return;
          uniqueActiveParams.forEach((param) => {
            if (!REAL_FIELDS.has(param.key)) return;
            const v = r[param.key];
            if (v !== null && v !== undefined && v !== '') {
              row[`${param.key}_${s.buoy.buoyName}`] = Number(v);
            }
          });
        });
        out.push(row);
      }
      return out;
    }

    // Live Data (single buoy): one row per measurement.
    const rows = buoySeries[0]?.rows ?? [];
    return rows.map((r) => {
      const row = { month: formatTimeLabel(r?.dateTime) };
      uniqueActiveParams.forEach((param) => {
        if (!REAL_FIELDS.has(param.key)) return;
        const v = r[param.key];
        if (v !== null && v !== undefined && v !== '') {
          row[param.key] = Number(v);
        }
      });
      return row;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoySeries, isBuoysAnalytics, uniqueActiveParams]);

  const hasData = chartData.length > 0;

  // Buoy NAME strings used by the series render + color map (Buoys Analytics).
  const activeBuoyNames = buoySeries.map((s) => s.buoy.buoyName);
  const buoyColorByName = {};
  activeBuoyNames.forEach((name, idx) => {
    buoyColorByName[name] = BUOY_PALETTE[idx % BUOY_PALETTE.length];
  });

  return (
    <div className={`w-full flex flex-col ${isMobile ? 'min-h-[420px]' : (isGraphAndTableView ? 'h-auto min-h-0' : 'h-full')}`}>
      {showHeader && (
        <div className="flex justify-between items-start mb-4">
          <h2 className={`text-[18px] font-bold text-white leading-tight ${isMobile ? 'max-w-[160px]' : ''}`}>
            {t('analytics.buoysOverview')}
          </h2>
          <button 
            className="flex items-center gap-2 px-6 py-2 text-[14px] transition-all hover:brightness-110 active:scale-95"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.30)',
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
              boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
              color: '#FFFFFF',
              fontWeight: '400',
              backdropFilter: 'blur(10px)'
            }}
          >
            {t('common.download')}
            <ChevronDown size={16} className="text-white/70" />
          </button>
        </div>
      )}

      {/* Chart Area */}
      {loading ? (
        <div className="w-full flex-1 min-h-[200px] flex items-center justify-center">
          <span className="text-white/60 text-[14px] animate-pulse">{t('common.loading', 'Loading…')}</span>
        </div>
      ) : !hasData ? (
        <div className="w-full flex-1 min-h-[200px] flex items-center justify-center">
          <span className="text-white/50 text-[14px]">{t('analytics.noSensorData', 'No sensor data available')}</span>
        </div>
      ) : isBuoysAnalytics ? (() => {
        const scrollContainerHeightClass = isMobile
          ? "max-h-[500px]"
          : (isGraphAndTableView 
              ? (uniqueActiveParams.length > 1 ? "max-h-[220px]" : "max-h-[200px]") 
              : "max-h-[500px]"
            );

        // Color keyed off the real buoyName values, palette fallback by index.
        const getBuoyColor = (buoy) => buoyColorByName[buoy] || '#1DCDDD';

        // Series iterate over the real buoy NAME strings (legend shows buoyName).
        const activeBuoys = activeBuoyNames;

        return (
          <>
          <div className={`w-full grid grid-cols-1 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6 overflow-y-auto pr-1 panel-chart-scrollbar ${scrollContainerHeightClass}`}>
            {uniqueActiveParams.map((param) => {
              const chartHeight = isMobile
                ? 200
                : (isGraphAndTableView 
                    ? (uniqueActiveParams.length > 1 ? 160 : 140) 
                    : 220
                  );

              const renderDefs = () => (
                <defs>
                  {activeBuoys.map(buoy => {
                    const color = getBuoyColor(buoy);
                    const gradId = `grad_${buoy.replace(/\s+/g, '')}`;
                    return (
                      <linearGradient key={buoy} id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    );
                  })}
                </defs>
              );

              const renderSeries = () => {
                if (chartType === 'Bar Chart') {
                  return activeBuoys.map((buoy) => (
                    <Bar 
                      key={buoy}
                      dataKey={`${param.key}_${buoy}`} 
                      name={buoy}
                      fill={getBuoyColor(buoy)}
                      radius={[4, 4, 0, 0]}
                    />
                  ));
                }
                if (chartType === 'Scatter Chart') {
                  return activeBuoys.map((buoy) => (
                    <Line 
                      key={buoy}
                      type="monotone" 
                      dataKey={`${param.key}_${buoy}`} 
                      name={buoy}
                      stroke="transparent" 
                      strokeWidth={0}
                      dot={{ r: 6, fill: getBuoyColor(buoy), stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 8, fill: getBuoyColor(buoy), stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  ));
                }
                // Default Area
                return activeBuoys.map((buoy) => {
                  const color = getBuoyColor(buoy);
                  const gradId = `grad_${buoy.replace(/\s+/g, '')}`;
                  return (
                    <Area 
                      key={buoy}
                      type="monotone" 
                      dataKey={`${param.key}_${buoy}`} 
                      name={buoy}
                      stroke={color} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill={`url(#${gradId})`} 
                      dot={{ r: 4, fill: '#ffffff', stroke: color, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#ffffff', stroke: color, strokeWidth: 2 }}
                    />
                  );
                });
              };

              const isOnlyOne = uniqueActiveParams.length === 1;

              return (
                <div 
                  key={param.key} 
                  className={`w-full flex flex-col p-4 relative ${isOnlyOne ? 'md:col-span-2' : ''}`}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.08) 100%)',
                  }}
                >
                  {/* Parameter Title */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-white text-[14px] font-bold tracking-wide">
                      {t(param.label)} Overview
                    </span>
                    <button 
                      onClick={() => setExpandedParam(param)}
                      className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                      title="Expand Chart"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>

                  {/* Chart container */}
                  <div style={{ width: '100%', height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                        if (chartType === 'Bar Chart') {
                          return (
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                              <XAxis 
                                dataKey="month" 
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => {
                                  const lowerVal = value ? value.toLowerCase() : '';
                                  if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                                    return t(`analytics.months.${lowerVal}`, value);
                                  }
                                  return value;
                                }}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                                dy={5}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                              />
                              <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                                content={<CustomTooltip />} 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                              />
                              {thresholdValue && thresholdForParam(param.key) != null && (
                                <ReferenceLine
                                  y={thresholdForParam(param.key)}
                                  stroke="#EF4444"
                                  strokeDasharray="4 4"
                                  label={{ value: t('analytics.thresholdLimit', 'Threshold Limit'), fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                                />
                              )}
                              {renderSeries()}
                              <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                height={24} 
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => <span className="text-white/80 font-medium ml-1.5 text-[11px]">{value}</span>}
                                wrapperStyle={{ paddingTop: '10px' }}
                              />
                            </BarChart>
                          );
                        }
                        if (chartType === 'Scatter Chart') {
                          return (
                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                              <XAxis 
                                dataKey="month" 
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => {
                                  const lowerVal = value ? value.toLowerCase() : '';
                                  if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                                    return t(`analytics.months.${lowerVal}`, value);
                                  }
                                  return value;
                                }}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                                dy={5}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                              />
                              <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                                content={<CustomTooltip />} 
                                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                              />
                              {thresholdValue && thresholdForParam(param.key) != null && (
                                <ReferenceLine
                                  y={thresholdForParam(param.key)}
                                  stroke="#EF4444"
                                  strokeDasharray="4 4"
                                  label={{ value: t('analytics.thresholdLimit', 'Threshold Limit'), fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                                />
                              )}
                              {renderSeries()}
                              <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                height={24} 
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => <span className="text-white/80 font-medium ml-1.5 text-[11px]">{value}</span>}
                                wrapperStyle={{ paddingTop: '10px' }}
                              />
                            </LineChart>
                          );
                        }
                        return (
                          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                            {renderDefs()}
                            <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                            <XAxis 
                              dataKey="month" 
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) => {
                                const lowerVal = value ? value.toLowerCase() : '';
                                if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                                  return t(`analytics.months.${lowerVal}`, value);
                                }
                                  return value;
                              }}
                              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                              dy={5}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                            />
                            <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                              content={<CustomTooltip />} 
                              cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                            />
                            {thresholdValue && thresholdForParam(param.key) != null && (
                              <ReferenceLine
                                y={thresholdForParam(param.key)}
                                stroke="#EF4444"
                                strokeDasharray="4 4"
                                label={{ value: t('analytics.thresholdLimit', 'Threshold Limit'), fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                              />
                            )}
                            {renderSeries()}
                            <Legend 
                              verticalAlign="bottom" 
                              align="center"
                              height={24} 
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => <span className="text-white/80 font-medium ml-1.5 text-[11px]">{value}</span>}
                              wrapperStyle={{ paddingTop: '10px' }}
                            />
                          </AreaChart>
                        );
                      })()}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet Vertical Scrolling Clue */}
          {isTablet && uniqueActiveParams.length > 2 && (
            <div className="flex justify-center items-center py-2 mt-2 opacity-60">
              <ChevronDown size={14} className="text-[#1DCDDD] animate-pulse" />
              <span className="text-[11px] text-white font-semibold tracking-widest uppercase mx-3">Swipe vertically to view more graphs</span>
              <ChevronDown size={14} className="text-[#1DCDDD] animate-pulse" />
            </div>
          )}
          </>
        );
      })() : (
        <div className={`w-full flex flex-col relative group ${isMobile ? 'min-h-[340px]' : ''}`}>
          {/* Mobile-only: Header with title and Maximize button */}
          {isMobile && !isBuoysAnalytics && (
            <div className="flex justify-between items-center mb-3 flex-shrink-0 px-1">
              <h3 className="text-[13px] font-bold text-white/95 tracking-tight">
                {t('analytics.liveData', 'Live Data')} Graph
              </h3>
              <button
                onClick={() => setExpandedParam({
                  filterName: 'Specific Conductivity',
                  label: 'dashboard.specificConductivity',
                  key: 'conductivity'
                })}
                className="text-white/70 hover:text-white transition-all p-1.5 bg-white/10 hover:bg-white/20 rounded-lg shadow-sm border border-white/10 cursor-pointer flex items-center justify-center"
                title="Full Screen View"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          )}

          {/* Floating Maximize Button (Desktop only) */}
          {!isMobile && !isBuoysAnalytics && (
            <div className="absolute top-2 right-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setExpandedParam({
                  filterName: 'Specific Conductivity',
                  label: 'dashboard.specificConductivity',
                  key: 'conductivity'
                })}
                className="p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center"
                title="Full Screen View"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          )}

          <div 
            className={isMobile ? 'w-full h-[260px]' : (height ? 'w-full' : 'w-full h-[300px]')}
            style={!isMobile && height ? { height } : undefined}
          >
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              if (chartType === 'Bar Chart') {
                return (
                  <BarChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 15 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        const lowerVal = value ? value.toLowerCase() : '';
                        if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                          return t(`analytics.months.${lowerVal}`, value);
                        }
                        return value;
                      }}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                      content={<CustomTooltip />} 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    />
                    {uniqueActiveParams.map((param, idx) => (
                      <Bar 
                        key={idx}
                        dataKey={param.key} 
                        name={t(param.label)}
                        fill={param.stroke}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                );
              }

              if (chartType === 'Scatter Chart') {
                return (
                  <LineChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 15 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        const lowerVal = value ? value.toLowerCase() : '';
                        if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                          return t(`analytics.months.${lowerVal}`, value);
                        }
                        return value;
                      }}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                    />
                    {uniqueActiveParams.map((param, idx) => (
                      <Line 
                        key={idx}
                        type="monotone" 
                        dataKey={param.key} 
                        name={t(param.label)}
                        stroke="transparent" 
                        strokeWidth={0}
                        dot={{ r: 6, fill: param.stroke, stroke: '#ffffff', strokeWidth: 1.5 }}
                        activeDot={{ r: 8, fill: param.stroke, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                );
              }

              // Default: Line/Area Chart
              return (
                <AreaChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 15 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorConductivity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorSalinity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorChlorophyll" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorOxygenSat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EC4899" stopOpacity={0.4}/><stop offset="95%" stopColor="#EC4899" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorDissolvedOxygen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/><stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorTurbidity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/><stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#84CC16" stopOpacity={0.4}/><stop offset="95%" stopColor="#84CC16" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/><stop offset="95%" stopColor="#6366F1" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorAlgae" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1DCDDD" stopOpacity={0.4}/><stop offset="95%" stopColor="#1DCDDD" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={true} stroke="#CACBCE" strokeWidth={1} strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const lowerVal = value ? value.toLowerCase() : '';
                      if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
                        return t(`analytics.months.${lowerVal}`, value);
                      }
                      return value;
                    }}
                    tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                  />
                  <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                  />
                  {uniqueActiveParams.map((param, idx) => (
                    <Area 
                      key={idx}
                      type="monotone" 
                      dataKey={param.key} 
                      name={t(param.label)}
                      stroke={param.stroke} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill={`url(#${param.fillGrad})`} 
                      dot={{ r: 4, fill: '#ffffff', stroke: param.stroke, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#ffffff', stroke: param.stroke, strokeWidth: 2 }}
                    />
                  ))}
                </AreaChart>
              );
            })()}
          </ResponsiveContainer>
        </div>

        {isMobile && !isBuoysAnalytics && (
          <div 
            className="mt-4 p-4 flex flex-col gap-2.5"
            style={{
              borderRadius: '20px',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.12) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: 'inset 2px 2px 3px rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
              {uniqueActiveParams.map((param, idx) => (
                <div key={idx} className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ background: param.stroke }} 
                  />
                  <span className="text-[12px] text-white/90 font-medium truncate leading-tight">
                    {t(param.label)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

      {/* Desktop-only: Custom Legend + Divider */}
      {!isMobile && !isBuoysAnalytics && (
        <>
          <div className={`flex flex-wrap items-center justify-center ${isGraphAndTableView ? 'gap-4 pt-1.5 pb-1.5' : 'gap-6 pt-3 pb-3'}`}>
            {uniqueActiveParams.map((param, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: param.stroke }} />
                <span className="text-[13px] text-white/80 font-medium">{t(param.label)}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </>
      )}

      {/* Expand Modal overlay */}
      {expandedParam && createPortal(
        <ChartModal
          isOpen={!!expandedParam}
          onClose={() => setExpandedParam(null)}
          metric={expandedParam.filterName}
          translatedMetricTitle={isBuoysAnalytics ? t(expandedParam.label) : activeBuoyNames.join(', ')}
          selectedBuoy={{ name: activeBuoyNames.join(', ') }}
          customData={chartData}
          series={isBuoysAnalytics ? (
            activeBuoyNames.map((buoy) => ({
              key: `${expandedParam.key}_${buoy}`,
              name: buoy,
              color: buoyColorByName[buoy] || '#1DCDDD'
            }))
          ) : (
            uniqueActiveParams.map(param => ({
              key: param.key,
              name: t(param.label),
              color: param.stroke
            }))
          )}
          xAxisKey="month"
        />,
        document.body
      )}
    </div>
  );
};

export default BuoysChart;
