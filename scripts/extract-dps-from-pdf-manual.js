// scripts/extract-dps-from-pdf-manual.js
// Ręczne wyciągnięcie danych DPS z PDF (wykaz dps malopolska 18.02.26.pdf)
//
// UWAGA: Ten plik zawiera RĘCZNIE przepisane dane z oficjalnego wykazu
// żeby móc porównać z bazą danych i wypełnić oficjalne_id + nazwa_oficjalna

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Dane DPS z PDF (l.p. 1-91) - wykaz z 18.02.2026
 *
 * Struktura:
 * - lp: numer z kolumny "l.p."
 * - powiat: z kolumny "powiat"
 * - nazwa: "nazwa i adres domu pomocy społecznej"
 * - miejscowosc: wyciągnięta z adresu
 * - miejsca: z kolumny "liczba miejsc"
 */
const DPS_MALOPOLSKA_2026 = [
  { lp: 1, powiat: 'bocheński', nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Karolina 14G', miejscowosc: 'Bochnia', miejsca: 157 },
  { lp: 2, powiat: 'brzeski', nazwa: 'Dom Pomocy Społecznej w Brzesku', ulica: 'ul. Starowiejska 6', miejscowosc: 'Brzesko', miejsca: 50 },
  { lp: 3, powiat: 'brzeski', nazwa: 'Dom Pomocy Społecznej w Porąbce Uszewskiej', miejscowosc: 'Porąbka Uszewska', miejsca: 25 },
  { lp: 4, powiat: 'brzeski', nazwa: 'Dom Pomocy Społecznej Regionalne Centrum Rehabilitacji i Pomocy Społecznej w Borzęcinie', miejscowosc: 'Borzęcin', miejsca: 100 },
  { lp: 5, powiat: 'chrzanowski', nazwa: 'Powiatowy Dom Pomocy Społecznej im. Adama Starzeńskiego w Płazie', ulica: 'ul. Wiosny Ludów 4', miejscowosc: 'Płaza', miejsca: 101 },
  { lp: 6, powiat: 'dąbrowski', nazwa: 'Dom Radosnej Starości im. Jana Pawła II w Kupieninie', miejscowosc: 'Kupienin', miejsca: 70 },
  { lp: 7, powiat: 'dąbrowski', nazwa: 'Dom Pomocy Społecznej Św. Brata Alberta Chmielowskiego Caritas Diecezji Tarnowskiej', ulica: 'ul. Św. Br. A. Chmielowskiego 16', miejscowosc: 'Dąbrowa Tarnowska', miejsca: 35 },
  { lp: 8, powiat: 'gorlicki', nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Michalusa 14', miejscowosc: 'Gorlice', miejsca: 120 },
  { lp: 9, powiat: 'gorlicki', nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Sienkiewicza 30', miejscowosc: 'Gorlice', miejsca: 86 },
  { lp: 10, powiat: 'gorlicki', nazwa: 'Dom Pomocy Społecznej', miejscowosc: 'Klimkówka', miejsca: 78 },
  { lp: 11, powiat: 'gorlicki', nazwa: 'Dom Pomocy Społecznej w Wapiennem', miejscowosc: 'Wapienne', miejsca: 25 },
  // ... więcej wpisów (dla testów wystarczy kilka pierwszych)
];

/**
 * Normalizuj polskie znaki
 */
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z');
}

/**
 * Fuzzy matching - czy nazwy są podobne?
 */
function isSimilarName(name1, name2) {
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  // Exact match
  if (n1 === n2) return true;

  // Nazwa PDF zawiera się w nazwie DB (lub odwrotnie)
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Extract key parts
  const extract = (s) => {
    // "Dom Pomocy Społecznej w Klimkówce" → "klimkowce"
    const match = s.match(/w\s+(\w+)/);
    return match ? match[1] : s.split(' ').pop();
  };

  const key1 = extract(n1);
  const key2 = extract(n2);

  return key1 === key2 || n1.includes(key1) && n2.includes(key1);
}

/**
 * Porównaj z bazą i wyświetl różnice
 */
async function compareWithDatabase() {
  console.log('🔍 WERYFIKACJA DPS MAŁOPOLSKA\n');
  console.log('='.repeat(80));

  console.log(`\n📄 PDF: ${DPS_MALOPOLSKA_2026.length} placówek (l.p. 1-${DPS_MALOPOLSKA_2026.length})`);

  const dbDps = await prisma.placowka.findMany({
    where: {
      wojewodztwo: 'małopolskie',
      typ_placowki: 'DPS'
    },
    select: {
      id: true,
      nazwa: true,
      ulica: true,
      miejscowosc: true,
      powiat: true,
      liczba_miejsc: true,
      koszt_pobytu: true,
      oficjalne_id: true,
      nazwa_oficjalna: true
    },
    orderBy: { id: 'asc' }
  });

  console.log(`📊 BAZA: ${dbDps.length} placówek DPS\n`);

  // Statystyki wypełnienia
  const withOfficialId = dbDps.filter(d => d.oficjalne_id !== null).length;
  const withOfficialName = dbDps.filter(d => d.nazwa_oficjalna !== null).length;

  console.log(`📈 Wypełnienie pól weryfikacyjnych:`);
  console.log(`  oficjalne_id: ${withOfficialId} / ${dbDps.length} (${Math.round(withOfficialId / dbDps.length * 100)}%)`);
  console.log(`  nazwa_oficjalna: ${withOfficialName} / ${dbDps.length} (${Math.round(withOfficialName / dbDps.length * 100)}%)`);

  console.log(`\n📋 PORÓWNANIE (pierwsze ${DPS_MALOPOLSKA_2026.length} z PDF):\n`);

  for (const pdfDps of DPS_MALOPOLSKA_2026) {
    // ✨ NOWE: Dopasowanie po powiecie + nazwie
    const matching = dbDps.filter(db => {
      // 1. Musi być ten sam powiat
      const powiatMatch = normalize(db.powiat).includes(normalize(pdfDps.powiat)) ||
                         normalize(pdfDps.powiat).includes(normalize(db.powiat));

      if (!powiatMatch) return false;

      // 2. Nazwa musi być podobna
      return isSimilarName(db.nazwa, pdfDps.nazwa);
    });

    if (matching.length === 0) {
      console.log(`❌ ${pdfDps.lp}. ${pdfDps.nazwa} - BRAK DOPASOWANIA!`);
      console.log(`    Powiat: ${pdfDps.powiat}, Miejscowość: ${pdfDps.miejscowosc}`);
    } else if (matching.length === 1) {
      const db = matching[0];
      const hasId = db.oficjalne_id === pdfDps.lp;
      const hasName = db.nazwa_oficjalna === pdfDps.nazwa;

      if (hasId && hasName) {
        console.log(`✅ ${pdfDps.lp}. ${pdfDps.miejscowosc} - OK (ID ${db.id})`);
      } else {
        console.log(`⚠️  ${pdfDps.lp}. ${pdfDps.miejscowosc} (ID ${db.id})`);
        if (!hasId) console.log(`    oficjalne_id: ${db.oficjalne_id} → ${pdfDps.lp}`);
        if (!hasName) console.log(`    nazwa_oficjalna: "${db.nazwa_oficjalna || 'NULL'}" → "${pdfDps.nazwa}"`);
      }
    } else {
      console.log(`⚠️  ${pdfDps.lp}. ${pdfDps.miejscowosc} - WIELE DOPASOWAŃ (${matching.length})`);
      matching.forEach(m => console.log(`     - ID ${m.id}: ${m.nazwa}`));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Następne kroki:');
  console.log('  1. Przepisz WSZYSTKIE 91 placówek DPS do tablicy DPS_MALOPOLSKA_2026');
  console.log('  2. Uruchom skrypt do automatycznego wypełnienia oficjalne_id i nazwa_oficjalna');
  console.log('  3. Powtórz dla ŚDS (osobny plik PDF)\n');
}

async function main() {
  try {
    await compareWithDatabase();
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
