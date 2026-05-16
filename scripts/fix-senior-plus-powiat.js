// Fixes powiat for all 107 Senior+ records — JST name → administrative county
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JST_TO_POWIAT = {
  'Gmina Andrychów':              'wadowicki',
  'Gmina Biały Dunajec':          'tatrzański',
  'Gmina Biecz':                  'gorlicki',
  'Gmina Bobowa':                 'gorlicki',
  'Gmina Bochnia':                'bocheński',
  'Gmina Borzęcin':               'brzeski',
  'Gmina Brzesko':                'brzeski',
  'Gmina Brzeszcze':              'oświęcimski',
  'Gmina Brzeźnica':              'wadowicki',
  'Gmina Ciężkowice':             'tarnowski',
  'Gmina Dobra':                  'limanowski',
  'Gmina Drwinia':                'bocheński',
  'Gmina Dąbrowa Tarnowska':      'dąbrowski',
  'Gmina Dębno':                  'brzeski',
  'Gmina Gnojnik':                'brzeski',
  'Gmina Gorlice':                'gorlicki',
  'Gmina Gołcza':                 'miechowski',
  'Gmina Grybów':                 'nowosądecki',
  'Gmina Gródek nad Dunajcem':    'nowosądecki',
  'Gmina Gręboszów':              'dąbrowski',
  'Gmina Igołomia-Wawrzeńczyce':  'krakowski',
  'Gmina Iwanowice':              'krakowski',
  'Gmina Jodłownik':              'limanowski',
  'Gmina Kalwaria Zebrzydowska':  'wadowicki',
  'Gmina Kamionka Wielka':        'nowosądecki',
  'Gmina Klucze':                 'olkuski',
  'Gmina Kocmyrzów-Luborzyca':    'krakowski',
  'Gmina Korzenna':               'nowosądecki',
  'Gmina Koszyce':                'proszowicki',
  'Gmina Krynica-Zdrój':          'nowosądecki',
  'Gmina Krzeszowice':            'krakowski',
  'Gmina Książ Wielki':           'miechowski',
  'Gmina Kęty':                   'oświęcimski',
  'Gmina Libiąż':                 'chrzanowski',
  'Gmina Maków Podhalański':      'suski',
  'Gmina Michałowice':            'krakowski',
  'Gmina Miechów':                'miechowski',
  'Gmina Mogilany':               'krakowski',
  'Gmina Moszczenica':            'gorlicki',
  'Gmina Mucharz':                'wadowicki',
  'Gmina Myślenice':              'myślenicki',
  'Gmina Nawojowa':               'nowosądecki',
  'Gmina Nowe Brzesko':           'proszowicki',
  'Gmina Olkusz':                 'olkuski',
  'Gmina Podegrodzie':            'nowosądecki',
  'Gmina Proszowice':             'proszowicki',
  'Gmina Przeciszów':             'oświęcimski',
  'Gmina Raciechowice':           'myślenicki',
  'Gmina Racławice':              'miechowski',
  'Gmina Radgoszcz':              'dąbrowski',
  'Gmina Radłów':                 'tarnowski',
  'Gmina Rzezawa':                'bocheński',
  'Gmina Skała':                  'krakowski',
  'Gmina Skrzyszów':              'tarnowski',
  'Gmina Stryszów':               'wadowicki',
  'Gmina Sułkowice':              'myślenicki',
  'Gmina Sułoszowa':              'krakowski',
  'Gmina Szczucin':               'dąbrowski',
  'Gmina Szczurowa':              'brzeski',
  'Gmina Szerzyny':               'tarnowski',
  'Gmina Tarnów':                 'tarnowski',
  'Gmina Trzyciąż':               'olkuski',
  'Gmina Wadowice':               'wadowicki',
  'Gmina Wieprz':                 'wadowicki',
  'Gmina Wierzchosławice':        'tarnowski',
  'Gmina Wietrzychowice':         'dąbrowski',
  'Gmina Wiśniowa':               'myślenicki',
  'Gmina Zabierzów':              'krakowski',
  'Gmina Łukowica':               'limanowski',
  'Gmina Łużna':                  'gorlicki',
  'Gmina Łącko':                  'nowosądecki',
  'Gmina Świątniki Górne':        'krakowski',
  'Gmina Żabno':                  'tarnowski',
  'Gorlice (miasto)':             'gorlicki',
  'Kraków (miasto)':              'krakowski',
  'Limanowa (miasto)':            'limanowski',
  'Mszana Dolna (miasto)':        'limanowski',
  'Nowy Sącz (miasto)':           'm. Nowy Sącz',
  'Nowy Targ (miasto)':           'nowotarski',
  'Powiat Bocheński':             'bocheński',
  'Tarnów (miasto)':              'm. Tarnów',
};

async function main() {
  const records = await prisma.placowka.findMany({
    where: { typ_placowki: { in: ['Klub Senior+', 'Dzienny Dom Senior+'] } },
    select: { id: true, nazwa: true, miejscowosc: true, jst_nazwa: true, powiat: true }
  });

  let updated = 0;
  let skipped = 0;
  const unknown = [];

  for (const rec of records) {
    const newPowiat = rec.jst_nazwa ? JST_TO_POWIAT[rec.jst_nazwa] : null;
    if (!newPowiat) {
      unknown.push({ id: rec.id, jst: rec.jst_nazwa });
      skipped++;
      continue;
    }
    if (rec.powiat === newPowiat) {
      skipped++;
      continue;
    }
    await prisma.placowka.update({
      where: { id: rec.id },
      data: { powiat: newPowiat }
    });
    console.log(`✓ [${rec.id}] ${rec.miejscowosc} (${rec.jst_nazwa}) → ${newPowiat}`);
    updated++;
  }

  if (unknown.length) {
    console.log('\n⚠ Nieznane JST:');
    unknown.forEach(u => console.log(`  id=${u.id} jst="${u.jst}"`));
  }

  console.log(`\nZaktualizowano: ${updated}, pominięto: ${skipped}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
