import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTarnow() {
  console.log('🔍 Szukam "Tarnów" w tabeli TerytLocation...\n');

  // Szukaj Tarnowa
  const results = await prisma.terytLocation.findMany({
    where: {
      OR: [
        { nazwa: { contains: 'Tarnów', mode: 'insensitive' } },
        { nazwa: { contains: 'Tarnow', mode: 'insensitive' } },
      ]
    },
    orderBy: { nazwa: 'asc' },
    take: 30
  });

  console.log(`Znaleziono ${results.length} wyników:\n`);

  results.forEach((loc, i) => {
    console.log(`${i + 1}. ${loc.nazwa}`);
    console.log(`   Powiat: ${loc.powiat}`);
    console.log(`   Wojewodztwo: ${loc.wojewodztwo}`);
    console.log(`   RM: ${loc.rodzaj_miejscowosci}`);
    console.log(`   TERYT: ${loc.teryt_sym}`);
    console.log('');
  });

  // Sprawdź ile jest placówek w Tarnowie
  console.log('\n🏥 Sprawdzam placówki w Tarnowie...\n');

  const placowki = await prisma.placowka.findMany({
    where: {
      OR: [
        { miejscowosc: { contains: 'Tarnów', mode: 'insensitive' } },
        { miejscowosc: { contains: 'Tarnow', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      nazwa: true,
      miejscowosc: true,
      powiat: true,
      typ_placowki: true
    }
  });

  console.log(`Znaleziono ${placowki.length} placówek:\n`);

  placowki.forEach((p, i) => {
    console.log(`${i + 1}. ${p.nazwa}`);
    console.log(`   Miejscowość: ${p.miejscowosc}`);
    console.log(`   Powiat: ${p.powiat}`);
    console.log(`   Typ: ${p.typ_placowki}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkTarnow().catch(console.error);
