/**
 * Normalizacja polskich znaków
 * Centralna funkcja używana w całym projekcie do porównywania tekstów
 *
 * Transformacje:
 * 1. Trim whitespace
 * 2. Lowercase
 * 3. ł/Ł → l
 * 4. NFD normalization (decompose)
 * 5. Remove diacritics (ą→a, ę→e, ó→o, etc.)
 *
 * Używana w:
 * - app/search/page.tsx - porównywanie powiatów i miejscowości
 * - app/api/teryt/suggest/route.ts - wyszukiwanie w bazie TERYT
 * - src/components/search/SearchResults.tsx - filtrowanie client-side
 */
export function normalizePolish(str: string | null | undefined): string {
  if (!str) return '';

  return str
    .trim()                                    // Usuń spacje na początku/końcu
    .toLowerCase()                              // Małe litery
    .replace(/ł/g, 'l')                        // ł → l
    .replace(/Ł/g, 'l')                        // Ł → l
    .normalize('NFD')                          // Unicode decomposition
    .replace(/[\u0300-\u036f]/g, '');         // Usuń diakrytyki (accenty)
}
