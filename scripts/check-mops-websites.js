#!/usr/bin/env node
// Skrypt: walidacja i odkrywanie adresów www dla MOPS/GOPS/CUS
// Uruchom: node scripts/check-mops-websites.js [--fix-db]

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const FIX_DB = process.argv.includes('--fix-db');

function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function checkUrl(url, method = 'HEAD', timeout = 6000) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https://') ? https : http;
    const timer = setTimeout(() => resolve({ ok: false, status: 0, finalUrl: null }), timeout);
    try {
      const req = proto.request(url, { method, timeout, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KompasSeniora/1.0)' } }, (res) => {
        clearTimeout(timer);
        const location = res.headers['location'];
        let finalUrl = null;
        if (location) {
          finalUrl = location.startsWith('http') ? location : new URL(location, url).href;
        }
        resolve({ ok: res.statusCode < 400, status: res.statusCode, finalUrl });
      });
      req.on('error', () => { clearTimeout(timer); resolve({ ok: false, status: 0, finalUrl: null }); });
      req.end();
    } catch { clearTimeout(timer); resolve({ ok: false, status: 0, finalUrl: null }); }
  });
}

async function checkUrlSmart(url) {
  let result = await checkUrl(url, 'HEAD');
  // Some servers block HEAD — retry with GET
  if (!result.ok && result.status === 0) {
    result = await checkUrl(url, 'GET');
  }
  // Follow redirect if needed
  if (result.finalUrl && result.status >= 301 && result.status <= 308) {
    const redirectResult = await checkUrl(result.finalUrl, 'HEAD');
    return { ...redirectResult, finalUrl: result.finalUrl };
  }
  return result;
}

function getCandidateUrls(typ, gmina, city) {
  const g = slugify(gmina || city);
  const c = slugify(city);
  const candidates = [];

  if (typ === 'MOPS') {
    candidates.push(
      `https://mops.${c}.pl`,
      `https://www.mops.${c}.pl`,
      `https://mops${c}.pl`,
      `https://www.mops${c}.pl`,
    );
  } else if (typ === 'GOPS') {
    candidates.push(
      `https://gops.${g}.pl`,
      `https://www.gops.${g}.pl`,
      `https://ops.${g}.pl`,
      `https://www.ops.${g}.pl`,
      `https://gops${g}.pl`,
      `https://www.gops${g}.pl`,
      `https://${g}.naszops.pl`,
      `https://www.${g}.naszops.pl`,
      `https://gops.${g}.naszops.pl`,
      `https://ops.${g}.naszops.pl`,
      `https://${g}.gopsinfo.pl`,
    );
  } else if (typ === 'CUS') {
    candidates.push(
      `https://cus.${c}.pl`,
      `https://www.cus.${c}.pl`,
      `https://cus${c}.pl`,
      `https://www.cus${c}.pl`,
    );
  }
  return candidates;
}

async function main() {
  const results = {
    validated_ok: [],
    broken: [],
    http_to_https: [],
    found_new: [],
    not_found: [],
  };

  // === 1. Walidacja istniejących www ===
  const existing = await prisma.mopsContact.findMany({
    where: { website: { not: null } },
    select: { id: true, city: true, name: true, website: true, typ: true, wojewodztwo: true },
    orderBy: { id: 'asc' }
  });

  console.log(`\n=== Walidacja ${existing.length} istniejących www ===`);

  for (const rec of existing) {
    const result = await checkUrlSmart(rec.website);

    if (result.ok) {
      if (rec.website.startsWith('http://')) {
        const httpsUrl = 'https://' + rec.website.slice(7);
        results.http_to_https.push({ ...rec, newUrl: result.finalUrl || httpsUrl });
        console.log(`🔄 ${rec.id} ${rec.city} | ${rec.website} → https`);
      } else {
        results.validated_ok.push(rec);
        process.stdout.write('.');
      }
    } else {
      results.broken.push({ ...rec, status: result.status });
      console.log(`\n❌ ${rec.id} ${rec.typ} ${rec.city} | ${rec.website} (${result.status})`);
    }
  }

  console.log(`\n\nOK: ${results.validated_ok.length} | Broken: ${results.broken.length} | HTTP→HTTPS: ${results.http_to_https.length}`);

  // === 2. Szukanie brakujących www ===
  const missing = await prisma.mopsContact.findMany({
    where: { website: null },
    select: { id: true, city: true, gmina: true, name: true, typ: true, address: true, wojewodztwo: true },
    orderBy: { id: 'asc' }
  });

  console.log(`\n=== Szukanie www dla ${missing.length} rekordów ===`);

  for (const rec of missing) {
    const candidates = getCandidateUrls(rec.typ, rec.gmina, rec.city);
    let foundUrl = null;

    for (const url of candidates) {
      const result = await checkUrlSmart(url);
      if (result.ok) {
        foundUrl = url;
        break;
      }
    }

    if (foundUrl) {
      results.found_new.push({ ...rec, website: foundUrl });
      console.log(`✅ ${rec.id} ${rec.typ} ${rec.city} → ${foundUrl}`);
    } else {
      results.not_found.push(rec);
      process.stdout.write('?');
    }
  }

  // === 3. Raport CSV ===
  const csvLines = [
    'id,typ,city,name,status,old_website,new_website,action',
    ...results.broken.map(r =>
      `${r.id},${r.typ},${r.city},"${r.name}",BROKEN,${r.website},,VERIFY`
    ),
    ...results.http_to_https.map(r =>
      `${r.id},${r.typ},${r.city},"${r.name}",HTTP_REDIRECT,${r.website},${r.newUrl},UPDATE`
    ),
    ...results.found_new.map(r =>
      `${r.id},${r.typ},${r.city},"${r.name}",FOUND_NEW,,${r.website},INSERT`
    ),
    ...results.not_found.map(r =>
      `${r.id},${r.typ},${r.city},"${r.name}",NOT_FOUND,,,MANUAL`
    ),
  ];

  const csvPath = path.join(__dirname, '../raw_dane/mops_www_audit.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(`\n\n=== PODSUMOWANIE ===`);
  console.log(`Broken: ${results.broken.length}`);
  console.log(`HTTP→HTTPS: ${results.http_to_https.length}`);
  console.log(`Found new: ${results.found_new.length}/${missing.length}`);
  console.log(`Not found: ${results.not_found.length}`);
  console.log(`\nCSV zapisany: raw_dane/mops_www_audit.csv`);

  // === 4. Opcjonalnie: zapisz do bazy ===
  if (FIX_DB) {
    console.log('\n=== Zapisywanie do bazy ===');
    let updated = 0;

    for (const rec of results.http_to_https) {
      await prisma.mopsContact.update({
        where: { id: rec.id },
        data: { website: rec.newUrl }
      });
      updated++;
    }

    for (const rec of results.found_new) {
      await prisma.mopsContact.update({
        where: { id: rec.id },
        data: { website: rec.website }
      });
      updated++;
    }

    console.log(`Zaktualizowano: ${updated} rekordów`);
  } else {
    console.log('\n(Dry run — dodaj --fix-db żeby zapisać do bazy)');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
