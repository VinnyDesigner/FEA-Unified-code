import React from 'react';
import { Thermometer, Droplets, Leaf, Wind, FlaskConical, Eye, Waves, Zap, Layers } from 'lucide-react';
import MetricCard from './MetricCard';

const sondeMetrics = [
  { label: 'Water Temperature (°c)', value: '25.1°c', icon: '/assets/metrics/temp.png', selected: true },
  { label: 'Salinity (ppt)', value: '36.4 ppt', icon: '/assets/metrics/salinity.png' },
  { label: 'Chlorophyll (ug)', value: '1.7 ug', icon: '/assets/metrics/chlorophyll.png' },
  { label: 'Dissolved Oxygen (mg/l)', value: '5.63 mg/l', icon: '/assets/metrics/oxygen.png' },
  { label: 'pH', value: '7.97 pH', icon: '/assets/metrics/ph.png' },
  { label: 'Turbidity (NTU)', value: '0.02 NTU', icon: '/assets/metrics/turbidity.png' },
  { label: 'Blue-Green Algae (ug)', value: '0.65 ug', icon: '/assets/metrics/algae.png' },
  { label: 'Depth(m)', value: '166 m', icon: '/assets/metrics/depth.png' },
  { label: 'Specific Conductivity(uS)', value: '12.5 uS', icon: '/assets/metrics/conductivity.png' },
];

const weatherMetrics = [
  { label: 'Air Temperature (°c)', value: '22.4°C', icon: '/assets/weather/air_temp.png', selected: true },
  { label: 'Relative Humidity (%)', value: '86%', icon: '/assets/weather/humidity.png' },
  { label: 'AWS (m/s)', value: '24 m/s', icon: '/assets/weather/wind.png' },
  { label: 'AWD (Degree)', value: '12 Degree', icon: '/assets/weather/awd.png' },
  { label: 'Wind Gust (Wind Gust)', value: '18 Wind Gust', icon: '/assets/weather/gust.png' },
  { label: 'Pressure (bar)', value: '20.5 bar', icon: '/assets/weather/pressure.png' },
];

const MetricsGrid = ({ activeTab }) => {
  const currentMetrics = activeTab === 'Weather' ? weatherMetrics : sondeMetrics;

  return (
    <div 
      className="w-full h-full grid gap-[14px] overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)'
      }}
    >
      {currentMetrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          isSelected={metric.selected}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;
