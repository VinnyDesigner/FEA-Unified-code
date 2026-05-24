import React, { useState, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Printer, Menu, Search, Hand, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

const ChartModal = ({ isOpen, onClose, metric }) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState('Line');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDashes, setShowDashes] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [optimizeData, setOptimizeData] = useState(true);
  const [maxPoints, setMaxPoints] = useState(2000);
  const [activeTool, setActiveTool] = useState('zoom'); // 'zoom', 'pan', 'select'

  // Generate dense data (200 points) to match the reference image
  const fullData = useMemo(() => {
    const data = [];
    const seed = (metric?.length || 0);
    const now = new Date();
    
    for (let i = 0; i < 200; i++) {
      const time = new Date(now.getTime() - (200 - i) * 5 * 60000);
      const base = Math.sin(seed + i / 10) * 2 + Math.cos(seed + i / 5) * 1 + 5;
      const noise = (Math.random() - 0.5) * 1.5;
      const value = Math.max(0.2, base + noise);
      
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: time.toLocaleDateString(),
        fullLabel: `${time.toLocaleDateString()} ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        value: parseFloat(value.toFixed(1)),
        value2: parseFloat((value * 0.7).toFixed(1))
      });
    }
    return data;
  }, [metric]);

  // Zoom State (Index range)
  const [dataRange, setDataRange] = useState([0, fullData.length]);

  const visibleData = useMemo(() => {
    return fullData.slice(dataRange[0], dataRange[1]);
  }, [fullData, dataRange]);

  const handleZoomIn = () => {
    const [start, end] = dataRange;
    const span = end - start;
    if (span <= 20) return; // Don't zoom too much
    const center = Math.floor((start + end) / 2);
    const newSpan = Math.floor(span / 4);
    setDataRange([Math.max(0, center - newSpan), Math.min(fullData.length, center + newSpan)]);
  };

  const handleZoomOut = () => {
    const [start, end] = dataRange;
    const span = end - start;
    if (span >= fullData.length) return;
    const center = Math.floor((start + end) / 2);
    const newSpan = Math.min(fullData.length, span);
    setDataRange([Math.max(0, center - newSpan), Math.min(fullData.length, center + newSpan)]);
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

  const metricLabel = metric ? metric.split('(')[0].trim() : 'Parameter';

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs">
          <p className="font-medium text-gray-500 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#009FAC] rounded-full"></div>
            <span className="text-gray-700">Value: <strong className="text-gray-900">{payload[0].value}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: visibleData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    const xAxis = (
      <XAxis 
        dataKey="fullLabel" 
        axisLine={{ stroke: '#E5E7EB' }}
        tickLine={false}
        tick={{ fontSize: 10, fill: "#6B7280" }}
        angle={-45}
        textAnchor="end"
        height={60}
        interval={Math.floor(visibleData.length / 10)}
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
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ddd', strokeWidth: 1, strokeDasharray: '3 3' }} />
    );

    const legend = null;

    if (chartType === 'Bars') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          {xAxis}
          {yAxis}
          {tooltip}
          {legend}
          <Bar dataKey="value" name={metricLabel} fill="#009FAC" isAnimationActive={showAnimation} />
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
      </LineChart>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-7xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#072227]">ATP Site</h2>
          
          <div className="flex items-center gap-4">
            {/* Chart Type Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['Line', 'Step Line', 'Dots', 'Stacked Lines', 'Bars'].map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    chartType === type 
                      ? 'bg-[#009FAC] text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Side: Chart */}
          <div className="flex-1 flex flex-col p-6 bg-white min-w-0">
            
            {/* Chart Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#009FAC] rounded-sm"></div>
                <span className="text-sm font-medium text-gray-700">{metricLabel}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                {/* Zoom In/Out */}
                <button onClick={handleZoomIn} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Zoom In"><ZoomIn size={18} /></button>
                <button onClick={handleZoomOut} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Zoom Out"><ZoomOut size={18} /></button>
                
                {/* Search / Zoom Select */}
                <button 
                  onClick={() => setActiveTool('select')} 
                  className={`p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${activeTool === 'select' ? 'text-[#009FAC] bg-gray-50' : 'hover:text-[#009FAC]'}`} 
                  title="Select Zoom"
                >
                  <Search size={18} />
                </button>
                
                {/* Pan */}
                <button 
                  onClick={() => setActiveTool('pan')} 
                  className={`p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${activeTool === 'pan' ? 'text-[#009FAC] bg-gray-50' : 'hover:text-[#009FAC]'}`} 
                  title="Pan Mode"
                >
                  <Hand size={18} />
                </button>
                
                {/* Pan Controls (visible when pan mode is active) */}
                {activeTool === 'pan' && (
                  <>
                    <button onClick={() => handlePan('left')} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Pan Left"><ArrowLeft size={16} /></button>
                    <button onClick={() => handlePan('right')} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Pan Right"><ArrowRight size={16} /></button>
                  </>
                )}
                
                {/* Home / Reset */}
                <button onClick={handleReset} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Reset/Home"><Home size={18} /></button>
                
                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                
                {/* Print & Menu */}
                <button onClick={handlePrint} className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Print"><Printer size={18} /></button>
                <button className="hover:text-[#009FAC] p-1.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer" title="Menu"><Menu size={18} /></button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side: Sidebar Controls */}
          <div className="w-72 border-l border-gray-100 p-6 flex flex-col gap-6 overflow-y-auto">
            
            {/* Toggles */}
            <div className="flex flex-col gap-4">
              <ToggleItem label="Optimize large datasets" checked={optimizeData} onChange={setOptimizeData} subtext="Showing all points" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max points (optimized)</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setMaxPoints(m => Math.max(100, m - 100))} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 transition-colors">-</button>
                  <span className="w-14 text-center text-sm border-x border-gray-200 py-1 text-gray-700 font-medium">{maxPoints}</span>
                  <button onClick={() => setMaxPoints(m => m + 100)} className="px-2.5 py-1 hover:bg-gray-100 text-gray-600 transition-colors">+</button>
                </div>
              </div>
              
              <div className="h-[1px] bg-gray-100 my-2"></div>
              
              <ToggleItem label="Marker" checked={showMarkers} onChange={setShowMarkers} />
              <ToggleItem label="Dashes" checked={showDashes} onChange={setShowDashes} />
              <ToggleItem label="Date Tooltip" checked={showTooltip} onChange={setShowTooltip} />
              <ToggleItem label="Animation" checked={showAnimation} onChange={setShowAnimation} />
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
