// Słownik profili opieki - centralne źródło prawdy
export const profileOpiekiKody = {
    'A': 'Niepełnosprawność intelektualna (dorośli)',
    'B': 'Spektrum autyzmu',
    'C': 'Zaburzenia psychiczne, demencja, Alzheimer',
    'D': 'Niepełnosprawności sprzężone',
    'E': 'Osoby w podeszłym wieku',
    'F': 'Przewlekle somatycznie chorzy',
    'G': 'Dzieci niepełnosprawne intelektualnie',
    'H': 'Młodzież niepełnosprawna intelektualnie',
    'I': 'Niepełnosprawność fizyczna (motoryczna)'
  } as const;
  
  export type ProfilOpiekiKod = keyof typeof profileOpiekiKody;
  
  // Funkcja helper do parsowania kodów z stringa
  export function parseProfileOpieki(kody: string | null): ProfilOpiekiKod[] {
    if (!kody) return [];
    return kody.split(',').map(k => k.trim() as ProfilOpiekiKod);
  }
  
  // Funkcja do wyświetlania nazw
  export function getProfileOpiekiNazwy(kody: string | null): string[] {
    const parsed = parseProfileOpieki(kody);
    return parsed.map(kod => profileOpiekiKody[kod]);
  }