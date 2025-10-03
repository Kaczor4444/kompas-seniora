import { allPlacowki } from './placowki';

// Wyciągnij unikalne miejscowości z wszystkich placówek
export interface Miejscowosc {
  nazwa: string;
  powiat: string;
  count: number; // ile placówek w tej miejscowości
}

function extractMiejscowosci(): Miejscowosc[] {
  const map = new Map<string, { powiat: string; count: number }>();
  
  allPlacowki.forEach(p => {
    const key = `${p.miasto_wies}|${p.powiat}`;
    const existing = map.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { powiat: p.powiat, count: 1 });
    }
  });
  
  const result: Miejscowosc[] = [];
  map.forEach((value, key) => {
    const [nazwa] = key.split('|');
    result.push({
      nazwa,
      powiat: value.powiat,
      count: value.count
    });
  });
  
  return result.sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
}

export const allMiejscowosci = extractMiejscowosci();

// Helper - wyszukiwanie z fuzzy matching
export function searchMiejscowosci(query: string, limit = 10): Miejscowosc[] {
  if (!query.trim()) return [];
  
  const normalized = query.toLowerCase().trim();
  
  return allMiejscowosci
    .filter(m => 
      m.nazwa.toLowerCase().includes(normalized) ||
      m.powiat.toLowerCase().includes(normalized)
    )
    .slice(0, limit);
}