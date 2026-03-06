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
  console.log('🔍 SPRAWDZANIE: Czy istniejące rekordy są w CSV jako zweryfikowane?\n');

  // 1. Pobierz dane z bazy
  const dbRecords = await prisma.mopsContact.findMany({
    orderBy: { cityDisplay: 'asc' }
  });

  console.log(`📦 W bazie danych: ${dbRecords.length} rekordów\n`);

  // 2. Wczytaj CSV
  const csvContent = fs.readFileSync('raw_dane/malopolskie/ops_malopolska_geo.csv', 'utf-8');
  const parsed = Papa.parse<OpsRecord>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const csvRecords = parsed.data;
  const relevantTypes = ['CUS', 'MOPS', 'MOPR', 'OPS', 'GOPS', 'MGOPS'];
  const csvFiltered = csvRecords.filter(r => relevantTypes.includes(r.typ));

  // 3. Dla każdego rekordu z bazy sprawdź czy jest w CSV
  console.log('📋 ANALIZA REKORDÓW W BAZIE:\n');

  let foundInCsv = 0;
  let foundVerified = 0;
  let foundUnverified = 0;
  let notFoundInCsv = 0;

  for (const dbRecord of dbRecords) {
    const normalizedDbCity = normalizeCity(dbRecord.city);

    // Znajdź w CSV
    const csvMatches = csvFiltered.filter(csv => {
      const normalizedCsvCity = normalizeCity(csv.miejscowosc);
      const normalizedCsvGmina = normalizeCity(csv.gmina);

      return normalizedCsvCity === normalizedDbCity || normalizedCsvGmina === normalizedDbCity;
    });

    if (csvMatches.length > 0) {
      foundInCsv++;
      const verified = csvMatches.filter(m => m.uwagi?.includes('RJPS'));

      console.log(`✓ ${dbRecord.cityDisplay} - ZNALEZIONO w CSV (${csvMatches.length} rekordów)`);

      csvMatches.forEach((match, idx) => {
        const isVerified = match.uwagi?.includes('RJPS');
        const badge = isVerified ? '✅ RJPS' : '⚠️  mir.org.pl';

        if (isVerified) foundVerified++;
        else foundUnverified++;

        console.log(`   ${idx + 1}. ${badge} - ${match.typ}`);
        console.log(`      ${match.nazwa}`);
        console.log(`      Tel: ${match.telefon}`);

        // Porównaj dane
        const differences = [];
        if (match.telefon !== dbRecord.phone) differences.push('telefon');
        if (match.www && match.www !== dbRecord.website) differences.push('www');
        if (match.email && match.email !== dbRecord.email) differences.push('email');

        if (differences.length > 0) {
          console.log(`      🔄 RÓŻNICE: ${differences.join(', ')}`);
          if (differences.includes('telefon')) {
            console.log(`         Tel DB: ${dbRecord.phone} → CSV: ${match.telefon}`);
          }
          if (differences.includes('www')) {
            console.log(`         WWW DB: ${dbRecord.website || '(brak)'} → CSV: ${match.www}`);
          }
          if (differences.includes('email')) {
            console.log(`         Email DB: ${dbRecord.email || '(brak)'} → CSV: ${match.email}`);
          }
        } else {
          console.log(`      ✓ Dane zgodne`);
        }
      });
      console.log('');
    } else {
      notFoundInCsv++;
      console.log(`❌ ${dbRecord.cityDisplay} - NIE ZNALEZIONO w CSV`);
      console.log(`   Baza: ${dbRecord.name}`);
      console.log(`   Tel: ${dbRecord.phone}\n`);
    }
  }

  console.log('\n📊 PODSUMOWANIE:');
  console.log(`  Rekordy w bazie: ${dbRecords.length}`);
  console.log(`  Znalezione w CSV: ${foundInCsv}`);
  console.log(`    - jako zweryfikowane (RJPS): ${foundVerified}`);
  console.log(`    - jako niezweryfikowane: ${foundUnverified}`);
  console.log(`  Nie znalezione w CSV: ${notFoundInCsv}`);

  console.log('\n💡 REKOMENDACJA:');
  if (foundVerified > 0) {
    console.log(`  ✅ ${foundVerified} rekordów ma nowsze dane z RJPS - warto zaktualizować!`);
  }
  if (notFoundInCsv > 0) {
    console.log(`  ⚠️  ${notFoundInCsv} rekordów nie ma w CSV - zachowaj w bazie!`);
  }
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
