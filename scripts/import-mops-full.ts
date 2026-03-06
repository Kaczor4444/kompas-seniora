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

function parseTyp(typ: string): string {
  // Mapowanie typów z CSV na nasze typy
  if (typ === 'CUS') return 'CUS';
  if (typ === 'MOPS' || typ === 'MOPR') return 'MOPS';
  if (typ === 'OPS' || typ === 'GOPS' || typ === 'MGOPS') return 'GOPS';
  return typ;
}

async function main() {
  console.log('🚀 IMPORT PEŁNY: Aktualizacja + Nowe rekordy MOPS/GOPS\n');

  // 1. Wczytaj CSV
  const csvContent = fs.readFileSync('raw_dane/malopolskie/ops_malopolska_geo.csv', 'utf-8');
  const parsed = Papa.parse<OpsRecord>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const csvRecords = parsed.data;
  const relevantTypes = ['CUS', 'MOPS', 'MOPR', 'OPS', 'GOPS', 'MGOPS'];
  const csvFiltered = csvRecords.filter(r => relevantTypes.includes(r.typ));

  console.log(`📄 Wczytano CSV: ${csvFiltered.length} rekordów (po filtrze)\n`);

  // 2. Pobierz istniejące rekordy
  const dbRecords = await prisma.mopsContact.findMany();
  console.log(`📦 W bazie obecnie: ${dbRecords.length} rekordów\n`);

  // 3. Przygotuj listy operacji
  const toUpdate: Array<{ db: any; csv: OpsRecord }> = [];
  const toInsertVerified: OpsRecord[] = [];
  const toInsertUnverified: OpsRecord[] = [];

  for (const csvRec of csvFiltered) {
    const normalizedCsvCity = normalizeCity(csvRec.miejscowosc);
    const normalizedCsvGmina = normalizeCity(csvRec.gmina);
    const csvName = csvRec.nazwa.trim();

    // Sprawdź czy istnieje w bazie (city + name musi pasować)
    const existing = dbRecords.find(db => {
      const normalizedDbCity = normalizeCity(db.city);
      const dbName = db.name;

      // Dopasowanie: (city lub gmina) + name
      const cityMatch = normalizedDbCity === normalizedCsvCity || normalizedDbCity === normalizedCsvGmina;
      const nameMatch = dbName === csvName;

      return cityMatch && nameMatch;
    });

    if (existing) {
      // Rekord istnieje - sprawdź czy ma nowsze dane (RJPS)
      const isVerified = csvRec.uwagi?.includes('RJPS');
      if (isVerified) {
        toUpdate.push({ db: existing, csv: csvRec });
      }
    } else {
      // Nowy rekord
      const isVerified = csvRec.uwagi?.includes('RJPS');
      if (isVerified) {
        toInsertVerified.push(csvRec);
      } else {
        toInsertUnverified.push(csvRec);
      }
    }
  }

  console.log('📊 PLAN IMPORTU:');
  console.log(`  ✏️  Do aktualizacji: ${toUpdate.length} rekordów (nowsze dane RJPS)`);
  console.log(`  ✅ Do dodania (zweryfikowane): ${toInsertVerified.length} rekordów`);
  console.log(`  ⚠️  Do dodania (niezweryfikowane): ${toInsertUnverified.length} rekordów\n`);

  console.log('📝 Podgląd pierwszych 5 operacji:\n');

  // Podgląd aktualizacji
  console.log('🔄 AKTUALIZACJE (pierwsze 3):');
  toUpdate.slice(0, 3).forEach(({ db, csv }) => {
    console.log(`  ${db.cityDisplay}`);
    console.log(`    Tel: ${db.phone} → ${csv.telefon}`);
    console.log(`    WWW: ${db.website || '(brak)'} → ${csv.www || '(brak)'}`);
  });

  // Podgląd nowych zweryfikowanych
  console.log('\n✅ NOWE ZWERYFIKOWANE (pierwsze 3):');
  toInsertVerified.slice(0, 3).forEach(csv => {
    console.log(`  ${csv.miejscowosc} (${csv.gmina}) - ${csv.typ}`);
    console.log(`    ${csv.nazwa}`);
    console.log(`    Tel: ${csv.telefon}`);
  });

  // Podgląd nowych niezweryfikowanych
  console.log('\n⚠️  NOWE NIEZWERYFIKOWANE (pierwsze 3):');
  toInsertUnverified.slice(0, 3).forEach(csv => {
    console.log(`  ${csv.miejscowosc} (${csv.gmina}) - ${csv.typ}`);
    console.log(`    ${csv.nazwa}`);
    console.log(`    Tel: ${csv.telefon}`);
    console.log(`    🔔 Notatka: Wymaga ręcznej weryfikacji - dane z mir.org.pl`);
  });

  console.log('\n⏸️  ZATRZYMANO - to był tylko PODGLĄD!');
  console.log('\n💡 Aby wykonać import:');
  console.log('   1. Sprawdź powyższe dane');
  console.log('   2. Odkomentuj sekcję wykonawczą w skrypcie');
  console.log('   3. Uruchom ponownie: npx tsx scripts/import-mops-full.ts\n');

  // ===== SEKCJA WYKONAWCZA (odkomentuj aby wykonać import) =====

  console.log('\n🚀 ROZPOCZYNAM IMPORT...\n');

  // 1. AKTUALIZACJE
  console.log('🔄 Aktualizuję istniejące rekordy...');
  let updatedCount = 0;
  for (const { db, csv } of toUpdate) {
    await prisma.mopsContact.update({
      where: { id: db.id },
      data: {
        name: csv.nazwa.trim(),
        phone: csv.telefon.trim(),
        email: csv.email?.trim() || null,
        address: [csv.ulica, csv.numer_domu].filter(Boolean).join(' ').trim() || csv.miejscowosc,
        website: csv.www?.trim() || null,
        latitude: csv.latitude ? parseFloat(csv.latitude) : null,
        longitude: csv.longitude ? parseFloat(csv.longitude) : null,
        verified: true,
        lastVerified: new Date(),
        notes: `Zaktualizowano z RJPS ${new Date().toISOString().split('T')[0]}. ${csv.godziny_pracy ? 'Godziny: ' + csv.godziny_pracy : ''}`,
      },
    });
    updatedCount++;
  }
  console.log(`  ✅ Zaktualizowano: ${updatedCount} rekordów\n`);

  // 2. NOWE ZWERYFIKOWANE
  console.log('✅ Dodaję nowe zweryfikowane rekordy...');
  let insertedVerified = 0;
  for (const csv of toInsertVerified) {
    // Użyj gmina jako city jeśli jest bardziej precyzyjna niż miejscowosc
    const city = csv.gmina ? normalizeCity(csv.gmina) : normalizeCity(csv.miejscowosc);
    const cityDisplay = csv.miejscowosc.trim();

    await prisma.mopsContact.create({
      data: {
        city,
        cityDisplay,
        typ: parseTyp(csv.typ),
        gmina: csv.gmina?.trim() || null,
        name: csv.nazwa.trim(),
        phone: csv.telefon.trim(),
        email: csv.email?.trim() || null,
        address: [csv.ulica, csv.numer_domu].filter(Boolean).join(' ').trim() || csv.miejscowosc,
        website: csv.www?.trim() || null,
        wojewodztwo: 'małopolskie',
        latitude: csv.latitude ? parseFloat(csv.latitude) : null,
        longitude: csv.longitude ? parseFloat(csv.longitude) : null,
        verified: true,
        lastVerified: new Date(),
        notes: csv.godziny_pracy ? `Godziny pracy: ${csv.godziny_pracy}` : null,
      },
    });
    insertedVerified++;

    if (insertedVerified % 10 === 0) {
      console.log(`  ... ${insertedVerified}/${toInsertVerified.length}`);
    }
  }
  console.log(`  ✅ Dodano: ${insertedVerified} zweryfikowanych rekordów\n`);

  // 3. NOWE NIEZWERYFIKOWANE
  console.log('⚠️  Dodaję nowe niezweryfikowane rekordy...');
  let insertedUnverified = 0;
  const seenUnverified = new Set<string>();

  for (const csv of toInsertUnverified) {
    // Użyj gmina jako city jeśli jest bardziej precyzyjna niż miejscowosc
    const city = csv.gmina ? normalizeCity(csv.gmina) : normalizeCity(csv.miejscowosc);
    const cityDisplay = csv.miejscowosc.trim();
    const name = csv.nazwa.trim();

    // Deduplikacja - pomiń jeśli już widzieliśmy ten sam city+name
    const key = `${city}|${name}`;
    if (seenUnverified.has(key)) {
      console.log(`  ⏭️  Pomijam duplikat: ${cityDisplay} - ${name}`);
      continue;
    }
    seenUnverified.add(key);

    await prisma.mopsContact.create({
      data: {
        city,
        cityDisplay,
        typ: parseTyp(csv.typ),
        gmina: csv.gmina?.trim() || null,
        name: csv.nazwa.trim(),
        phone: csv.telefon.trim(),
        email: csv.email?.trim() || null,
        address: [csv.ulica, csv.numer_domu].filter(Boolean).join(' ').trim() || csv.miejscowosc,
        website: csv.www?.trim() || null,
        wojewodztwo: 'małopolskie',
        latitude: csv.latitude ? parseFloat(csv.latitude) : null,
        longitude: csv.longitude ? parseFloat(csv.longitude) : null,
        verified: false,
        lastVerified: null,
        notes: '⚠️ Wymaga ręcznej weryfikacji - dane z mir.org.pl (brak www/email). Proszę zweryfikować telefon i uzupełnić dane kontaktowe.',
      },
    });
    insertedUnverified++;

    if (insertedUnverified % 10 === 0) {
      console.log(`  ... ${insertedUnverified}/${toInsertUnverified.length}`);
    }
  }
  console.log(`  ⚠️  Dodano: ${insertedUnverified} niezweryfikowanych rekordów\n`);

  // PODSUMOWANIE
  const finalCount = await prisma.mopsContact.count();
  console.log('✨ IMPORT ZAKOŃCZONY!\n');
  console.log('📊 PODSUMOWANIE:');
  console.log(`  Przed importem: ${dbRecords.length} rekordów`);
  console.log(`  Po imporcie: ${finalCount} rekordów`);
  console.log(`  Zaktualizowano: ${updatedCount}`);
  console.log(`  Dodano zweryfikowanych: ${insertedVerified}`);
  console.log(`  Dodano niezweryfikowanych: ${insertedUnverified}`);
  console.log(`\n💡 Niezweryfikowane rekordy można edytować w panelu admin: /admin/mops`);
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
