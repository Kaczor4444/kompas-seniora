/**
 * Formatuje numer telefonu do postaci: XX XXX XX XX
 * Obsługuje różne formaty wejściowe:
 * - 123456789 → 12 345 67 89
 * - 12 345 67 89 → 12 345 67 89
 * - +48123456789 → 12 345 67 89
 * - 12-345-67-89 → 12 345 67 89
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Usuń wszystkie znaki poza cyframi
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Usuń prefix +48 jeśli istnieje
  const withoutPrefix = digitsOnly.startsWith('48') && digitsOnly.length > 9 
    ? digitsOnly.slice(2) 
    : digitsOnly;
  
  // Jeśli nie ma 9 cyfr, zwróć oryginał
  if (withoutPrefix.length !== 9) {
    return phone; // Zwróć oryginał jeśli nieprawidłowy format
  }
  
  // Formatuj: XX XXX XX XX
  return `${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2, 5)} ${withoutPrefix.slice(5, 7)} ${withoutPrefix.slice(7, 9)}`;
}

/**
 * Normalizuje numer telefonu do samych cyfr (bez spacji, myślników, +48)
 * Używane do porównywania numerów
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Usuń prefix +48 jeśli istnieje
  return digitsOnly.startsWith('48') && digitsOnly.length > 9
    ? digitsOnly.slice(2)
    : digitsOnly;
}
