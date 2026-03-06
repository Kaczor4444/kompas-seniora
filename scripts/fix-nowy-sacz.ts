import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNowyScz() {
  console.log('🔧 NAPRAWA DANYCH DLA NOWEGO SĄCZA\n');
  console.log('=' .repeat(60));

  // Znajdź placówkę
  const placowka = await prisma.placowka.findUnique({
    where: { id: 164 }
  });

  if (!placowka) {
    console.log('❌ Nie znaleziono placówki #164');
    return;
  }

  console.log('Przed naprawą:');
  console.log(`   miejscowosc: "${placowka.miejscowosc}"`);
  console.log(`   powiat: "${placowka.powiat}"`);

  // Napraw powiat
  await prisma.placowka.update({
    where: { id: 164 },
    data: {
      powiat: 'nowosądecki'
    }
  });

  console.log('\n✅ Po naprawie:');
  console.log(`   miejscowosc: "${placowka.miejscowosc}"`);
  console.log(`   powiat: "nowosądecki"`);

  // Weryfikacja
  const updated = await prisma.placowka.findUnique({
    where: { id: 164 },
    select: { miejscowosc: true, powiat: true, nazwa: true }
  });

  console.log('\n📊 Weryfikacja:');
  console.log(`   ${updated?.nazwa}`);
  console.log(`   Miejscowość: ${updated?.miejscowosc}`);
  console.log(`   Powiat: ${updated?.powiat}`);

  await prisma.$disconnect();
}

fixNowyScz().catch(console.error);
