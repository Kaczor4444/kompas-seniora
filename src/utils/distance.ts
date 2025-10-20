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