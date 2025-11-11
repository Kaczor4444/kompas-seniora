// scripts/seed-mops.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MOPS contacts...');

  // Kraków - Miasto na prawach powiatu
  const krakow = await prisma.mopsContact.upsert({
    where: { city: 'kraków' },
    update: {},
    create: {
      city: 'kraków',
      cityDisplay: 'Kraków',
      name: 'Miejski Ośrodek Pomocy Społecznej w Krakowie',
      phone: '12 616 54 01',
      email: 'mops@mops.krakow.pl',
      address: 'ul. Józefińska 14, 30-529 Kraków',
      website: 'https://mops.krakow.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Miasto na prawach powiatu - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Kraków MOPS created:', krakow.city);

  // Nowy Sącz - Miasto na prawach powiatu
  const nowysacz = await prisma.mopsContact.upsert({
    where: { city: 'nowy sącz' },
    update: {},
    create: {
      city: 'nowy sącz',
      cityDisplay: 'Nowy Sącz',
      name: 'Miejski Ośrodek Pomocy Społecznej w Nowym Sączu',
      phone: '18 444 38 10',
      email: 'sekretariat@mops.nowysacz.pl',
      address: 'ul. Nawojowska 17A, 33-300 Nowy Sącz',
      website: 'https://mops.nowysacz.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Miasto na prawach powiatu - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Nowy Sącz MOPS created:', nowysacz.city);

  // Tarnów - Miasto na prawach powiatu (CUS - dawniej MOPS)
  const tarnow = await prisma.mopsContact.upsert({
    where: { city: 'tarnów' },
    update: {},
    create: {
      city: 'tarnów',
      cityDisplay: 'Tarnów',
      name: 'Centrum Usług Społecznych w Tarnowie (dawniej MOPS)',
      phone: '14 688 20 00',
      email: 'cus@cus.tarnow.pl',
      address: 'al. Solidarności 5-9, 33-100 Tarnów',
      website: 'https://cus.tarnow.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Miasto na prawach powiatu - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Tarnów CUS created:', tarnow.city);

  // Bochnia
  const bochnia = await prisma.mopsContact.upsert({
    where: { city: 'bochnia' },
    update: {},
    create: {
      city: 'bochnia',
      cityDisplay: 'Bochnia',
      name: 'Miejski Ośrodek Pomocy Społecznej w Bochni',
      phone: '14 615 39 10',
      email: 'mops@mopsbochnia.pl',
      address: 'ul. Kolejowa 14, 32-700 Bochnia',
      website: 'https://mopsbochnia.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Bochnia MOPS created:', bochnia.city);

  // Brzesko
  const brzesko = await prisma.mopsContact.upsert({
    where: { city: 'brzesko' },
    update: {},
    create: {
      city: 'brzesko',
      cityDisplay: 'Brzesko',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Brzesku',
      phone: '14 663 15 83',
      email: 'mgops.brzesko@op.pl',
      address: 'ul. Mickiewicza 21, 32-800 Brzesko',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Alternatywny email: mopsbrzesko@mail.zetosa.com.pl - zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Brzesko MGOPS created:', brzesko.city);

  // Chrzanów
  const chrzanow = await prisma.mopsContact.upsert({
    where: { city: 'chrzanów' },
    update: {},
    create: {
      city: 'chrzanów',
      cityDisplay: 'Chrzanów',
      name: 'Miejski Ośrodek Pomocy Społecznej w Chrzanowie',
      phone: '32 623 37 80',
      email: 'mops@mops.chrzanow.pl',
      address: 'ul. Armii Krajowej 5, 32-500 Chrzanów',
      website: 'https://mops.chrzanow.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Chrzanów MOPS created:', chrzanow.city);

  // Dąbrowa Tarnowska
  const dabrowa = await prisma.mopsContact.upsert({
    where: { city: 'dąbrowa tarnowska' },
    update: {},
    create: {
      city: 'dąbrowa tarnowska',
      cityDisplay: 'Dąbrowa Tarnowska',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Dąbrowie Tarnowskiej',
      phone: '14 655 46 82',
      email: 'mgops@dabrowatar.pl',
      address: 'ul. Generała Bema 1, 33-200 Dąbrowa Tarnowska',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Dąbrowa Tarnowska MGOPS created:', dabrowa.city);

  // Gorlice
  const gorlice = await prisma.mopsContact.upsert({
    where: { city: 'gorlice' },
    update: {},
    create: {
      city: 'gorlice',
      cityDisplay: 'Gorlice',
      name: 'Miejski Ośrodek Pomocy Społecznej w Gorlicach',
      phone: '18 353 79 36',
      email: 'mops@gorlice.pl',
      address: 'ul. Stanisława Staszica 2, 38-300 Gorlice',
      website: 'https://gorlice.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Gorlice MOPS created:', gorlice.city);

  // Limanowa
  const limanowa = await prisma.mopsContact.upsert({
    where: { city: 'limanowa' },
    update: {},
    create: {
      city: 'limanowa',
      cityDisplay: 'Limanowa',
      name: 'Miejski Ośrodek Pomocy Społecznej w Limanowej',
      phone: '18 337 20 84',
      email: 'mops@miastolimanowa.pl',
      address: 'ul. Kościuszki 41, 34-600 Limanowa',
      website: 'https://miastolimanowa.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Limanowa MOPS created:', limanowa.city);

  // Miechów
  const miechow = await prisma.mopsContact.upsert({
    where: { city: 'miechów' },
    update: {},
    create: {
      city: 'miechów',
      cityDisplay: 'Miechów',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Miechowie',
      phone: '41 383 18 53',
      email: 'mgops@miechow.eu',
      address: 'ul. Henryka Sienkiewicza 27, 32-200 Miechów',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Miechów MGOPS created:', miechow.city);

  // Myślenice
  const myslenice = await prisma.mopsContact.upsert({
    where: { city: 'myślenice' },
    update: {},
    create: {
      city: 'myślenice',
      cityDisplay: 'Myślenice',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Myślenicach',
      phone: '12 272 19 66',
      email: 'mgops@myslenice.pl',
      address: 'ul. Słoneczna 24, 32-400 Myślenice',
      website: 'https://myslenice.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Myślenice MGOPS created:', myslenice.city);

  // Nowy Targ
  const nowytarg = await prisma.mopsContact.upsert({
    where: { city: 'nowy targ' },
    update: {},
    create: {
      city: 'nowy targ',
      cityDisplay: 'Nowy Targ',
      name: 'Miejski Ośrodek Pomocy Społecznej w Nowym Targu',
      phone: '18 266 21 00',
      email: 'mops@nowytarg.pl',
      address: 'ul. Świętej Katarzyny 1, 34-400 Nowy Targ',
      website: 'https://nowytarg.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Nowy Targ MOPS created:', nowytarg.city);

  // Olkusz
  const olkusz = await prisma.mopsContact.upsert({
    where: { city: 'olkusz' },
    update: {},
    create: {
      city: 'olkusz',
      cityDisplay: 'Olkusz',
      name: 'Miejski Ośrodek Pomocy Społecznej w Olkuszu',
      phone: '32 643 06 17',
      email: 'sekretariat@mops.olkusz.eu',
      address: 'ul. Juliusza Słowackiego 12, 32-300 Olkusz',
      website: 'https://mops.olkusz.eu',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Olkusz MOPS created:', olkusz.city);

  // Oświęcim
  const oswiecim = await prisma.mopsContact.upsert({
    where: { city: 'oświęcim' },
    update: {},
    create: {
      city: 'oświęcim',
      cityDisplay: 'Oświęcim',
      name: 'Miejski Ośrodek Pomocy Społecznej w Oświęcimiu',
      phone: '33 842 27 86',
      email: 'sekretariat@mops.oswiecim.pl',
      address: 'ul. Solskiego 1, 32-600 Oświęcim',
      website: 'https://mops.oswiecim.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Oświęcim MOPS created:', oswiecim.city);

  // Proszowice
  const proszowice = await prisma.mopsContact.upsert({
    where: { city: 'proszowice' },
    update: {},
    create: {
      city: 'proszowice',
      cityDisplay: 'Proszowice',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Proszowicach',
      phone: '12 386 10 93',
      email: 'mgops_proszowice@proszowice.pl',
      address: 'ul. Rynek 2, 32-100 Proszowice',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Proszowice MGOPS created:', proszowice.city);

  // Sucha Beskidzka
  const sucha = await prisma.mopsContact.upsert({
    where: { city: 'sucha beskidzka' },
    update: {},
    create: {
      city: 'sucha beskidzka',
      cityDisplay: 'Sucha Beskidzka',
      name: 'Miejski Ośrodek Pomocy Społecznej w Suchej Beskidzkiej',
      phone: '33 874 24 55',
      email: 'mops@sucha-beskidzka.pl',
      address: 'ul. Adama Mickiewicza 19, 34-200 Sucha Beskidzka',
      website: 'https://sucha-beskidzka.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Sucha Beskidzka MOPS created:', sucha.city);

  // Wadowice
  const wadowice = await prisma.mopsContact.upsert({
    where: { city: 'wadowice' },
    update: {},
    create: {
      city: 'wadowice',
      cityDisplay: 'Wadowice',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Wadowicach',
      phone: '33 873 24 16',
      email: 'sekretariat@mgops.wadowice.pl',
      address: 'ul. dr Józefa Putka 1, 34-100 Wadowice',
      website: 'https://mgops.wadowice.pl',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Wadowice MGOPS created:', wadowice.city);

  // Wieliczka
  const wieliczka = await prisma.mopsContact.upsert({
    where: { city: 'wieliczka' },
    update: {},
    create: {
      city: 'wieliczka',
      cityDisplay: 'Wieliczka',
      name: 'Miejski Ośrodek Pomocy Społecznej w Wieliczce',
      phone: '12 278 18 80',
      email: 'mops@wieliczka.eu',
      address: 'ul. Słowackiego 38, 32-020 Wieliczka',
      website: 'https://wieliczka.eu',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Wieliczka MOPS created:', wieliczka.city);

  // Zakopane
  const zakopane = await prisma.mopsContact.upsert({
    where: { city: 'zakopane' },
    update: {},
    create: {
      city: 'zakopane',
      cityDisplay: 'Zakopane',
      name: 'Miejski Ośrodek Pomocy Społecznej w Zakopanem',
      phone: '18 201 54 86',
      email: 'sekretariat@mops.zakopane.eu',
      address: 'ul. Jagiellońska 7, 34-500 Zakopane',
      website: 'https://mops.zakopane.eu',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Zakopane MOPS created:', zakopane.city);

  // Tuchów
  const tuchow = await prisma.mopsContact.upsert({
    where: { city: 'tuchów' },
    update: {},
    create: {
      city: 'tuchów',
      cityDisplay: 'Tuchów',
      name: 'Miejsko-Gminny Ośrodek Pomocy Społecznej w Tuchowie',
      phone: '14 652 50 16',
      email: 'ops@tuchow.pl',
      address: 'ul. Jana Pawła II 1, 33-170 Tuchów',
      wojewodztwo: 'małopolskie',
      verified: true,
      lastVerified: new Date(),
      notes: 'Zweryfikowano 2025-11-10'
    }
  });
  console.log('✅ Tuchów MGOPS created:', tuchow.city);

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