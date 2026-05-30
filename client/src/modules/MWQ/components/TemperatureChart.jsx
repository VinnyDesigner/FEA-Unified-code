import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Maximize2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChartModal from './ChartModal';
import { getMqwSensorData, getMqwWeatherHistory } from '../../../lib/queries';
import { durationToRange } from '../../../lib/duration';

// Dropdown labels → duration labels understood by durationToRange().
const DATE_RANGE_TO_DURATION = {
  'Last 24 Hours': 'Last Day',
  'Last 7 Days': 'Last Week',
  'Last 30 Days': 'Last Month',
};

// Sonde metric label → real sensor-data field name (numeric strings on the API).
const SONDE_METRIC_FIELD = {
  'Water Temperature (°c)': 'temp',
  'Salinity (ppt)': 'salinity',
  'Chlorophyll (ug)': 'chlorophyll',
  'Dissolved Oxygen (mg/l)': 'dissolvedOxygen',
  'pH': 'ph',
  'Turbidity (NTU)': 'turbidity',
  'Blue-Green Algae (ug)': 'algae',
  'Depth(m)': 'depth',
  'Specific Conductivity(uS)': 'conductivity',
};

// Weather metric label → real weather field name (from /mwq/weather).
const WEATHER_METRIC_FIELD = {
  'Air Temperature (°c)': 'airTemp',
  'Relative Humidity (%)': 'humidity',
  'AWS (m/s)': 'windSpeed',
  'AWD (Degree)': 'windDirection',
  'Wind Gust (Wind Gust)': 'windGust',
  'Pressure (bar)': 'pressure',
};

const num = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// Build a { time, hour, fullLabel, value } point from a real API row for the
// given metric field. Returns null when the field is missing/non-numeric.
const rowToPoint = (row, field, locale) => {
  const value = num(row[field]);
  if (value == null) return null;
  const d = new Date(row.dateTime);
  const validDate = !Number.isNaN(d.getTime());
  const time = validDate ? d.toLocaleDateString(locale) : (row.dateTime || '');
  const hour = validDate ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
  return {
    time,
    hour,
    label: `${time},\n${hour}`,
    fullLabel: `${time} ${hour}`.trim(),
    value,
  };
};

const CustomYAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={-35} 
        y={4} 
        textAnchor="start" 
        fill="#6B7280" 
        fontSize={10} 
        fontWeight="400"
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const parts = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={12} dy={0} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight="400">
        {parts[0]}
      </text>
      <text x={0} y={22} dy={0} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight="500">
        {parts[1]}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, selectedMetric }) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div 
        className="backdrop-blur-[20px] border border-white/10 p-5 rounded-[20px] shadow-2xl min-w-[220px]"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        <div className="flex flex-col gap-1.5 ltr:text-left rtl:text-right">
          <p className="text-[13px] text-[#072227]">
            <span className="font-bold opacity-90">{t('analytics.parameters')} :</span> <span className="opacity-80">{selectedMetric?.split('(')[0].trim() || 'Temperature'}</span>
          </p>
          <p className="text-[13px] text-[#072227]">
            <span className="font-bold opacity-90">{t('analytics.station')} :</span> <span className="opacity-80">{t('analytics.stationName')}</span>
          </p>
          <p className="text-[13px] text-[#072227]">
            <span className="font-bold opacity-90">{t('analytics.details')} :</span> <span className="opacity-80">{payload[0].value.toFixed(2)}</span>
          </p>
          <p className="text-[13px] text-[#072227]">
            <span className="font-bold opacity-90">{t('analytics.dateTime')} :</span> <span className="opacity-80">{label.replace('\\n', ' ')}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const sondeMetrics = [
  'Water Temperature (°c)',
  'Salinity (ppt)',
  'Chlorophyll (ug)',
  'Dissolved Oxygen (mg/l)',
  'pH',
  'Turbidity (NTU)',
  'Blue-Green Algae (ug)',
  'Depth(m)',
  'Specific Conductivity(uS)'
];

const weatherMetrics = [
  'Air Temperature (°c)',
  'Relative Humidity (%)',
  'AWS (m/s)',
  'AWD (Degree)',
  'Wind Gust (Wind Gust)',
  'Pressure (bar)'
];

const DateRangeDropdown = ({ selectedDateRange, setSelectedDateRange, customRange, setCustomRange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(customRange?.from ?? '');
  const [draftTo, setDraftTo] = useState(customRange?.to ?? '');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateDropdownPos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX - 60
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos);
      window.addEventListener('resize', updateDropdownPos);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPos);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isOpen, updateDropdownPos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          btnRef.current && !btnRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dateRanges = ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Custom Range'];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1 bg-white/60 hover:bg-white/85 rounded-lg border border-white/40 text-[#072227] text-[11px] font-bold shadow-sm transition-all outline-none cursor-pointer"
      >
        <span>{selectedDateRange || 'Last 24 Hours'}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-[#072227]/70`} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] p-4 flex flex-col gap-3.5"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            minWidth: '170px',
            borderRadius: '21px',
            border: '1px solid rgba(0, 0, 0, 0.10)',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%), radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.24) 100%)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
          }}
        >
          {dateRanges.map((range) => (
            <button
              key={range}
              className={`text-left text-[14px] font-bold transition-colors outline-none cursor-pointer whitespace-nowrap ${
                (selectedDateRange || 'Last 24 Hours') === range 
                  ? 'text-[#1DCDDD]' 
                  : 'text-white hover:text-[#1DCDDD]'
              }`}
              onClick={() => {
                if (setSelectedDateRange) setSelectedDateRange(range);
                if (range !== 'Custom Range') {
                  setIsOpen(false);
                }
              }}
            >
              {range}
            </button>
          ))}
          {selectedDateRange === 'Custom Range' && (
            <div className="border-t border-white/10 mt-1 pt-2 flex flex-col gap-1.5">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] text-white/60">From</label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] text-white/60">To</label>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <button
                onClick={() => {
                  if (setCustomRange && draftFrom && draftTo) {
                    setCustomRange({ from: draftFrom, to: draftTo });
                  }
                  setIsOpen(false);
                }}
                className="mt-1 bg-[#009FAC] hover:bg-[#00b4c4] text-white py-1 rounded-lg text-xs font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const TemperatureChart = ({ activeTab, selectedBuoy, selectedMetric, setSelectedMetric, isMobile = false, selectedDateRange, setSelectedDateRange }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n?.language === 'ar';
  const isWeather = activeTab === 'Weather';
  const metrics = isWeather ? weatherMetrics : sondeMetrics;
  const locale = i18n?.language === 'ar' ? 'ar-AE' : 'en-US';

  const containerRef = useRef(null);
  const chartRefs = useRef({});
  const isScrollingRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalMetric, setActiveModalMetric] = useState(null);

  // Custom Range window (set from the dropdown's date inputs).
  const [customRange, setCustomRange] = useState(null);

  // Real rows fetched for the active buoy + tab + window.
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Resolve the fetch window from the selected dropdown range (or custom dates).
  const range = useMemo(() => {
    if (selectedDateRange === 'Custom Range' && customRange?.from && customRange?.to) {
      return {
        from: new Date(customRange.from).toISOString(),
        to: new Date(`${customRange.to}T23:59:59`).toISOString(),
      };
    }
    return durationToRange(DATE_RANGE_TO_DURATION[selectedDateRange] ?? 'Last Day');
  }, [selectedDateRange, customRange]);

  // Fetch REAL data whenever the buoy, tab, or window changes.
  useEffect(() => {
    const buoyId = selectedBuoy?.id;
    if (!buoyId) {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const fetcher = isWeather
      ? getMqwWeatherHistory({ buoyId, from: range.from, to: range.to }, { signal: controller.signal })
      : getMqwSensorData({ buoyId, from: range.from, to: range.to }, { signal: controller.signal });
    fetcher
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => { /* keep stale rows on abort/error */ })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedBuoy?.id, isWeather, range.from, range.to]);

  // Build the chart series for a metric from the real rows.
  const getMetricData = (metric) => {
    const field = isWeather ? WEATHER_METRIC_FIELD[metric] : SONDE_METRIC_FIELD[metric];
    if (!field) return [];
    return rows
      .map((row) => rowToPoint(row, field, locale))
      .filter(Boolean);
  };

  const metricKeyMap = {
    'Water Temperature (°c)': 'dashboard.waterTemperature',
    'Salinity (ppt)': 'dashboard.salinity',
    'Chlorophyll (ug)': 'dashboard.chlorophyll',
    'Dissolved Oxygen (mg/l)': 'dashboard.dissolvedOxygen',
    'pH': 'dashboard.ph',
    'Turbidity (NTU)': 'dashboard.turbidity',
    'Blue-Green Algae (ug)': 'dashboard.blueGreenAlgae',
    'Depth(m)': 'dashboard.depth',
    'Specific Conductivity(uS)': 'dashboard.specificConductivity',
    'Air Temperature (°c)': 'dashboard.airTemperature',
    'Relative Humidity (%)': 'dashboard.relativeHumidity',
    'AWS (m/s)': 'dashboard.aws',
    'AWD (Degree)': 'dashboard.awd',
    'Wind Gust (Wind Gust)': 'dashboard.windGust',
    'Pressure (bar)': 'dashboard.pressure'
  };

  // Track which metric the IntersectionObserver last set — prevents scroll loop
  const observerSetRef = useRef(null);

  // Smooth scroll helper — must be defined BEFORE the useEffects that call it
  const smoothScrollTo = (targetY, duration) => {
    const container = containerRef.current;
    if (!container) return;

    isScrollingRef.current = true;

    const startY = container.scrollTop;
    const distance = targetY - startY;
    let startTime = null;

    const animation = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      // Easing: easeInOutQuad
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      container.scrollTop = startY + distance * ease;
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        isScrollingRef.current = false;
      }
    };
    requestAnimationFrame(animation);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        // Pick the entry with the highest intersection ratio
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) {
          const metric = best.target.getAttribute('data-metric');
          if (metric && setSelectedMetric) {
            observerSetRef.current = metric;
            setSelectedMetric(metric);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.3, 0.6]
      }
    );

    const elements = Object.values(chartRefs.current);
    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [metrics, setSelectedMetric]);

  // When selectedMetric changes externally (card click), scroll to that chart
  useEffect(() => {
    if (!selectedMetric) return;
    // Skip if this change was triggered by the observer itself
    if (observerSetRef.current === selectedMetric) return;
    const el = chartRefs.current[selectedMetric];
    const container = containerRef.current;
    if (el && container) {
      const targetY = el.offsetTop - container.offsetTop;
      smoothScrollTo(targetY, 500);
    }
  }, [selectedMetric]); // eslint-disable-line

  // Render ALL metrics scrollably as requested by the user
  const displayMetrics = metrics;

  return (
    <div 
      className="flex flex-col relative h-full"
      style={{
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        background: 'rgba(255, 255, 255, 0.60)',
        boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.40) inset',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Hide scrollbars but keep native snap scrolling behavior */}
      <style>{`
        .charts-snap-container::-webkit-scrollbar { display: none; }
        .charts-snap-container { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Scrollable snapping container */}
      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto charts-snap-container"
        style={{ 
          padding: 0,
          height: '100%',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {displayMetrics.map((metric, idx) => {
          const currentData = getMetricData(metric);
          const translatedTitle = metricKeyMap[metric] ? t(metricKeyMap[metric]) : metric;
          const gradId = `chartGrad_${idx}`;
          const hasData = currentData.length > 0;

          return (
            <div
              key={metric}
              ref={(el) => (chartRefs.current[metric] = el)}
              data-metric={metric}
              className="flex flex-col justify-between"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                padding: isMobile ? '12px 12px' : '16px 20px',
                boxSizing: 'border-box'
              }}
            >
              {/* Chart header */}
              <div className="flex justify-between items-center mb-2.5 flex-shrink-0">
                <h3
                  className={`${
                    isMobile ? 'text-[13px]' : 'text-[14px]'
                  } font-bold tracking-tight`}
                  style={{ color: '#000000' }}
                >
                  {translatedTitle}
                </h3>
                <div className="flex items-center gap-2">
                  <DateRangeDropdown
                    selectedDateRange={selectedDateRange}
                    setSelectedDateRange={setSelectedDateRange}
                    customRange={customRange}
                    setCustomRange={setCustomRange}
                  />
                  <button
                    onClick={() => {
                      setActiveModalMetric(metric);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-[#009FAC] transition-all p-1.5 bg-white/60 rounded-lg shadow-sm border border-white/40 cursor-pointer"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>

              {/* Chart body - stretches to utilize 100% of remaining vertical layout */}
              <div className="flex-1 min-h-0 relative" style={{ width: '100%' }}>
                {loading && !hasData ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-400 font-medium">
                    {t('common.loading', 'Loading…')}
                  </div>
                ) : !hasData ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-400 font-medium">
                    {t('common.noData', 'No data available')}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData} margin={{ top: 6, right: 12, left: -20, bottom: 6 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1DCDDD" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1DCDDD" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(0,0,0,0.07)" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      interval={Math.max(0, Math.ceil(currentData.length / 8) - 1)}
                      height={32}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)', fontWeight: 500 }}
                      domain={['auto', 'auto']}
                      width={42}
                    />
                    <Tooltip
                      content={<CustomTooltip selectedMetric={metric} />}
                      cursor={{ stroke: 'rgba(0,159,172,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#009FAC"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#${gradId})`}
                      dot={{ r: 3, fill: '#ffffff', stroke: '#009FAC', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#ffffff', stroke: '#009FAC', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>{/* end scroll container */}

      {isModalOpen && createPortal(
        <ChartModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          metric={activeModalMetric}
          translatedMetricTitle={metricKeyMap[activeModalMetric] ? t(metricKeyMap[activeModalMetric]) : activeModalMetric}
          selectedBuoy={selectedBuoy}
          customData={getMetricData(activeModalMetric)}
          series={[{ key: 'value', name: metricKeyMap[activeModalMetric] ? t(metricKeyMap[activeModalMetric]) : activeModalMetric, color: '#009FAC' }]}
          xAxisKey="fullLabel"
        />,
        document.body
      )}
    </div>
  );
};

export default TemperatureChart;
