// scripts/fill-dps-official-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// DANE Z PDF (wykaz DPS Małopolska 18.02.2026) - TYLKO PEWNE DOPASOWANIA
const DPS_PDF = [
  // NOWE - pewne dopasowania (unikalne po powiecie + ulicy):
  { lp: 5, nazwa: 'Powiatowy Dom Pomocy Społecznej\nim. Adama Starzeńskiego w Płazie\nul. Wiosny Ludów 4\n32-552 Płaza', powiat: 'chrzanowski', ulica: 'Wiosny Ludów' },
  { lp: 8, nazwa: 'Dom Pomocy Społecznej\nul. Michalusa 14\n38-300 Gorlice', powiat: 'gorlicki', ulica: 'Michalusa' },
  { lp: 9, nazwa: 'Dom Pomocy Społecznej\nul. Sienkiewicza 30\n38-300 Gorlice', powiat: 'gorlicki', ulica: 'Sienkiewicza' },

  // Kraków - DPS mają unikalne ulice
  { lp: 12, nazwa: 'Dom Pomocy Społecznej\nul. Kluzeka 6\n31-222 Kraków', powiat: 'Kraków', ulica: 'Kluzeka' },
  { lp: 13, nazwa: 'Dom Pomocy Społecznej\nim. św. Jana Pawła II\nul. Praska 25\n30-329 Kraków', powiat: 'Kraków', ulica: 'Praska 25' },
  { lp: 14, nazwa: 'Dom Pomocy Społecznej\nul. Praska 27\n30-329 Kraków', powiat: 'Kraków', ulica: 'Praska 27' },
  { lp: 15, nazwa: 'Dom Pomocy Społecznej\nim. Ludwika i Anny Helclów\nul. Helclów 2\n31-148 Kraków', powiat: 'Kraków', ulica: 'Helclów' },
  { lp: 16, nazwa: 'Dom Pomocy Społecznej\nim. św. Brata Alberta\nul. Adolfa Nowaczyńskiego 1\n30-336 Kraków', powiat: 'Kraków', ulica: 'Nowaczyńskiego' },
  { lp: 17, nazwa: 'Dom Pomocy Społecznej\nul. Łanowa 39\n30-725 Kraków', powiat: 'Kraków', ulica: 'Łanowa 39' },
  { lp: 18, nazwa: 'Dom Pomocy Społecznej\nul. Krakowska 55\n31-066 Kraków', powiat: 'Kraków', ulica: 'Krakowska 55' },
  { lp: 19, nazwa: 'Dom Pomocy Społecznej\nul. Łanowa 41\n30-725 Kraków', powiat: 'Kraków', ulica: 'Łanowa 41' },
  { lp: 21, nazwa: 'Dom Pomocy Społecznej\nul. dr Józefa Babińskiego 25\n30-393 Kraków', powiat: 'Kraków', ulica: 'Babińskiego' },
  { lp: 22, nazwa: 'Dom Pomocy Społecznej\nul. Łanowa 43\n30-725 Kraków', powiat: 'Kraków', ulica: 'Łanowa 43' },
  { lp: 23, nazwa: 'Dom Pomocy Społecznej\nul. Rozrywka 1\n31-419 Kraków', powiat: 'Kraków', ulica: 'Rozrywka' },

  // Krakowski powiat
  { lp: 26, nazwa: 'Dom Pomocy Społecznej\nul. Matejki 24\n32-086 Batowice', powiat: 'krakowski', miejscowosc: 'Batowice' },
  { lp: 27, nazwa: 'Dom Pomocy Społecznej\nCzerna 110\n32-065 Krzeszowice', powiat: 'krakowski', miejscowosc: 'Czerna' },
  { lp: 28, nazwa: 'Dom Pomocy Społecznej\nul. Osiedlowa 10\n32-082 Karniowice', powiat: 'krakowski', miejscowosc: 'Karniowice' },
  { lp: 31, nazwa: 'Dom Pomocy Społecznej\nul. Kasztanowa 20\n32-088 Owczary', powiat: 'krakowski', miejscowosc: 'Owczary' },
  { lp: 34, nazwa: 'Dom Pomocy Społecznej\nul. Słoneczna 3\n32-082 Więckowice', powiat: 'krakowski', miejscowosc: 'Więckowice' },

  // Limanowski
  { lp: 36, nazwa: 'Dom Pomocy Społecznej\nul. W. Witosa 24/26\n34-600 Limanowa', powiat: 'limanowski', miejscowosc: 'Limanowa', ulica: 'Witosa' },
  { lp: 37, nazwa: 'Dom Pomocy Społecznej\nul. Rakoczego 9\n34-730 Mszana Dolna', powiat: 'limanowski', miejscowosc: 'Mszana Dolna' },
  { lp: 41, nazwa: 'Dom Pomocy Społecznej\nw Szczyrzycu\n34-623 Szczyrzyc 182', powiat: 'limanowski', miejscowosc: 'Szczyrzyc' },

  // Miechowski
  { lp: 42, nazwa: 'Dom Pomocy Społecznej\nMianocice 51\n32-210 Książ Wielki', powiat: 'miechowski', miejscowosc: 'Mianocice' },
  { lp: 43, nazwa: 'Dom Pomocy Społecznej\nul. Warszawska 49A\n32-200 Miechów', powiat: 'miechowski', miejscowosc: 'Miechów', ulica: 'Warszawska' },

  // Myślenicki
  { lp: 48, nazwa: 'Dom Pomocy Społecznej\n32-432 Pcim 638', powiat: 'myślenicki', miejscowosc: 'Pcim' },
  { lp: 49, nazwa: 'Dom Pomocy Społecznej\n„Biały Potok"\n32-425 Trzemeśnia 377', powiat: 'myślenicki', miejscowosc: 'Trzemeśnia' },

  // Olkuski
  { lp: 60, nazwa: 'Dom Pomocy Społecznej\nul. Jana Kantego 4\n32-300 Olkusz', powiat: 'olkuski' },

  // Oświęcimski
  { lp: 61, nazwa: 'Dom Pomocy Społecznej\nul. Księżnej Ogińskiej 2\n32-661 Bobrek', powiat: 'oświęcimski' },

  // Proszowicki
  { lp: 64, nazwa: 'Dom Pomocy Społecznej\nim. Adama Chmielowskiego\nŁyszkowice 64\n32-104 Koniusza', powiat: 'proszowicki', miejscowosc: 'Łyszkowice' },

  // Suski
  { lp: 67, nazwa: 'Dom Pomocy Społecznej\nul. Żeromskiego 17\n34-220 Maków Podhalański', powiat: 'suski', miejscowosc: 'Maków' },

  // Wadowicki
  { lp: 82, nazwa: 'Dom Pomocy Społecznej\nul. Parkowa 1\n34-100 Wadowice', powiat: 'wadowicki', ulica: 'Parkowa' },
  { lp: 83, nazwa: 'Dom Pomocy Społecznej\nim. św. O. Rafała Kalinowskiego\nul. Pułaskiego 5\n34-100 Wadowice', powiat: 'wadowicki', ulica: 'Pułaskiego' },
  { lp: 85, nazwa: 'Dom Pomocy Społecznej\nim. św. Brata Alberta\nul. Dworska 150\n34-144 Izdebnik', powiat: 'wadowicki', miejscowosc: 'Izdebnik' },
];

async function main() {
  console.log('🚀 Wypełniam pewne dopasowania DPS...\n');

  let updated = 0;
  let skipped = 0;

  for (const pdf of DPS_PDF) {
    // Znajdź w bazie po powiecie + (ulicy LUB miejscowości)
    const where = {
      wojewodztwo: 'małopolskie',
      typ_placowki: 'DPS'
    };

    // Powiat - elastyczne dopasowanie
    const powiatNormalized = pdf.powiat.toLowerCase().replace(/ą/g, 'a').replace(/ł/g, 'l').replace(/ó/g, 'o').replace(/ś/g, 's');

    const allDps = await prisma.placowka.findMany({
      where: {
        wojewodztwo: 'małopolskie',
        typ_placowki: 'DPS'
      }
    });

    const candidates = allDps.filter(p => {
      const pPowiat = p.powiat.toLowerCase().replace(/ą/g, 'a').replace(/ł/g, 'l').replace(/ó/g, 'o').replace(/ś/g, 's');

      // Musi być ten sam powiat
      if (!pPowiat.includes(powiatNormalized) && !powiatNormalized.includes(pPowiat)) {
        return false;
      }

      // Jeśli mamy ulicę - dopasuj po ulicy
      if (pdf.ulica) {
        const pUlica = (p.ulica || '').toLowerCase();
        const targetUlica = pdf.ulica.toLowerCase();
        return pUlica.includes(targetUlica) || targetUlica.includes(pUlica);
      }

      // Jeśli mamy miejscowość - dopasuj po miejscowości
      if (pdf.miejscowosc) {
        const pMiejsc = p.miejscowosc.toLowerCase().replace(/ą/g, 'a').replace(/ł/g, 'l').replace(/ó/g, 'o');
        const targetMiejsc = pdf.miejscowosc.toLowerCase().replace(/ą/g, 'a').replace(/ł/g, 'l').replace(/ó/g, 'o');
        return pMiejsc.includes(targetMiejsc) || targetMiejsc.includes(pMiejsc);
      }

      return true;
    });

    if (candidates.length === 1) {
      const placowka = candidates[0];

      // Sprawdź czy już wypełnione
      if (placowka.oficjalne_id !== null) {
        console.log(`⏭️  l.p.${pdf.lp} - już wypełnione (ID ${placowka.id})`);
        skipped++;
        continue;
      }

      await prisma.placowka.update({
        where: { id: placowka.id },
        data: {
          oficjalne_id: pdf.lp,
          nazwa_oficjalna: pdf.nazwa
        }
      });

      console.log(`✅ l.p.${pdf.lp} → ID ${placowka.id} | ${placowka.miejscowosc} (${pdf.ulica || pdf.miejscowosc || pdf.powiat})`);
      updated++;
    } else if (candidates.length === 0) {
      console.log(`❌ l.p.${pdf.lp} - BRAK W BAZIE (${pdf.powiat})`);
      skipped++;
    } else {
      console.log(`⚠️  l.p.${pdf.lp} - WIELE DOPASOWAŃ (${candidates.length}) - POMIJAM`);
      candidates.forEach(c => console.log(`     - ID ${c.id}: ${c.nazwa} (${c.miejscowosc})`));
      skipped++;
    }
  }

  console.log('\n📊 PODSUMOWANIE:');
  console.log(`  Zaktualizowano: ${updated}`);
  console.log(`  Pominięto: ${skipped}`);

  const total = await prisma.placowka.count({
    where: { wojewodztwo: 'małopolskie', typ_placowki: 'DPS', oficjalne_id: { not: null } }
  });

  console.log(`\n📈 PROGRESS: ${total} / 85 DPS wypełnionych (${Math.round(total/85*100)}%)`);

  await prisma.$disconnect();
}

main().catch(console.error);
