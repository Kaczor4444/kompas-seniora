// src/lib/powiat-to-city.ts

/**
 * Mapowanie powiatów na miasta powiatowe gdzie znajdują się MOPS-y
 * Używane jako fallback gdy nie ma MOPS-u dla małej miejscowości
 */

export const powiatToCity: Record<string, string> = {
  // Małopolskie - miasta na prawach powiatu
  'kraków': 'kraków',
  'nowy sącz': 'nowy sącz',
  'tarnów': 'tarnów',
  
  // Małopolskie - powiaty ziemskie
  'bocheński': 'bochnia',
  'bochnia': 'bochnia',
  'brzeski': 'brzesko',
  'brzesko': 'brzesko',
  'chrzanowski': 'chrzanów',
  'chrzanow': 'chrzanów',
  'chrzanów': 'chrzanów',
  'dąbrowski': 'dąbrowa tarnowska',
  'dabrowski': 'dąbrowa tarnowska',
  'dąbrowa tarnowska': 'dąbrowa tarnowska',
  'gorlicki': 'gorlice',
  'gorlice': 'gorlice',
  'krakowski': 'kraków',
  'krakow': 'kraków',
  'limanowski': 'limanowa',
  'limanowa': 'limanowa',
  'miechowski': 'miechów',
  'miechow': 'miechów',
  'miechów': 'miechów',
  'myślenicki': 'myślenice',
  'myslenicki': 'myślenice',
  'myslenice': 'myślenice',
  'myślenice': 'myślenice',
  'nowosądecki': 'nowy sącz',
  'nowosadecki': 'nowy sącz',
  'nowy sącz': 'nowy sącz',
  'nowy sacz': 'nowy sącz',
  'nowotarski': 'nowy targ',
  'nowatorski': 'nowy targ', // typo w bazie
  'nowy targ': 'nowy targ',
  'olkuski': 'olkusz',
  'olkusz': 'olkusz',
  'oświęcimski': 'oświęcim',
  'oswiecimski': 'oświęcim',
  'oswiecim': 'oświęcim',
  'oświęcim': 'oświęcim',
  'proszowicki': 'proszowice',
  'proszowice': 'proszowice',
  'suski': 'sucha beskidzka',
  'sucha beskidzka': 'sucha beskidzka',
  'tarnowski': 'tarnów',
  'tarnow': 'tarnów',
  'tatrzański': 'zakopane',
  'tatrzanski': 'zakopane',
  'zakopane': 'zakopane',
  'wadowicki': 'wadowice',
  'wadowice': 'wadowice',
  'wielicki': 'wieliczka',
  'wieliczka': 'wieliczka',
  
  // Śląskie (przykłady - dodaj więcej gdy będziesz mieć dane)
  'bielski': 'bielsko-biała',
  'bielsko': 'bielsko-biała',
  'bielsko-biała': 'bielsko-biała',
  'bielsko biała': 'bielsko-biała',
};

/**
 * Normalizuje nazwę powiatu przed lookup
 * - lowercase
 * - trim whitespace
 */
export function normalizePowiat(powiat: string): string {
  return powiat.toLowerCase().trim();
}

/**
 * Mapuje powiat na miasto powiatowe (MOPS)
 * Zwraca null jeśli nie znaleziono mapowania
 */
export function mapPowiatToCity(powiat: string): string | null {
  const normalized = normalizePowiat(powiat);
  return powiatToCity[normalized] || null;
}

/**
 * Sprawdza czy dane miasto/miejscowość jest miastem powiatowym
 * (tzn. czy ma bezpośredni MOPS)
 */
export function isCityWithMops(city: string): boolean {
  const normalized = city.toLowerCase().trim();
  const cities = new Set(Object.values(powiatToCity));
  return cities.has(normalized);
}