// scripts/normalize-profil-opieki.ts
// Skrypt do normalizacji profili opieki w bazie danych

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapowanie tekstów na kody
const TEXT_TO_CODE_MAP: Record<string, string[]> = {
  // Osoby starsze / podeszły wiek
  'osoby-starsze': ['E'],
  'dla osób w podeszłym wieku': ['E'],
  'dla osób w w podeszłym wieku': ['E'],
  'w podeszłym wieku': ['E'],
  
  // Niepełnosprawność intelektualna
  'dorosłych niepełnosprawnych intelektualnie': ['A'],
  'niepełnosprawnych intelektualnie': ['A'],
  
  // Dzieci/młodzież niepełnosprawna intelektualnie
  'dzieci, młodzieży niepełnosprawnych intelektualnie': ['G', 'H'],
  'dzieci i młodzieży niepełnosporawnych intelektualnie': ['G', 'H'],
  'zieci i młodzieży niepełnosporawnych intelektualnie': ['G', 'H'],
  
  // Przewlekle chorzy
  'przewlekle-chorzy': ['F'],
  'przewlekle-chore': ['F'],
  'dla osób przewlekle somatycznie chorych': ['F'],
  'przewlekle somatycznie chorych': ['F'],
  'dla osób przewlekle psychicznie chorych': ['C'],
  'przewlekle psychicznie chorych': ['C'],
  
  // Niepełnosprawność fizyczna
  'niepełnosprawnych fizycznie': ['I'],
};

// Funkcja do parsowania i normalizacji
function normalizeProfilOpieki(input: string | null): string | null {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Jeśli już jest w formacie A,B,C - zostaw
  if (/^[A-I](,[A-I])*$/.test(trimmed)) {
    return trimmed;
  }
  
  const codes = new Set<string>();
  
  // Sprawdź każdy mapping
  for (const [text, kodyCodes] of Object.entries(TEXT_TO_CODE_MAP)) {
    if (trimmed.toLowerCase().includes(text.toLowerCase())) {
      kodyCodes.forEach(code => codes.add(code));
    }
  }
  
  // Obsługa pipe separator (|)
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    parts.forEach(part => {
      const normalized = normalizeProfilOpieki(part);
      if (normalized) {
        normalized.split(',').forEach(code => codes.add(code.trim()));
      }
    });
  }
  
  // Obsługa przecinków w długich opisach
  if (trimmed.includes(',') && !trimmed.match(/^[A-I]/)) {
    const parts = trimmed.split(',');
    parts.forEach(part => {
      for (const [text, kodyCodes] of Object.entries(TEXT_TO_CODE_MAP)) {
        if (part.trim().toLowerCase().includes(text.toLowerCase())) {
          kodyCodes.forEach(code => codes.add(code));
        }
      }
    });
  }
  
  if (codes.size === 0) {
    console.warn(`⚠️  Nie znaleziono mappingu dla: "${trimmed}"`);
    return null;
  }
  
  // Sortuj kody alfabetycznie
  return Array.from(codes).sort().join(',');
}

async function main() {
  console.log('🚀 Rozpoczynam normalizację profili opieki...\n');
  
  // Pobierz wszystkie placówki z profilem opieki
  const placowki = await prisma.placowka.findMany({
    where: {
      profil_opieki: {
        not: null
      }
    },
    select: {
      id: true,
      nazwa: true,
      profil_opieki: true,
    }
  });
  
  console.log(`📊 Znaleziono ${placowki.length} placówek z profilem opieki\n`);
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const placowka of placowki) {
    const original = placowka.profil_opieki;
    const normalized = normalizeProfilOpieki(original);
    
    if (!normalized) {
      console.log(`❌ [ID ${placowka.id}] ${placowka.nazwa}`);
      console.log(`   Brak mappingu dla: "${original}"\n`);
      failed++;
      continue;
    }
    
    if (original === normalized) {
      console.log(`⏭️  [ID ${placowka.id}] ${placowka.nazwa}`);
      console.log(`   Już znormalizowane: ${normalized}\n`);
      skipped++;
      continue;
    }
    
    console.log(`✏️  [ID ${placowka.id}] ${placowka.nazwa}`);
    console.log(`   Przed: "${original}"`);
    console.log(`   Po:    "${normalized}"\n`);
    
    // Aktualizuj bazę
    await prisma.placowka.update({
      where: { id: placowka.id },
      data: { profil_opieki: normalized }
    });
    
    updated++;
  }
  
  console.log('\n✅ PODSUMOWANIE:');
  console.log(`   Zaktualizowano: ${updated}`);
  console.log(`   Pominięto (już OK): ${skipped}`);
  console.log(`   Błędy (brak mappingu): ${failed}`);
  console.log(`   Razem: ${placowki.length}`);
  
  // Pokaż unikalne znormalizowane wartości
  const uniqueProfiles = await prisma.placowka.findMany({
    where: {
      profil_opieki: { not: null }
    },
    select: {
      profil_opieki: true
    },
    distinct: ['profil_opieki']
  });
  
  console.log('\n📋 UNIKALNE PROFILE PO NORMALIZACJI:');
  uniqueProfiles
    .map(p => p.profil_opieki)
    .sort()
    .forEach(profile => {
      console.log(`   ${profile}`);
    });
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });