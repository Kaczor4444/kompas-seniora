#!/usr/bin/env node
// Czyści błędne bip.malopolska.pl i szuka samorzad.gov.pl dla wszystkich dotkniętych

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

// Oryginalne BIP z CSV — zostawiamy
const KEEP_BIP_IDS = [81, 116]; // cusryglice, gopswlaskowej (Oświęcim PCPR osobno)

function slugify(str) {
  if (!str) return '';
  return str.toLowerCase().trim()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
    .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
    .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

function check(url, timeout = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeout);
    const req = https.request(url, { method: 'HEAD', headers: {'User-Agent':'Mozilla/5.0'} }, (res) => {
      clearTimeout(timer); resolve(res.statusCode < 400 ? url : false);
    });
    req.on('error', () => { clearTimeout(timer); resolve(false); });
    req.end();
  });
}

function getSamorzadCandidates(typ, gmina, city) {
  const g = slugify(gmina || city);
  const c = slugify(city);
  const prefix = typ === 'MOPS' ? 'mops' : typ === 'CUS' ? 'cus' : 'gops';

  return [
    `https://samorzad.gov.pl/web/${prefix}-${g}`,
    `https://samorzad.gov.pl/web/${prefix}-${c}`,
    `https://samorzad.gov.pl/web/ops-${g}`,
    `https://samorzad.gov.pl/web/ops-${c}`,
    `https://samorzad.gov.pl/web/mgops-${g}`,
    `https://samorzad.gov.pl/web/mgops-${c}`,
    // Konkatenacja bez myślnika między prefiksem a nazwą
    `https://samorzad.gov.pl/web/${prefix}${g.replace(/-/g,'')}`,
  ].filter((u, i, a) => a.indexOf(u) === i); // deduplicate
}

async function main() {
  const toBeFix = await prisma.mopsContact.findMany({
    where: {
      website: { contains: 'bip.malopolska.pl' },
      id: { notIn: KEEP_BIP_IDS }
    },
    select: { id: true, city: true, gmina: true, name: true, typ: true, wojewodztwo: true, website: true },
    orderBy: { id: 'asc' }
  });

  console.log(`Rekordy do poprawy: ${toBeFix.length}\n`);

  const found = [];
  const notFound = [];

  for (const rec of toBeFix) {
    const candidates = getSamorzadCandidates(rec.typ, rec.gmina, rec.city);
    let foundUrl = null;
    for (const url of candidates) {
      if (await check(url)) { foundUrl = url; break; }
    }

    if (foundUrl) {
      found.push({ id: rec.id, website: foundUrl });
      console.log(`✅ ${rec.id} ${rec.typ} ${rec.city} → ${foundUrl}`);
    } else {
      notFound.push(rec);
      process.stdout.write('?');
    }
  }

  console.log(`\n\nZnaleziono: ${found.length}/${toBeFix.length}`);
  console.log(`Nie znaleziono: ${notFound.length}`);

  // Zapisz znalezione
  for (const rec of found) {
    await prisma.mopsContact.update({ where: { id: rec.id }, data: { website: rec.website } });
  }

  // Wyczyść nieznalezione (null zamiast złego BIP)
  if (notFound.length > 0) {
    const ids = notFound.map(r => r.id);
    await prisma.mopsContact.updateMany({ where: { id: { in: ids } }, data: { website: null } });
    console.log(`Wyczyszczono ${notFound.length} błędnych BIP-ów.`);
    console.log('\nNieznalezione (do ręcznego uzupełnienia):');
    notFound.forEach(r => console.log(`  ${r.id} ${r.typ} ${r.wojewodztwo} ${r.city} | ${r.name}`));
  }

  const withWww = await prisma.mopsContact.count({ where: { website: { not: null } } });
  console.log(`\nŁącznie z www: ${withWww}/344`);
  await prisma.$disconnect();
}

main().catch(console.error);
