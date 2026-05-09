// Pola Placowka bezpieczne do ujawnienia publicznie.
// Używaj tego w każdym publicznym GET — zapobiega wyciekowi notatek,
// pól weryfikacji i metadanych admina przez RSC payload / JSON API.
export const PUBLIC_PLACOWKA_SELECT = {
  id: true,
  nazwa: true,
  typ_placowki: true,
  prowadzacy: true,
  ulica: true,
  miejscowosc: true,
  kod_pocztowy: true,
  gmina: true,
  powiat: true,
  wojewodztwo: true,
  telefon: true,
  email: true,
  www: true,
  facebook: true,
  liczba_miejsc: true,
  miejsca_za_zyciem: true,
  profil_opieki: true,
  koszt_pobytu: true,
  data_zrodla_cena: true,
  latitude: true,
  longitude: true,
  data_aktualizacji: true,
  zrodlo_dane: true,
} as const;

// Kolumny do SELECT w raw SQL (ten sam zestaw co powyżej)
export const PUBLIC_PLACOWKA_COLUMNS = [
  'id', 'nazwa', 'typ_placowki', 'prowadzacy', 'ulica', 'miejscowosc',
  'kod_pocztowy', 'gmina', 'powiat', 'wojewodztwo', 'telefon', 'email',
  'www', 'facebook', 'liczba_miejsc', 'miejsca_za_zyciem', 'profil_opieki',
  'koszt_pobytu', 'data_zrodla_cena', 'latitude', 'longitude', 'data_aktualizacji', 'zrodlo_dane',
].map(col => `"${col}"`).join(', ');

type PublicPlacowka = {
  -readonly [K in keyof typeof PUBLIC_PLACOWKA_SELECT]: any;
};

// Filtruje surowy obiekt z bazy do tylko publicznych pól (używane po $queryRaw)
export function pickPublicFields(p: Record<string, unknown>): PublicPlacowka {
  const keys = Object.keys(PUBLIC_PLACOWKA_SELECT) as (keyof typeof PUBLIC_PLACOWKA_SELECT)[];
  const result: Partial<PublicPlacowka> = {};
  for (const key of keys) {
    result[key] = p[key] as any;
  }
  return result as PublicPlacowka;
}
