import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTrailingSpaces() {
  console.log('🔧 NAPRAWA TRAILING SPACES\n');
  console.log('=' .repeat(60));

  // Znajdź wszystkie placówki z trailing spaces w miejscowości
  const allPlacowki = await prisma.placowka.findMany({
    select: {
      id: true,
      miejscowosc: true,
      powiat: true,
      nazwa: true
    }
  });

  const withTrailing = allPlacowki.filter(p => p.miejscowosc !== p.miejscowosc.trim());

  console.log(`Znaleziono ${withTrailing.length} placówek z trailing spaces:\n`);

  for (const p of withTrailing) {
    console.log(`[ID ${p.id}] ${p.nazwa.substring(0, 50)}...`);
    console.log(`   Przed: "${p.miejscowosc}" (length: ${p.miejscowosc.length})`);

    const trimmed = p.miejscowosc.trim();

    await prisma.placowka.update({
      where: { id: p.id },
      data: { miejscowosc: trimmed }
    });

    console.log(`   Po: "${trimmed}" (length: ${trimmed.length})`);
    console.log('   ✅ Naprawiono\n');
  }

  console.log(`\n✅ Naprawiono ${withTrailing.length} placówek!`);

  await prisma.$disconnect();
}

fixTrailingSpaces().catch(console.error);
