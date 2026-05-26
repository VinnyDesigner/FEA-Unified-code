import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, ZoomIn, ZoomOut, Search, Hand, Home, Printer, Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useLanguage } from '../contexts/LanguageContext';

// Robust unwrapper for legacy CommonJS highcharts-react-official wrapper in React 19/Vite ESM
const HighchartsReactComponent = (() => {
  if (!HighchartsReact) return null;
  if (typeof HighchartsReact === 'function' || HighchartsReact.$$typeof) return HighchartsReact;
  if (HighchartsReact.default) {
    const def = HighchartsReact.default;
    if (typeof def === 'function' || def.$$typeof) return def;
    if (def.default && (typeof def.default === 'function' || def.default.$$typeof)) return def.default;
  }
  if (HighchartsReact.HighchartsReact) {
    const hr = HighchartsReact.HighchartsReact;
    if (typeof hr === 'function' || hr.$$typeof) return hr;
  }
  return HighchartsReact;
})();

const createCustomIcon = (value, color, isSelected = false) => {
  const isYellow = (color === '#fcd34d');
  const textColor = isYellow ? '#854d0e' : 'white';
  const selectedStyle = isSelected 
    ? 'border: 3px solid #00f3ff; box-shadow: 0 0 15px #00f3ff, 0 0 5px rgba(0,0,0,0.4); transform: scale(1.2); z-index: 999;' 
    : 'border: 1.5px solid rgba(255,255,255,0.85);';
  return L.divIcon({
    className: 'custom-map-marker-icon',
    html: `<div class="custom-marker-pill" style="background:${color}; color:${textColor}; ${selectedStyle}">${value}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

/* ── Cloud-shaped pollutant icons ─────────────────────────────── */
const CloudPath = "M19.5 12.5c0-3.59-2.91-6.5-6.5-6.5-2.96 0-5.45 1.97-6.26 4.66C4.05 11.23 2 13.62 2 16.5 2 19.54 4.46 22 7.5 22h12c3.04 0 5.5-2.46 5.5-5.5 0-2.88-2.05-5.27-4.74-5.84-.18 0-.35-.16-.5-.16z";

const PM25Icon = () => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="10" cy="15" r="1.8" fill="white" />
    <circle cx="17" cy="15" r="1.8" fill="white" />
  </svg>
);

const PM10Icon = () => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="8.5" cy="15" r="1.4" fill="white" />
    <circle cx="13.5" cy="15" r="1.4" fill="white" />
    <circle cx="18.5" cy="15" r="1.4" fill="white" />
  </svg>
);

const ChemicalIcon = ({ label }) => (
  <svg className="p-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d={CloudPath} fill="#009FAC" />
    <circle cx="13.5" cy="15" r="5.5" fill="white" stroke="#009FAC" strokeWidth="1" />
    <text x="13.5" y="15.5" fill="#009FAC" fontSize="5.5" fontFamily="'Roboto', sans-serif"
      fontWeight="800" textAnchor="middle" dominantBaseline="middle">
      {label}
    </text>
  </svg>
);

/* ── Pollutant data ──────────────────────────────────────────── */
const pollutants = [
  { icon: <img src="/assets/AQMS/pollutants/PM2.5.png" alt="PM2.5" className="p-icon" />, name: 'PM2.5', val: '9', unit: '\u00B5g/m\u00B3', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/PM10.png" alt="PM10" className="p-icon" />, name: 'PM10', val: '18', unit: '\u00B5g/m\u00B3', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/CO.png" alt="CO" className="p-icon" />, name: 'CO', val: '0.3', unit: 'ppb', statusColor: '#84cc16' },
  { icon: <img src="/assets/AQMS/pollutants/o3.png" alt="O3" className="p-icon" />, name: 'O\u2083', val: '38', unit: 'ppb', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/No2.png" alt="NO2" className="p-icon" />, name: 'NO\u2082', val: '12', unit: 'ppb', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/So2.png" alt="SO2" className="p-icon" />, name: 'SO\u2082', val: '03', unit: 'ppb', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/Co2.png" alt="CO2" className="p-icon" />, name: 'CO\u2082', val: '04', unit: 'ppm', statusColor: '#fcd34d' },
  { icon: <img src="/assets/AQMS/pollutants/Ch4.png" alt="CH4" className="p-icon" />, name: 'CH\u2084', val: '0.1', unit: 'ppb', statusColor: '#f97316' },
  { icon: <img src="/assets/AQMS/pollutants/H2o.png" alt="H2S" className="p-icon" />, name: 'H\u2082S', val: '0.02', unit: 'ppm', statusColor: '#fcd34d' },
];

const stationsData = {
  'City Centre': {
    name: 'City Centre',
    lat: 25.1150,
    lng: 56.3150,
    aqi: 120,
    category: 'Unhealthy for Sensitive Groups',
    aqiColor: '#f97316',
    pm25: '14',
    pm10: '28',
    co: '0.45',
    o3: '52',
    no2: '18',
    so2: '05',
    co2: '04',
    ch4: '0.1',
    h2s: '0.02',
    nmhc: '1.2',
    windSpeed: '16',
    windDirection: '267',
    windUnit: 'Km/h',
    windDirText: 'W',
    windPill: 'Light breeze',
    temp: '24.59',
    pressure: '1008',
    solar: '1632',
    humidity: '72.2',
    idealTempText: 'Ideal Temperature',
    balancedPressureText: 'Balanced Air Pressure',
    highSolarText: 'High Solar Intensity',
    humidityNormalText: 'Humidity is normal',
    chartAqiData: [110, 115, 120, 125, 130, 122, 120, 114, 116, 118, 122, 124, 120],
    chartConcentrationData: {
      so2: [25, 28, 30, 32, 35, 30, 28, 25, 24, 26, 28, 30, 27],
      no2: [35, 38, 40, 42, 45, 40, 38, 35, 34, 36, 38, 40, 37],
      co: [15, 18, 20, 22, 25, 20, 18, 15, 14, 16, 18, 20, 17],
      pm10: [45, 48, 50, 52, 55, 50, 48, 45, 44, 46, 48, 50, 47],
      pm25: [55, 58, 60, 62, 65, 60, 58, 55, 54, 56, 58, 60, 57],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'City Centre', co: '0.25', co2: '03', o3: '35', no2: '10', so2: '02', pm25: '08', pm10: '16', ch4: '0.08', h2s: '01', nmhc: '1.0', temp: '24.10°C', hum: '73.5%', windSpd: '14 Km/h', windDir: '265° W' },
      { time: '24 Feb 2026 11:05', station: 'City Centre', co: '0.28', co2: '03', o3: '36', no2: '11', so2: '02', pm25: '08', pm10: '17', ch4: '0.09', h2s: '02', nmhc: '1.1', temp: '24.25°C', hum: '73.0%', windSpd: '15 Km/h', windDir: '266° W' },
      { time: '24 Feb 2026 11:10', station: 'City Centre', co: '0.30', co2: '04', o3: '38', no2: '12', so2: '03', pm25: '09', pm10: '18', ch4: '0.10', h2s: '02', nmhc: '1.2', temp: '24.59°C', hum: '72.2%', windSpd: '16 Km/h', windDir: '267° W' },
      { time: '24 Feb 2026 11:15', station: 'City Centre', co: '0.33', co2: '04', o3: '39', no2: '13', so2: '03', pm25: '09', pm10: '19', ch4: '0.12', h2s: '02', nmhc: '1.3', temp: '24.65°C', hum: '72.0%', windSpd: '17 Km/h', windDir: '268° W' },
      { time: '24 Feb 2026 11:20', station: 'City Centre', co: '0.36', co2: '05', o3: '40', no2: '14', so2: '04', pm25: '10', pm10: '20', ch4: '0.20', h2s: '03', nmhc: '1.5', temp: '24.72°C', hum: '71.8%', windSpd: '18 Km/h', windDir: '270° W' },
      { time: '24 Feb 2026 11:25', station: 'City Centre', co: '0.40', co2: '05', o3: '41', no2: '14', so2: '04', pm25: '10', pm10: '21', ch4: '0.20', h2s: '03', nmhc: '1.6', temp: '24.80°C', hum: '71.0%', windSpd: '18 Km/h', windDir: '269° W' },
      { time: '24 Feb 2026 11:30', station: 'City Centre', co: '0.45', co2: '06', o3: '42', no2: '15', so2: '05', pm25: '11', pm10: '22', ch4: '0.20', h2s: '04', nmhc: '1.8', temp: '24.90°C', hum: '70.5%', windSpd: '19 Km/h', windDir: '265° W' },
      { time: '24 Feb 2026 11:35', station: 'City Centre', co: '0.40', co2: '05', o3: '39', no2: '13', so2: '03', pm25: '10', pm10: '21', ch4: '0.10', h2s: '03', nmhc: '1.4', temp: '24.80°C', hum: '73.1%', windSpd: '17 Km/h', windDir: '268° W' },
      { time: '24 Feb 2026 11:40', station: 'City Centre', co: '0.35', co2: '04', o3: '38', no2: '12', so2: '02', pm25: '09', pm10: '19', ch4: '0.10', h2s: '02', nmhc: '1.3', temp: '24.60°C', hum: '73.5%', windSpd: '16 Km/h', windDir: '267° W' },
      { time: '24 Feb 2026 11:45', station: 'City Centre', co: '0.30', co2: '04', o3: '37', no2: '11', so2: '02', pm25: '08', pm10: '17', ch4: '0.10', h2s: '02', nmhc: '1.1', temp: '24.40°C', hum: '74.0%', windSpd: '15 Km/h', windDir: '266° W' },
      { time: '24 Feb 2026 11:50', station: 'City Centre', co: '0.28', co2: '04', o3: '36', no2: '10', so2: '02', pm25: '08', pm10: '16', ch4: '0.09', h2s: '01', nmhc: '1.0', temp: '24.25°C', hum: '74.5%', windSpd: '14 Km/h', windDir: '265° W' },
      { time: '24 Feb 2026 11:55', station: 'City Centre', co: '0.25', co2: '03', o3: '35', no2: '09', so2: '01', pm25: '07', pm10: '15', ch4: '0.08', h2s: '01', nmhc: '0.9', temp: '24.10°C', hum: '75.0%', windSpd: '13 Km/h', windDir: '264° W' }
    ]
  },
  'Mobile Station': {
    name: 'Mobile Station',
    lat: 25.1450,
    lng: 56.3400,
    aqi: 45,
    category: 'Good',
    aqiColor: '#84cc16',
    pm25: '5',
    pm10: '10',
    co: '0.1',
    o3: '22',
    no2: '6',
    so2: '01',
    co2: '02',
    ch4: '0.05',
    h2s: '0.01',
    nmhc: '0.6',
    windSpeed: '12',
    windDirection: '180',
    windUnit: 'Km/h',
    windDirText: 'S',
    windPill: 'Gentle breeze',
    temp: '22.10',
    pressure: '1012',
    solar: '1200',
    humidity: '65.4',
    idealTempText: 'Very Comfortable',
    balancedPressureText: 'Optimal Pressure',
    highSolarText: 'Moderate Solar Intensity',
    humidityNormalText: 'Humidity is optimal',
    chartAqiData: [40, 42, 45, 48, 50, 47, 45, 42, 43, 45, 46, 44, 45],
    chartConcentrationData: {
      so2: [12, 14, 15, 17, 18, 16, 15, 13, 14, 15, 16, 15, 14],
      no2: [22, 24, 25, 27, 28, 26, 25, 23, 24, 25, 26, 25, 24],
      co: [8, 9, 10, 11, 12, 10, 9, 8, 9, 10, 11, 10, 9],
      pm10: [25, 27, 28, 30, 31, 29, 28, 26, 27, 28, 29, 28, 27],
      pm25: [35, 37, 38, 40, 41, 39, 38, 36, 37, 38, 39, 38, 37],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Mobile Station', co: '0.08', co2: '01', o3: '18', no2: '04', so2: '01', pm25: '03', pm10: '07', ch4: '0.03', h2s: '01', nmhc: '0.4', temp: '21.80°C', hum: '66.8%', windSpd: '10 Km/h', windDir: '178° S' },
      { time: '24 Feb 2026 11:05', station: 'Mobile Station', co: '0.09', co2: '01', o3: '20', no2: '05', so2: '01', pm25: '04', pm10: '08', ch4: '0.04', h2s: '01', nmhc: '0.5', temp: '21.90°C', hum: '66.0%', windSpd: '11 Km/h', windDir: '179° S' },
      { time: '24 Feb 2026 11:10', station: 'Mobile Station', co: '0.10', co2: '02', o3: '22', no2: '06', so2: '01', pm25: '05', pm10: '10', ch4: '0.05', h2s: '01', nmhc: '0.6', temp: '22.10°C', hum: '65.4%', windSpd: '12 Km/h', windDir: '180° S' },
      { time: '24 Feb 2026 11:15', station: 'Mobile Station', co: '0.15', co2: '02', o3: '23', no2: '07', so2: '02', pm25: '05', pm10: '11', ch4: '0.05', h2s: '01', nmhc: '0.7', temp: '22.20°C', hum: '65.0%', windSpd: '13 Km/h', windDir: '182° S' },
      { time: '24 Feb 2026 11:20', station: 'Mobile Station', co: '0.20', co2: '03', o3: '24', no2: '08', so2: '02', pm25: '06', pm10: '12', ch4: '0.06', h2s: '02', nmhc: '0.8', temp: '22.30°C', hum: '64.8%', windSpd: '14 Km/h', windDir: '185° S' },
      { time: '24 Feb 2026 11:25', station: 'Mobile Station', co: '0.25', co2: '03', o3: '25', no2: '08', so2: '02', pm25: '06', pm10: '13', ch4: '0.06', h2s: '02', nmhc: '0.8', temp: '22.40°C', hum: '64.2%', windSpd: '15 Km/h', windDir: '183° S' },
      { time: '24 Feb 2026 11:30', station: 'Mobile Station', co: '0.30', co2: '04', o3: '26', no2: '09', so2: '03', pm25: '07', pm10: '14', ch4: '0.07', h2s: '03', nmhc: '0.9', temp: '22.50°C', hum: '63.5%', windSpd: '15 Km/h', windDir: '178° S' },
      { time: '24 Feb 2026 11:35', station: 'Mobile Station', co: '0.25', co2: '03', o3: '24', no2: '07', so2: '02', pm25: '06', pm10: '12', ch4: '0.06', h2s: '02', nmhc: '0.8', temp: '22.30°C', hum: '64.5%', windSpd: '13 Km/h', windDir: '181° S' },
      { time: '24 Feb 2026 11:40', station: 'Mobile Station', co: '0.18', co2: '02', o3: '23', no2: '06', so2: '01', pm25: '05', pm10: '11', ch4: '0.05', h2s: '01', nmhc: '0.7', temp: '22.20°C', hum: '65.0%', windSpd: '12 Km/h', windDir: '180° S' },
      { time: '24 Feb 2026 11:45', station: 'Mobile Station', co: '0.12', co2: '02', o3: '21', no2: '05', so2: '01', pm25: '04', pm10: '09', ch4: '0.04', h2s: '01', nmhc: '0.5', temp: '22.00°C', hum: '65.8%', windSpd: '11 Km/h', windDir: '179° S' },
      { time: '24 Feb 2026 11:50', station: 'Mobile Station', co: '0.10', co2: '02', o3: '20', no2: '04', so2: '01', pm25: '03', pm10: '08', ch4: '0.03', h2s: '01', nmhc: '0.4', temp: '21.90°C', hum: '66.2%', windSpd: '10 Km/h', windDir: '180° S' },
      { time: '24 Feb 2026 11:55', station: 'Mobile Station', co: '0.08', co2: '01', o3: '18', no2: '03', so2: '01', pm25: '03', pm10: '07', ch4: '0.03', h2s: '01', nmhc: '0.3', temp: '21.80°C', hum: '66.5%', windSpd: '09 Km/h', windDir: '181° S' }
    ]
  },
  'Qidfa': {
    name: 'Qidfa',
    lat: 25.1100,
    lng: 56.3300,
    aqi: 120,
    category: 'Unhealthy for Sensitive Groups',
    aqiColor: '#f97316',
    pm25: '15',
    pm10: '28',
    co: '0.5',
    o3: '52',
    no2: '20',
    so2: '06',
    co2: '06',
    ch4: '0.2',
    h2s: '0.04',
    nmhc: '2.0',
    windSpeed: '22',
    windDirection: '315',
    windUnit: 'Km/h',
    windDirText: 'NW',
    windPill: 'Strong breeze',
    temp: '26.80',
    pressure: '1004',
    solar: '1850',
    humidity: '78.5',
    idealTempText: 'Warm Atmosphere',
    balancedPressureText: 'Low Pressure Alert',
    highSolarText: 'Intense Solar Radiation',
    humidityNormalText: 'Humidity is high',
    chartAqiData: [110, 115, 120, 125, 130, 122, 120, 114, 116, 118, 122, 124, 120],
    chartConcentrationData: {
      so2: [45, 48, 50, 52, 55, 50, 48, 45, 44, 46, 48, 50, 47],
      no2: [65, 68, 70, 72, 75, 70, 68, 65, 64, 66, 68, 70, 67],
      co: [30, 33, 35, 37, 40, 35, 33, 30, 29, 31, 33, 35, 32],
      pm10: [75, 78, 80, 82, 85, 80, 78, 75, 74, 76, 78, 80, 77],
      pm25: [85, 88, 90, 92, 95, 90, 88, 85, 84, 86, 88, 90, 87],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Qidfa', co: '0.40', co2: '05', o3: '45', no2: '16', so2: '04', pm25: '12', pm10: '22', ch4: '0.15', h2s: '02', nmhc: '1.6', temp: '26.10°C', hum: '79.5%', windSpd: '18 Km/h', windDir: '310° NW' },
      { time: '24 Feb 2026 11:05', station: 'Qidfa', co: '0.45', co2: '05', o3: '48', no2: '18', so2: '05', pm25: '13', pm10: '25', ch4: '0.18', h2s: '03', nmhc: '1.8', temp: '26.40°C', hum: '79.0%', windSpd: '20 Km/h', windDir: '312° NW' },
      { time: '24 Feb 2026 11:10', station: 'Qidfa', co: '0.50', co2: '06', o3: '52', no2: '20', so2: '06', pm25: '15', pm10: '28', ch4: '0.20', h2s: '04', nmhc: '2.0', temp: '26.80°C', hum: '78.5%', windSpd: '22 Km/h', windDir: '315° NW' },
      { time: '24 Feb 2026 11:15', station: 'Qidfa', co: '0.55', co2: '06', o3: '53', no2: '21', so2: '06', pm25: '15', pm10: '29', ch4: '0.21', h2s: '04', nmhc: '2.1', temp: '26.90°C', hum: '78.2%', windSpd: '23 Km/h', windDir: '318° NW' },
      { time: '24 Feb 2026 11:20', station: 'Qidfa', co: '0.60', co2: '07', o3: '54', no2: '22', so2: '07', pm25: '16', pm10: '30', ch4: '0.22', h2s: '05', nmhc: '2.2', temp: '27.00°C', hum: '77.8%', windSpd: '24 Km/h', windDir: '320° NW' },
      { time: '24 Feb 2026 11:25', station: 'Qidfa', co: '0.65', co2: '07', o3: '55', no2: '23', so2: '07', pm25: '16', pm10: '31', ch4: '0.23', h2s: '05', nmhc: '2.3', temp: '27.10°C', hum: '77.2%', windSpd: '24 Km/h', windDir: '318° NW' },
      { time: '24 Feb 2026 11:30', station: 'Qidfa', co: '0.70', co2: '08', o3: '56', no2: '24', so2: '08', pm25: '17', pm10: '32', ch4: '0.25', h2s: '06', nmhc: '2.5', temp: '27.20°C', hum: '76.5%', windSpd: '25 Km/h', windDir: '312° NW' },
      { time: '24 Feb 2026 11:35', station: 'Qidfa', co: '0.65', co2: '07', o3: '53', no2: '21', so2: '06', pm25: '15', pm10: '29', ch4: '0.22', h2s: '04', nmhc: '2.1', temp: '27.00°C', hum: '77.8%', windSpd: '22 Km/h', windDir: '315° NW' },
      { time: '24 Feb 2026 11:40', station: 'Qidfa', co: '0.55', co2: '06', o3: '50', no2: '18', so2: '05', pm25: '14', pm10: '26', ch4: '0.18', h2s: '03', nmhc: '1.8', temp: '26.70°C', hum: '78.5%', windSpd: '20 Km/h', windDir: '314° NW' },
      { time: '24 Feb 2026 11:45', station: 'Qidfa', co: '0.45', co2: '05', o3: '47', no2: '15', so2: '04', pm25: '12', pm10: '23', ch4: '0.16', h2s: '02', nmhc: '1.7', temp: '26.30°C', hum: '79.0%', windSpd: '19 Km/h', windDir: '311° NW' },
      { time: '24 Feb 2026 11:50', station: 'Qidfa', co: '0.40', co2: '05', o3: '45', no2: '14', so2: '04', pm25: '11', pm10: '21', ch4: '0.14', h2s: '02', nmhc: '1.5', temp: '26.10°C', hum: '79.5%', windSpd: '18 Km/h', windDir: '310° NW' },
      { time: '24 Feb 2026 11:55', station: 'Qidfa', co: '0.35', co2: '04', o3: '42', no2: '12', so2: '03', pm25: '10', pm10: '19', ch4: '0.12', h2s: '01', nmhc: '1.3', temp: '25.90°C', hum: '80.0%', windSpd: '17 Km/h', windDir: '308° NW' }
    ]
  },
  'Lafarge Cems': {
    name: 'Lafarge Cems',
    lat: 25.1350,
    lng: 56.3050,
    aqi: 45,
    category: 'Good',
    aqiColor: '#84cc16',
    pm25: '4',
    pm10: '8',
    co: '0.1',
    o3: '20',
    no2: '5',
    so2: '01',
    co2: '02',
    ch4: '0.04',
    h2s: '0.01',
    nmhc: '0.5',
    windSpeed: '10',
    windDirection: '90',
    windUnit: 'Km/h',
    windDirText: 'E',
    windPill: 'Light air',
    temp: '23.15',
    pressure: '1010',
    solar: '1500',
    humidity: '68.2',
    idealTempText: 'Comfortable Temp',
    balancedPressureText: 'Standard Air Pressure',
    highSolarText: 'Optimal Solar Intensity',
    humidityNormalText: 'Humidity is normal',
    chartAqiData: [42, 44, 45, 47, 48, 46, 45, 43, 44, 45, 46, 45, 44],
    chartConcentrationData: {
      so2: [10, 12, 13, 14, 15, 14, 13, 11, 12, 13, 14, 13, 12],
      no2: [20, 22, 23, 24, 25, 24, 23, 21, 22, 23, 24, 23, 22],
      co: [7, 8, 9, 10, 11, 10, 9, 7, 8, 9, 10, 9, 8],
      pm10: [20, 22, 23, 24, 25, 24, 23, 21, 22, 23, 24, 23, 22],
      pm25: [30, 32, 33, 34, 35, 34, 33, 31, 32, 33, 34, 33, 32],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Lafarge Cems', co: '0.08', co2: '01', o3: '16', no2: '03', so2: '01', pm25: '03', pm10: '06', ch4: '0.02', h2s: '01', nmhc: '0.3', temp: '22.80°C', hum: '69.0%', windSpd: '08 Km/h', windDir: '86° E' },
      { time: '24 Feb 2026 11:05', station: 'Lafarge Cems', co: '0.09', co2: '01', o3: '18', no2: '04', so2: '01', pm25: '03', pm10: '07', ch4: '0.03', h2s: '01', nmhc: '0.4', temp: '22.95°C', hum: '68.5%', windSpd: '09 Km/h', windDir: '88° E' },
      { time: '24 Feb 2026 11:10', station: 'Lafarge Cems', co: '0.10', co2: '02', o3: '20', no2: '05', so2: '01', pm25: '04', pm10: '08', ch4: '0.04', h2s: '01', nmhc: '0.5', temp: '23.15°C', hum: '68.2%', windSpd: '10 Km/h', windDir: '90° E' },
      { time: '24 Feb 2026 11:15', station: 'Lafarge Cems', co: '0.15', co2: '02', o3: '20', no2: '05', so2: '01', pm25: '04', pm10: '09', ch4: '0.04', h2s: '01', nmhc: '0.5', temp: '23.20°C', hum: '68.0%', windSpd: '10 Km/h', windDir: '92° E' },
      { time: '24 Feb 2026 11:20', station: 'Lafarge Cems', co: '0.20', co2: '03', o3: '21', no2: '06', so2: '02', pm25: '05', pm10: '10', ch4: '0.05', h2s: '02', nmhc: '0.6', temp: '23.30°C', hum: '67.8%', windSpd: '11 Km/h', windDir: '95° E' },
      { time: '24 Feb 2026 11:25', station: 'Lafarge Cems', co: '0.25', co2: '03', o3: '22', no2: '06', so2: '02', pm25: '05', pm10: '11', ch4: '0.05', h2s: '02', nmhc: '0.6', temp: '23.40°C', hum: '67.0%', windSpd: '11 Km/h', windDir: '92° E' },
      { time: '24 Feb 2026 11:30', station: 'Lafarge Cems', co: '0.30', co2: '04', o3: '23', no2: '07', so2: '03', pm25: '06', pm10: '12', ch4: '0.06', h2s: '03', nmhc: '0.7', temp: '23.45°C', hum: '66.5%', windSpd: '12 Km/h', windDir: '88° E' },
      { time: '24 Feb 2026 11:35', station: 'Lafarge Cems', co: '0.22', co2: '03', o3: '21', no2: '06', so2: '02', pm25: '05', pm10: '11', ch4: '0.05', h2s: '02', nmhc: '0.6', temp: '23.30°C', hum: '67.5%', windSpd: '11 Km/h', windDir: '90° E' },
      { time: '24 Feb 2026 11:40', station: 'Lafarge Cems', co: '0.15', co2: '02', o3: '20', no2: '05', so2: '01', pm25: '04', pm10: '09', ch4: '0.04', h2s: '01', nmhc: '0.5', temp: '23.20°C', hum: '68.0%', windSpd: '10 Km/h', windDir: '89° E' },
      { time: '24 Feb 2026 11:45', station: 'Lafarge Cems', co: '0.10', co2: '02', o3: '19', no2: '04', so2: '01', pm25: '04', pm10: '08', ch4: '0.03', h2s: '01', nmhc: '0.4', temp: '23.00°C', hum: '68.8%', windSpd: '09 Km/h', windDir: '87° E' },
      { time: '24 Feb 2026 11:50', station: 'Lafarge Cems', co: '0.09', co2: '01', o3: '18', no2: '03', so2: '01', pm25: '03', pm10: '07', ch4: '0.02', h2s: '01', nmhc: '0.3', temp: '22.90°C', hum: '69.2%', windSpd: '08 Km/h', windDir: '88° E' },
      { time: '24 Feb 2026 11:55', station: 'Lafarge Cems', co: '0.08', co2: '01', o3: '17', no2: '03', so2: '01', pm25: '03', pm10: '06', ch4: '0.02', h2s: '01', nmhc: '0.3', temp: '22.80°C', hum: '69.5%', windSpd: '08 Km/h', windDir: '89° E' }
    ]
  },
  'Fujairah Port': {
    name: 'Fujairah Port',
    lat: 25.1200,
    lng: 56.3550,
    aqi: 150,
    category: 'Unhealthy',
    aqiColor: '#ef4444',
    pm25: '25',
    pm10: '45',
    co: '0.8',
    o3: '68',
    no2: '28',
    so2: '09',
    co2: '08',
    ch4: '0.3',
    h2s: '0.06',
    nmhc: '2.8',
    windSpeed: '28',
    windDirection: '45',
    windUnit: 'Km/h',
    windDirText: 'NE',
    windPill: 'High breeze',
    temp: '27.50',
    pressure: '1002',
    solar: '1900',
    humidity: '82.0',
    idealTempText: 'Warm & Humid',
    balancedPressureText: 'Low Pressure Alert',
    highSolarText: 'Extremely High Solar',
    humidityNormalText: 'Humidity is very high',
    chartAqiData: [130, 135, 140, 145, 150, 142, 140, 136, 138, 142, 145, 148, 150],
    chartConcentrationData: {
      so2: [55, 58, 60, 62, 65, 60, 58, 55, 54, 56, 58, 60, 57],
      no2: [75, 78, 80, 82, 85, 80, 78, 75, 74, 76, 78, 80, 77],
      co: [40, 43, 45, 47, 50, 45, 43, 40, 39, 41, 43, 45, 42],
      pm10: [85, 88, 90, 92, 95, 90, 88, 85, 84, 86, 88, 90, 87],
      pm25: [95, 98, 100, 102, 105, 100, 98, 95, 94, 96, 98, 100, 97],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Fujairah Port', co: '0.70', co2: '07', o3: '60', no2: '24', so2: '07', pm25: '22', pm10: '38', ch4: '0.25', h2s: '04', nmhc: '2.4', temp: '26.90°C', hum: '83.5%', windSpd: '24 Km/h', windDir: '42° NE' },
      { time: '24 Feb 2026 11:05', station: 'Fujairah Port', co: '0.75', co2: '08', o3: '64', no2: '26', so2: '08', pm25: '23', pm10: '42', ch4: '0.28', h2s: '05', nmhc: '2.6', temp: '27.20°C', hum: '82.8%', windSpd: '26 Km/h', windDir: '44° NE' },
      { time: '24 Feb 2026 11:10', station: 'Fujairah Port', co: '0.80', co2: '08', o3: '68', no2: '28', so2: '09', pm25: '25', pm10: '45', ch4: '0.30', h2s: '06', nmhc: '2.8', temp: '27.50°C', hum: '82.0%', windSpd: '28 Km/h', windDir: '45° NE' },
      { time: '24 Feb 2026 11:15', station: 'Fujairah Port', co: '0.85', co2: '09', o3: '69', no2: '29', so2: '09', pm25: '25', pm10: '46', ch4: '0.31', h2s: '06', nmhc: '2.9', temp: '27.60°C', hum: '81.8%', windSpd: '29 Km/h', windDir: '48° NE' },
      { time: '24 Feb 2026 11:20', station: 'Fujairah Port', co: '0.90', co2: '09', o3: '70', no2: '30', so2: '10', pm25: '26', pm10: '48', ch4: '0.32', h2s: '07', nmhc: '3.0', temp: '27.70°C', hum: '81.5%', windSpd: '30 Km/h', windDir: '50° NE' },
      { time: '24 Feb 2026 11:25', station: 'Fujairah Port', co: '0.95', co2: '10', o3: '71', no2: '31', so2: '10', pm25: '26', pm10: '49', ch4: '0.33', h2s: '07', nmhc: '3.1', temp: '27.80°C', hum: '81.0%', windSpd: '31 Km/h', windDir: '48° NE' },
      { time: '24 Feb 2026 11:30', station: 'Fujairah Port', co: '1.00', co2: '10', o3: '72', no2: '32', so2: '11', pm25: '27', pm10: '50', ch4: '0.35', h2s: '08', nmhc: '3.2', temp: '27.90°C', hum: '80.2%', windSpd: '32 Km/h', windDir: '40° NE' },
      { time: '24 Feb 2026 11:35', station: 'Fujairah Port', co: '0.92', co2: '09', o3: '69', no2: '29', so2: '09', pm25: '25', pm10: '46', ch4: '0.31', h2s: '06', nmhc: '2.9', temp: '27.70°C', hum: '81.2%', windSpd: '29 Km/h', windDir: '44° NE' },
      { time: '24 Feb 2026 11:40', station: 'Fujairah Port', co: '0.80', co2: '08', o3: '67', no2: '27', so2: '08', pm25: '24', pm10: '43', ch4: '0.28', h2s: '05', nmhc: '2.7', temp: '27.40°C', hum: '82.0%', windSpd: '26 Km/h', windDir: '46° NE' },
      { time: '24 Feb 2026 11:45', station: 'Fujairah Port', co: '0.72', co2: '07', o3: '63', no2: '25', so2: '07', pm25: '22', pm10: '40', ch4: '0.26', h2s: '04', nmhc: '2.5', temp: '27.00°C', hum: '83.0%', windSpd: '25 Km/h', windDir: '43° NE' },
      { time: '24 Feb 2026 11:50', station: 'Fujairah Port', co: '0.68', co2: '06', o3: '60', no2: '23', so2: '06', pm25: '20', pm10: '38', ch4: '0.24', h2s: '03', nmhc: '2.3', temp: '26.80°C', hum: '83.5%', windSpd: '24 Km/h', windDir: '42° NE' },
      { time: '24 Feb 2026 11:55', station: 'Fujairah Port', co: '0.62', co2: '05', o3: '56', no2: '20', so2: '05', pm25: '18', pm10: '35', ch4: '0.22', h2s: '03', nmhc: '2.1', temp: '26.50°C', hum: '84.0%', windSpd: '22 Km/h', windDir: '40° NE' }
    ]
  },
  'Fujairah Stadium': {
    name: 'Fujairah Stadium',
    lat: 25.1288,
    lng: 56.3265,
    aqi: 77,
    category: 'Moderate',
    aqiColor: '#fcd34d',
    pm25: '8',
    pm10: '17',
    co: '0.28',
    o3: '36',
    no2: '11',
    so2: '02',
    co2: '03',
    ch4: '0.08',
    h2s: '0.02',
    nmhc: '1.1',
    windSpeed: '14',
    windDirection: '260',
    windUnit: 'Km/h',
    windDirText: 'W',
    windPill: 'Light breeze',
    temp: '24.20',
    pressure: '1007',
    solar: '1600',
    humidity: '71.5',
    idealTempText: 'Ideal Temperature',
    balancedPressureText: 'Balanced Air Pressure',
    highSolarText: 'High Solar Intensity',
    humidityNormalText: 'Humidity is normal',
    chartAqiData: [68, 72, 77, 80, 82, 78, 76, 72, 74, 76, 77, 79, 77],
    chartConcentrationData: {
      so2: [22, 25, 27, 29, 31, 28, 26, 23, 24, 25, 26, 28, 27],
      no2: [32, 35, 37, 39, 41, 38, 36, 33, 34, 35, 36, 38, 37],
      co: [12, 15, 17, 19, 21, 18, 16, 13, 14, 15, 16, 18, 17],
      pm10: [42, 45, 47, 49, 51, 48, 46, 43, 44, 45, 46, 48, 47],
      pm25: [52, 55, 57, 59, 61, 58, 56, 53, 54, 55, 56, 58, 57],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Fujairah Stadium', co: '0.22', co2: '02', o3: '32', no2: '08', so2: '01', pm25: '06', pm10: '14', ch4: '0.06', h2s: '01', nmhc: '0.9', temp: '23.80°C', hum: '72.8%', windSpd: '12 Km/h', windDir: '255° W' },
      { time: '24 Feb 2026 11:05', station: 'Fujairah Stadium', co: '0.25', co2: '02', o3: '34', no2: '09', so2: '01', pm25: '07', pm10: '15', ch4: '0.07', h2s: '01', nmhc: '1.0', temp: '24.00°C', hum: '72.0%', windSpd: '13 Km/h', windDir: '258° W' },
      { time: '24 Feb 2026 11:10', station: 'Fujairah Stadium', co: '0.28', co2: '03', o3: '36', no2: '11', so2: '02', pm25: '08', pm10: '17', ch4: '0.08', h2s: '02', nmhc: '1.1', temp: '24.20°C', hum: '71.5%', windSpd: '14 Km/h', windDir: '260° W' },
      { time: '24 Feb 2026 11:15', station: 'Fujairah Stadium', co: '0.29', co2: '03', o3: '37', no2: '12', so2: '02', pm25: '08', pm10: '18', ch4: '0.09', h2s: '02', nmhc: '1.2', temp: '24.30°C', hum: '71.2%', windSpd: '15 Km/h', windDir: '263° W' },
      { time: '24 Feb 2026 11:20', station: 'Fujairah Stadium', co: '0.30', co2: '04', o3: '38', no2: '13', so2: '03', pm25: '09', pm10: '19', ch4: '0.10', h2s: '03', nmhc: '1.3', temp: '24.40°C', hum: '70.8%', windSpd: '16 Km/h', windDir: '265° W' },
      { time: '24 Feb 2026 11:25', station: 'Fujairah Stadium', co: '0.35', co2: '04', o3: '39', no2: '13', so2: '03', pm25: '09', pm10: '20', ch4: '0.11', h2s: '03', nmhc: '1.4', temp: '24.50°C', hum: '70.2%', windSpd: '16 Km/h', windDir: '262° W' },
      { time: '24 Feb 2026 11:30', station: 'Fujairah Stadium', co: '0.40', co2: '05', o3: '40', no2: '14', so2: '04', pm25: '10', pm10: '21', ch4: '0.12', h2s: '04', nmhc: '1.5', temp: '24.60°C', hum: '69.5%', windSpd: '17 Km/h', windDir: '258° W' },
      { time: '24 Feb 2026 11:35', station: 'Fujairah Stadium', co: '0.32', co2: '04', o3: '37', no2: '12', so2: '03', pm25: '09', pm10: '19', ch4: '0.10', h2s: '03', nmhc: '1.3', temp: '24.40°C', hum: '70.5%', windSpd: '15 Km/h', windDir: '261° W' },
      { time: '24 Feb 2026 11:40', station: 'Fujairah Stadium', co: '0.26', co2: '03', o3: '35', no2: '10', so2: '02', pm25: '07', pm10: '16', ch4: '0.08', h2s: '02', nmhc: '1.1', temp: '24.10°C', hum: '71.5%', windSpd: '13 Km/h', windDir: '259° W' },
      { time: '24 Feb 2026 11:45', station: 'Fujairah Stadium', co: '0.20', co2: '02', o3: '33', no2: '08', so2: '01', pm25: '06', pm10: '13', ch4: '0.07', h2s: '01', nmhc: '0.9', temp: '23.90°C', hum: '72.5%', windSpd: '11 Km/h', windDir: '256° W' },
      { time: '24 Feb 2026 11:50', station: 'Fujairah Stadium', co: '0.18', co2: '02', o3: '32', no2: '07', so2: '01', pm25: '05', pm10: '12', ch4: '0.06', h2s: '01', nmhc: '0.8', temp: '23.80°C', hum: '72.8%', windSpd: '10 Km/h', windDir: '255° W' },
      { time: '24 Feb 2026 11:55', station: 'Fujairah Stadium', co: '0.15', co2: '01', o3: '30', no2: '06', so2: '01', pm25: '05', pm10: '11', ch4: '0.05', h2s: '01', nmhc: '0.7', temp: '23.60°C', hum: '73.2%', windSpd: '09 Km/h', windDir: '254° W' }
    ]
  },
  'Sakamkam': {
    name: 'Sakamkam',
    lat: 25.1050,
    lng: 56.3450,
    aqi: 180,
    category: 'Unhealthy',
    aqiColor: '#ef4444',
    pm25: '35',
    pm10: '58',
    co: '1.2',
    o3: '82',
    no2: '38',
    so2: '12',
    co2: '10',
    ch4: '0.4',
    h2s: '08',
    nmhc: '3.5',
    windSpeed: '32',
    windDirection: '330',
    windUnit: 'Km/h',
    windDirText: 'NW',
    windPill: 'High wind warning',
    temp: '28.10',
    pressure: '998',
    solar: '1950',
    humidity: '85.2',
    idealTempText: 'Extremely Hot',
    balancedPressureText: 'Severe Low Pressure',
    highSolarText: 'Extreme UV Danger',
    humidityNormalText: 'Humidity is extremely high',
    chartAqiData: [160, 165, 170, 175, 180, 172, 170, 164, 166, 168, 172, 176, 180],
    chartConcentrationData: {
      so2: [65, 68, 70, 72, 75, 70, 68, 65, 64, 66, 68, 70, 67],
      no2: [85, 88, 90, 92, 95, 90, 88, 85, 84, 86, 88, 90, 87],
      co: [50, 53, 55, 57, 60, 55, 53, 50, 49, 51, 53, 55, 52],
      pm10: [95, 98, 100, 102, 105, 100, 98, 95, 94, 96, 98, 100, 97],
      pm25: [105, 108, 110, 112, 115, 110, 108, 105, 104, 106, 108, 110, 107],
    },
    tabular: [
      { time: '24 Feb 2026 11:00', station: 'Sakamkam', co: '1.00', co2: '08', o3: '75', no2: '32', so2: '09', pm25: '30', pm10: '50', ch4: '0.32', h2s: '06', nmhc: '3.0', temp: '27.40°C', hum: '86.5%', windSpd: '26 Km/h', windDir: '326° NW' },
      { time: '24 Feb 2026 11:05', station: 'Sakamkam', co: '1.10', co2: '09', o3: '78', no2: '35', so2: '10', pm25: '32', pm10: '54', ch4: '0.35', h2s: '07', nmhc: '3.2', temp: '27.70°C', hum: '85.8%', windSpd: '29 Km/h', windDir: '328° NW' },
      { time: '24 Feb 2026 11:10', station: 'Sakamkam', co: '1.20', co2: '10', o3: '82', no2: '38', so2: '12', pm25: '35', pm10: '58', ch4: '0.40', h2s: '08', nmhc: '3.5', temp: '28.10°C', hum: '85.2%', windSpd: '32 Km/h', windDir: '330° NW' },
      { time: '24 Feb 2026 11:15', station: 'Sakamkam', co: '1.25', co2: '10', o3: '83', no2: '39', so2: '12', pm25: '35', pm10: '59', ch4: '0.41', h2s: '08', nmhc: '3.6', temp: '28.20°C', hum: '85.0%', windSpd: '33 Km/h', windDir: '332° NW' },
      { time: '24 Feb 2026 11:20', station: 'Sakamkam', co: '1.30', co2: '11', o3: '85', no2: '40', so2: '13', pm25: '36', pm10: '60', ch4: '0.42', h2s: '09', nmhc: '3.8', temp: '28.30°C', hum: '84.8%', windSpd: '34 Km/h', windDir: '335° NW' },
      { time: '24 Feb 2026 11:25', station: 'Sakamkam', co: '1.35', co2: '11', o3: '86', no2: '41', so2: '13', pm25: '36', pm10: '61', ch4: '0.43', h2s: '09', nmhc: '3.9', temp: '28.40°C', hum: '84.2%', windSpd: '35 Km/h', windDir: '332° NW' },
      { time: '24 Feb 2026 11:30', station: 'Sakamkam', co: '1.40', co2: '12', o3: '88', no2: '42', so2: '14', pm25: '37', pm10: '62', ch4: '0.45', h2s: '10', nmhc: '4.0', temp: '28.50°C', hum: '83.5%', windSpd: '36 Km/h', windDir: '328° NW' },
      { time: '24 Feb 2026 11:35', station: 'Sakamkam', co: '1.30', co2: '11', o3: '85', no2: '39', so2: '12', pm25: '35', pm10: '59', ch4: '0.41', h2s: '08', nmhc: '3.7', temp: '28.30°C', hum: '84.5%', windSpd: '33 Km/h', windDir: '331° NW' },
      { time: '24 Feb 2026 11:40', station: 'Sakamkam', co: '1.20', co2: '10', o3: '81', no2: '36', so2: '11', pm25: '33', pm10: '55', ch4: '0.38', h2s: '07', nmhc: '3.4', temp: '28.00°C', hum: '85.2%', windSpd: '30 Km/h', windDir: '329° NW' },
      { time: '24 Feb 2026 11:45', station: 'Sakamkam', co: '1.05', co2: '09', o3: '77', no2: '33', so2: '09', pm25: '31', pm10: '51', ch4: '0.34', h2s: '06', nmhc: '3.1', temp: '27.60°C', hum: '86.0%', windSpd: '27 Km/h', windDir: '327° NW' },
      { time: '24 Feb 2026 11:50', station: 'Sakamkam', co: '1.00', co2: '08', o3: '75', no2: '32', so2: '09', pm25: '30', pm10: '50', ch4: '0.32', h2s: '06', nmhc: '3.0', temp: '27.40°C', hum: '86.5%', windSpd: '26 Km/h', windDir: '326° NW' },
      { time: '24 Feb 2026 11:55', station: 'Sakamkam', co: '0.90', co2: '07', o3: '70', no2: '29', so2: '08', pm25: '27', pm10: '46', ch4: '0.28', h2s: '05', nmhc: '2.7', temp: '27.00°C', hum: '87.0%', windSpd: '24 Km/h', windDir: '324° NW' }
    ]
  }
};

const MapController = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);
  return null;
};

const LiveData = () => {
  const { lang, t } = useLanguage();
  const isRtl = lang === 'ar';
  const navigate = useNavigate();

  const translateDateTime = (timeStr) => {
    if (!isRtl || !timeStr) return timeStr;
    return timeStr
      .replace('Jan', 'يناير')
      .replace('Feb', 'فبراير')
      .replace('Mar', 'مارس')
      .replace('Apr', 'أبريل')
      .replace('May', 'مايو')
      .replace('Jun', 'يونيو')
      .replace('Jul', 'يوليو')
      .replace('Aug', 'أغسطس')
      .replace('Sep', 'سبتمبر')
      .replace('Oct', 'أكتوبر')
      .replace('Nov', 'نوفمبر')
      .replace('Dec', 'ديسمبر');
  };

  const translateWindSpeed = (speedStr) => {
    if (!isRtl || !speedStr) return speedStr;
    return speedStr.replace('Km/h', 'كم/ساعة');
  };

  const translateWindDir = (dirStr) => {
    if (!isRtl || !dirStr) return dirStr;
    return dirStr
      .replace(' W', ' غرب')
      .replace(' E', ' شرق')
      .replace(' N', ' شمال')
      .replace(' S', ' جنوب')
      .replace(' NW', ' شمال غرب')
      .replace(' NE', ' شمال شرق')
      .replace(' SW', ' جنوب غرب')
      .replace(' SE', ' جنوب شرق');
  };

  // Full Screen Chart Modal States & Zoom Reference
  const [modalChartType, setModalChartType] = useState('Line');
  const [modalOptimizeData, setModalOptimizeData] = useState(true);
  const [modalMaxPoints, setModalMaxPoints] = useState(2000);
  const [modalShowMarkers, setModalShowMarkers] = useState(true);
  const [modalShowDashes, setModalShowDashes] = useState(false);
  const [modalShowTooltip, setModalShowTooltip] = useState(true);
  const [modalShowAnimation, setModalShowAnimation] = useState(true);
  const [activeTool, setActiveTool] = useState('zoom'); // 'zoom', 'pan', 'select'
  const [isMobileResponsive, setIsMobileResponsive] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileResponsive(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.15;
      chart.xAxis[0].setExtremes(min + step, max - step);
    }
  };

  const handleZoomOut = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max, dataMin, dataMax } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.2;
      const newMin = Math.max(dataMin, min - step);
      const newMax = Math.min(dataMax, max + step);
      chart.xAxis[0].setExtremes(newMin, newMax);
    }
  };

  const handleReset = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.xAxis[0].setExtremes(null, null);
    }
  };

  const handlePan = (direction) => {
    const chart = chartRef.current?.chart;
    if (chart) {
      const { min, max, dataMin, dataMax } = chart.xAxis[0].getExtremes();
      const range = max - min;
      const step = range * 0.25;
      if (direction === 'left') {
        const newMin = Math.max(dataMin, min - step);
        const newMax = newMin + range;
        chart.xAxis[0].setExtremes(newMin, newMax);
      } else {
        const newMax = Math.min(dataMax, max + step);
        const newMin = newMax - range;
        chart.xAxis[0].setExtremes(newMin, newMax);
      }
    }
  };

  const handlePrint = () => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.print();
    }
  };

  const getToolbarTitle = (key, fallback) => {
    const map = {
      'Zoom In': isRtl ? 'تكبير' : 'Zoom In',
      'Zoom Out': isRtl ? 'تصغير' : 'Zoom Out',
      'Select Zoom': isRtl ? 'تحديد التكبير' : 'Select Zoom',
      'Pan Mode': isRtl ? 'وضع التحريك' : 'Pan Mode',
      'Pan Left': isRtl ? 'تحريك لليسار' : 'Pan Left',
      'Pan Right': isRtl ? 'تحريك لليمين' : 'Pan Right',
      'Reset/Home': isRtl ? 'إعادة تعيين' : 'Reset/Home',
      'Print': isRtl ? 'طباعة' : 'Print',
      'Menu': isRtl ? 'القائمة' : 'Menu'
    };
    return map[key] || fallback;
  };

  const getModalChartOptions = () => {
    const baseOptions = expandedChart === 'aqi' ? aqiChartOptions : concChartOptions;
    
    let seriesType = 'spline';
    if (modalChartType === 'Bars') {
      seriesType = 'column';
    } else if (modalChartType === 'Dots') {
      seriesType = 'scatter';
    }

    const seriesConfig = {
      lineWidth: modalChartType === 'Dots' ? 0 : 3,
      step: modalChartType === 'Step Line' ? 'center' : undefined,
      dashStyle: modalShowDashes ? 'Dash' : 'Solid',
      animation: modalShowAnimation,
      marker: {
        enabled: modalShowMarkers || modalChartType === 'Dots',
        radius: modalChartType === 'Dots' ? 5 : 4
      }
    };

    const options = {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: seriesType,
        height: isMobileResponsive ? 300 : 450,
        spacing: [15, 15, 15, 15]
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        ...baseOptions.plotOptions,
        spline: {
          ...(baseOptions.plotOptions?.spline || {}),
          ...seriesConfig
        },
        line: {
          ...seriesConfig
        },
        column: {
          animation: modalShowAnimation
        },
        scatter: {
          ...seriesConfig,
          marker: {
            enabled: true,
            radius: 6
          }
        }
      },
      tooltip: {
        ...baseOptions.tooltip,
        enabled: modalShowTooltip
      }
    };

    if (modalOptimizeData) {
      options.series = options.series.map(s => {
        const slicedData = s.data ? s.data.slice(0, modalMaxPoints) : [];
        return {
          ...s,
          data: slicedData
        };
      });
    }

    return options;
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [isAqiFlipped, setIsAqiFlipped] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const toggleMapFullscreen = () => {
    const mapCardEl = document.querySelector('.map-card');
    if (!mapCardEl) return;
    
    if (!document.fullscreenElement) {
      mapCardEl.requestFullscreen().then(() => {
        setTimeout(() => {
          mapInstance?.invalidateSize();
        }, 150);
      }).catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setTimeout(() => {
          mapInstance?.invalidateSize();
        }, 150);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 150);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mapInstance]);

  const [selectedStations, setSelectedStations] = useState('City Centre');
  const [selectedDate, setSelectedDate] = useState('Live Data');
  const [selectedView, setSelectedView] = useState('Graph View');
  
  // Custom date range states for LiveData page
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-24');
  const [currentPage, setCurrentPage] = useState(3);
  const [activeAccordionIdx, setActiveAccordionIdx] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const currentStation = stationsData[selectedStations] || stationsData['City Centre'];

  const pollutants = [
    { icon: <img src="/assets/AQMS/pollutants/PM2.5.png" alt="PM2.5" className="p-icon" />, name: 'PM2.5', val: currentStation.pm25, unit: '\u00B5g/m\u00B3', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/PM10.png" alt="PM10" className="p-icon" />, name: 'PM10', val: currentStation.pm10, unit: '\u00B5g/m\u00B3', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/CO.png" alt="CO" className="p-icon" />, name: 'CO', val: currentStation.co, unit: 'ppb', statusColor: '#84cc16' },
    { icon: <img src="/assets/AQMS/pollutants/o3.png" alt="O3" className="p-icon" />, name: 'O\u2083', val: currentStation.o3, unit: 'ppb', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/No2.png" alt="NO2" className="p-icon" />, name: 'NO\u2082', val: currentStation.no2, unit: 'ppb', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/So2.png" alt="SO2" className="p-icon" />, name: 'SO\u2082', val: currentStation.so2, unit: 'ppb', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/Co2.png" alt="CO2" className="p-icon" />, name: 'CO\u2082', val: currentStation.co2, unit: 'ppm', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/Ch4.png" alt="CH4" className="p-icon" />, name: 'CH\u2084', val: currentStation.ch4, unit: 'ppb', statusColor: currentStation.aqiColor },
    { icon: <img src="/assets/AQMS/pollutants/H2o.png" alt="H2S" className="p-icon" />, name: 'H\u2082S', val: currentStation.h2s, unit: 'ppm', statusColor: currentStation.aqiColor },
  ];

  const tabularData = {
    1: currentStation.tabular,
    2: currentStation.tabular.map((r, i) => ({
      ...r,
      time: r.time.replace('11:', '10:'),
      co: (parseFloat(r.co) * 0.95).toFixed(2),
      o3: Math.round(parseFloat(r.o3) * 0.95),
      pm25: String(Math.round(parseInt(r.pm25) * 0.95)).padStart(2, '0')
    })),
    3: currentStation.tabular.map((r, i) => ({
      ...r,
      time: r.time.replace('11:', '09:'),
      co: (parseFloat(r.co) * 0.9).toFixed(2),
      o3: Math.round(parseFloat(r.o3) * 0.9),
      pm25: String(Math.round(parseInt(r.pm25) * 0.9)).padStart(2, '0')
    })),
    4: currentStation.tabular.map((r, i) => ({
      ...r,
      time: r.time.replace('11:', '08:'),
      co: (parseFloat(r.co) * 1.05).toFixed(2),
      o3: Math.round(parseFloat(r.o3) * 1.05),
      pm25: String(Math.round(parseInt(r.pm25) * 1.05)).padStart(2, '0')
    })),
    5: currentStation.tabular.map((r, i) => ({
      ...r,
      time: r.time.replace('11:', '07:'),
      co: (parseFloat(r.co) * 1.1).toFixed(2),
      o3: Math.round(parseFloat(r.o3) * 1.1),
      pm25: String(Math.round(parseInt(r.pm25) * 1.1)).padStart(2, '0')
    }))
  };

  const getSortedTabularData = () => {
    const rawData = tabularData[currentPage] || [];
    const sorted = [...rawData];
    sorted.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  };

  const toggleDateSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    if (mapInstance && selectedStations) {
      const station = stationsData[selectedStations];
      if (station) {
        mapInstance.setView([station.lat, station.lng], 12.5, {
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [selectedStations, mapInstance]);

  const [selectedParams, setSelectedParams] = useState(['SO2', 'NO2', 'CO', 'PM10', 'PM2.5']);
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);
  const [aqiDownloadOpen, setAqiDownloadOpen] = useState(false);
  const [concDownloadOpen, setConcDownloadOpen] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleDownload = (chartName, format) => {
    setAqiDownloadOpen(false);
    setConcDownloadOpen(false);
    setToastMessage(`Exporting ${chartName} as ${format}...`);
    setTimeout(() => {
      setToastMessage(`${chartName} successfully saved as ${format}!`);
      setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    }, 1200);
  };

  /* ── Highcharts Settings: Last 24hrs Air Quality Index ── */
  const aqiChartOptions = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 260,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [10, 5, 5, 5],
    },
    title: { text: null },
    xAxis: {
      categories: ['1:00PM', '2:00PM', '3:00PM', '4:00PM', '5:00PM', '6:00PM', '7:00PM', '8:00PM', '9:00PM', '10:00PM', '11:00PM', '12:00PM', '1:00AM'],
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      labels: {
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      max: 300,
      tickInterval: 50,
      title: { text: null },
      gridLineColor: 'rgba(0,0,0,0.05)',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      useHTML: true,
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderRadius: 10,
      borderColor: 'rgba(255,255,255,1)',
      shadow: {
        color: 'rgba(0,0,0,0.08)',
        offsetX: 0,
        offsetY: 4,
        opacity: 0.8,
        width: 12
      },
      padding: 10,
      formatter: function () {
        return `
          <div style="font-family:'Roboto',sans-serif; text-align:center; padding:2px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:4px;">
              <span style="width:10px; height:10px; background:${currentStation.aqiColor}; border-radius:50%; display:inline-block;"></span>
              <strong style="color:#111; font-size:0.875rem;">${this.y} AQI</strong>
              <span style="color:#6b7280; font-size:0.75rem; margin-left:4px;">20 Feb, 2:00PM</span>
            </div>
            <div style="color:#6b7280; font-size:0.72rem; font-weight:500;">PM10 - 50 ug/m³</div>
          </div>
        `;
      }
    },
    plotOptions: {
      spline: {
        lineWidth: 3,
        color: currentStation.aqiColor,
        marker: {
          enabled: true,
          radius: 4,
          fillColor: currentStation.aqiColor,
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        states: { hover: { lineWidth: 4 } }
      }
    },
    series: [{
      name: 'AQI Index',
      data: currentStation.chartAqiData
    }]
  };

  /* ── Highcharts Settings: Last 24hrs Concentration ── */
  const concChartOptions = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 260,
      style: { fontFamily: "'Roboto', sans-serif" },
      spacing: [10, 5, 5, 5],
    },
    title: { text: null },
    xAxis: {
      categories: ['1:00PM', '2:00PM', '3:00PM', '4:00PM', '5:00PM', '6:00PM', '7:00PM', '8:00PM', '9:00PM', '10:00PM', '11:00PM', '12:00PM'],
      gridLineWidth: 0,
      lineColor: 'rgba(0,0,0,0.06)',
      labels: {
        style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' }
      },
      tickColor: 'rgba(0,0,0,0.06)',
    },
    yAxis: {
      min: 0,
      max: 250,
      tickInterval: 50,
      title: {
        text: 'CO(mg/m³)   ug/m³',
        style: { color: '#6b7280', fontSize: '0.72rem', fontWeight: '600' }
      },
      gridLineColor: 'rgba(0,0,0,0.05)',
      labels: { style: { fontSize: '0.72rem', color: '#6b7280', fontWeight: '500' } }
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 8,
      borderColor: 'rgba(0,0,0,0.05)',
      shadow: true,
      style: { fontSize: '0.8rem' }
    },
    plotOptions: {
      spline: {
        lineWidth: 2,
        marker: { enabled: false },
        states: { hover: { lineWidth: 2.5 } }
      }
    },
    series: [
      { name: 'SO2',   data: currentStation.chartConcentrationData.so2, color: '#3b82f6' },
      { name: 'NO2',   data: currentStation.chartConcentrationData.no2, color: '#0ea5e9' },
      { name: 'CO',    data: currentStation.chartConcentrationData.co, color: '#0f766e' },
      { name: 'PM10',  data: currentStation.chartConcentrationData.pm10, color: '#0d9488' },
      { name: 'PM2.5', data: currentStation.chartConcentrationData.pm25, color: '#06b6d4' }
    ].filter(s => selectedParams.includes(s.name))
  };

  const SidebarToggle = ({ label, checked, onChange, subtext }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{label}</span>
        {subtext && <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{subtext}</span>}
      </div>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: '38px',
          height: '20px',
          background: checked ? '#009FAC' : '#e2e8f0',
          borderRadius: '999px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0
        }}
      >
        <div 
          style={{
            width: '16px',
            height: '16px',
            background: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="aqms-live-data-container">
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="page-title">
          {selectedView === 'Tabular View' ? (
            <>
              <h1 className="tabular-title">Tabular Form</h1>
              <p className="tabular-date">24 Feb 2026 11:30:42</p>
            </>
          ) : (
            <>
              <h1>{t('live.title')}</h1>
              <p className="header-date">24 Feb 2026 11:30:42</p>
            </>
          )}
        </div>
        
        <div className="header-controls-group">
          {/* Pill Switcher Navigation */}
          <div className="pill-tabs-group">
            <button className="pill-tab active" onClick={() => navigate('/AQMS/live-data')}>
              {t('nav.live_data', 'Live Data')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/analytics')}>
              {t('nav.analytics', 'Analytics')}
            </button>
            <button className="pill-tab" onClick={() => navigate('/AQMS/data-capture')}>
              {t('nav.reports', 'Reports')}
            </button>
          </div>

          {/* View Toggle Icons (Graph / Tabular) */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${selectedView === 'Graph View' ? 'active' : ''}`}
              onClick={() => setSelectedView('Graph View')}
              title="Graph View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${selectedView === 'Tabular View' ? 'active' : ''}`}
              onClick={() => setSelectedView('Tabular View')}
              title="Tabular View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="9" x2="9" y2="21"/>
                <line x1="15" y1="9" x2="15" y2="21"/>
              </svg>
            </button>
          </div>

          {/* Floating filter toggle button & popover wrapper */}
          <div className="filter-popover-anchor-wrapper">
            <button 
              className={`filter-toggle-circle-btn ${filtersOpen ? 'active' : ''}`} 
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setActiveSubMenu(null);
              }}
              title={t('filter.title', 'Filter')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>

            {filtersOpen && (
              <div className="filter-dropdown-popover">
                <div className="popover-header">{t('filter.title', 'Filter')}</div>
                
                {/* Station Dropdown (Single-select with radio buttons) */}
                <div 
                  className="popover-item site-location-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'location' ? null : 'location');
                  }}
                >
                  <span className="popover-item-label teal-label">
                    {t('filter.station', 'Station')}: <strong style={{ color: '#009fac', marginLeft: '4px' }}>{t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}</strong>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#009fac" strokeWidth="3" className={`popover-arrow-svg ${activeSubMenu === 'location' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'location' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {["City Centre", "Mobile Station", "Qidfa", "Lafarge Cems", "Fujairah Port", "Fujairah Stadium", "Sakamkam"].map(option => {
                        let label = t(`live.${option.toLowerCase().replace(' ', '_')}`, option);
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${selectedStations === option ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                              setSelectedStations(option);
                              setActiveSubMenu(null);
                            }}
                          >
                            <input 
                              type="radio" 
                              checked={selectedStations === option}
                              onChange={() => {}}
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Date Range Dropdown */}
                <div 
                  className="popover-item date-today-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'date' ? null : 'date');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {selectedDate === 'Live Data' ? t('live.live_data', 'Live Data') :
                     selectedDate === 'Last Day' ? t('live.last_day', 'Last Day') :
                     selectedDate === 'Last Week' ? t('live.last_week', 'Last Week') :
                     selectedDate === 'Last Month' ? t('live.last_month', 'Last Month') :
                     selectedDate === 'Last Year' ? t('live.last_year', 'Last Year') :
                     t('live.customize', 'Customize')}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'date' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'date' && (
                    <div className="popover-sub-menu">
                      {["Live Data", "Last Day", "Last Week", "Last Month", "Last Year", "Customize"].map(option => {
                        const labels = {
                          'Live Data': t('live.live_data', 'Live Data'),
                          'Last Day': t('live.last_day', 'Last Day'),
                          'Last Week': t('live.last_week', 'Last Week'),
                          'Last Month': t('live.last_month', 'Last Month'),
                          'Last Year': t('live.last_year', 'Last Year'),
                          'Customize': t('live.customize', 'Customize'),
                        };
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${selectedDate === option ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(option);
                              if (option !== 'Customize') {
                                setActiveSubMenu(null);
                                setFiltersOpen(false);
                              }
                            }}
                          >
                            {labels[option]}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* If selectedDate is 'Customize', render start/end date inputs beautifully inside the popover! */}
                {selectedDate === 'Customize' && (
                  <div className="custom-date-inputs-container" onClick={(e) => e.stopPropagation()}>
                    <div className="date-input-field">
                      <label>{t('filter.start_date', 'Start Date')}</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="custom-date-picker"
                      />
                    </div>
                    <div className="date-input-field">
                      <label>{t('filter.end_date', 'End Date')}</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="custom-date-picker"
                      />
                    </div>
                  </div>
                )}

                {/* Parameter Dropdown (Multi-select) */}
                <div 
                  className="popover-item parameter-row" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubMenu(activeSubMenu === 'parameter' ? null : 'parameter');
                  }}
                >
                  <span className="popover-item-label neutral-label" style={{ fontWeight: '800' }}>
                    {`${t('analytics.parameters', 'Parameters')} (${selectedParams.length})`}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" className={`popover-arrow-svg ${activeSubMenu === 'parameter' ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  
                  {activeSubMenu === 'parameter' && (
                    <div className="popover-sub-menu" onClick={(e) => e.stopPropagation()}>
                      {['SO2', 'NO2', 'CO', 'PM10', 'PM2.5'].map(option => {
                        const isChecked = selectedParams.includes(option);
                        return (
                          <div 
                            key={option} 
                            className={`popover-sub-item ${isChecked ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedParams(selectedParams.filter(p => p !== option));
                              } else {
                                setSelectedParams([...selectedParams, option]);
                              }
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ accentColor: '#009fac', cursor: 'pointer' }}
                            />
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <div className="aqms-live-data-scroll-body">
        {selectedView === 'Tabular View' ? (
        <div className="tabular-form-container">
          <div className="tabular-card">
            {/* Mobile View: Responsive Accordion Cards */}
            <div className="tabular-mobile-accordion-list">
              {getSortedTabularData().map((row, idx) => {
                const isExpanded = activeAccordionIdx === idx;
                return (
                  <div 
                    key={idx} 
                    className={`tabular-accordion-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setActiveAccordionIdx(isExpanded ? null : idx)}
                  >
                    {/* Collapsed Header */}
                    <div className="accordion-card-header">
                      <div className="header-main-info">
                        <div className="station-row">
                          <span className="station-name">{row.station}</span>
                          <span className="record-time">{row.time}</span>
                        </div>
                        <div className="aqi-row">
                          <span className="aqi-status-badge" style={{ backgroundColor: currentStation.aqiColor + '20', color: currentStation.aqiColor, border: `1px solid ${currentStation.aqiColor}40` }}>
                            {currentStation.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="header-aqi-indicator">
                        <div className="aqi-stat-col">
                          <span className="aqi-label">AQI</span>
                          <span className="aqi-value" style={{ color: currentStation.aqiColor }}>{currentStation.aqi}</span>
                        </div>
                        <svg className={`accordion-chevron ${isExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Expanded Content Details */}
                    <div className={`accordion-card-details ${isExpanded ? 'open' : ''}`}>
                      <div className="details-grid">
                        <div className="detail-item"><span className="detail-label">CO</span><span className="detail-value">{row.co} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">CO₂</span><span className="detail-value">{row.co2} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">O₃</span><span className="detail-value">{row.o3} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">NO₂</span><span className="detail-value">{row.no2} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">SO₂</span><span className="detail-value">{row.so2} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">PM2.5</span><span className="detail-value">{row.pm25} µg/m³</span></div>
                        <div className="detail-item"><span className="detail-label">PM10</span><span className="detail-value">{row.pm10} µg/m³</span></div>
                        <div className="detail-item"><span className="detail-label">CH₄</span><span className="detail-value">{row.ch4} ppb</span></div>
                        <div className="detail-item"><span className="detail-label">H₂S</span><span className="detail-value">{row.h2s} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">NMHC</span><span className="detail-value">{row.nmhc} ppm</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.temperature', 'Temperature')}</span><span className="detail-value">{row.temp}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.humidity', 'Humidity')}</span><span className="detail-value">{row.hum}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.wind_speed', 'Wind Speed')}</span><span className="detail-value">{translateWindSpeed(row.windSpd)}</span></div>
                        <div className="detail-item"><span className="detail-label">{t('live.wind_direction', 'Wind Direction')}</span><span className="detail-value">{translateWindDir(row.windDir)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tabular-table-scroll-wrapper">
              <table className="tabular-table">
                <thead>
                  <tr>
                    <th onClick={toggleDateSort} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t('live.date_time', 'Date & Time')}
                        <span className="sort-icon" style={{ opacity: 1, display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle' }}>
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke={sortOrder === 'asc' ? '#009fac' : '#9ca3af'} strokeWidth="4" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke={sortOrder === 'desc' ? '#009fac' : '#9ca3af'} strokeWidth="4" strokeLinecap="round" style={{ marginTop: '1px' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </span>
                      </div>
                    </th>
                    <th>{t('datacapture.station_name', 'Station Name')}</th>
                    <th>{t('live.co', 'CO')}</th>
                    <th>{t('live.co2', 'CO2')}</th>
                    <th>{t('live.o3', 'O3')}</th>
                    <th>{t('live.no2', 'NO2')}</th>
                    <th>{t('live.so2', 'SO2')}</th>
                    <th>{t('live.pm2.5', 'PM2.5')}</th>
                    <th>{t('live.pm10', 'PM10')}</th>
                    <th>{t('live.ch4', 'CH4')}</th>
                    <th>{t('live.h2s', 'H2S')}</th>
                    <th>{t('live.nmhc', 'NMHC')}</th>
                    <th>{t('live.temperature', 'Temperature')}</th>
                    <th>{t('live.humidity', 'Humidity')}</th>
                    <th>{t('live.wind_speed', 'Wind Speed')}</th>
                    <th>{t('live.wind_direction', 'Wind Direction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedTabularData().map((row, idx) => (
                    <tr key={idx}>
                      <td>{translateDateTime(row.time)}</td>
                      <td>{t(`live.${row.station.toLowerCase().replace(' ', '_')}`, row.station)}</td>
                      <td>{row.co}</td>
                      <td>{row.co2}</td>
                      <td>{row.o3}</td>
                      <td>{row.no2}</td>
                      <td>{row.so2}</td>
                      <td>{row.pm25}</td>
                      <td>{row.pm10}</td>
                      <td>{row.ch4}</td>
                      <td>{row.h2s}</td>
                      <td>{row.nmhc}</td>
                      <td>{row.temp}</td>
                      <td>{row.hum}</td>
                      <td>{translateWindSpeed(row.windSpd)}</td>
                      <td>{translateWindDir(row.windDir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="tabular-pagination-container">
              <button 
                className="tab-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                &lt;
              </button>
              {[1, 2, 3, 4, 5].map(pageNum => (
                <button 
                  key={pageNum}
                  className={`tab-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                className="tab-page-btn"
                disabled={currentPage === 5}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, 5))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── TOP GRID: AQI + Pollutants ──────────────────── */}
          <div className="top-grid">
        {/* AQI Card */}
        <div 
          className={`aqi-card${isAqiFlipped ? ' aqi-card-flipped-container' : ''}`} 
          style={{ 
            border: '1px solid #FFF', 
            boxShadow: '0 4px 34px 0 rgba(0, 0, 0, 0.21)' 
          }}
        >
          {isAqiFlipped ? (
            /* ── FLIPPED: About Station ─── */
            <div className="about-station-card">
              <div className="about-station-header">
                <span className="about-station-title">About Station</span>
                <button
                  className="aqi-flip-btn about-station-flip-btn"
                  title="Flip back"
                  onClick={() => setIsAqiFlipped(false)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>

              <div className="about-station-body">
                {/* Station image */}
                <div className="about-station-img-wrap">
                  <img
                    src="/assets/AQMS/station-city-centre.jpg"
                    alt="Station Illustration"
                    className="about-station-img"
                    onError={e => { e.target.style.background='#c8e6ea'; e.target.removeAttribute('src'); }}
                  />
                  <div className="about-station-img-label">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3" fill="currentColor"/>
                    </svg>
                    {t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}
                  </div>
                </div>

                {/* Parameters */}
                <div className="about-station-params">
                  <div className="about-param-block">
                    <div className="about-param-title">AQ Parameters:</div>
                    <div className="about-param-text">
                      PM10, PM2.5, NO₂, SO₂, H₂S, Total Hydrocarbons (THC), CO, Benzene, Toluene, Ethylbenzene, and Xylene.
                    </div>
                  </div>
                  <div className="about-param-block">
                    <div className="about-param-title">Met Parameters:</div>
                    <div className="about-param-text">
                      Wind Speed, Wind Direction, Net Radiation, Relative Humidity, Temperature, Atmospheric Pressure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── DEFAULT: AQI View ─── */
            <>
              <div className="aqi-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pin-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3" fill="currentColor"/>
                </svg>
                {t(`live.${selectedStations.toLowerCase().replace(' ', '_')}`, selectedStations)}
              </div>

              <button
                className="aqi-flip-btn"
                title="Flip card"
                onClick={() => setIsAqiFlipped(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>

              <div className="aqi-info">
                <div className="aqi-label">{t('live.aqi_index')}</div>
                <div className="aqi-value" style={{ color: currentStation.aqiColor }}>{currentStation.aqi}</div>
              </div>
              <div className="aqi-footer">
                <div 
                  className="status-badge" 
                  style={{ 
                    backgroundColor: currentStation.aqiColor, 
                    color: currentStation.aqiColor === '#fcd34d' ? '#854d0e' : '#fff'
                  }}
                >
                  {t(`live.${currentStation.category.toLowerCase().replace(/ /g, '_')}`, currentStation.category)}
                </div>
                <div className="live-indicator">
                  <div className="dot animate-pulse"></div> {t('live.live_aqi')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pollutants Card */}
        <div className="pollutants-wrapper">
          <h2 className="pollutants-title">{t('live.pollutant_metrics')}</h2>
          <div className="pollutants-list">
            {pollutants.map((p, i) => (
              <div className="pollutant-card" key={i}>
                <div className="pollutant-icon-container">
                  {p.icon}
                </div>
                <div className="p-name">{p.name}</div>
                <div className="p-val">{p.val}</div>
                <div className="p-unit">{p.unit}</div>
                <div className="p-status-bar" style={{ backgroundColor: p.statusColor }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: Wind + Env + Map ───────────────── */}
      <div className="bottom-grid">

        {/* Wind Card */}
        <div className="wind-card">
          {/* Windmills background */}
          <img className="turbines-bg" src="/assets/AQMS/icons/widnspeed.png" alt="Windmills" />

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, zIndex: 1, position: 'relative' }}>
            <div className="wind-section">
              <div className="wind-label">{t('live.wind_speed')}</div>
              <div className="wind-val">{currentStation.windSpeed} <span className="wind-unit">{currentStation.windUnit}</span></div>
            </div>

            <div className="wind-divider" />

            <div className="wind-section">
              <div className="wind-label">{t('live.wind_direction')}</div>
              <div className="wind-val">{currentStation.windDirection}{'\u00BA'} <span className="wind-unit">{currentStation.windDirText}</span></div>
            </div>
          </div>

          <div className="wind-pill" style={{ zIndex: 1, position: 'relative' }}>{t(`live.${currentStation.windPill.toLowerCase().replace(/ /g, '_')}`, currentStation.windPill)}</div>
        </div>

        {/* Environmental Grid (2x2) */}
        <div className="env-grid">
          {/* Temperature */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.temperature')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.temp}<span className="env-card-unit">{'\u00BAC'}</span></div>
                <div className="env-card-desc">{t(`live.${currentStation.idealTempText.toLowerCase().replace(/ /g, '_')}`, currentStation.idealTempText)}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Temperature.png" alt="Temperature" />
            </div>
          </div>

          {/* Atmospheric Pressure */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.atmospheric_pressure')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.pressure}<span className="env-card-unit">mbar</span></div>
                <div className="env-card-desc">{t(`live.${currentStation.balancedPressureText.toLowerCase().replace(/ /g, '_')}`, currentStation.balancedPressureText)}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Atmospheric.png" alt="Atmospheric Pressure" />
            </div>
          </div>

          {/* Solar Radiation */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.solar_radiation')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.solar}<span className="env-card-unit">w/m{'\u00B2'}</span></div>
                <div className="env-card-desc">{t(`live.${currentStation.highSolarText.toLowerCase().replace(/ /g, '_')}`, currentStation.highSolarText)}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Solar.png" alt="Solar Radiation" />
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="env-card-styled">
            <div className="env-card-title">{t('live.relative_humidity')}</div>
            <div className="env-card-content">
              <div className="env-card-info">
                <div className="env-card-value">{currentStation.humidity}<span className="env-card-unit">%</span></div>
                <div className="env-card-desc">{t(`live.${currentStation.humidityNormalText.toLowerCase().replace(/ /g, '_')}`, currentStation.humidityNormalText)}</div>
              </div>
              <img className="env-card-3d-icon" src="/assets/AQMS/icons/Humidity.png" alt="Relative Humidity" />
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div className="map-card">
          <MapContainer
            center={[25.1288, 56.3265]}
            zoom={12}
            zoomControl={false}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />
            {Object.values(stationsData).map(station => {
              const isSelected = selectedStations === station.name;
              return (
                <Marker 
                  key={station.name}
                  position={[station.lat, station.lng]} 
                  icon={createCustomIcon(String(station.aqi), station.aqiColor, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStations(station.name);
                    }
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]} className={`custom-map-tooltip-styled ${isSelected ? 'tooltip-selected' : ''}`}>
                    {t(`live.${station.name.toLowerCase().replace(/ /g, '_')}`, station.name)}
                  </Tooltip>
                </Marker>
              );
            })}
            <MapController setMapInstance={setMapInstance} />
          </MapContainer>

          {/* Floating controls */}
          <div className="map-controls">
            <button 
              className="map-btn" 
              title="Expand" 
              onClick={toggleMapFullscreen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            <button 
              className="map-btn" 
              title="Zoom In" 
              style={{ fontSize: '1.25rem', fontWeight: '700', paddingBottom: '2px' }}
              onClick={() => mapInstance?.zoomIn()}
            >
              +
            </button>
            <button 
              className="map-btn" 
              title="Zoom Out" 
              style={{ fontSize: '1.25rem', fontWeight: '700', paddingBottom: '3px' }}
              onClick={() => mapInstance?.zoomOut()}
            >
              −
            </button>
          </div>

          <div className="map-floating-fujairah-title">
            {t('live.fujairah')}
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: 24hrs Air Quality Index & Concentrations Spline Charts ── */}
      <div className="charts-grid-row">
        {/* Panel 1: Last 24hrs Air Quality Index */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <h3 className="chart-panel-title">Last 24hrs Air Quality Index</h3>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-download-dropdown-btn"
                  onClick={() => setAqiDownloadOpen(!aqiDownloadOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight: '6px'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={aqiDownloadOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {aqiDownloadOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '130px', top: 'calc(100% + 4px)' }}>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'Export')}>Export</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'PDF')}>PDF</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Air Quality Index', 'Word')}>Word</div>
                  </div>
                )}
              </div>

              <button 
                className="chart-expand-icon-btn" 
                onClick={() => setExpandedChart('aqi')}
                title="Expand Graph"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chart-container-wrapper">
            <HighchartsReactComponent
              highcharts={Highcharts}
              options={aqiChartOptions}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          </div>

          {/* Legend exactly matching the reference */}
          <div className="chart-legend-container aqi-legend">
            <div className="legend-item"><span className="legend-box" style={{background: '#84cc16'}}></span>Good</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#fcd34d'}}></span>Moderate</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#f97316'}}></span>Unhealthy for Sensitive Groups</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#ef4444'}}></span>Unhealthy</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#a855f7'}}></span>Very Unhealthy</div>
            <div className="legend-item"><span className="legend-box" style={{background: '#7f1d1d'}}></span>Hazardous</div>
          </div>
        </div>

        {/* Panel 2: Last 24hrs Concentration */}
        <div className="chart-panel-card">
          <div className="chart-panel-header">
            <h3 className="chart-panel-title">Last 24hrs Concentration</h3>
            
            <div style={{display: 'flex', gap: '8px'}}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-parameter-dropdown-btn"
                  onClick={() => setParamDropdownOpen(!paramDropdownOpen)}
                >
                  {selectedParams.length === 0 
                    ? 'Select Parameter' 
                    : selectedParams.length === 5
                      ? 'All Parameters'
                      : selectedParams.join(', ')}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={paramDropdownOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {paramDropdownOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ minWidth: '150px', right: 0, left: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    {['SO2', 'NO2', 'CO', 'PM10', 'PM2.5'].map(param => {
                      const isChecked = selectedParams.includes(param);
                      return (
                        <div 
                          key={param} 
                          className={`reports-sub-dropdown-item ${isChecked ? 'active' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedParams(selectedParams.filter(p => p !== param));
                            } else {
                              setSelectedParams([...selectedParams, param]);
                            }
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ accentColor: '#009fac', cursor: 'pointer' }}
                          />
                          <span>{param}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div style={{ position: 'relative' }}>
                <button 
                  className="chart-download-dropdown-btn"
                  onClick={() => setConcDownloadOpen(!concDownloadOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight: '6px'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '6px'}} className={concDownloadOpen ? 'open' : ''}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {concDownloadOpen && (
                  <div className="reports-sub-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '130px', top: 'calc(100% + 4px)' }}>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'Export')}>Export</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'PDF')}>PDF</div>
                    <div className="reports-sub-dropdown-item" onClick={() => handleDownload('Last 24hrs Concentration', 'Word')}>Word</div>
                  </div>
                )}
              </div>

              <button 
                className="chart-expand-icon-btn" 
                onClick={() => setExpandedChart('conc')}
                title="Expand Graph"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chart-container-wrapper">
            <HighchartsReactComponent
              highcharts={Highcharts}
              options={concChartOptions}
              containerProps={{ style: { height: '100%', width: '100%' } }}
            />
          </div>

          {/* Legend matching the reference dynamically */}
          <div className="chart-legend-container conc-legend">
            {selectedParams.includes('SO2') && <div className="legend-item"><span className="legend-box" style={{background: '#3b82f6'}}></span>SO2</div>}
            {selectedParams.includes('NO2') && <div className="legend-item"><span className="legend-box" style={{background: '#0ea5e9'}}></span>NO2</div>}
            {selectedParams.includes('CO') && <div className="legend-item"><span className="legend-box" style={{background: '#0f766e'}}></span>CO</div>}
            {selectedParams.includes('PM10') && <div className="legend-item"><span className="legend-box" style={{background: '#0d9488'}}></span>PM10</div>}
            {selectedParams.includes('PM2.5') && <div className="legend-item"><span className="legend-box" style={{background: '#06b6d4'}}></span>PM2.5</div>}
          </div>
        </div>
      </div>
        </>
      )}
      {expandedChart && (
        <div className="aqms-chart-modal-overlay" dir="ltr">
          <div className="aqms-chart-modal-card">
            
            {/* Top Header */}
            <div className="aqms-chart-modal-header">
              <div>
                <h2 className="aqms-chart-modal-title">
                  {expandedChart === 'aqi' 
                    ? t('live.last_24hrs_aqi', 'Last 24hrs Air Quality Index') 
                    : t('live.last_24hrs_conc', 'Last 24hrs Concentration')}
                </h2>
              </div>
              
              <div className="aqms-chart-type-container" style={{ marginRight: '36px', marginLeft: '0' }}>
                {/* Chart Type Toggle pill exactly styled like MWQ */}
                <div className="aqms-chart-type-pill">
                  {[
                    { id: 'Line', label: t('chart.line', 'Line') },
                    { id: 'Step Line', label: t('chart.stepLine', 'Step Line') },
                    { id: 'Dots', label: t('chart.dots', 'Dots') },
                    { id: 'Stacked Lines', label: t('chart.stackedLines', 'Stacked Lines') },
                    { id: 'Bars', label: t('chart.bars', 'Bars') }
                  ].map((type) => {
                    const isActive = modalChartType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setModalChartType(type.id)}
                        className={`aqms-chart-type-btn ${isActive ? 'active' : ''}`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Absolute Close Button */}
              <button 
                onClick={() => setExpandedChart(null)}
                className="aqms-chart-modal-close-btn"
                style={{
                  right: '20px',
                  left: 'auto'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content Area: Split 75% chart / 25% sidebar control on desktop */}
            <div className="aqms-chart-modal-content-body">
              
              {/* Left Side: Chart canvas and toolbar */}
              <div className="aqms-chart-modal-left">
                
                {/* Chart Toolbar */}
                <div className="aqms-chart-modal-toolbar">
                  <div className="aqms-chart-modal-toolbar-group">
                    {/* Zoom In */}
                    <button 
                      onClick={handleZoomIn} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Zoom In', 'Zoom In')}
                    >
                      <ZoomIn size={18} />
                    </button>

                    {/* Zoom Out */}
                    <button 
                      onClick={handleZoomOut} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Zoom Out', 'Zoom Out')}
                    >
                      <ZoomOut size={18} />
                    </button>
                    
                    {/* Search / Zoom Select */}
                    <button 
                      onClick={() => setActiveTool('select')} 
                      className={`aqms-chart-modal-toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                      title={getToolbarTitle('Select Zoom', 'Select Zoom')}
                    >
                      <Search size={18} />
                    </button>
                    
                    {/* Pan Mode */}
                    <button 
                      onClick={() => setActiveTool('pan')} 
                      className={`aqms-chart-modal-toolbar-btn ${activeTool === 'pan' ? 'active' : ''}`}
                      title={getToolbarTitle('Pan Mode', 'Pan Mode')}
                    >
                      <Hand size={18} />
                    </button>
                    
                    {/* Pan Controls */}
                    {activeTool === 'pan' && (
                      <>
                        <button 
                          onClick={() => handlePan('left')} 
                          className="aqms-chart-modal-toolbar-btn"
                          title={getToolbarTitle('Pan Left', 'Pan Left')}
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <button 
                          onClick={() => handlePan('right')} 
                          className="aqms-chart-modal-toolbar-btn"
                          title={getToolbarTitle('Pan Right', 'Pan Right')}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </>
                    )}
                    
                    {/* Home / Reset */}
                    <button 
                      onClick={handleReset} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Reset/Home', 'Reset/Home')}
                    >
                      <Home size={18} />
                    </button>
                    
                    <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
                    
                    {/* Print */}
                    <button 
                      onClick={handlePrint} 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Print', 'Print')}
                    >
                      <Printer size={18} />
                    </button>

                    {/* Menu */}
                    <button 
                      className="aqms-chart-modal-toolbar-btn"
                      title={getToolbarTitle('Menu', 'Menu')}
                    >
                      <Menu size={18} />
                    </button>
                  </div>
                </div>

                {/* Chart Canvas Container */}
                <div className="aqms-chart-modal-canvas-container">
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <HighchartsReactComponent
                      highcharts={Highcharts}
                      options={getModalChartOptions()}
                      ref={chartRef}
                      containerProps={{ style: { height: '100%', width: '100%' } }}
                    />
                  </div>
                </div>

                {/* Legend beneath chart */}
                {expandedChart === 'aqi' ? (
                  <div className="chart-legend-container aqi-legend" style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    <div className="legend-item"><span className="legend-box" style={{background: '#84cc16'}}></span>{t('landing.stats.good', 'Good')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#fcd34d'}}></span>{t('live.moderate', 'Moderate')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#f97316'}}></span>{t('landing.dash.unhealthy_sg', 'Unhealthy for Sensitive Groups')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#ef4444'}}></span>{t('landing.dash.unhealthy', 'Unhealthy')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#a855f7'}}></span>{t('landing.dash.very_unhealthy', 'Very Unhealthy')}</div>
                    <div className="legend-item"><span className="legend-box" style={{background: '#7f1d1d'}}></span>{t('landing.dash.hazardous', 'Hazardous')}</div>
                  </div>
                ) : (
                  <div className="chart-legend-container conc-legend" style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    {selectedParams.includes('SO2') && <div className="legend-item"><span className="legend-box" style={{background: '#3b82f6'}}></span>SO2</div>}
                    {selectedParams.includes('NO2') && <div className="legend-item"><span className="legend-box" style={{background: '#0ea5e9'}}></span>NO2</div>}
                    {selectedParams.includes('CO') && <div className="legend-item"><span className="legend-box" style={{background: '#0f766e'}}></span>CO</div>}
                    {selectedParams.includes('PM10') && <div className="legend-item"><span className="legend-box" style={{background: '#0d9488'}}></span>PM10</div>}
                    {selectedParams.includes('PM2.5') && <div className="legend-item"><span className="legend-box" style={{background: '#06b6d4'}}></span>PM2.5</div>}
                  </div>
                )}
              </div>

              {/* Right Side: Sidebar Controls */}
              <div 
                className="aqms-chart-modal-sidebar"
                style={{
                  borderLeft: '1px solid #f1f5f9',
                  borderRight: 'none'
                }}
              >
                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Optimize large datasets */}
                  <SidebarToggle 
                    label={t('chart.optimize_large_datasets', 'Optimize large datasets')}
                    subtext={t('chart.showing_all_points', 'Showing all points')} 
                    checked={modalOptimizeData} 
                    onChange={setModalOptimizeData} 
                  />
                  
                  {/* Max points */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{t('chart.max_points_optimized', 'Max points (optimized)')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '28px' }}>
                      <button 
                        onClick={() => setModalMaxPoints(m => Math.max(100, m - 100))} 
                        style={{ border: 'none', background: 'none', padding: '0 10px', height: '100%', cursor: 'pointer', color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        -
                      </button>
                      <span style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#334155', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', height: '100%' }}>
                        {modalMaxPoints}
                      </span>
                      <button 
                        onClick={() => setModalMaxPoints(m => m + 100)} 
                        style={{ border: 'none', background: 'none', padding: '0 10px', height: '100%', cursor: 'pointer', color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>
                  
                  {/* Marker */}
                  <SidebarToggle 
                    label={t('chart.marker', 'Marker')} 
                    checked={modalShowMarkers} 
                    onChange={setModalShowMarkers} 
                  />

                  {/* Dashes */}
                  <SidebarToggle 
                    label={t('chart.dashes', 'Dashes')} 
                    checked={modalShowDashes} 
                    onChange={setModalShowDashes} 
                  />

                  {/* Date Tooltip */}
                  <SidebarToggle 
                    label={t('chart.date_tooltip', 'Date Tooltip')} 
                    checked={modalShowTooltip} 
                    onChange={setModalShowTooltip} 
                  />

                  {/* Animation */}
                  <SidebarToggle 
                    label={t('chart.animation', 'Animation')} 
                    checked={modalShowAnimation} 
                    onChange={setModalShowAnimation} 
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="custom-toast-notification">
          <div className="custom-toast-content">
            <svg className="custom-toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LiveData;


