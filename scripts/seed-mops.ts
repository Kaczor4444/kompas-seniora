// scripts/seed-mops.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MOPS contacts...');

  // Kraków
  const krakow = await prisma.mopsContact.upsert({
    where: { city: 'kraków' },
    update: {},
    create: {
      city: 'kraków',
      cityDisplay: 'Kraków',
      name: 'Miejski Ośrodek Pomocy Społecznej w Krakowie',
      phone: '12 616 66 00',
      email: 'sekretariat@mops.krakow.pl',
      address: 'ul. Józefińska 14/109, 30-529 Kraków',
      website: 'https://mops.krakow.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Główny MOPS w Krakowie - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Kraków MOPS created:', krakow.city);

  // Wieliczka
  const wieliczka = await prisma.mopsContact.upsert({
    where: { city: 'wieliczka' },
    update: {},
    create: {
      city: 'wieliczka',
      cityDisplay: 'Wieliczka',
      name: 'Miejski Ośrodek Pomocy Społecznej w Wieliczce',
      phone: '12 278 32 74',
      email: 'mops@wieliczka.eu',
      address: 'ul. Sienkiewicza 2, 32-020 Wieliczka',
      website: 'https://mops.wieliczka.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'MOPS w Wieliczce - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Wieliczka MOPS created:', wieliczka.city);

  console.log('\n🎉 Seeding completed successfully!');
  console.log(`📊 Total MOPS contacts: ${await prisma.mopsContact.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });