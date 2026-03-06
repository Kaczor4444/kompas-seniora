import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== DOKŁADNE WARTOŚCI W POLU "powiat" ===\n');

  const krakowRelated = await prisma.placowka.findMany({
    where: {
      OR: [
        { powiat: { contains: 'krakow', mode: 'insensitive' } },
        { powiat: { contains: 'krakowski', mode: 'insensitive' } },
        { powiat: { contains: 'Kraków', mode: 'insensitive' } }
      ]
    },
    select: {
      powiat: true
    }
  });

  // Uniq values
  const uniquePowiats = [...new Set(krakowRelated.map(p => p.powiat))];

  console.log(`📊 Unikalne wartości w polu "powiat" dla Krakowa:`);
  uniquePowiats.forEach(powiat => {
    const count = krakowRelated.filter(p => p.powiat === powiat).length;
    console.log(`  "${powiat}": ${count} placówek`);

    // Show bytes
    const bytes = Buffer.from(powiat, 'utf-8').toString('hex');
    console.log(`    → bytes: ${bytes}`);
  });

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
