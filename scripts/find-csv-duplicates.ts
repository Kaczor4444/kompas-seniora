import * as fs from 'fs';
import Papa from 'papaparse';

interface OpsRecord {
  typ: string;
  gmina: string;
  miejscowosc: string;
  nazwa: string;
  telefon: string;
}

function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseTyp(typ: string): string {
  if (typ === 'CUS') return 'CUS';
  if (typ === 'MOPS' || typ === 'MOPR') return 'MOPS';
  if (typ === 'OPS' || typ === 'GOPS' || typ === 'MGOPS') return 'GOPS';
  return typ;
}

const csvContent = fs.readFileSync('raw_dane/malopolskie/ops_malopolska_geo.csv', 'utf-8');
const parsed = Papa.parse<OpsRecord>(csvContent, {
  header: true,
  skipEmptyLines: true,
});

const records = parsed.data;
const relevantTypes = ['CUS', 'MOPS', 'MOPR', 'OPS', 'GOPS', 'MGOPS'];
const filtered = records.filter(r => relevantTypes.includes(r.typ));

console.log('🔍 Szukam duplikatów w CSV (city + typ):\n');

const seen = new Map<string, OpsRecord>();
const duplicates: Array<{ key: string; records: OpsRecord[] }> = [];

for (const rec of filtered) {
  const city = rec.gmina ? normalizeCity(rec.gmina) : normalizeCity(rec.miejscowosc);
  const typ = parseTyp(rec.typ);
  const key = `${city}|${typ}`;

  if (seen.has(key)) {
    // Duplikat!
    const existing = duplicates.find(d => d.key === key);
    if (existing) {
      existing.records.push(rec);
    } else {
      duplicates.push({
        key,
        records: [seen.get(key)!, rec]
      });
    }
  }

  seen.set(key, rec);
}

if (duplicates.length === 0) {
  console.log('✅ Brak duplikatów w CSV!');
} else {
  console.log(`❌ Znaleziono ${duplicates.length} grup duplikatów:\n`);

  duplicates.forEach((dup, idx) => {
    const [city, typ] = dup.key.split('|');
    console.log(`${idx + 1}. ${city} + ${typ} (${dup.records.length} rekordów):`);
    dup.records.forEach((r, i) => {
      console.log(`   ${i + 1}) ${r.miejscowosc} (${r.gmina}) - ${r.typ}`);
      console.log(`      ${r.nazwa}`);
      console.log(`      Tel: ${r.telefon}`);
    });
    console.log('');
  });
}
