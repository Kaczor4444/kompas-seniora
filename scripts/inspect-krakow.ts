import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  const records = await prisma.placowka.findMany({
    where: {
      miejscowosc: { contains: 'Krak' },
      powiat: 'kraków',
    },
    select: {
      id: true,
      nazwa: true,
      miejscowosc: true,
      powiat: true,
    },
  });

  console.log(`Found ${records.length} records with powiat='kraków':\n`);
  records.forEach((r) => {
    console.log(`ID: ${r.id}`);
    console.log(`  Nazwa: ${r.nazwa}`);
    console.log(`  Miejscowosc: "${r.miejscowosc}" (length: ${r.miejscowosc.length})`);
    console.log(`  Powiat: "${r.powiat}" (length: ${r.powiat.length})`);
    console.log(`  Miejscowosc hex: ${Buffer.from(r.miejscowosc, 'utf8').toString('hex')}`);
    console.log(`  Powiat hex: ${Buffer.from(r.powiat, 'utf8').toString('hex')}`);
    console.log('');
  });

  await prisma.$disconnect();
}

inspect();
