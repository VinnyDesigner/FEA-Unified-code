// Version: 1.0.3 - Enhanced Symbology Size and Color
import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus } from 'lucide-react';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// High-fidelity active colors from reference
const buoyColors = {
  orange: { main: '#FF9F43', filter: 'invert(76%) sepia(21%) saturate(5412%) hue-rotate(341deg) brightness(101%) contrast(101%)' },
  yellow: { main: '#FFC107', filter: 'invert(86%) sepia(50%) saturate(2222%) hue-rotate(344deg) brightness(105%) contrast(104%)' },
  cyan:   { main: '#00CFE8', filter: 'invert(53%) sepia(91%) saturate(1478%) hue-rotate(152deg) brightness(97%) contrast(105%)' },
  pink:   { main: '#FF4D4D', filter: 'invert(44%) sepia(96%) saturate(3015%) hue-rotate(334deg) brightness(101%) contrast(101%)' }
};

// Version: 1.0.4 - Unified Symbology (No Double Flags)
const createBuoyIcon = (temp, colorKey, isActive) => {
  const displayTemp = temp.split('.')[0] + '°';
  const color = buoyColors[colorKey] || buoyColors.cyan;

  // Active state styling
  const wrapperScale = isActive ? 1.15 : 0.85;
  const wrapperOpacity = isActive ? 1 : 0.7;
  const zIndex = isActive ? 100 : 5;
  const imgFilter = `${color.filter} ${isActive ? `drop-shadow(0 0 10px ${color.main})` : ''}`;

  return L.divIcon({
    className: 'custom-buoy-marker',
    html: `
      <div style="position:relative; width:80px; height:80px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; pointer-events:none;">
        
        <!-- Buoy Body -->
        <div style="position:relative; z-index:${zIndex}; width:55px; height:55px; pointer-events:auto; transform: scale(${wrapperScale}); opacity: ${wrapperOpacity}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;">
          <img 
            src="/assets/buoy-white.png" 
            style="
              width:100%; 
              height:100%; 
              object-fit:contain; 
              filter: ${imgFilter};
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            " 
          />
        </div>
        
      </div>
    `,
    iconSize: [80, 80],
    iconAnchor: [40, 75],
  });
};

const buoys = [
  { id: 1, name: 'AL Aqah Buoy',    nameKey: 'alAqah',    position: [25.4725, 56.4162], temp: '25.1°c', color: 'orange', updated: '2 min ago', updatedKey: '2min', interval: '30 min', intervalKey: '30min' },
  { id: 2, name: 'Fujairah Buoy 1', nameKey: 'fujairah1', position: [25.1288, 56.3572], temp: '24.9°c', color: 'yellow', updated: '5 min ago', updatedKey: '5min', interval: '30 min', intervalKey: '30min' },
  { id: 3, name: 'Fujairah Buoy 2', nameKey: 'fujairah2', position: [25.2041, 56.3738], temp: '25.3°c', color: 'cyan',   updated: '1 min ago', updatedKey: '1min', interval: '30 min', intervalKey: '30min' },
  { id: 4, name: 'Coastal Buoy A',  nameKey: 'coastal',   position: [25.3100, 56.3950], temp: '24.8°c', color: 'pink',   updated: '8 min ago', updatedKey: '8min', interval: '30 min', intervalKey: '30min' },
];

const MapController = forwardRef((_, ref) => {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    zoomIn:  () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
    setView: (center, zoom) => map.setView(center, zoom),
  }));
  return null;
});

const MapView = forwardRef(({ onBuoySelect, selectedBuoy, isMobile = false }, ref) => {
  const controlRef = useRef();

  useImperativeHandle(ref, () => ({
    zoomIn:  () => controlRef.current?.zoomIn(),
    zoomOut: () => controlRef.current?.zoomOut(),
    setView: (center, zoom) => controlRef.current?.setView(center, zoom),
  }));

  const handleMarkerClick = (b) => {
    if (onBuoySelect) onBuoySelect(b);
  };

  const activeId = selectedBuoy ? selectedBuoy.id : 1;

  return (
    <div className={`${isMobile ? 'relative w-full h-full' : 'absolute inset-0'} z-0`}>
      <MapContainer
        center={[25.28, 56.34]}
        zoom={isMobile ? 10 : 11}
        style={{ width: '100%', height: '100%', background: '#f4f3f0' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <MapController ref={controlRef} />
        {buoys.map((b) => (
          <Marker
            key={`${b.id}-${activeId === b.id ? 'active' : 'inactive'}`}
            position={b.position}
            icon={createBuoyIcon(b.temp, b.color, activeId === b.id)}
            eventHandlers={{ click: () => handleMarkerClick(b) }}
          />
        ))}
      </MapContainer>


    </div>
  );
});

MapView.displayName = 'MapView';
export default MapView;
