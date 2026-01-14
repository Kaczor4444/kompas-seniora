const fs = require('fs');
const svgContent = fs.readFileSync('public/images/poland-mapsvg.svg', 'utf8');

// Regex który złapie atrybuty w dowolnej kolejności
const pathRegex = /<path[^>]*>/g;

const regions = [];
let match;

while ((match = pathRegex.exec(svgContent)) !== null) {
  const pathTag = match[0];
  
  // Wyciągnij poszczególne atrybuty
  const idMatch = pathTag.match(/id="([^"]*)"/);
  const titleMatch = pathTag.match(/title="([^"]*)"/);
  const dMatch = pathTag.match(/d="([^"]*)"/);
  
  if (idMatch && titleMatch && dMatch) {
    regions.push({
      id: idMatch[1],
      name: titleMatch[1],
      d: dMatch[1]
    });
  }
}

// Sortuj alfabetycznie po id
regions.sort((a, b) => a.id.localeCompare(b.id));

// Wypisz w formacie TypeScript
console.log('const POLAND_REGIONS = [');
regions.forEach((region, index) => {
  const comma = index < regions.length - 1 ? ',' : '';
  console.log(`  {`);
  console.log(`    id: '${region.id}',`);
  console.log(`    name: '${region.name}',`);
  console.log(`    d: '${region.d}'`);
  console.log(`  }${comma}`);
});
console.log('];');

console.log('\n// Mapowanie aktywnych województw:');
console.log('// PL-MA (Małopolskie) - active: true');
console.log('// PL-SL (Śląskie) - upcoming: true');
console.log('// Reszta - disabled (wkrótce)');
