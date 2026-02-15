'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getShortProfileLabels } from '@/src/lib/profileLabels';

// Fix dla ikon Leaflet w Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom SVG pin icons
function createPinIcon(color: string, pinClass: string) {
  return L.divIcon({
    html: `
      <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.92"/>
      </svg>
    `,
    className: pinClass,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
  });
}

const dpsIcon = createPinIcon('#10b981', 'map-pin-dps');   // emerald green
const sdsIcon = createPinIcon('#1e3a8a', 'map-pin-sds');   // dark blue

// Custom cluster icon - dual color (DPS green + ŚDS dark blue)
const createClusterCustomIcon = function (cluster: any) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;

  // Policz DPS vs ŚDS
  const dpsCount = markers.filter((m: any) =>
    m.options.icon.options.className?.includes('map-pin-dps')
  ).length;

  // Proporcje dla gradient
  const dpsPercent = Math.round((dpsCount / count) * 100);

  let size = 45;
  let fontSize = 16;

  if (count >= 10) {
    size = 60;
    fontSize = 20;
  } else if (count >= 5) {
    size = 50;
    fontSize = 18;
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(90deg, #10b981 ${dpsPercent}%, #1e3a8a ${dpsPercent}%);
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        <span style="
          font-size: ${fontSize}px;
          font-weight: 700;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          z-index: 10;
        ">${count}</span>
      </div>
    `,
    className: 'custom-dual-cluster',
    iconSize: L.point(size, size, true)
  });
};

interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  powiat: string;
  miejscowosc: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  latitude: number | null;
  longitude: number | null;
  profil_opieki?: string | null;
}

interface FacilityMapProps {
  facilities: Facility[];
  mode?: 'single' | 'multiple';
  showDirections?: boolean;
}

// Component do auto-fit bounds z resize handling
function AutoFitBounds({ facilities }: { facilities: Facility[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Check if map is properly initialized
    const isMapReady = map &&
                       typeof map.invalidateSize === 'function' &&
                       map.getContainer &&
                       map.getContainer();

    if (!isMapReady) {
      console.warn('Map not ready for invalidateSize');
      return;
    }

    let mounted = true;

    // Fix map size with error handling
    const t = setTimeout(() => {
      if (!mounted) return;
      try {
        if (map && typeof map.invalidateSize === 'function') {
          map.invalidateSize();
        }
      } catch (error) {
        console.error('Map invalidateSize error:', error);
      }
    }, 100);

    // Fit bounds with error handling
    try {
      if (facilities.length === 1 && map.setView) {
        map.setView([facilities[0].latitude!, facilities[0].longitude!], 13);
      } else if (facilities.length > 1 && map.fitBounds) {
        const bounds = L.latLngBounds(
          facilities.map(f => [f.latitude!, f.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    } catch (error) {
      console.error('Map bounds error:', error);
    }

    // Resize listener with error handling
    const handleResize = () => {
      setTimeout(() => {
        try {
          if (map && typeof map.invalidateSize === 'function') {
            map.invalidateSize();
          }
        } catch (error) {
          console.error('Map resize invalidateSize error:', error);
        }
      }, 100);

      // Re-fit bounds on resize
      try {
        if (facilities.length > 1 && map.fitBounds) {
          const bounds = L.latLngBounds(
            facilities.map(f => [f.latitude!, f.longitude!] as [number, number])
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
      } catch (error) {
        console.error('Map resize bounds error:', error);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      mounted = false;
      clearTimeout(t);
      window.removeEventListener('resize', handleResize);
    };
  }, [facilities, map]);

  return null;
}

export default function FacilityMap({ 
  facilities, 
  mode = 'multiple',
  showDirections = false 
}: FacilityMapProps) {
  const facilitiesWithCoords = facilities.filter(
    f => f.latitude && f.longitude
  );

  if (facilitiesWithCoords.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Brak danych geolokalizacyjnych dla tej placówki</p>
      </div>
    );
  }

  const center: [number, number] = [50.0647, 19.9450];

  return (
    <div className="w-full h-full">
      <style jsx global>{`
        .custom-dual-cluster {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          z-index: 0 !important;
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
      `}</style>
      
      <div className="h-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          
          center={center}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <AutoFitBounds facilities={facilitiesWithCoords} />
          
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            iconCreateFunction={createClusterCustomIcon}
          >
            {facilitiesWithCoords.map((facility) => (
              <Marker
                key={facility.id}
                position={[facility.latitude!, facility.longitude!]}
                icon={facility.typ_placowki === 'DPS' ? dpsIcon : sdsIcon}
              >
                <Popup>
                  <div style={{ minWidth: '170px', maxWidth: '220px', padding: '6px 8px' }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: facility.typ_placowki === 'DPS' ? '#059669' : '#1e3a8a',
                      margin: '0 0 2px',
                    }}>
                      {facility.typ_placowki}
                    </p>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 5px', lineHeight: '1.25' }}>
                      {facility.nazwa}
                    </h3>
                    {(() => {
                      const profiles = getShortProfileLabels(facility.profil_opieki ?? null, facility.typ_placowki);
                      return profiles.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '5px' }}>
                          {profiles.map(p => (
                            <span key={p} style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '999px',
                              background: facility.typ_placowki === 'DPS' ? '#d1fae5' : '#dbeafe',
                              color: facility.typ_placowki === 'DPS' ? '#065f46' : '#1e3a8a',
                              fontWeight: 500,
                            }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                    {facility.typ_placowki === 'DPS' && (
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px', color: facility.koszt_pobytu ? '#111827' : '#059669' }}>
                        {facility.koszt_pobytu
                          ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                          : 'Bezpłatne'}
                      </p>
                    )}
                    <a
                      href={`/placowka/${facility.id}`}
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '5px',
                        background: facility.typ_placowki === 'DPS' ? '#10b981' : '#1e3a8a',
                        color: 'white',
                        textDecoration: 'none',
                      }}
                    >
                      Zobacz szczegóły →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
      
      {showDirections && mode === 'single' && facilitiesWithCoords[0] && (
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${facilitiesWithCoords[0].latitude},${facilitiesWithCoords[0].longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          Otwórz w Google Maps
        </a>
      )}
    </div>
  );
}