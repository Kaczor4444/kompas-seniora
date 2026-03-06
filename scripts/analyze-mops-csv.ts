import * as fs from 'fs';
import Papa from 'papaparse';

interface OpsRecord {
  typ: string;
  id_jednostki: string;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  nazwa: string;
  kod_pocztowy: string;
  miejscowosc: string;
  ulica: string;
  numer_domu: string;
  telefon: string;
  www: string;
  email: string;
  godziny_pracy: string;
  teryt_gminy: string;
  latitude: string;
  longitude: string;
  geo_precyzja: string;
  uwagi: string;
}

const csvContent = fs.readFileSync('raw_dane/malopolskie/ops_malopolska_geo.csv', 'utf-8');
const parsed = Papa.parse<OpsRecord>(csvContent, {
  header: true,
  skipEmptyLines: true,
});

const records = parsed.data;

console.log('📊 ANALIZA PLIKU ops_malopolska_geo.csv\n');
console.log(`📁 Łącznie rekordów: ${records.length}`);

// Grupowanie po typie
const byType = records.reduce((acc, r) => {
  acc[r.typ] = (acc[r.typ] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('\n🏢 Rozkład po typie:');
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([typ, count]) => {
  console.log(`  - ${typ}: ${count}`);
});

// Źródła danych
const fromRJPS = records.filter(r => r.uwagi?.includes('RJPS eksport'));
const fromMir = records.filter(r => r.uwagi?.includes('mir.org.pl'));

console.log('\n📌 Źródła danych:');
console.log(`  - RJPS (zweryfikowane): ${fromRJPS.length}`);
console.log(`  - mir.org.pl (wymaga weryfikacji): ${fromMir.length}`);

// Kompletność danych
const withWebsite = records.filter(r => r.www && r.www.trim() !== '').length;
const withEmail = records.filter(r => r.email && r.email.trim() !== '').length;
const withGPS = records.filter(r => r.latitude && r.longitude).length;

console.log('\n✅ Kompletność danych:');
console.log(`  - Z www: ${withWebsite}/${records.length} (${Math.round(withWebsite/records.length*100)}%)`);
console.log(`  - Z email: ${withEmail}/${records.length} (${Math.round(withEmail/records.length*100)}%)`);
console.log(`  - Z GPS: ${withGPS}/${records.length} (${Math.round(withGPS/records.length*100)}%)`);

// Miasta/powiaty
const uniqueCities = new Set(records.map(r => r.miejscowosc.toLowerCase().trim()));
const uniquePowiats = new Set(records.map(r => r.powiat));

console.log('\n🗺️  Pokrycie geograficzne:');
console.log(`  - Unikalne miejscowości: ${uniqueCities.size}`);
console.log(`  - Powiaty: ${uniquePowiats.size}`);

// Przykłady MOPS/MOPR (miejskie)
const miejskie = records.filter(r => r.typ === 'MOPS' || r.typ === 'MOPR' || r.typ === 'CUS');
console.log('\n🏙️  Ośrodki miejskie/CUS:');
miejskie.slice(0, 15).forEach(r => {
  const verified = r.uwagi?.includes('RJPS') ? '✅' : '⚠️';
  console.log(`  ${verified} ${r.miejscowosc} - ${r.typ}`);
});

// Przykłady GOPS (gminne)
const gminne = records.filter(r => r.typ === 'OPS' || r.typ === 'GOPS');
console.log(`\n🏘️  Ośrodki gminne (OPS/GOPS): ${gminne.length} rekordów`);
console.log('  Przykłady:');
gminne.slice(0, 10).forEach(r => {
  const verified = r.uwagi?.includes('RJPS') ? '✅' : '⚠️';
  console.log(`  ${verified} ${r.gmina} (${r.powiat})`);
});
