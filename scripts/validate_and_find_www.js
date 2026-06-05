const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

function slugify(str) {
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

async function checkUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https://') ? https : http;
    const timer = setTimeout(() => resolve({ ok: false, status: 0, redirect: null }), timeout);
    try {
      const req = proto.request(url, { method: 'HEAD', timeout }, (res) => {
        clearTimeout(timer);
        const redirect = res.headers['location'] || null;
        resolve({ ok: res.statusCode < 400, status: res.statusCode, redirect });
      });
      req.on('error', () => { clearTimeout(timer); resolve({ ok: false, status: 0, redirect: null }); });
      req.end();
    } catch { clearTimeout(timer); resolve({ ok: false, status: 0, redirect: null }); }
  });
}

// Common patterns for Polish GOPS/MOPS
function getCandidateUrls(typ, gmina, city) {
  const g = slugify(gmina || city);
  const c = slugify(city);
  const patterns = [];
  
  if (typ === 'MOPS') {
    patterns.push(
      `https://www.mops.${c}.pl`,
      `https://mops.${c}.pl`,
      `https://mops${c}.pl`,
    );
  } else if (typ === 'GOPS') {
    patterns.push(
      `https://gops.${g}.pl`,
      `https://www.gops.${g}.pl`,
      `https://ops.${g}.pl`,
      `https://www.ops.${g}.pl`,
      `https://gops${g}.pl`,
      `https://www.gops${g}.pl`,
    );
  } else if (typ === 'CUS') {
    patterns.push(
      `https://cus.${c}.pl`,
      `https://www.cus.${c}.pl`,
      `https://cus${c}.pl`,
    );
  }
  return patterns;
}

async function main() {
  // 1. Validate existing URLs
  const existing = await prisma.mopsContact.findMany({
    where: { website: { not: null } },
    select: { id: true, city: true, website: true, typ: true }
  });
  
  console.log(`\n=== Walidacja ${existing.length} istniejących www ===`);
  const broken = [];
  const httpOnly = [];
  
  for (const rec of existing) {
    const result = await checkUrl(rec.website);
    if (!result.ok) {
      broken.push({ ...rec, status: result.status });
      console.log(`❌ ${rec.id} ${rec.city} | ${rec.website} → ${result.status}`);
    } else if (rec.website.startsWith('http://') && result.redirect) {
      httpOnly.push({ ...rec, redirect: result.redirect });
      console.log(`🔄 ${rec.id} ${rec.city} | ${rec.website} → ${result.redirect}`);
    }
  }
  
  console.log(`\nBroken: ${broken.length}, HTTP-only: ${httpOnly.length}`);
  
  // 2. Try to find missing URLs (sample - first 20 missing)
  const missing = await prisma.mopsContact.findMany({
    where: { website: null },
    select: { id: true, city: true, gmina: true, typ: true, name: true, wojewodztwo: true },
    take: 20
  });
  
  console.log(`\n=== Próba znalezienia www (pierwsze 20 brakujących) ===`);
  const found = [];
  
  for (const rec of missing) {
    const candidates = getCandidateUrls(rec.typ, rec.gmina, rec.city);
    let foundUrl = null;
    for (const url of candidates) {
      const result = await checkUrl(url, 4000);
      if (result.ok) {
        foundUrl = url;
        break;
      }
    }
    if (foundUrl) {
      found.push({ id: rec.id, website: foundUrl });
      console.log(`✅ ${rec.id} ${rec.typ} ${rec.city} → ${foundUrl}`);
    } else {
      console.log(`❓ ${rec.id} ${rec.typ} ${rec.city} | ${rec.name.substring(0, 40)}`);
    }
  }
  
  console.log(`\nZnaleziono: ${found.length}/20`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
