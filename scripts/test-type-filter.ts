// Test filtrowania po typie
const testData = [
  { typ_placowki: 'DPS', nazwa: 'Test DPS' },
  { typ_placowki: 'ŚDS', nazwa: 'Test ŚDS' }
];

console.log('Test 1: Filtr DPS');
const dpsFilter = testData.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('DPS'));
console.log('  Wynik:', dpsFilter.length);
dpsFilter.forEach(f => console.log('   -', f.nazwa, '(typ:', f.typ_placowki + ')'));

console.log('\nTest 2: Filtr SDS');
const sdsFilter = testData.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('SDS'));
console.log('  Wynik:', sdsFilter.length);
sdsFilter.forEach(f => console.log('   -', f.nazwa, '(typ:', f.typ_placowki + ')'));

console.log('\nProblem:');
console.log('  "ŚDS".toUpperCase() =', 'ŚDS'.toUpperCase());
console.log('  "ŚDS".toUpperCase().includes("SDS") =', 'ŚDS'.toUpperCase().includes('SDS'));

console.log('\nRozwiązanie - normalizacja:');
const normalize = (str: string) => str.replace(/Ś/g, 'S').replace(/ś/g, 's');
console.log('  normalize("ŚDS") =', normalize('ŚDS'));
console.log('  normalize("ŚDS").includes("SDS") =', normalize('ŚDS').includes('SDS'));
