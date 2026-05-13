import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Maximize2 } from 'lucide-react';

const sondeData = [
  { time: '17 Feb 2026', hour: '9:30AM', temp: 5 },
  { time: '17 Feb 2026', hour: '10:00AM', temp: 28 },
  { time: '17 Feb 2026', hour: '10:30AM', temp: 48 },
  { time: '17 Feb 2026', hour: '11:00AM', temp: 62 },
  { time: '17 Feb 2026', hour: '11:30AM', temp: 38 },
  { time: '17 Feb 2026', hour: '12:00PM', temp: 42 },
];

const weatherData = [
  { time: '17 Feb 2026', hour: '9:30AM', temp: 38 },
  { time: '17 Feb 2026', hour: '10:00AM', temp: 12 },
  { time: '17 Feb 2026', hour: '10:30AM', temp: 22 },
  { time: '17 Feb 2026', hour: '11:00AM', temp: 38 },
  { time: '17 Feb 2026', hour: '11:30AM', temp: 52 }
];

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
      <text x={0} y={15} dy={0} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight="400">
        {parts[0]}
      </text>
      <text x={0} y={26} dy={0} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight="500">
        {parts[1]}
      </text>
    </g>
  );
};

const TemperatureChart = ({ activeTab }) => {
  const isWeather = activeTab === 'Weather';
  const rawData = isWeather ? weatherData : sondeData;
  const currentData = rawData.map(d => ({ ...d, label: `${d.time},\n${d.hour}` }));

  return (
    <div 
      className="flex flex-col h-full relative"
      style={{
        background: 'rgba(255, 255, 255, 0.45)',
        borderRadius: '24px',
        padding: '16px 20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        border: '1px solid rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[19px] font-bold text-[#072227] tracking-tight">
          {isWeather ? 'Air Temperature' : 'Water Temperature'} (°c)
        </h3>
        <button className="text-gray-400 hover:text-[#009FAC] transition-all p-1 bg-white/60 rounded-lg shadow-sm border border-white/40">
          <Maximize2 size={12} />
        </button>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1DCDDD" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#1DCDDD" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="rgba(0,0,0,0.08)" />
            <XAxis 
              dataKey="label" 
              axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
              tickLine={{ stroke: 'rgba(0,0,0,0.2)', transform: 'translate(0, -6)' }}
              tick={<CustomXAxisTick />}
              interval={0}
              height={50}
            />
            <YAxis 
              axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
              tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
              tick={<CustomYAxisTick />}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              width={45}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.8)', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)'
              }}
              itemStyle={{ color: '#009FAC', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="#1DCDDD" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTemp)"
              dot={(props) => {
                if (props.index === currentData.length - 1) {
                  return (
                    <g key="end-dot">
                      <circle cx={props.cx} cy={props.cy} r={6} fill="#1DCDDD" fillOpacity={0.15} />
                      <circle cx={props.cx} cy={props.cy} r={3} fill="white" stroke="#1DCDDD" strokeWidth={2} />
                      <line x1={props.cx} y1={props.cy} x2={props.cx} y2={220} stroke="#1DCDDD" strokeDasharray="3 3" strokeOpacity={0.4} />
                    </g>
                  );
                }
                return null;
              }}
              activeDot={{ r: 5, fill: '#1DCDDD', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureChart;
