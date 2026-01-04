'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix dla ikon Leaflet w Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom ikony
const dpsIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sdsIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom cluster icon - dual color (DPS red + ŚDS blue)
const createClusterCustomIcon = function (cluster: any) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  
  // Policz DPS vs ŚDS
  const dpsCount = markers.filter((m: any) => 
    m.options.icon.options.iconUrl?.includes('red')
  ).length;
  const sdsCount = count - dpsCount;
  
  // Proporcje dla gradient
  const dpsPercent = Math.round((dpsCount / count) * 100);
  
  let sizeClass = 'small';
  let size = 45;
  let fontSize = 16;
  
  if (count >= 10) {
    sizeClass = 'large';
    size = 60;
    fontSize = 20;
  } else if (count >= 5) {
    sizeClass = 'medium';
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
        background: linear-gradient(90deg, #ef4444 ${dpsPercent}%, #3b82f6 ${dpsPercent}%);
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
    if (facilities.length === 0) return;

    // Fix map size
    setTimeout(() => map.invalidateSize(), 100);

    // Fit bounds
    if (facilities.length === 1) {
      map.setView([facilities[0].latitude!, facilities[0].longitude!], 13);
    } else {
      const bounds = L.latLngBounds(
        facilities.map(f => [f.latitude!, f.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }

    // Resize listener
    const handleResize = () => {
      setTimeout(() => map.invalidateSize(), 100);
      // Re-fit bounds on resize
      if (facilities.length > 1) {
        const bounds = L.latLngBounds(
          facilities.map(f => [f.latitude!, f.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-sm mb-1">{facility.nazwa}</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {facility.typ_placowki} • {facility.powiat}
                    </p>
                    <p className={`text-sm font-medium mb-2 ${facility.koszt_pobytu ? 'text-gray-900' : 'text-green-600'}`}>
                      {facility.koszt_pobytu 
                        ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                        : 'Bezpłatne'
                      }
                    </p>
                    <div className="flex gap-2">
                      <a href={`/placowka/${facility.id}`}
                        className="text-xs bg-accent-600 text-white px-3 py-1 rounded hover:bg-accent-700"
                      >
                        Zobacz szczegóły
                      </a>
                      {facility.telefon && (
                        <a href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                          className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 md:hidden"
                        >
                          Zadzwoń
                        </a>
                      )}
                    </div>
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
          className="mt-3 inline-block bg-accent-600 text-white px-4 py-2 rounded hover:bg-accent-700"
        >
          Otwórz w Google Maps
        </a>
      )}
    </div>
  );
}