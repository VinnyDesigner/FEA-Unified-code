import React from 'react';
import { Thermometer, Droplets, Leaf, Wind, FlaskConical, Eye, Waves, Zap, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MetricCard from './MetricCard';

const sondeMetrics = [
  { label: 'Water Temperature (°c)', labelKey: 'dashboard.waterTemperature', value: '25.1°c', icon: '/assets/metrics/temp.png' },
  { label: 'Salinity (ppt)', labelKey: 'dashboard.salinity', value: '36.4 ppt', icon: '/assets/metrics/salinity.png' },
  { label: 'Chlorophyll (ug)', labelKey: 'dashboard.chlorophyll', value: '1.7 ug', icon: '/assets/metrics/chlorophyll.png' },
  { label: 'Dissolved Oxygen (mg/l)', labelKey: 'dashboard.dissolvedOxygen', value: '5.63 mg/l', icon: '/assets/metrics/oxygen.png' },
  { label: 'pH', labelKey: 'dashboard.ph', value: '7.97 pH', icon: '/assets/metrics/ph.png' },
  { label: 'Turbidity (NTU)', labelKey: 'dashboard.turbidity', value: '0.02 NTU', icon: '/assets/metrics/turbidity.png' },
  { label: 'Blue-Green Algae (ug)', labelKey: 'dashboard.blueGreenAlgae', value: '0.65 ug', icon: '/assets/metrics/algae.png' },
  { label: 'Depth(m)', labelKey: 'dashboard.depth', value: '166 m', icon: '/assets/metrics/depth.png' },
  { label: 'Specific Conductivity(uS)', labelKey: 'dashboard.specificConductivity', value: '12.5 uS', icon: '/assets/metrics/conductivity.png' },
];

const weatherMetrics = [
  { label: 'Air Temperature (°c)', labelKey: 'dashboard.airTemperature', value: '22.4°C', icon: '/assets/weather/air_temp.png' },
  { label: 'Relative Humidity (%)', labelKey: 'dashboard.relativeHumidity', value: '86%', icon: '/assets/weather/humidity.png' },
  { label: 'AWS (m/s)', labelKey: 'dashboard.aws', value: '24 m/s', icon: '/assets/weather/wind.png' },
  { label: 'AWD (Degree)', labelKey: 'dashboard.awd', value: '12 Degree', icon: '/assets/weather/awd.png' },
  { label: 'Wind Gust (Wind Gust)', labelKey: 'dashboard.windGust', value: '18 Wind Gust', icon: '/assets/weather/gust.png' },
  { label: 'Pressure (bar)', labelKey: 'dashboard.pressure', value: '20.5 bar', icon: '/assets/weather/pressure.png' },
];

const MetricsGrid = ({ activeTab, selectedMetric, setSelectedMetric, isMobile = false, selectedBuoy, selectedDateRange }) => {
  const { t } = useTranslation();
  
  const getDynamicMetrics = (metrics, buoyId, dateRange) => {
    const seed = (buoyId || 1) + (dateRange?.length || 0);
    return metrics.map((metric, index) => {
      const numMatch = metric.value.match(/[\d.]+/);
      if (numMatch) {
        const baseValue = parseFloat(numMatch[0]);
        // Use a deterministic variation based on seed and index
        const variation = Math.sin(seed + index) * (baseValue * 0.1); // up to 10% variation
        const newValue = Math.max(0, baseValue + variation).toFixed(metric.label === 'pH' ? 2 : 1);
        const newValueStr = metric.value.replace(/[\d.]+/, newValue);
        return { ...metric, value: newValueStr };
      }
      return metric;
    });
  };

  const baseMetrics = activeTab === 'Weather' ? weatherMetrics : sondeMetrics;
  const displayMetrics = getDynamicMetrics(baseMetrics, selectedBuoy?.id, selectedDateRange);

  return (
    <div 
      className={`w-full ${isMobile ? 'grid grid-cols-2 md:grid-cols-3 gap-[10px] md:gap-[16px]' : 'grid gap-[10px]'}`}
      style={!isMobile ? {
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gridAutoRows: '88px'
      } : {}}
    >
      {displayMetrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.labelKey ? t(metric.labelKey) : metric.label}
          value={metric.value}
          icon={metric.icon}
          isSelected={metric.label === selectedMetric}
          onClick={() => setSelectedMetric(metric.label)}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

export default MetricsGrid;
