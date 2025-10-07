'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix dla ikon Leaflet w Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom ikony - DPS (czerwony) i ŚDS (niebieski)
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

export default function FacilityMap({ 
  facilities, 
  mode = 'multiple',
  showDirections = false 
}: FacilityMapProps) {
  // Filtruj placówki z geo coordinates
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

  // Oblicz centrum mapy
  const center: [number, number] = mode === 'single'
    ? [facilitiesWithCoords[0].latitude!, facilitiesWithCoords[0].longitude!]
    : [
        facilitiesWithCoords.reduce((sum, f) => sum + f.latitude!, 0) / facilitiesWithCoords.length,
        facilitiesWithCoords.reduce((sum, f) => sum + f.longitude!, 0) / facilitiesWithCoords.length,
      ];

  const zoom = mode === 'single' ? 13 : 9;

  return (
    <div className="w-full">
      <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
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
                      className="text-xs text-white px-3 py-1 rounded"                    >
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
        </MapContainer>
      </div>
      
      {showDirections && mode === 'single' && facilitiesWithCoords[0] && (
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${facilitiesWithCoords[0].latitude},${facilitiesWithCoords[0].longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block bg-accent-600 text-white px-4 py-2 rounded hover:bg-accent-700"        >
          Otwórz w Google Maps
        </a>
      )}
    </div>
  );
}