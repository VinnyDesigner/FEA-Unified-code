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

  return L.divIcon({
    className: 'custom-buoy-marker',
    html: `
      <div style="position:relative; width:80px; height:80px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; pointer-events:none;">
        
        <!-- Waves glow (Categorical color) -->
        <div style="position:absolute; bottom:0px; left:50%; transform:translateX(-50%); width:65px; height:14px; background:${color.main}${isActive ? '88' : '55'}; filter:blur(3px); border-radius:50%; z-index:0;"></div>
        
        <!-- Buoy Body (Using high-fidelity PNG) -->
        <div style="position:relative; z-index:5; width:55px; height:55px; pointer-events:auto;">
          <img 
            src="/assets/buoy-white.png" 
            style="
              width:100%; 
              height:100%; 
              object-fit:contain; 
              filter: ${isActive ? color.filter : 'none'} drop-shadow(0 4px 12px rgba(0,0,0,0.4));
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            " 
          />
          
          <!-- Temperature Label -->
          <div style="
            position:absolute; 
            top:50%; 
            left:50%; 
            transform:translate(-50%, -8%); 
            color:${isActive ? 'white' : '#072227'}; 
            font-size:12px; 
            font-weight:900;
            text-shadow: ${isActive ? '0 1px 2px rgba(0,0,0,0.6)' : '0 0 2px rgba(255,255,255,1)'};
            white-space:nowrap;
            pointer-events:none;
            transition: color 0.4s ease;
          ">
            ${displayTemp}
          </div>
        </div>
        
        ${isActive ? `
          <!-- Active Pulsing Indicator -->
          <div style="position:absolute; bottom:-12px; width:55px; height:10px; background:${color.main}; border-radius:50%; opacity:0.4; filter:blur(2px); animation: pulse 2.5s infinite;"></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.85) translateX(-58%); opacity: 0.5; }
          50% { transform: scale(1.15) translateX(-43%); opacity: 0.2; }
          100% { transform: scale(0.85) translateX(-58%); opacity: 0.5; }
        }
      </style>
    `,
    iconSize: [80, 80],
    iconAnchor: [40, 75],
  });
};

const buoys = [
  { id: 1, name: 'AL Aqah Buoy',    position: [25.4725, 56.4162], temp: '25.1°c', color: 'orange' },
  { id: 2, name: 'Fujairah Buoy 1', position: [25.1288, 56.3572], temp: '24.9°c', color: 'yellow' },
  { id: 3, name: 'Fujairah Buoy 2', position: [25.2041, 56.3738], temp: '25.3°c', color: 'cyan' },
  { id: 4, name: 'Coastal Buoy A',  position: [25.3100, 56.3950], temp: '24.8°c', color: 'pink' },
];

const MapController = forwardRef((_, ref) => {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    zoomIn:  () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
  }));
  return null;
});

const MapView = forwardRef(({ onBuoySelect, isMobile = false }, ref) => {
  const controlRef = useRef();
  const [activeBuoyId, setActiveBuoyId] = useState(1);

  const handleMarkerClick = (b) => {
    setActiveBuoyId(b.id);
    if (onBuoySelect) onBuoySelect(b);
  };

  return (
    <div className={`${isMobile ? 'relative w-full h-full' : 'absolute inset-0'} z-0`}>
      <MapContainer
        center={[25.28, 56.34]}
        zoom={isMobile ? 10 : 11}
        style={{ width: '100%', height: '100%', background: '#b2d9e8' }}
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
            key={`${b.id}-${activeBuoyId === b.id ? 'active' : 'inactive'}`}
            position={b.position}
            icon={createBuoyIcon(b.temp, b.color, activeBuoyId === b.id)}
            eventHandlers={{ click: () => handleMarkerClick(b) }}
          />
        ))}
      </MapContainer>

      {/* Map zoom controls */}
      <div className={`absolute ${isMobile ? 'top-4 right-4' : 'top-8 right-8'} flex flex-col gap-2 z-[1000]`}>
        <button
          onClick={() => controlRef.current?.zoomIn()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
          style={{ 
            background: '#FFF', 
            boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25) inset' 
          }}
        >
          <Plus size={20} className="text-[#072227]" />
        </button>
        <button
          onClick={() => controlRef.current?.zoomOut()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
          style={{ 
            background: '#FFF', 
            boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25) inset' 
          }}
        >
          <Minus size={20} className="text-[#072227]" />
        </button>
      </div>
    </div>
  );
});

MapView.displayName = 'MapView';
export default MapView;
