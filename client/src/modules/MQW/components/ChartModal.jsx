import React, { useState, useMemo, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Printer, Menu, Search, Hand, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

const ChartModal = ({ isOpen, onClose, metric, translatedMetricTitle, selectedBuoy, customData, series, xAxisKey = "fullLabel" }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const translateStation = (stationStr) => {
    if (!stationStr) return '';
    const stationMap = {
      'Al Aqah New': 'stations.alAqahNew',
      'North Dibbah': 'stations.northDibbah',
      'OSB': 'stations.osb',
      'NSB': 'stations.nsb',
      'Al Aqah Buoy': 'stations.alAqah',
      'Fujairah Buoy 1': 'stations.fujairah1',
      'Fujairah Buoy 2': 'stations.fujairah2',
      'Coastal Buoy A': 'stations.coastal',
      'Near Shore Buoy': 'stations.nearShore',
      'Offshore Buoy': 'stations.offshore',
      'All Stations': 'stations.allStations'
    };

    return stationStr
      .split(',')
      .map(part => {
        const trimmed = part.trim();
        return stationMap[trimmed] ? t(stationMap[trimmed]) : trimmed;
      })
      .join(', ');
  };

  const translateMetric = (metricStr) => {
    if (!metricStr) return '';
    const metricMap = {
      'Specific Conductivity': 'analytics.specificConductivity',
      'Water Temperature': 'analytics.waterTemperature',
      'Salinity': 'analytics.salinity',
      'Chlorophyll': 'analytics.chlorophyll',
      'Oxygen Saturation': 'analytics.oxygenSaturation',
      'Dissolved Oxygen': 'analytics.dissolvedOxygen',
      'Turbidity': 'analytics.turbidity',
      'pH': 'analytics.ph',
      'Depth': 'analytics.depth',
      'Blue-Green Algae': 'analytics.blueGreenAlgae',
      'Bluegreen Algae': 'analytics.blueGreenAlgae',
      'Sonde Information': 'analytics.sondeInformation',
      'Weather Information': 'analytics.weatherInformation'
    };
    
    const cleanMetric = metricStr.split('(')[0].trim();
    return metricMap[cleanMetric] ? t(metricMap[cleanMetric]) : cleanMetric;
  };

  const getToolbarTitle = (key, fallback) => {
    const map = {
      'Zoom In': i18n.language === 'ar' ? 'تكبير' : 'Zoom In',
      'Zoom Out': i18n.language === 'ar' ? 'تصغير' : 'Zoom Out',
      'Select Zoom': i18n.language === 'ar' ? 'تحديد التكبير' : 'Select Zoom',
      'Pan Mode': i18n.language === 'ar' ? 'وضع التحريك' : 'Pan Mode',
      'Pan Left': i18n.language === 'ar' ? 'تحريك لليسار' : 'Pan Left',
      'Pan Right': i18n.language === 'ar' ? 'تحريك لليمين' : 'Pan Right',
      'Reset/Home': i18n.language === 'ar' ? 'إعادة تعيين' : 'Reset/Home',
      'Print': i18n.language === 'ar' ? 'طباعة' : 'Print',
      'Menu': i18n.language === 'ar' ? 'القائمة' : 'Menu'
    };
    return map[key] || fallback;
  };

  const [chartType, setChartType] = useState('Line');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDashes, setShowDashes] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [optimizeData, setOptimizeData] = useState(true);
  const [maxPoints, setMaxPoints] = useState(2000);
  const [activeTool, setActiveTool] = useState('zoom'); // 'zoom', 'pan', 'select'
  const [isMobileResponsive, setIsMobileResponsive] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileResponsive(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate dense data (200 points) to match the reference image
  const fullData = useMemo(() => {
    if (customData) return customData;
    const data = [];
    const seed = (metric?.length || 0);
    const now = new Date();
    const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-US';
    
    for (let i = 0; i < 200; i++) {
      const time = new Date(now.getTime() - (200 - i) * 5 * 60000);
      const base = Math.sin(seed + i / 10) * 2 + Math.cos(seed + i / 5) * 1 + 5;
      const noise = (Math.random() - 0.5) * 1.5;
      const value = Math.max(0.2, base + noise);
      
      data.push({
        time: time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        date: time.toLocaleDateString(locale),
        fullLabel: `${time.toLocaleDateString(locale)} ${time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`,
        value: parseFloat(value.toFixed(1)),
        value2: parseFloat((value * 0.7).toFixed(1))
      });
    }
    return data;
  }, [metric, i18n.language]);

  // Zoom State (Index range)
  const [dataRange, setDataRange] = useState([0, fullData.length]);

  // Reset zoom range when fullData changes
  useEffect(() => {
    setDataRange([0, fullData.length]);
  }, [fullData]);

  const visibleData = useMemo(() => {
    return fullData.slice(dataRange[0], dataRange[1]);
  }, [fullData, dataRange]);

  const handleZoomIn = () => {
    const [start, end] = dataRange;
    const span = end - start;
    if (span <= 3) return; // Keep at least 3 points visible
    const step = Math.max(1, Math.floor(span * 0.15)); // Zoom in by 15% from each side
    const newStart = Math.min(end - 3, start + step);
    const newEnd = Math.max(newStart + 3, end - step);
    setDataRange([newStart, newEnd]);
  };

  const handleZoomOut = () => {
    const [start, end] = dataRange;
    const span = end - start;
    if (span >= fullData.length) return; // Already fully zoomed out
    const step = Math.max(1, Math.floor(span * 0.2)); // Zoom out by 20% from each side
    const newStart = Math.max(0, start - step);
    const newEnd = Math.min(fullData.length, end + step);
    setDataRange([newStart, newEnd]);
  };

  const handleReset = () => {
    setDataRange([0, fullData.length]);
  };

  const handlePan = (direction) => {
    const [start, end] = dataRange;
    const span = end - start;
    const step = Math.floor(span / 4);
    
    if (direction === 'left') {
      const newStart = Math.max(0, start - step);
      const newEnd = newStart + span;
      setDataRange([newStart, newEnd]);
    } else {
      const newEnd = Math.min(fullData.length, end + step);
      const newStart = newEnd - span;
      setDataRange([newStart, newEnd]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const metricLabel = translateMetric(metric) || 'Parameter';

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs"
          style={{ transform: 'translateY(36px)' }}
        >
          <p className="font-medium text-gray-500 mb-1">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color || item.stroke || '#009FAC' }}></div>
                <span className="text-gray-700">{item.name || t('analytics.details')}: <strong className="text-gray-900">{typeof item.value === 'number' ? item.value.toFixed(2) : item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: visibleData,
      margin: isMobileResponsive 
        ? { top: 15, right: 15, left: -25, bottom: 5 } 
        : (isRtl ? { top: 20, right: 20, left: 30, bottom: 60 } : { top: 20, right: 30, left: 20, bottom: 60 })
    };

    const xAxis = (
      <XAxis 
        dataKey={xAxisKey} 
        axisLine={{ stroke: '#E5E7EB' }}
        tickLine={false}
        tick={{ fontSize: isMobileResponsive ? 9 : 10, fill: "#6B7280" }}
        angle={isMobileResponsive ? 0 : -45}
        textAnchor={isMobileResponsive ? "middle" : "end"}
        height={isMobileResponsive ? 25 : 60}
        interval={customData ? 0 : Math.floor(visibleData.length / 10)}
        tickFormatter={(val) => {
          if (customData) {
            const lowerVal = val ? val.toLowerCase() : '';
            if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(lowerVal)) {
              return t(`analytics.months.${lowerVal}`, val);
            }
          }
          return val;
        }}
      />
    );

    const yAxis = (
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 11, fill: "#6B7280" }}
        domain={[0, 'auto']}
      />
    );

    const tooltip = showTooltip && (
      <Tooltip wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} content={<CustomTooltip />} cursor={{ stroke: '#ddd', strokeWidth: 1, strokeDasharray: '3 3' }} />
    );

    const legend = showLegend && !isMobileResponsive ? <Legend verticalAlign="top" align="center" height={36} wrapperStyle={{ paddingBottom: '10px' }} /> : null;

    if (chartType === 'Bars') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          {xAxis}
          {yAxis}
          {tooltip}
          {legend}
          {series ? series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} isAnimationActive={showAnimation} />
          )) : (
            <Bar dataKey="value" name={metricLabel} fill="#009FAC" isAnimationActive={showAnimation} />
          )}
        </BarChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
        {xAxis}
        {yAxis}
        {tooltip}
        {legend}
        {series ? series.map((s) => (
          <Line 
            key={s.key}
            type={chartType === 'Step Line' ? 'stepAfter' : 'monotone'}
            dataKey={s.key} 
            name={s.name}
            stroke={s.color} 
            strokeWidth={chartType === 'Dots' ? 0 : 2}
            strokeDasharray={showDashes ? "5 5" : "0"}
            dot={showMarkers || chartType === 'Dots' ? { r: 3, fill: s.color, stroke: '#fff', strokeWidth: 1 } : false}
            activeDot={{ r: 5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={showAnimation}
          />
        )) : (
          <>
            <Line 
              type={chartType === 'Step Line' ? 'stepAfter' : 'monotone'}
              dataKey="value" 
              name={metricLabel}
              stroke="#009FAC" 
              strokeWidth={chartType === 'Dots' ? 0 : 2}
              strokeDasharray={showDashes ? "5 5" : "0"}
              dot={showMarkers || chartType === 'Dots' ? { r: 3, fill: '#009FAC', stroke: '#fff', strokeWidth: 1 } : false}
              activeDot={{ r: 5, fill: '#009FAC', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={showAnimation}
            />
            {chartType === 'Stacked Lines' && (
              <Line 
                type="monotone"
                dataKey="value2" 
                name={`${metricLabel} (Forecast)`}
                stroke="#10B981" 
                strokeWidth={2}
                dot={showMarkers ? { r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 1 } : false}
                isAnimationActive={showAnimation}
              />
            )}
          </>
        )}
      </LineChart>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-white w-full max-w-7xl h-[95vh] md:h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className={`flex flex-col md:flex-row items-start md:items-center px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 gap-3 md:gap-4 relative ${isRtl ? 'pl-12 md:pl-16' : 'pr-12 md:pr-16'}`}>
          <div className="flex items-center w-full md:w-auto">
            <h2 className="text-lg md:text-xl font-bold text-[#072227]">
              {selectedBuoy?.nameKey ? t(`stations.${selectedBuoy.nameKey}`) : translateStation(selectedBuoy?.name || 'Station')}
            </h2>
          </div>
          
          <div className="flex items-center w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {/* Chart Type Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 min-w-max">
              {[
                { id: 'Line', key: 'line' },
                { id: 'Step Line', key: 'stepLine' },
                { id: 'Dots', key: 'dots' },
                { id: 'Stacked Lines', key: 'stackedLines' },
                { id: 'Bars', key: 'bars' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    chartType === type.id 
                      ? 'bg-[#009FAC] text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(`chart.${type.key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Absolute Close Button */}
          <button 
            onClick={onClose}
            className={`absolute top-3 md:top-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full ${isRtl ? 'left-3 md:left-4' : 'right-3 md:right-4'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          
          {/* Left Side: Chart */}
          <div className="flex-1 flex flex-col p-4 md:p-6 bg-white min-w-0 min-h-[350px] md:min-h-0">
            
            {/* Chart Toolbar */}
            <div className="flex justify-end items-center mb-2 md:mb-4 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-1 md:gap-2 text-gray-400 min-w-max">
                {/* Zoom In/Out */}
                <button onClick={handleZoomIn} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Zoom In', 'Zoom In')}><ZoomIn size={18} /></button>
                <button onClick={handleZoomOut} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Zoom Out', 'Zoom Out')}><ZoomOut size={18} /></button>
                
                {/* Search / Zoom Select */}
                <button 
                  onClick={() => setActiveTool('select')} 
                  className={`p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${activeTool === 'select' ? 'text-[#009FAC] bg-gray-50' : 'hover:text-[#009FAC]'}`} 
                  title={getToolbarTitle('Select Zoom', 'Select Zoom')}
                >
                  <Search size={18} />
                </button>
                
                {/* Pan */}
                <button 
                  onClick={() => setActiveTool('pan')} 
                  className={`p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${activeTool === 'pan' ? 'text-[#009FAC] bg-gray-50' : 'hover:text-[#009FAC]'}`} 
                  title={getToolbarTitle('Pan Mode', 'Pan Mode')}
                >
                  <Hand size={18} />
                </button>
                
                {/* Pan Controls (visible when pan mode is active) */}
                {activeTool === 'pan' && (
                  <>
                    <button onClick={() => handlePan('left')} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Pan Left', 'Pan Left')}><ArrowLeft size={16} /></button>
                    <button onClick={() => handlePan('right')} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Pan Right', 'Pan Right')}><ArrowRight size={16} /></button>
                  </>
                )}
                
                {/* Home / Reset */}
                <button onClick={handleReset} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Reset/Home', 'Reset/Home')}><Home size={18} /></button>
                
                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                
                {/* Print & Menu */}
                <button onClick={handlePrint} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Print', 'Print')}><Printer size={18} /></button>
                <button className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title={getToolbarTitle('Menu', 'Menu')}><Menu size={18} /></button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="flex-1 w-full relative min-h-[260px] md:min-h-[400px]">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mobile Custom Legend */}
            {showLegend && isMobileResponsive && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
                  {series ? (
                    series.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ background: s.color }} 
                        />
                        <span className="text-[11px] text-gray-700 font-semibold truncate leading-tight">
                          {s.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 col-span-2 justify-center">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ background: '#009FAC' }} 
                      />
                      <span className="text-[11px] text-gray-700 font-semibold truncate leading-tight">
                        {metricLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Sidebar Controls */}
          <div className={`w-full md:w-72 border-t md:border-t-0 border-gray-100 p-4 md:p-6 flex flex-col gap-4 md:gap-6 flex-shrink-0 ${isRtl ? 'md:border-r' : 'md:border-l'}`}>
            
            {/* Toggles */}
            <div className="flex flex-col gap-4">
              <ToggleItem label={t('chart.optimize')} checked={optimizeData} onChange={setOptimizeData} subtext={t('chart.showingAll')} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('chart.maxPoints')}</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setMaxPoints(m => Math.max(100, m - 100))} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 transition-colors">-</button>
                  <span className="w-14 text-center text-sm border-x border-gray-200 py-1 text-gray-700 font-medium">{maxPoints}</span>
                  <button onClick={() => setMaxPoints(m => m + 100)} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 transition-colors">+</button>
                </div>
              </div>
              
              <div className="h-[1px] bg-gray-100 my-1 md:my-2"></div>
              
              <ToggleItem label={t('chart.marker')} checked={showMarkers} onChange={setShowMarkers} />
              <ToggleItem label={t('chart.dashes')} checked={showDashes} onChange={setShowDashes} />
              <ToggleItem label={t('chart.dateTooltip')} checked={showTooltip} onChange={setShowTooltip} />
              <ToggleItem label={t('chart.animation')} checked={showAnimation} onChange={setShowAnimation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleItem = ({ label, checked, onChange, subtext }) => (
  <div className="flex justify-between items-start">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="sr-only peer" 
      />
      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009FAC]"></div>
    </label>
  </div>
);

export default ChartModal;
