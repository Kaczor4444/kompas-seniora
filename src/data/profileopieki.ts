// Profile opieki - kody i nazwy
export const profileOpiekiKody = {
  A: 'Osoby z niepełnosprawnością intelektualną',
  B: 'Osoby z zaburzeniami psychicznymi',
  C: 'Osoby z niepełnosprawnością fizyczną',
  D: 'Osoby w podeszłym wieku',
  E: 'Osoby niewidome i słabowidzące',
  F: 'Osoby niesłyszące i słabosłyszące'
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
