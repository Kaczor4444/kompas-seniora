const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const POWIATY_MAP = {
  '01': 'bocheński',
  '02': 'brzeski',
  '03': 'chrzanowski',
  '04': 'dąbrowski',
  '05': 'gorlicki',
  '06': 'krakowski',
  '07': 'limanowski',
  '08': 'miechowski',
  '09': 'myślenicki',
  '10': 'nowosądecki',
  '11': 'nowotarski',
  '12': 'olkuski',
  '13': 'oświęcimski',
  '14': 'proszowicki',
  '15': 'suski',
  '16': 'tarnowski',
  '17': 'tatrzański',
  '18': 'wadowicki',
  '19': 'wielicki',
  '61': 'm. Kraków',
  '62': 'm. Nowy Sącz',
  '63': 'm. Tarnów',
};

function normalizePolish(str) {
  return str.toLowerCase().replace(/ł/g, 'l').replace(/Ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function sync() {
  console.log('Pobieram miejscowości z placówek...');
  
  const facilities = await prisma.placowka.findMany({ select: { miejscowosc: true } });
  const cityMap = new Map();
  facilities.forEach(f => {
    const norm = normalizePolish(f.miejscowosc);
    if (!cityMap.has(norm)) cityMap.set(norm, f.miejscowosc);
  });
  
  console.log('Znaleziono miast:', cityMap.size, '\n');
  
  const missingCities = [];
  for (const [norm, name] of cityMap) {
    const exists = await prisma.terytLocation.findFirst({ where: { nazwa_normalized: norm }});
    if (!exists) {
      console.log('Brak:', name);
      missingCities.push({ norm, name });
    } else {
      console.log('Jest:', name);
    }
  }
  
  if (missingCities.length === 0) {
    console.log('\nWszystkie miasta są w TERYT!');
    return;
  }
  
  console.log('\nDodaję brakujące miasta...\n');
  
  const csv = fs.readFileSync('data/SIMC_Adresowy_20250922.csv', 'utf-8').split('\n');
  csv.shift();
  
  let added = 0;
  for (const city of missingCities) {
    for (const line of csv) {
      const [woj, pow, , , , , nazwa] = line.split(';');
       if (nazwa && normalizePolish(nazwa.trim()) === city.norm && woj === '12') {        try {
          await prisma.terytLocation.create({
            data: {
              nazwa: nazwa.trim(),
              nazwa_normalized: city.norm,
              typ: 'miasto',
              powiat: POWIATY_MAP[pow],
              wojewodztwo: 'małopolskie',
              gmina: nazwa.trim()
            }
          });
          console.log('Dodano:', nazwa.trim());
          added++;
        } catch (e) {}
        break;
      }
    }
  }
  
  console.log('\nZakończono! Dodano:', added);
  await prisma.$disconnect();
}

sync();