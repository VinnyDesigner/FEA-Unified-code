import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MetricCard from './MetricCard';
import { getMqwSensorDataLatest, getMqwWeatherLatest } from '../../../lib/queries';
import { usePolling } from '../../../lib/polling';

const sondeMetricDefs = [
  { label: 'Water Temperature (°c)', labelKey: 'dashboard.waterTemperature', key: 'temp', icon: '/assets/metrics/temp.png', suffix: '°c' },
  { label: 'Salinity (ppt)', labelKey: 'dashboard.salinity', key: 'salinity', icon: '/assets/metrics/salinity.png', suffix: ' ppt' },
  { label: 'Chlorophyll (ug)', labelKey: 'dashboard.chlorophyll', key: 'chlorophyll', icon: '/assets/metrics/chlorophyll.png', suffix: ' ug' },
  { label: 'Dissolved Oxygen (mg/l)', labelKey: 'dashboard.dissolvedOxygen', key: 'dissolvedOxygen', icon: '/assets/metrics/oxygen.png', suffix: ' mg/l' },
  { label: 'pH', labelKey: 'dashboard.ph', key: 'ph', icon: '/assets/metrics/ph.png', suffix: ' pH' },
  { label: 'Turbidity (NTU)', labelKey: 'dashboard.turbidity', key: 'turbidity', icon: '/assets/metrics/turbidity.png', suffix: ' NTU' },
  { label: 'Blue-Green Algae (ug)', labelKey: 'dashboard.blueGreenAlgae', key: 'algae', icon: '/assets/metrics/algae.png', suffix: ' ug' },
  { label: 'Depth(m)', labelKey: 'dashboard.depth', key: 'depth', icon: '/assets/metrics/depth.png', suffix: ' m' },
  { label: 'Specific Conductivity(uS)', labelKey: 'dashboard.specificConductivity', key: 'conductivity', icon: '/assets/metrics/conductivity.png', suffix: ' uS' },
];

const weatherMetricDefs = [
  { label: 'Air Temperature (°c)', labelKey: 'dashboard.airTemperature', key: 'airTemp', icon: '/assets/weather/air_temp.png', suffix: '°c', fallback: '—' },
  { label: 'Relative Humidity (%)', labelKey: 'dashboard.relativeHumidity', key: 'humidity', icon: '/assets/weather/humidity.png', suffix: ' %', fallback: '—' },
  { label: 'AWS (m/s)', labelKey: 'dashboard.aws', key: 'windSpeed', icon: '/assets/weather/wind.png', suffix: ' m/s', fallback: '—' },
  { label: 'AWD (Degree)', labelKey: 'dashboard.awd', key: 'windDirection', icon: '/assets/weather/awd.png', suffix: '°', fallback: '—' },
  { label: 'Wind Gust (Wind Gust)', labelKey: 'dashboard.windGust', key: 'windGust', icon: '/assets/weather/gust.png', suffix: ' m/s', fallback: '—' },
  { label: 'Pressure (bar)', labelKey: 'dashboard.pressure', key: 'pressure', icon: '/assets/weather/pressure.png', suffix: ' mbar', fallback: '—' },
];

const MetricsGrid = ({ activeTab, selectedMetric, setSelectedMetric, isMobile = false, selectedBuoy }) => {
  const { t } = useTranslation();
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = async () => {
    if (!selectedBuoy?.id) return;
    try {
      // The Weather tab reads the weather feed; everything else reads the sonde feed.
      const data = activeTab === 'Weather'
        ? await getMqwWeatherLatest({ buoyId: selectedBuoy.id })
        : await getMqwSensorDataLatest({ buoyId: selectedBuoy.id });
      setLatestData(Array.isArray(data) ? data[0] : data);
    } catch (_) {
      // keep stale
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLatest();
  }, [selectedBuoy?.id, activeTab]);

  usePolling(fetchLatest, 60000);

  const buildMetrics = (defs) =>
    defs.map((def) => {
      let value = '—';
      if (def.key && latestData && latestData[def.key] != null) {
        value = `${Number(latestData[def.key]).toFixed(def.key === 'ph' ? 2 : 1)}${def.suffix ?? ''}`;
      } else if (def.fallback != null) {
        value = def.fallback;
      }
      return { ...def, value };
    });

  const baseMetricDefs = activeTab === 'Weather' ? weatherMetricDefs : sondeMetricDefs;
  const displayMetrics = loading ? baseMetricDefs.map((d) => ({ ...d, value: '…' })) : buildMetrics(baseMetricDefs);

  return (
    <div className="w-full">
      <div
        className="w-full grid gap-[10px] md:gap-[16px]"
        style={{
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gridAutoRows: '88px'
        }}
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
    </div>
  );
};

export default MetricsGrid;
