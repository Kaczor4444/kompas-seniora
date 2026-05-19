#!/usr/bin/env node
/**
 * Import MOPS/GOPS/CUS województwa śląskiego do tabeli MopsContact.
 * Źródło: raw_dane/slaskie/ops_slaskie.csv (167 rekordów)
 * PDF:    raw_dane/slaskie/ops_slaskie.pdf  (katowice.uw.gov.pl, maj 2026)
 *
 * Uruchomienie:
 *   node scripts/import-mops-slaskie.js
 *
 * Czas: ~170 × 1.2s = ~3.5 min (Nominatim rate limit)
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalizeCity(city) {
  return city
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function geocode(adres, miejscowosc) {
  // Usuń prefixes ul./pl./al. itp. przed zapytaniem
  const cleanAddr = (adres || '')
    .replace(/^(ul\.|pl\.|al\.|oś\.|os\.|rynek\s+|ks\.|bpa\.|dr\.|gen\.)\s*/gi, '')
    .trim();

  let q;
  if (cleanAddr) {
    q = `${cleanAddr}, ${miejscowosc}, Polska`;
  } else {
    q = `${miejscowosc}, Polska`;
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=pl`;

  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'geocoder-research/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results[0]) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Simple CSV parse (quoted fields with commas handled)
    const values = [];
    let cur = '';
    let inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur);
    const row = {};
    headers.forEach((h, idx) => row[h.trim()] = (values[idx] || '').trim());
    rows.push(row);
  }
  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 IMPORT MOPS Śląskie\n');

  const csvContent = fs.readFileSync('raw_dane/slaskie/ops_slaskie.csv', 'utf-8');
  const records = parseCSV(csvContent);
  console.log(`📄 Wczytano ${records.length} rekordów z CSV\n`);

  let created = 0, updated = 0, skipped = 0, geoOk = 0, geoFail = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const city = normalizeCity(r.miejscowosc);
    const address = [r.adres, r.kod_pocztowy, r.miejscowosc]
      .filter(Boolean).join(', ');

    // Geocoding (z rate limitem Nominatim 1.2s)
    await sleep(1200);
    const geo = await geocode(r.adres, r.miejscowosc);
    if (geo) { geoOk++; process.stdout.write('✅'); }
    else      { geoFail++; process.stdout.write('❌'); }

    const data = {
      city,
      cityDisplay:  r.miejscowosc,
      typ:          r.typ,
      gmina:        r.gmina || null,
      name:         r.nazwa,
      phone:        r.telefon,
      email:        r.email || null,
      address,
      website:      null,
      wojewodztwo:  'śląskie',
      latitude:     geo?.lat ?? null,
      longitude:    geo?.lng ?? null,
      verified:     true,
      lastVerified: new Date(),
      notes:        `Źródło: Wykaz OPS woj. śląskiego (katowice.uw.gov.pl, maj 2026)`,
    };

    try {
      const existing = await prisma.mopsContact.findFirst({
        where: { city, name: r.nazwa }
      });

      if (existing) {
        await prisma.mopsContact.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.mopsContact.create({ data });
        created++;
      }
    } catch (err) {
      console.error(`\n  ⚠️  ${r.nazwa}: ${err.message}`);
      skipped++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(` (${i + 1}/${records.length})`);
    }
  }

  console.log(`\n\n✅ Zakończono:`);
  console.log(`   Dodano:     ${created}`);
  console.log(`   Zaktualizowano: ${updated}`);
  console.log(`   Błędy:      ${skipped}`);
  console.log(`   Geocoded:   ${geoOk}/${records.length} (${geoFail} bez GPS)`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
