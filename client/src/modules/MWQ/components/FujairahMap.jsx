import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getMqwBuoys, getMqwSensorDataLatest } from '../../../lib/queries';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom buoy marker
const buoyIcon = (label) => L.divIcon({
  className: '',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer">
      <div style="
        background: linear-gradient(135deg, #1DCDDD 0%, #009FAC 100%);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 0 12px rgba(29,205,221,0.7), 0 2px 6px rgba(0,0,0,0.3);
        letter-spacing: 0.3px;
      ">${label}</div>
      <svg width="24" height="28" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="32" rx="14" ry="5" fill="rgba(29,205,221,0.2)"/>
        <rect x="16.5" y="10" width="3" height="18" rx="1.5" fill="#F59E0B"/>
        <ellipse cx="18" cy="30" rx="12" ry="5" fill="#F59E0B"/>
        <rect x="14" y="4" width="10" height="7" rx="2" fill="#374151"/>
        <line x1="18" y1="4" x2="18" y2="1" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
        <circle cx="18" cy="34" r="2" fill="#1DCDDD" opacity="0.9"/>
      </svg>
    </div>`,
  iconSize: [75, 56],
  iconAnchor: [37, 56],
  popupAnchor: [0, -58],
});

// Inner component to expose map instance via ref
const MapController = forwardRef((_, ref) => {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    zoomIn:  () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
  }));
  return null;
});

const fmtTemp = (v) => {
  if (v == null || v === '') return '—°c';
  const n = Number(v);
  return Number.isNaN(n) ? '—°c' : `${n.toFixed(1)}°c`;
};

const FujairahMap = forwardRef(({ onBuoySelect, buoys: buoysProp }, ref) => {
  const controlRef = useRef();

  // Use the passed buoys, or self-fetch the real list when rendered standalone.
  const [buoys, setBuoys] = useState(buoysProp || []);
  // Latest reading per buoy id (temp + dateTime), from the real API.
  const [latestById, setLatestById] = useState({});

  // Forward zoom calls to the inner controller
  useImperativeHandle(ref, () => ({
    zoomIn:  () => controlRef.current?.zoomIn(),
    zoomOut: () => controlRef.current?.zoomOut(),
  }));

  useEffect(() => {
    if (buoysProp) { setBuoys(buoysProp); return; }
    const controller = new AbortController();
    getMqwBuoys({ signal: controller.signal })
      .then((data) => setBuoys(data || []))
      .catch(() => { /* keep empty */ });
    return () => controller.abort();
  }, [buoysProp]);

  useEffect(() => {
    if (!buoys.length) return;
    const controller = new AbortController();
    Promise.all(
      buoys.map((b) =>
        getMqwSensorDataLatest({ buoyId: b.id }, { signal: controller.signal })
          .then((data) => {
            const row = Array.isArray(data) ? data[0] : data;
            return [b.id, { temp: row?.temp ?? null, dateTime: row?.dateTime ?? null }];
          })
          .catch(() => [b.id, { temp: null, dateTime: null }])
      )
    ).then((entries) => setLatestById(Object.fromEntries(entries)));
    return () => controller.abort();
  }, [buoys]);

  return (
    <MapContainer
      center={[25.28, 56.34]}
      zoom={11}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* Light map tiles matching the attached design (CartoDB Voyager) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <MapController ref={controlRef} />

      {buoys.map((b) => {
        const latest = latestById[b.id];
        const tempStr = fmtTemp(latest?.temp);
        const updated = latest?.dateTime ? new Date(latest.dateTime).toLocaleString() : '—';
        return (
          <Marker
            key={`${b.id}-${latest?.temp ?? ''}`}
            position={b.position || [b.latitude, b.longitude]}
            icon={buoyIcon(tempStr)}
            eventHandlers={{ click: () => onBuoySelect && onBuoySelect(b) }}
          >
            <Popup>
              <div style={{ background: '#0d2229', color: 'white', padding: '8px 12px', borderRadius: 10, fontSize: 12, minWidth: 130 }}>
                <strong style={{ color: '#1DCDDD', display: 'block', marginBottom: 4 }}>{b.buoyName || b.name}</strong>
                Water Temp: <strong>{tempStr}</strong>
                <div style={{ marginTop: 4, opacity: 0.7 }}>Updated: {updated}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
});

FujairahMap.displayName = 'FujairahMap';
export default FujairahMap;
