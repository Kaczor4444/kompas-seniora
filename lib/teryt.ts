/**
 * TERYT Helper Functions
 * Normalization and search utilities for Polish place names
 */

/**
 * Normalize Polish characters to ASCII equivalents
 * Example: "Kraków" -> "krakow", "Łódź" -> "lodz"
 */
 export function normalizePolishString(text: string): string {
    if (!text) return '';
    
    const polishChars: Record<string, string> = {
      'ą': 'a', 'Ą': 'a',
      'ć': 'c', 'Ć': 'c',
      'ę': 'e', 'Ę': 'e',
      'ł': 'l', 'Ł': 'l',
      'ń': 'n', 'Ń': 'n',
      'ó': 'o', 'Ó': 'o',
      'ś': 's', 'Ś': 's',
      'ź': 'z', 'Ź': 'z',
      'ż': 'z', 'Ż': 'z'
    };
    
    return text
      .split('')
      .map(char => polishChars[char] || char)
      .join('')
      .toLowerCase()
      .trim();
  }
  
  /**
   * Check if search query matches location
   * Handles both exact and normalized matches
   */
  export function matchesLocation(
    query: string, 
    location: string
  ): boolean {
    if (!query || !location) return false;
    
    const normalizedQuery = normalizePolishString(query);
    const normalizedLocation = normalizePolishString(location);
    
    return normalizedLocation.includes(normalizedQuery);
  }
  
  /**
   * Calculate match score for ranking results
   * Higher score = better match
   */
  export function calculateMatchScore(
    query: string,
    fields: {
      nazwa?: string;
      miejscowosc?: string;
      gmina?: string;
      powiat?: string;
    }
  ): number {
    const normalizedQuery = normalizePolishString(query);
    let score = 0;
    
    // Exact match in miejscowość = highest priority
    if (fields.miejscowosc && normalizePolishString(fields.miejscowosc) === normalizedQuery) {
      score += 100;
    } else if (fields.miejscowosc && normalizePolishString(fields.miejscowosc).includes(normalizedQuery)) {
      score += 50;
    }
    
    // Match in gmina = high priority
    if (fields.gmina && normalizePolishString(fields.gmina) === normalizedQuery) {
      score += 80;
    } else if (fields.gmina && normalizePolishString(fields.gmina).includes(normalizedQuery)) {
      score += 40;
    }
    
    // Match in powiat = medium priority
    // Handle Polish grammar: "olkusz" (gmina) vs "olkuski" (powiat adjective)
    const normalizedPowiat = fields.powiat ? normalizePolishString(fields.powiat) : '';
    
    if (normalizedPowiat === normalizedQuery) {
      score += 60; // Exact match
    } else {
      // Count matching characters from the START
      // "olkusz" vs "olkuski": o-l-k-u-s match = 5 chars
      let matchingChars = 0;
      const minLen = Math.min(normalizedQuery.length, normalizedPowiat.length);
      
      for (let i = 0; i < minLen; i++) {
        if (normalizedQuery[i] === normalizedPowiat[i]) {
          matchingChars++;
        } else {
          break; // Stop at first difference
        }
      }
      
      const similarity = matchingChars / normalizedQuery.length;
      
      // "olkusz" (6 chars) vs "olkuski": 5 matching = 5/6 = 0.83
      if (similarity >= 0.75 && matchingChars >= 4) {
        score += 55; // Strong prefix match
      } else if (similarity >= 0.6 && matchingChars >= 3) {
        score += 40; // Decent prefix match
      } else if (normalizedPowiat.includes(normalizedQuery)) {
        score += 30; // Query appears somewhere in powiat
      }
    }
    
    // Match in nazwa placówki = lower priority
    if (fields.nazwa && normalizePolishString(fields.nazwa).includes(normalizedQuery)) {
      score += 20;
    }
    
    return score;
  }