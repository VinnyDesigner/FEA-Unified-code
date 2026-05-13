import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { time: '17 Feb 2025,\n08:00AM', temp: 12 },
  { time: '17 Feb 2025,\n09:00AM', temp: 18 },
  { time: '17 Feb 2025,\n10:00AM', temp: 58 },
  { time: '17 Feb 2025,\n11:00AM', temp: 68 },
  { time: '17 Feb 2025,\n12:00PM', temp: 42 },
  { time: '17 Feb 2025,\n01:00PM', temp: 55 },
  { time: '17 Feb 2025,\n02:00PM', temp: 38 },
  { time: '17 Feb 2025,\n03:00PM', temp: 30 },
];

const WaterTempChart = () => (
  <ResponsiveContainer width="100%" height={160}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1DCDDD" stopOpacity={0.4} />
          <stop offset="95%" stopColor="#1DCDDD" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={0} />
      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 80]} />
      <Tooltip
        contentStyle={{ background: '#0d2229', border: '1px solid #009FAC', borderRadius: 8, color: '#fff', fontSize: 12 }}
        formatter={(v) => [`${v}°c`, 'Temp']}
      />
      <Area type="monotone" dataKey="temp" stroke="#1DCDDD" strokeWidth={2} fill="url(#tempGrad)" dot={{ fill: '#1DCDDD', r: 3 }} />
    </AreaChart>
  </ResponsiveContainer>
);

export default WaterTempChart;
