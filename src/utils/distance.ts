// src/utils/distance.ts

/**
 * Oblicza odległość między dwoma punktami geograficznymi używając wzoru Haversine
 * @param lat1 Szerokość geograficzna punktu 1 (stopnie)
 * @param lon1 Długość geograficzna punktu 1 (stopnie)
 * @param lat2 Szerokość geograficzna punktu 2 (stopnie)
 * @param lon2 Długość geograficzna punktu 2 (stopnie)
 * @returns Odległość w kilometrach
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Promień Ziemi w kilometrach
  const R = 6371;

  // Konwersja stopni na radiany
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Zaokrąglij do 1 miejsca po przecinku
  return Math.round(distance * 10) / 10;
}

/**
 * Formatuje dystans do czytelnej postaci
 * @param distance Dystans w kilometrach
 * @returns Sformatowany string (np. "2.5 km", "450 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    // Poniżej 1 km - pokaż w metrach
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }

  return `${distance} km`;
}

/**
 * Oblicza szacunkowy czas dojazdu na podstawie odległości
 * Uwzględnia różne typy dróg (lokalne, wojewódzkie, ekspresowe)
 *
 * @param km - odległość w kilometrach
 * @returns sformatowany string, np. "~20 min" lub "~1 h 15 min"
 */
export function estimateDriveTime(km: number): string {
  // Prędkości średnie dla różnych zakresów (w km/h)
  // 0-10 km: drogi lokalne, korki w mieście (~40 km/h)
  // 10-30 km: drogi wojewódzkie (~50 km/h)
  // 30-50 km: drogi szybkie, mieszanka (~55 km/h)
  // 50+ km: autostrady/ekspresówki (~60 km/h)

  let avgSpeed: number;
  if (km <= 10) {
    avgSpeed = 40;
  } else if (km <= 30) {
    avgSpeed = 50;
  } else if (km <= 50) {
    avgSpeed = 55;
  } else {
    avgSpeed = 60;
  }

  const hours = km / avgSpeed;
  const totalMinutes = Math.round(hours * 60);

  if (totalMinutes < 60) {
    return `~${totalMinutes} min`;
  } else {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
      return `~${h} h`;
    }
    return `~${h} h ${m} min`;
  }
}