import { getProfileOpiekiNazwyDPS, getProfileOpiekiNazwySDS } from '@/src/data/profileopieki';

const SHORT_LABELS: Record<string, string> = {
  'Osoby przewlekle psychicznie chore': 'Zaburzenia psychiczne',
  'Osoby w podeszłym wieku': 'Osoby starsze',
  'Osoby przewlekle somatycznie chore': 'Choroby przewlekłe',
  'Osoby z niepełnosprawnością intelektualną': 'Niepełn. intelektualna',
  'Osoby niepełnosprawne fizycznie': 'Niepełn. fizyczna',
  'Dzieci niepełnosprawne intelektualnie': 'Dzieci niepełnosprawne',
  'Młodzież niepełnosprawna intelektualnie': 'Młodzież niepełnosprawna',
  'Osoby z zaburzeniami psychicznymi': 'Zaburzenia psychiczne',
  'Osoby z niepełnosprawnością fizyczną': 'Niepełn. fizyczna',
  'Osoby niewidome i słabowidzące': 'Niewidomi',
  'Osoby niesłyszące i słabosłyszące': 'Niesłyszący',
};

// Wzorce dla wolnego tekstu (DPS-y małopolskie mają opisy zamiast kodów)
const FREE_TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/podeszłym wieku/i,                        'Osoby starsze'],
  [/przewlekle somatycznie/i,                  'Choroby przewlekłe'],
  [/przewlekle psychicznie/i,                  'Zaburzenia psychiczne'],
  [/niepełnospraw\w* intelektualnie/i,         'Niepełn. intelektualna'],
  [/niepełnospraw\w* fizycz\w+/i,              'Niepełn. fizyczna'],
  [/dzieci i młodzież\w*/i,                    'Dzieci i młodzież'],
  [/uzależnionych od alkoholu/i,               'Uzależnienia'],
];

function parseFreetextProfile(text: string): string[] {
  const found: string[] = [];
  for (const [pattern, label] of FREE_TEXT_PATTERNS) {
    if (pattern.test(text) && !found.includes(label)) {
      found.push(label);
    }
  }
  return found;
}

export function getShortProfileLabels(profil: string | null, typ: string): string[] {
  if (!profil) return [];

  // Kody literowe zaczynają się od A-I (ŚDS i część DPS śląskich)
  const isLetterCodes = /^[A-I](\s*[,;.]\s*[A-I])*/.test(profil.trim());

  if (isLetterCodes) {
    const codesMatch = profil.match(/^([A-I](?:\s*[,;.]\s*[A-I])*)/);
    const codes = codesMatch ? codesMatch[1].replace(/[;.]/g, ',') : profil;
    const fullNames = typ === 'DPS'
      ? getProfileOpiekiNazwyDPS(codes)
      : getProfileOpiekiNazwySDS(codes);
    return fullNames.map(name => SHORT_LABELS[name] || name);
  }

  // Wolny tekst — DPS Małopolskie
  return parseFreetextProfile(profil);
}
