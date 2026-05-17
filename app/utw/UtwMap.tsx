'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons w Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fioletowy marker SVG dla UTW
const utwIcon = new L.DivIcon({
  html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#7c3aed"/>
    <circle cx="14" cy="14" r="7" fill="white" opacity="0.9"/>
    <text x="14" y="18" text-anchor="middle" font-size="11" fill="#7c3aed" font-weight="bold">U</text>
  </svg>`,
  className: '',
  iconSize:   [28, 38],
  iconAnchor: [14, 38],
  popupAnchor:[0, -38],
});

interface UtwEntry {
  id: number;
  nazwa: string;
  miejscowosc: string;
  powiat: string;
  telefon: string | null;
  email: string | null;
  www: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function UtwMap({ utw }: { utw: UtwEntry[] }) {
  const withGeo = utw.filter(u => u.latitude && u.longitude);

  return (
    <MapContainer
      center={[49.9, 20.2]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withGeo.map(u => (
        <Marker
          key={u.id}
          position={[u.latitude!, u.longitude!]}
          icon={utwIcon}
        >
          <Popup>
            <div className="min-w-[200px]">
              <p className="font-bold text-slate-900 text-sm leading-snug mb-1">{u.nazwa}</p>
              <p className="text-xs text-slate-500 mb-2">{u.miejscowosc} · pow. {u.powiat}</p>
              {u.telefon && (
                <a href={`tel:${u.telefon.replace(/\s/g, '')}`}
                   className="block text-xs text-violet-700 hover:underline mb-1">
                  📞 {u.telefon}
                </a>
              )}
              {u.email && (
                <a href={`mailto:${u.email}`}
                   className="block text-xs text-violet-700 hover:underline mb-1">
                  ✉ {u.email}
                </a>
              )}
              {u.www && (
                <a href={u.www.startsWith('http') ? u.www : `https://${u.www}`}
                   target="_blank" rel="noopener noreferrer"
                   className="block text-xs text-violet-700 hover:underline">
                  🌐 Strona WWW
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
