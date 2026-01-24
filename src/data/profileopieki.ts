// Profile opieki - kody i nazwy
// Uwaga: Kody mają różne znaczenia dla DPS vs ŚDS!

export const profileOpiekiKody = {
  // Wspólne dla DPS i ŚDS
  A: 'Osoby z niepełnosprawnością intelektualną',
  
  // ŚDS: zaburzenia psychiczne | DPS: nie używane w tym znaczeniu
  B: 'Osoby z zaburzeniami psychicznymi',
  
  // ŚDS: niepełnosprawność fizyczna | DPS: przewlekle psychicznie chorzy
  C: 'Osoby z zaburzeniami psychicznymi / niepełnosprawnością fizyczną',
  
  // ŚDS: podeszły wiek | DPS: nie używane
  D: 'Osoby w podeszłym wieku',
  
  // ŚDS: niewidomi | DPS: podeszły wiek
  E: 'Osoby w podeszłym wieku / niewidomi i słabowidzący',
  
  // ŚDS: niesłyszący | DPS: przewlekle somatycznie chorzy
  F: 'Osoby przewlekle somatycznie chore / niesłyszący',
  
  // DPS: dzieci niepełnosprawni intelektualnie
  G: 'Dzieci i młodzież niepełnosprawni intelektualnie',
  H: 'Dzieci i młodzież niepełnosprawni intelektualnie',
  
  // DPS: niepełnosprawni fizycznie
  I: 'Osoby niepełnosprawne fizycznie'
} as const;

export type ProfileOpiekiKod = keyof typeof profileOpiekiKody;

export function getProfileOpiekiNazwy(kody: string | null): string[] {
  if (!kody) return [];
  
  return kody
    .split(',')
    .map(kod => kod.trim() as ProfileOpiekiKod)
    .filter(kod => kod in profileOpiekiKody)
    .map(kod => profileOpiekiKody[kod]);
}

// Funkcja dla DPS - bardziej precyzyjna
export function getProfileOpiekiNazwyDPS(kody: string | null): string[] {
  if (!kody) return [];
  
  const mapping: Record<string, string> = {
    'A': 'Osoby z niepełnosprawnością intelektualną',
    'C': 'Osoby przewlekle psychicznie chore',
    'E': 'Osoby w podeszłym wieku',
    'F': 'Osoby przewlekle somatycznie chore',
    'G': 'Dzieci niepełnosprawne intelektualnie',
    'H': 'Młodzież niepełnosprawna intelektualnie',
    'I': 'Osoby niepełnosprawne fizycznie'
  };
  
  return kody
    .split(',')
    .map(kod => kod.trim())
    .filter(kod => kod in mapping)
    .map(kod => mapping[kod]);
}

// Funkcja dla ŚDS
export function getProfileOpiekiNazwySDS(kody: string | null): string[] {
  if (!kody) return [];
  
  const mapping: Record<string, string> = {
    'A': 'Osoby z niepełnosprawnością intelektualną',
    'B': 'Osoby z zaburzeniami psychicznymi',
    'C': 'Osoby z niepełnosprawnością fizyczną',
    'D': 'Osoby w podeszłym wieku',
    'E': 'Osoby niewidome i słabowidzące',
    'F': 'Osoby niesłyszące i słabosłyszące'
  };
  
  return kody
    .split(',')
    .map(kod => kod.trim())
    .filter(kod => kod in mapping)
    .map(kod => mapping[kod]);
}
