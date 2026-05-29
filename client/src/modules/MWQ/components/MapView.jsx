// Version: 1.0.3 - Enhanced Symbology Size and Color
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus } from 'lucide-react';
import { getMqwSensorDataLatest } from '../../../lib/queries';

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
  const tempNum = temp == null || temp === '' ? null : Number(temp);
  const displayTemp = tempNum == null || Number.isNaN(tempNum) ? '—°' : `${Math.round(tempNum)}°`;
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

const MapController = forwardRef((_, ref) => {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    zoomIn:  () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
    setView: (center, zoom) => map.setView(center, zoom),
  }));
  return null;
});

const MapView = forwardRef(({ onBuoySelect, selectedBuoy, isMobile = false, stations = [] }, ref) => {
  const controlRef = useRef();

  // Latest sonde temp per buoy id, fetched from the real API.
  const [tempById, setTempById] = useState({});

  useImperativeHandle(ref, () => ({
    zoomIn:  () => controlRef.current?.zoomIn(),
    zoomOut: () => controlRef.current?.zoomOut(),
    setView: (center, zoom) => controlRef.current?.setView(center, zoom),
  }));

  // Pull the latest reading per buoy so markers show real temperatures.
  useEffect(() => {
    if (!stations.length) return;
    const controller = new AbortController();
    Promise.all(
      stations.map((b) =>
        getMqwSensorDataLatest({ buoyId: b.id }, { signal: controller.signal })
          .then((data) => {
            const row = Array.isArray(data) ? data[0] : data;
            return [b.id, row?.temp ?? null];
          })
          .catch(() => [b.id, null])
      )
    ).then((entries) => setTempById(Object.fromEntries(entries)));
    return () => controller.abort();
  }, [stations]);

  const handleMarkerClick = (b) => {
    if (onBuoySelect) onBuoySelect(b);
  };

  const activeId = selectedBuoy ? selectedBuoy.id : (stations[0]?.id ?? null);

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
        {stations.map((b) => (
          <Marker
            key={`${b.id}-${activeId === b.id ? 'active' : 'inactive'}-${tempById[b.id] ?? ''}`}
            position={b.position || [b.latitude, b.longitude]}
            icon={createBuoyIcon(tempById[b.id], b.color, activeId === b.id)}
            eventHandlers={{ click: () => handleMarkerClick(b) }}
          />
        ))}
      </MapContainer>


    </div>
  );
});

MapView.displayName = 'MapView';
export default MapView;
