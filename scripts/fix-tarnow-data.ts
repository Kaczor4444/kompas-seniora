import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTarnowData() {
  console.log('🔧 NAPRAWA DANYCH DLA TARNOWA\n');
  console.log('=' .repeat(60));

  // 1. Napraw trailing space w placówce #165
  console.log('\n1️⃣ Naprawiam trailing space w miejscowości...');

  const placowka165 = await prisma.placowka.findUnique({
    where: { id: 165 }
  });

  if (placowka165) {
    console.log(`   Przed: miejscowosc = "${placowka165.miejscowosc}" (length: ${placowka165.miejscowosc.length})`);

    await prisma.placowka.update({
      where: { id: 165 },
      data: {
        miejscowosc: placowka165.miejscowosc.trim()
      }
    });

    console.log(`   ✅ Po: miejscowosc = "Tarnów" (bez trailing space)`);
  } else {
    console.log('   ⚠️ Nie znaleziono placówki #165');
  }

  // 2. Napraw powiat w placówce #166
  console.log('\n2️⃣ Naprawiam powiat w placówce #166...');

  const placowka166 = await prisma.placowka.findUnique({
    where: { id: 166 }
  });

  if (placowka166) {
    console.log(`   Przed: powiat = "${placowka166.powiat}"`);

    await prisma.placowka.update({
      where: { id: 166 },
      data: {
        powiat: 'tarnowski'
      }
    });

    console.log(`   ✅ Po: powiat = "tarnowski"`);
  } else {
    console.log('   ⚠️ Nie znaleziono placówki #166');
  }

  // 3. Sprawdź wynik
  console.log('\n3️⃣ Weryfikacja naprawy...\n');

  const tarnowPlacowki = await prisma.placowka.findMany({
    where: {
      miejscowosc: {
        contains: 'Tarnów',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      nazwa: true,
      miejscowosc: true,
      powiat: true
    }
  });

  tarnowPlacowki.forEach(p => {
    console.log(`   ID ${p.id}: ${p.nazwa.substring(0, 40)}...`);
    console.log(`      Miejscowość: "${p.miejscowosc}" (length: ${p.miejscowosc.length})`);
    console.log(`      Powiat: "${p.powiat}"`);
    console.log('');
  });

  console.log('✅ Naprawa zakończona!');
  console.log('   Teraz Tarnów powinien pojawić się w autocomplete z 2 placówkami.');

  await prisma.$disconnect();
}

fixTarnowData().catch(console.error);
