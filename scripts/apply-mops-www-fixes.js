#!/usr/bin/env node
// Aplikuje poprawki www do bazy na podstawie audytu

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// http → https (6 rekordów znalezionych w audycie)
const HTTP_TO_HTTPS = [
  { id: 98, website: 'https://gops.greboszow.pl/' },
  { id: 112, website: 'https://gopszielonki.naszops.pl/public/' },
  { id: 131, website: 'https://www.opsmuszyna.naszops.pl/' },
  { id: 147, website: 'https://ops.olkusz.pl/kontakt/' },
  { id: 161, website: 'https://opsradlow.pl/' },
  { id: 162, website: 'https://szerzyny.pl/' },
];

// Martwe domeny — nowe URL znalezione ręcznie/skryptem
const DEAD_FIXED = [
  { id: 138, website: 'https://www.lipnicawielka.pl/ops/' },
  { id: 165, website: 'https://gops.wojnicz.pl' },
  { id: 171, website: 'https://ops.poronin.pl' },
];

// Martwe domeny bez zastępnika — wyczyść
const DEAD_CLEAR = [141, 151]; // rabka-zdroj, zator

// Nowe URL znalezione przez pattern matching (106 rekordów)
const NEW_WEBSITES = [
  { id: 72, website: 'https://cus.mogilany.pl' },
  { id: 90, website: 'https://lapanow.naszops.pl' },
  { id: 104, website: 'https://gops.czernichow.pl' },
  { id: 108, website: 'https://gops.michalowice.pl' },
  { id: 120, website: 'https://www.gopsniedzwiedz.pl' },
  { id: 181, website: 'https://gops.rzezawa.pl' },
  { id: 182, website: 'https://czchow.naszops.pl' },
  { id: 184, website: 'https://gnojnik.naszops.pl' },
  { id: 185, website: 'https://gops.iwkowa.pl' },
  { id: 191, website: 'https://olesno.naszops.pl' },
  { id: 192, website: 'https://gops.radgoszcz.pl' },
  { id: 195, website: 'https://gops.luzna.pl' },
  { id: 196, website: 'https://moszczenica.naszops.pl' },
  { id: 197, website: 'https://gopsropa.pl' },
  { id: 199, website: 'https://gops.iwanowice.pl' },
  { id: 200, website: 'https://skala.naszops.pl' },
  { id: 204, website: 'https://gopslukowica.pl' },
  { id: 205, website: 'https://gops.tymbark.pl' },
  { id: 207, website: 'https://gops.golcza.pl' },
  { id: 211, website: 'https://gopsraciechowice.pl' },
  { id: 213, website: 'https://gopstokarnia.pl' },
  { id: 215, website: 'https://gops.chelmiec.pl' },
  { id: 218, website: 'https://gopsnawojowa.pl' },
  { id: 219, website: 'https://gops.rytro.pl' },
  { id: 222, website: 'https://gops.czorsztyn.pl' },
  { id: 225, website: 'https://gopsspytkowice.pl' },
  { id: 228, website: 'https://gops.polanka-wielka.pl' },
  { id: 229, website: 'https://gopsprzeciszow.pl' },
  { id: 230, website: 'https://gops.koniusza.pl' },
  { id: 234, website: 'https://bystra-sidzina.naszops.pl' },
  { id: 242, website: 'https://gops.brzeznica.pl' },
  { id: 245, website: 'https://gops.tomice.pl' },
  { id: 247, website: 'https://gops.gdow.pl' },
  { id: 249, website: 'https://mops.bedzin.pl' },
  { id: 250, website: 'https://ops.bobrowniki.pl' },
  { id: 251, website: 'https://mops.czeladz.pl' },
  { id: 253, website: 'https://ops.psary.pl' },
  { id: 257, website: 'https://gops.bestwina.pl' },
  { id: 260, website: 'https://gops.jasienica.pl' },
  { id: 262, website: 'https://gops.kozy.pl' },
  { id: 263, website: 'https://gops.porabka.pl' },
  { id: 265, website: 'https://gops.wilamowice.pl' },
  { id: 266, website: 'https://gops.wilkowice.pl' },
  { id: 272, website: 'https://mopsledziny.pl' },
  { id: 276, website: 'https://chybie.naszops.pl' },
  { id: 277, website: 'https://mops.cieszyn.pl' },
  { id: 278, website: 'https://gopsdebowiec.pl' },
  { id: 279, website: 'https://cusgoleszow.pl' },
  { id: 280, website: 'https://gops.hazlach.pl' },
  { id: 282, website: 'https://ops.skoczow.pl' },
  { id: 283, website: 'https://mops.strumien.pl' },
  { id: 284, website: 'https://mops.ustron.pl' },
  { id: 285, website: 'https://mops.wisla.pl' },
  { id: 286, website: 'https://gops.zebrzydowice.pl' },
  { id: 288, website: 'https://mopsblachownia.pl' },
  { id: 290, website: 'https://gops.janow.pl' },
  { id: 295, website: 'https://gops.kruszyna.pl' },
  { id: 297, website: 'https://gops.mstow.pl' },
  { id: 298, website: 'https://gops.mykanow.pl' },
  { id: 301, website: 'https://gops.przyrow.pl' },
  { id: 302, website: 'https://gops.redziny.pl' },
  { id: 306, website: 'https://www.ops.gieraltowice.pl' },
  { id: 307, website: 'https://mopsknurow.pl' },
  { id: 308, website: 'https://gops.pilchowice.pl' },
  { id: 310, website: 'https://rudziniec.naszops.pl' },
  { id: 312, website: 'https://ops.toszek.pl' },
  { id: 315, website: 'https://mops.jaworzno.pl' },
  { id: 316, website: 'https://mops.katowice.pl' },
  { id: 317, website: 'https://gopsklobuck.pl' },
  { id: 319, website: 'https://lipie.naszops.pl' },
  { id: 323, website: 'https://popow.naszops.pl' },
  { id: 327, website: 'https://ciasna.naszops.pl' },
  { id: 328, website: 'https://gopsherby.pl' },
  { id: 329, website: 'https://gops.kochanowice.pl' },
  { id: 332, website: 'https://pawonkow.naszops.pl' },
  { id: 336, website: 'https://gops.ornontowice.pl' },
  { id: 342, website: 'https://gopsniegowa.pl' },
  { id: 349, website: 'https://ops.pawlowice.pl' },
  { id: 351, website: 'https://gopssuszec.pl' },
  { id: 352, website: 'https://ops.kornowac.pl' },
  { id: 354, website: 'https://ops.krzyzanowice.pl' },
  { id: 362, website: 'https://ops.gaszowice.pl' },
  { id: 363, website: 'https://jejkowice.naszops.pl' },
  { id: 364, website: 'https://ops.lyski.pl' },
  { id: 365, website: 'https://ops.swierklany.pl' },
  { id: 368, website: 'https://mopssosnowiec.pl' },
  { id: 369, website: 'https://ops.swietochlowice.pl' },
  { id: 373, website: 'https://ops.ozarowice.pl' },
  { id: 374, website: 'https://gops.radzionkow.pl' },
  { id: 375, website: 'https://swierklaniec.naszops.pl' },
  { id: 377, website: 'https://gops.tworog.pl' },
  { id: 380, website: 'https://gops.godow.pl' },
  { id: 381, website: 'https://gopsgorzyce.pl' },
  { id: 383, website: 'https://ops.marklowice.pl' },
  { id: 384, website: 'https://gops.mszana.pl' },
  { id: 385, website: 'https://ops.pszow.pl' },
  { id: 386, website: 'https://gops.radlin.pl' },
  { id: 390, website: 'https://gops.irzadze.pl' },
  { id: 391, website: 'https://gopskroczyce.pl' },
  { id: 395, website: 'https://mopsporeba.pl' },
  { id: 397, website: 'https://gopswlodowice.pl' },
  { id: 398, website: 'https://mopszawiercie.pl' },
  { id: 399, website: 'https://ops.zarnowiec.pl' },
  { id: 405, website: 'https://lekawica.naszops.pl' },
  { id: 406, website: 'https://gopslodygowice.pl' },
  { id: 410, website: 'https://slemien.naszops.pl' },
  { id: 411, website: 'https://swinna.naszops.pl' },
];

async function main() {
  let updated = 0;

  console.log('=== HTTP → HTTPS (6) ===');
  for (const rec of HTTP_TO_HTTPS) {
    await prisma.mopsContact.update({ where: { id: rec.id }, data: { website: rec.website } });
    console.log(`✅ id=${rec.id} → ${rec.website}`);
    updated++;
  }

  console.log('\n=== Martwe → nowe URL (3) ===');
  for (const rec of DEAD_FIXED) {
    await prisma.mopsContact.update({ where: { id: rec.id }, data: { website: rec.website } });
    console.log(`✅ id=${rec.id} → ${rec.website}`);
    updated++;
  }

  console.log('\n=== Martwe bez zastępnika → null (2) ===');
  for (const id of DEAD_CLEAR) {
    await prisma.mopsContact.update({ where: { id }, data: { website: null } });
    console.log(`🗑️  id=${id} → null`);
    updated++;
  }

  console.log(`\n=== Nowe www (${NEW_WEBSITES.length}) ===`);
  for (const rec of NEW_WEBSITES) {
    await prisma.mopsContact.update({ where: { id: rec.id }, data: { website: rec.website } });
    process.stdout.write('.');
    updated++;
  }

  console.log(`\n\n=== GOTOWE: zaktualizowano ${updated} rekordów ===`);

  // Podsumowanie po aktualizacji
  const total = await prisma.mopsContact.count();
  const withWww = await prisma.mopsContact.count({ where: { website: { not: null } } });
  const malWww = await prisma.mopsContact.count({ where: { wojewodztwo: 'małopolskie', website: { not: null } } });
  const slWww = await prisma.mopsContact.count({ where: { wojewodztwo: 'śląskie', website: { not: null } } });
  console.log(`\nBaza po aktualizacji:`);
  console.log(`Total: ${total} | Z www: ${withWww}`);
  console.log(`Małopolska: ${malWww} | Śląskie: ${slWww}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
