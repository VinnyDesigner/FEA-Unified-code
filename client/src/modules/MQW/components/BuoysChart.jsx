import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const dayData = [
  { month: '09:00', conductivity: 4000, temp: 3500, salinity: 3000, chlorophyll: 4500, oxygenSat: 6000, dissolvedOxygen: 5000, turbidity: 4200, ph: 3800, depth: 2500, algae: 2000 },
  { month: '11:00', conductivity: 7500, temp: 6200, salinity: 5800, chlorophyll: 7200, oxygenSat: 9000, dissolvedOxygen: 8500, turbidity: 7000, ph: 6000, depth: 4500, algae: 3900 },
  { month: '13:00', conductivity: 5200, temp: 4600, salinity: 4100, chlorophyll: 5500, oxygenSat: 7200, dissolvedOxygen: 6800, turbidity: 5300, ph: 4800, depth: 3200, algae: 2800 },
  { month: '15:00', conductivity: 10500, temp: 8400, salinity: 7800, chlorophyll: 9500, oxygenSat: 12000, dissolvedOxygen: 11000, turbidity: 9800, ph: 8200, depth: 6400, algae: 5200 },
  { month: '17:00', conductivity: 8200, temp: 6500, salinity: 5900, chlorophyll: 7800, oxygenSat: 10000, dissolvedOxygen: 9200, turbidity: 8000, ph: 7100, depth: 5100, algae: 4200 },
  { month: '19:00', conductivity: 16000, temp: 15000, salinity: 14000, chlorophyll: 13500, oxygenSat: 15500, dissolvedOxygen: 14500, turbidity: 13000, ph: 12500, depth: 11000, algae: 9200 },
  { month: '21:00', conductivity: 13500, temp: 11500, salinity: 10500, chlorophyll: 11000, oxygenSat: 13800, dissolvedOxygen: 12500, turbidity: 12000, ph: 11200, depth: 9500, algae: 7200 },
];

const weekData = [
  { month: 'Mon', conductivity: 3800, temp: 3400, salinity: 2900, chlorophyll: 4200, oxygenSat: 5800, dissolvedOxygen: 4900, turbidity: 4000, ph: 3700, depth: 2400, algae: 1900 },
  { month: 'Tue', conductivity: 7100, temp: 5900, salinity: 5500, chlorophyll: 6800, oxygenSat: 8500, dissolvedOxygen: 8100, turbidity: 6600, ph: 5700, depth: 4200, algae: 3600 },
  { month: 'Wed', conductivity: 5500, temp: 4800, salinity: 4300, chlorophyll: 5800, oxygenSat: 7500, dissolvedOxygen: 7100, turbidity: 5600, ph: 5000, depth: 3400, algae: 3000 },
  { month: 'Thu', conductivity: 9800, temp: 7900, salinity: 7300, chlorophyll: 8800, oxygenSat: 11200, dissolvedOxygen: 10200, turbidity: 9100, ph: 7600, depth: 5900, algae: 4800 },
  { month: 'Fri', conductivity: 8900, temp: 7100, salinity: 6500, chlorophyll: 8100, opacity: 10500, oxygenSat: 10500, dissolvedOxygen: 9700, turbidity: 8500, ph: 7500, depth: 5500, algae: 4500 },
  { month: 'Sat', conductivity: 17500, temp: 16500, salinity: 15500, chlorophyll: 15000, oxygenSat: 17000, dissolvedOxygen: 16000, turbidity: 14500, ph: 14000, depth: 12500, algae: 10500 },
  { month: 'Sun', conductivity: 14200, temp: 12200, salinity: 11200, chlorophyll: 11800, oxygenSat: 14500, dissolvedOxygen: 13200, turbidity: 12700, ph: 11900, depth: 10200, algae: 7800 },
];

const monthData = [
  { month: '1 May', conductivity: 4200, temp: 3600, salinity: 3100, chlorophyll: 4700, oxygenSat: 6200, dissolvedOxygen: 5200, turbidity: 4400, ph: 3900, depth: 2600, algae: 2100 },
  { month: '5 May', conductivity: 8000, temp: 6600, salinity: 6200, chlorophyll: 7600, oxygenSat: 9500, dissolvedOxygen: 9000, turbidity: 7400, ph: 6300, depth: 4800, algae: 4200 },
  { month: '10 May', conductivity: 4900, temp: 4400, salinity: 3900, chlorophyll: 5200, oxygenSat: 6800, dissolvedOxygen: 6400, turbidity: 5000, ph: 4500, depth: 3000, algae: 2500 },
  { month: '15 May', conductivity: 11000, temp: 8800, salinity: 8200, chlorophyll: 10000, oxygenSat: 12500, dissolvedOxygen: 11500, turbidity: 10200, ph: 8600, depth: 6800, algae: 5600 },
  { month: '20 May', conductivity: 7800, temp: 6200, salinity: 5600, chlorophyll: 7400, oxygenSat: 9600, dissolvedOxygen: 8800, turbidity: 7600, ph: 6800, depth: 4900, algae: 3900 },
  { month: '25 May', conductivity: 19000, temp: 18000, salinity: 17000, chlorophyll: 16500, oxygenSat: 18500, dissolvedOxygen: 17500, turbidity: 16000, ph: 15500, depth: 14000, algae: 11200 },
  { month: '30 May', conductivity: 13000, temp: 11000, salinity: 10000, chlorophyll: 10500, oxygenSat: 13200, dissolvedOxygen: 12000, turbidity: 11500, ph: 10800, depth: 9000, algae: 6800 },
];

const threeMonthsData = [
  { month: 'Mar', conductivity: 4500, temp: 3900, salinity: 3400, chlorophyll: 5000, oxygenSat: 6500, dissolvedOxygen: 5500, turbidity: 4700, ph: 4200, depth: 2800, algae: 2300 },
  { month: 'Apr', conductivity: 7500, temp: 6200, salinity: 5800, chlorophyll: 7200, oxygenSat: 9000, dissolvedOxygen: 8500, turbidity: 7000, ph: 6000, depth: 4500, algae: 3900 },
  { month: 'May', conductivity: 13500, temp: 11500, salinity: 10500, chlorophyll: 11000, oxygenSat: 13800, dissolvedOxygen: 12500, turbidity: 12000, ph: 11200, depth: 9500, algae: 7200 },
];

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
          background: 'rgba(255, 255, 255, 0.08)',
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
  selectedBuoy = 'Al Aqah Buoy', 
  selectedDuration = 'Last Day',
  height,
  isGraphAndTableView = false,
  isBuoysAnalytics = false,
  thresholdValue = false,
  isTablet = false
}) => {
  const { t } = useTranslation();
  const [expandedParam, setExpandedParam] = React.useState(null);

  const getFilteredData = () => {
    const getBuoyMultiplier = (buoyName) => {
      if (buoyName === 'Near Shore Buoy') return 0.85;
      if (buoyName === 'Offshore Buoy') return 1.15;
      if (buoyName === 'North Dibbah') return 0.95;
      return 1.0;
    };

    let baseData = threeMonthsData;
    if (selectedDuration === 'Live Data' || selectedDuration === 'Last Day' || selectedDuration === 'Daily') {
      baseData = dayData;
    } else if (selectedDuration === 'Last Week' || selectedDuration === 'Weekly') {
      baseData = weekData;
    } else if (selectedDuration === 'Last Month' || selectedDuration === 'Last One Month' || selectedDuration === 'Monthly') {
      baseData = monthData;
    } else if (selectedDuration === 'Last Three Months') {
      baseData = threeMonthsData;
    }

    if (isBuoysAnalytics) {
      const activeBuoys = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];
      return baseData.map(row => {
        const newRow = { ...row };
        activeBuoys.forEach(buoy => {
          const multiplier = getBuoyMultiplier(buoy);
          paramDefs.forEach(param => {
            if (row[param.key]) {
              newRow[`${param.key}_${buoy}`] = Math.round(row[param.key] * multiplier);
            }
          });
        });
        return newRow;
      });
    }

    let multiplier = 1.0;
    if (Array.isArray(selectedBuoy)) {
      if (selectedBuoy.length > 0) {
        const sum = selectedBuoy.reduce((acc, b) => acc + getBuoyMultiplier(b), 0);
        multiplier = sum / selectedBuoy.length;
      }
    } else {
      multiplier = getBuoyMultiplier(selectedBuoy);
    }

    return baseData.map(row => {
      const newRow = { ...row };
      paramDefs.forEach(param => {
        if (row[param.key]) {
          newRow[param.key] = Math.round(row[param.key] * multiplier);
        }
      });
      return newRow;
    });
  };

  const chartData = getFilteredData();

  const activeParams = selectedParams && selectedParams.length > 0
    ? paramDefs.filter(def => selectedParams.includes(def.filterName))
    : paramDefs.filter((def, index, self) => self.findIndex(d => d.key === def.key) === index);

  // deduplicate active parameters by unique key
  const uniqueActiveParams = activeParams.filter((def, index, self) => self.findIndex(d => d.key === def.key) === index);

  const renderLegend = () => (
    <Legend 
      verticalAlign="bottom" 
      align="center"
      height={60} 
      iconType="circle"
      iconSize={10}
      formatter={(value) => <span className="text-white/90 font-medium ml-2 text-[12px] whitespace-normal">{value}</span>}
      wrapperStyle={{ 
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
        textAlign: "center",
        paddingTop: "20px",
        width: "100%",
        position: "relative"
      }}
    />
  );

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
      {isBuoysAnalytics ? (() => {
        const scrollContainerHeightClass = isMobile
          ? "max-h-[500px]"
          : (isGraphAndTableView 
              ? (uniqueActiveParams.length > 1 ? "max-h-[220px]" : "max-h-[200px]") 
              : "max-h-[500px]"
            );

        const buoyColors = {
          'Near Shore Buoy': '#3B82F6', // Blue
          'Offshore Buoy': '#F59E0B',  // Amber
          'Al Aqah Buoy': '#10B981',   // Teal
          'North Dibbah': '#EC4899'    // Pink
        };

        const getBuoyColor = (buoy) => buoyColors[buoy] || '#1DCDDD';

        const activeBuoys = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];

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
                                ticks={[0, 5000, 10000, 15000, 20000]}
                                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                              />
                              <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                              />
                              {thresholdValue && (
                                <ReferenceLine 
                                  y={8000} 
                                  stroke="#EF4444" 
                                  strokeDasharray="4 4" 
                                  label={{ value: 'Threshold Limit', fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }} 
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
                                ticks={[0, 5000, 10000, 15000, 20000]}
                                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                              />
                              <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                              />
                              {thresholdValue && (
                                <ReferenceLine 
                                  y={8000} 
                                  stroke="#EF4444" 
                                  strokeDasharray="4 4" 
                                  label={{ value: 'Threshold Limit', fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }} 
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
                              ticks={[0, 5000, 10000, 15000, 20000]}
                              tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                            />
                            <Tooltip 
                              content={<CustomTooltip />} 
                              cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                            />
                            {thresholdValue && (
                              <ReferenceLine 
                                y={8000} 
                                stroke="#EF4444" 
                                strokeDasharray="4 4" 
                                label={{ value: 'Threshold Limit', fill: '#EF4444', fontSize: 10, position: 'top', fontWeight: 'bold' }} 
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
        <div className={`w-full ${isMobile ? 'min-h-[340px] flex justify-center' : ''}`}>
        <div 
          className={isMobile ? 'w-full h-[320px]' : (height ? 'w-full' : 'w-full h-[300px]')}
          style={!isMobile && height ? { height } : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              if (chartType === 'Bar Chart') {
                return (
                  <BarChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 30 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
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
                      ticks={[0, 5000, 10000, 15000, 20000]}
                      tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Tooltip 
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
                    {isMobile && renderLegend()}
                  </BarChart>
                );
              }

              if (chartType === 'Scatter Chart') {
                return (
                  <LineChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 30 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
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
                      ticks={[0, 5000, 10000, 15000, 20000]}
                      tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                      tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                    />
                    <Tooltip 
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
                    {isMobile && renderLegend()}
                  </LineChart>
                );
              }

              // Default: Line/Area Chart
              return (
                <AreaChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -25, bottom: 30 } : { top: 20, right: 30, left: -10, bottom: 10 }}>
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
                    ticks={[0, 5000, 10000, 15000, 20000]}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                    tick={{ fontSize: isMobile ? 12 : 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                  />
                  <Tooltip 
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
                  {isMobile && renderLegend()}
                </AreaChart>
              );
            })()}
          </ResponsiveContainer>
        </div>
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
      {expandedParam && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-8">
          <div 
            className="relative w-full max-w-[1000px] h-[550px] p-6 md:p-8 flex flex-col"
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(10, 30, 35, 0.95) 0%, rgba(5, 15, 20, 0.98) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-white text-[20px] font-bold tracking-wide">
                {t(expandedParam.label)} Overview (Expanded)
              </span>
              <button 
                onClick={() => setExpandedParam(null)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Chart viewport */}
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const buoyColors = {
                    'Near Shore Buoy': '#3B82F6', // Blue
                    'Offshore Buoy': '#F59E0B',  // Amber
                    'Al Aqah Buoy': '#10B981',   // Teal
                    'North Dibbah': '#EC4899'    // Pink
                  };
                  const getBuoyColor = (buoy) => buoyColors[buoy] || '#1DCDDD';
                  const activeBuoys = Array.isArray(selectedBuoy) ? selectedBuoy : [selectedBuoy];

                  const renderModalDefs = () => (
                    <defs>
                      {activeBuoys.map(buoy => {
                        const color = getBuoyColor(buoy);
                        const gradId = `modal_grad_${buoy.replace(/\s+/g, '')}`;
                        return (
                          <linearGradient key={buoy} id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        );
                      })}
                    </defs>
                  );

                  const renderModalSeries = () => {
                    if (chartType === 'Bar Chart') {
                      return activeBuoys.map((buoy) => (
                        <Bar 
                          key={buoy}
                          dataKey={`${expandedParam.key}_${buoy}`} 
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
                          dataKey={`${expandedParam.key}_${buoy}`} 
                          name={buoy}
                          stroke="transparent" 
                          strokeWidth={0}
                          dot={{ r: 8, fill: getBuoyColor(buoy), stroke: '#ffffff', strokeWidth: 2 }}
                          activeDot={{ r: 10, fill: getBuoyColor(buoy), stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      ));
                    }
                    // Default Area
                    return activeBuoys.map((buoy) => {
                      const color = getBuoyColor(buoy);
                      const gradId = `modal_grad_${buoy.replace(/\s+/g, '')}`;
                      return (
                        <Area 
                          key={buoy}
                          type="monotone" 
                          dataKey={`${expandedParam.key}_${buoy}`} 
                          name={buoy}
                          stroke={color} 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill={`url(#${gradId})`} 
                          dot={{ r: 5, fill: '#ffffff', stroke: color, strokeWidth: 2.5 }}
                          activeDot={{ r: 8, fill: '#ffffff', stroke: color, strokeWidth: 3 }}
                        />
                      );
                    });
                  };

                  const CustomTooltip = ({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div 
                          className="p-4" 
                          style={{
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(10,30,35,0.95)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                          }}
                        >
                          <p className="text-[12px] text-white/50 mb-2 font-medium">{label}</p>
                          <div className="flex flex-col gap-2">
                            {payload.map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                <span className="text-[13px] text-white/70 font-medium">{item.name}:</span>
                                <span className="text-[13px] text-white font-bold">{item.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  };

                  return (
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      {renderModalDefs()}
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
                        tick={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 5000, 10000, 15000, 20000]}
                        tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
                        tick={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                      />
                      <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '5 5' }} 
                      />
                      {renderModalSeries()}
                      <Legend 
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span className="text-white/80 font-medium ml-2 text-[13px]">{value}</span>}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </AreaChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuoysChart;
