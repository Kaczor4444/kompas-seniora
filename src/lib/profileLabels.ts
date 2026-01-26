import { getProfileOpiekiNazwyDPS, getProfileOpiekiNazwySDS } from '@/src/data/profileopieki';

// Mapowanie długich opisów na krótsze wersje dla czytelności w search results
const SHORT_LABELS: Record<string, string> = {
  // DPS profiles
  'Osoby przewlekle psychicznie chore': 'Zaburzenia psychiczne',
  'Osoby w podeszłym wieku': 'Osoby starsze',
  'Osoby przewlekle somatycznie chore': 'Choroby przewlekłe',
  'Osoby z niepełnosprawnością intelektualną': 'Niepełn. intelektualna',
  'Osoby niepełnosprawne fizycznie': 'Niepełn. fizyczna',
  'Dzieci niepełnosprawne intelektualnie': 'Dzieci niepełnosprawne',
  'Młodzież niepełnosprawna intelektualnie': 'Młodzież niepełnosprawna',

  // ŚDS profiles
  'Osoby z zaburzeniami psychicznymi': 'Zaburzenia psychiczne',
  'Osoby z niepełnosprawnością fizyczną': 'Niepełn. fizyczna',
  'Osoby niewidome i słabowidzące': 'Niewidomi',
  'Osoby niesłyszące i słabosłyszące': 'Niesłyszący',
};

/**
 * Zwraca skrócone etykiety profili opieki dla danej placówki
 * @param profil - Kody profilu opieki (np. "A,B,C")
 * @param typ - Typ placówki ("DPS" lub "ŚDS")
 * @returns Tablica skróconych etykiet tekstowych
 */
export function getShortProfileLabels(profil: string | null, typ: string): string[] {
  if (!profil) return [];

  // Pobierz pełne nazwy z odpowiedniej funkcji
  const fullNames = typ === 'DPS'
    ? getProfileOpiekiNazwyDPS(profil)
    : getProfileOpiekiNazwySDS(profil);

  // Zamień na krótkie wersje lub zostaw pełną nazwę jeśli nie ma skrótu
  return fullNames.map(name => SHORT_LABELS[name] || name);
}
