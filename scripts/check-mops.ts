import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.mopsContact.findMany();
  console.log('📊 All MOPS in database:');
  all.forEach(m => {
    console.log(`  - city: "${m.city}" (length: ${m.city.length})`);
    console.log(`    bytes: ${Buffer.from(m.city).toString('hex')}`);
  });
}

main().finally(() => prisma.$disconnect());
