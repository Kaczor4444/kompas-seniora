// Analiza danych w PostgreSQL - trailing spaces, encoding, niespójności
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeData() {
  console.log('🔍 ANALIZA DANYCH W POSTGRESQL (NEON)\n');

  // 1. Total count
  const totalCount = await prisma.placowka.count();
  console.log(`📊 TOTAL PLACÓWEK: ${totalCount}\n`);

  // 2. Sprawdź trailing spaces
  console.log('🔍 TRAILING SPACES:');
  const allFacilities = await prisma.placowka.findMany({
    select: { id: true, miejscowosc: true, powiat: true }
  });

  const withTrailingSpaces = allFacilities.filter(f =>
    f.miejscowosc !== f.miejscowosc.trim() ||
    f.powiat !== f.powiat.trim()
  );

  console.log(`   Placówki z trailing spaces: ${withTrailingSpaces.length}`);
  if (withTrailingSpaces.length > 0) {
    console.log('   Przykłady:');
    withTrailingSpaces.slice(0, 5).forEach(f => {
      console.log(`   - ID ${f.id}: miejscowosc="${f.miejscowosc}", powiat="${f.powiat}"`);
    });
  }
  console.log();

  // 3. Sprawdź różne warianty "Kraków"
  console.log('🏙️ WARIANTY "KRAKÓW":');
  const krakow = await prisma.placowka.findMany({
    where: {
      OR: [
        { miejscowosc: { contains: 'Krak', mode: 'insensitive' } },
        { miejscowosc: { contains: 'krak', mode: 'insensitive' } },
        { powiat: { contains: 'Krak', mode: 'insensitive' } },
        { powiat: { contains: 'krak', mode: 'insensitive' } }
      ]
    },
    select: { miejscowosc: true, powiat: true, typ_placowki: true }
  });

  // Grupuj po miejscowość + powiat
  const grouped = krakow.reduce((acc, f) => {
    const key = `${f.miejscowosc}|${f.powiat}|${f.typ_placowki}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`   Total z "Krak": ${krakow.length}`);
  Object.entries(grouped).forEach(([key, count]) => {
    const [miejscowosc, powiat, typ] = key.split('|');
    console.log(`   - "${miejscowosc}" / powiat: "${powiat}" / ${typ}: ${count}`);
  });
  console.log();

  // 4. Wszystkie unikalne powiaty (szukamy niespójności)
  console.log('📍 WSZYSTKIE POWIATY W MAŁOPOLSCE:');
  const malopolskie = await prisma.placowka.findMany({
    where: { wojewodztwo: 'Małopolskie' },
    select: { powiat: true, typ_placowki: true }
  });

  const powiatyCount = malopolskie.reduce((acc, f) => {
    const key = `${f.powiat}|${f.typ_placowki}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const powiaty = [...new Set(malopolskie.map(f => f.powiat))].sort();
  console.log(`   Unikalne powiaty: ${powiaty.length}`);
  powiaty.forEach(p => {
    const dps = powiatyCount[`${p}|DPS`] || 0;
    const sds = powiatyCount[`${p}|ŚDS`] || 0;
    const total = dps + sds;
    console.log(`   - "${p}": ${total} (${dps} DPS, ${sds} ŚDS)`);
  });
  console.log();

  // 5. Sprawdź czy są miasta na prawach powiatu
  console.log('🏛️ MIASTA NA PRAWACH POWIATU (potencjalne):');
  const potencjalnieMnP = powiaty.filter(p =>
    p.toLowerCase().includes('m.') ||
    p.toLowerCase() === 'kraków' ||
    p.toLowerCase() === 'nowy sącz' ||
    p.toLowerCase() === 'tarnów'
  );

  if (potencjalnieMnP.length > 0) {
    potencjalnieMnP.forEach(p => {
      const count = malopolskie.filter(f => f.powiat === p).length;
      console.log(`   - "${p}": ${count} placówek`);
    });
  } else {
    console.log('   Brak znalezionych');
  }
  console.log();

  // 6. Rozbicie powiat krakowski
  console.log('📊 POWIAT KRAKOWSKI - szczegóły:');
  const krakowski = await prisma.placowka.findMany({
    where: {
      OR: [
        { powiat: 'krakowski' },
        { powiat: 'Krakowski' },
        { powiat: { contains: 'krakow', mode: 'insensitive' } }
      ]
    },
    select: { miejscowosc: true, powiat: true, typ_placowki: true }
  });

  if (krakowski.length > 0) {
    const groupedKrak = krakowski.reduce((acc, f) => {
      const key = `${f.miejscowosc}|${f.typ_placowki}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`   Total: ${krakowski.length}`);
    Object.entries(groupedKrak).forEach(([key, count]) => {
      const [miejscowosc, typ] = key.split('|');
      console.log(`   - ${miejscowosc} (${typ}): ${count}`);
    });
  } else {
    console.log('   Brak placówek w powiecie krakowskim!');
  }
  console.log();

  console.log('✅ ANALIZA ZAKOŃCZONA');
}

analyzeData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
