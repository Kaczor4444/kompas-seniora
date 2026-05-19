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

  // ===== ŚLĄSKIE — 19 miast na prawach powiatu =====
  if (normalized === 'm. bielsko-biala' || normalized === 'm. bielsko biala' || normalized === 'bielsko-biala') return 'm. Bielsko-Biała';
  if (normalized === 'm. bytom' || normalized === 'bytom') return 'm. Bytom';
  if (normalized === 'm. chorzow' || normalized === 'chorzow') return 'm. Chorzów';
  if (normalized === 'm. czestochowa' || normalized === 'czestochowa') return 'm. Częstochowa';
  if (normalized === 'm. dabrowa gornicza' || normalized === 'dabrowa gornicza') return 'm. Dąbrowa Górnicza';
  if (normalized === 'm. gliwice' || normalized === 'gliwice') return 'm. Gliwice';
  if (normalized === 'm. jastrzebie-zdro j' || normalized === 'm. jastrzebie zdro j' || normalized === 'jastrzebie-zdro j' || normalized === 'm. jastrzebie-zdroj' || normalized === 'jastrzebie zdro j') return 'm. Jastrzębie-Zdrój';
  if (normalized === 'm. jaworzno' || normalized === 'jaworzno') return 'm. Jaworzno';
  if (normalized === 'm. katowice' || normalized === 'katowice') return 'm. Katowice';
  if (normalized === 'm. myslowice' || normalized === 'myslowice') return 'm. Mysłowice';
  if (normalized === 'm. piekary slaskie' || normalized === 'piekary slaskie') return 'm. Piekary Śląskie';
  if (normalized === 'm. ruda slaska' || normalized === 'ruda slaska') return 'm. Ruda Śląska';
  if (normalized === 'm. rybnik' || normalized === 'rybnik') return 'm. Rybnik';
  if (normalized === 'm. siemianowice slaskie' || normalized === 'siemianowice slaskie') return 'm. Siemianowice Śląskie';
  if (normalized === 'm. sosnowiec' || normalized === 'sosnowiec') return 'm. Sosnowiec';
  if (normalized === 'm. swietochlowice' || normalized === 'swietochlowice') return 'm. Świętochłowice';
  if (normalized === 'm. tychy' || normalized === 'tychy') return 'm. Tychy';
  if (normalized === 'm. zabrze' || normalized === 'zabrze') return 'm. Zabrze';
  if (normalized === 'm. zory' || normalized === 'zory') return 'm. Żory';

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
