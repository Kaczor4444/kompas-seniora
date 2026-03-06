import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import Papa from 'papaparse';

const prisma = new PrismaClient();

interface OpsRecord {
  typ: string;
  id_jednostki: string;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  nazwa: string;
  kod_pocztowy: string;
  miejscowosc: string;
  ulica: string;
  numer_domu: string;
  telefon: string;
  www: string;
  email: string;
  godziny_pracy: string;
  teryt_gminy: string;
  latitude: string;
  longitude: string;
  geo_precyzja: string;
  uwagi: string;
}

function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function main() {
  console.log('🔍 PORÓWNANIE: Plik CSV vs Baza Danych\n');

  // 1. Pobierz dane z bazy
  const dbRecords = await prisma.mopsContact.findMany({
    orderBy: { cityDisplay: 'asc' }
  });

  console.log(`📦 W bazie danych: ${dbRecords.length} rekordów`);
  dbRecords.forEach(r => {
    console.log(`  - ${r.cityDisplay} (${r.typ}) - ${r.city}`);
  });

  // 2. Wczytaj CSV
  const csvContent = fs.readFileSync('raw_dane/malopolskie/ops_malopolska_geo.csv', 'utf-8');
  const parsed = Papa.parse<OpsRecord>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const csvRecords = parsed.data;
  console.log(`\n📄 W pliku CSV: ${csvRecords.length} rekordów\n`);

  // 3. Porównaj
  const dbCities = new Set(dbRecords.map(r => normalizeCity(r.city)));

  // Filtruj tylko te typy, które są faktycznymi MOPS/GOPS (bez PCPR)
  const relevantTypes = ['CUS', 'MOPS', 'MOPR', 'OPS', 'GOPS', 'MGOPS'];
  const csvFiltered = csvRecords.filter(r => relevantTypes.includes(r.typ));

  console.log(`📋 Po odfiltrowaniu PCPR: ${csvFiltered.length} rekordów (były ${csvRecords.length})`);

  // Znajdź nowe rekordy (nie ma w bazie)
  const newRecords = csvFiltered.filter(csv => {
    const normalizedCity = normalizeCity(csv.miejscowosc);
    const normalizedGmina = normalizeCity(csv.gmina);

    // Sprawdź czy jest w bazie po miejscowości lub gminie
    return !dbCities.has(normalizedCity) && !dbCities.has(normalizedGmina);
  });

  console.log(`\n✨ NOWE REKORDY (nie ma w bazie): ${newRecords.length}\n`);

  // Podziel na zweryfikowane i niezweryfikowane
  const verified = newRecords.filter(r => r.uwagi?.includes('RJPS'));
  const unverified = newRecords.filter(r => r.uwagi?.includes('mir.org.pl'));

  console.log(`  ✅ Zweryfikowane (RJPS): ${verified.length}`);
  console.log(`  ⚠️  Niezweryfikowane (mir.org.pl): ${unverified.length}\n`);

  // Pokaż przykłady zweryfikowanych
  console.log('📝 Przykłady NOWYCH zweryfikowanych rekordów (gotowe do importu):');
  verified.slice(0, 15).forEach(r => {
    const hasWww = r.www ? '🌐' : '  ';
    const hasEmail = r.email ? '📧' : '  ';
    console.log(`  ${hasWww}${hasEmail} ${r.miejscowosc} (${r.gmina}) - ${r.typ}`);
    console.log(`       ${r.nazwa}`);
    console.log(`       Tel: ${r.telefon}`);
  });

  // Rekordy które już są w bazie
  const existing = csvFiltered.filter(csv => {
    const normalizedCity = normalizeCity(csv.miejscowosc);
    const normalizedGmina = normalizeCity(csv.gmina);
    return dbCities.has(normalizedCity) || dbCities.has(normalizedGmina);
  });

  console.log(`\n\n✓ Rekordy już w bazie: ${existing.length}`);
  existing.forEach(r => {
    console.log(`  - ${r.miejscowosc} (${r.gmina}) - ${r.typ}`);
  });

  console.log(`\n\n📊 PODSUMOWANIE:`);
  console.log(`  W bazie obecnie: ${dbRecords.length}`);
  console.log(`  W CSV (po filtrze): ${csvFiltered.length}`);
  console.log(`  Już w bazie: ${existing.length}`);
  console.log(`  NOWE do dodania: ${newRecords.length}`);
  console.log(`    - zweryfikowane: ${verified.length}`);
  console.log(`    - niezweryfikowane: ${unverified.length}`);
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
