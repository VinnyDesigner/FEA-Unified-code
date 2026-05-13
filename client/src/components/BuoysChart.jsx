import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { month: 'Feb', waterTemp: 3500, algae: 2000 },
  { month: 'Apr', waterTemp: 6200, algae: 3900 },
  { month: 'Jun', waterTemp: 4600, algae: 2800 },
  { month: 'Aug', waterTemp: 8400, algae: 5200 },
  { month: 'Oct', waterTemp: 6500, algae: 4200 },
  { month: 'Dec', waterTemp: 19000, algae: 12000 },
  { month: 'Feb', waterTemp: 11500, algae: 7200 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isAlgae = payload[0].name.includes('Algae');
    return (
      <div className="bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl min-w-[240px]">
        <div className="space-y-1.5">
          <p className="text-[14px] text-white/90">
            <span className="font-bold">Parameters :</span> {isAlgae ? 'Blue Green Algae' : 'Water Temperature'}
          </p>
          <p className="text-[14px] text-white/90">
            <span className="font-bold">Station :</span> Al Aqah New
          </p>
          <p className="text-[14px] text-white/90">
            <span className="font-bold">Value :</span> {payload[0].value}
          </p>
          <p className="text-[14px] text-white/90">
            <span className="font-bold">Month :</span> {label} 2025
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const BuoysChart = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[18px] font-bold text-white">Buoys Monthly Overview</h2>
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
          Download
          <ChevronDown size={16} className="text-white/70" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlgae" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1DCDDD" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#1DCDDD" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#CACBCE" strokeWidth={1.088} strokeOpacity={0.15} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
              dy={15}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              ticks={[0, 5000, 10000, 15000, 20000]}
              tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}K`}
              tick={{ fontSize: 14, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend 
              verticalAlign="bottom" 
              height={40} 
              iconType="circle"
              iconSize={10}
              formatter={(value) => <span className="text-[14px] text-white/90 font-medium ml-2">{value}</span>}
              wrapperStyle={{ paddingTop: '40px' }}
            />
            <Area 
              type="monotone" 
              dataKey="waterTemp" 
              name="Al Aqah New (Water Temperature)"
              stroke="#F59E0B" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorWater)" 
              dot={{ r: 4, fill: '#ffffff', stroke: '#F59E0B', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#F59E0B', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="algae" 
              name="Al Aqah New (Blue Green Algae)"
              stroke="#1DCDDD" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAlgae)" 
              dot={{ r: 4, fill: '#ffffff', stroke: '#1DCDDD', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#1DCDDD', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Divider line after graph labels */}
      <div className="w-full h-px bg-white/10 mt-14 mb-8" />
    </div>
  );
};

export default BuoysChart;
