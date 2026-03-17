import { normalizePolish } from './normalize-polish';

/**
 * Mapowanie miast na prawach powiatu (TERYT) → powiaty ziemskie (baza placówek)
 *
 * Problem:
 * - TERYT używa: "m. Kraków", "m. Nowy Sącz", "m. Tarnów"
 * - Baza placówek używa: "krakowski", "nowosądecki", "tarnowski"
 *
 * Ta funkcja centralizuje logikę mapowania aby była spójna w całym projekcie.
 *
 * Używana w:
 * - app/search/page.tsx - mapowanie powiatów przy wyszukiwaniu
 * - app/api/teryt/suggest/route.ts - mapowanie przy autocomplete
 * - src/components/search/SearchResults.tsx - mapowanie przy filtrach client-side
 *
 * @param powiat - Nazwa powiatu z TERYT (może być "m. Kraków" lub "krakowski")
 * @returns Zmapowana nazwa powiatu (zawsze powiat ziemski)
 */
export function mapCityCountyToPowiat(powiat: string): string {
  const normalized = normalizePolish(powiat);

  // Kraków
  if (normalized === 'm. krakow' || normalized === 'miasto krakow' || normalized === 'krakow') {
    return 'krakowski';
  }

  // Nowy Sącz
  if (normalized === 'm. nowy sacz' || normalized === 'miasto nowy sacz' || normalized === 'nowy sacz') {
    return 'nowosądecki';
  }

  // Tarnów
  if (normalized === 'm. tarnow' || normalized === 'miasto tarnow' || normalized === 'tarnow') {
    return 'tarnowski';
  }

  // Inne powiaty - bez zmian
  return powiat;
}

/**
 * Sprawdza czy dany powiat jest miastem na prawach powiatu
 *
 * @param powiat - Nazwa powiatu do sprawdzenia
 * @returns true jeśli to miasto na prawach powiatu
 */
export function isCityCounty(powiat: string): boolean {
  const normalized = normalizePolish(powiat);
  return (
    normalized === 'm. krakow' ||
    normalized === 'm. nowy sacz' ||
    normalized === 'm. tarnow' ||
    normalized.startsWith('m. ')
  );
}
