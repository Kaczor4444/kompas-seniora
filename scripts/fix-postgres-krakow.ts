// Naprawa danych w PostgreSQL - mapowanie "Kraków" → "krakowski"
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixData() {
  console.log('🔧 NAPRAWA DANYCH - KRAKÓW\n');

  // 1. Znajdź placówki do naprawy
  console.log('📋 KROK 1: Identyfikacja placówek do zmiany\n');

  const toFixKrakow = await prisma.placowka.findMany({
    where: { powiat: 'Kraków' },
    select: { id: true, nazwa: true, miejscowosc: true, powiat: true, typ_placowki: true }
  });

  const toCheckLimanowski = await prisma.placowka.findMany({
    where: {
      miejscowosc: 'Kraków',
      powiat: 'limanowski'
    },
    select: { id: true, nazwa: true, miejscowosc: true, powiat: true, typ_placowki: true, ulica: true }
  });

  console.log(`🔍 Znaleziono:`);
  console.log(`   - ${toFixKrakow.length} placówek z powiatem "Kraków" (zmienić → "krakowski")`);
  console.log(`   - ${toCheckLimanowski.length} placówek "Kraków" w pow. limanowski (sprawdzić ręcznie)\n`);

  if (toFixKrakow.length === 0 && toCheckLimanowski.length === 0) {
    console.log('✅ Brak danych do naprawy!');
    return;
  }

  // 2. Pokaż szczegóły
  if (toFixKrakow.length > 0) {
    console.log('📝 PLACÓWKI DO ZMIANY (Kraków → krakowski):');
    toFixKrakow.forEach(f => {
      console.log(`   [${f.id}] ${f.nazwa}`);
      console.log(`       Miejscowość: ${f.miejscowosc}, Powiat: "${f.powiat}" → "krakowski", Typ: ${f.typ_placowki}`);
    });
    console.log();
  }

  if (toCheckLimanowski.length > 0) {
    console.log('⚠️  PODEJRZANE PLACÓWKI (Kraków w pow. limanowski):');
    toCheckLimanowski.forEach(f => {
      console.log(`   [${f.id}] ${f.nazwa}`);
      console.log(`       Adres: ${f.ulica || 'brak'}, ${f.miejscowosc}`);
      console.log(`       Powiat: "${f.powiat}" - CZY TO BŁĄD?`);
    });
    console.log();
  }

  // 3. Podsumowanie przed zmianą
  const currentKrakowski = await prisma.placowka.count({
    where: { powiat: 'krakowski' }
  });

  console.log('📊 AKTUALNY STAN:');
  console.log(`   - Powiat "krakowski": ${currentKrakowski} placówek`);
  console.log(`   - Powiat "Kraków": ${toFixKrakow.length} placówek`);
  console.log(`   - RAZEM PO ZMIANIE: ${currentKrakowski + toFixKrakow.length} placówek w pow. krakowski\n`);

  // 4. Pytanie o potwierdzenie (lub --confirm w CLI)
  const autoConfirm = process.argv.includes('--confirm');

  let answer = 'nie';
  if (autoConfirm) {
    console.log('✅ Auto-potwierdzenie (--confirm flag)\n');
    answer = 'tak';
  } else {
    answer = await question('❓ Czy chcesz wykonać tę naprawę? (tak/nie): ');
  }

  if (answer.toLowerCase() !== 'tak') {
    console.log('\n❌ Anulowano. Żadne dane nie zostały zmienione.');
    return;
  }

  // 5. Wykonaj naprawę
  console.log('\n🔄 WYKONYWANIE NAPRAWY...\n');

  try {
    // Mapowanie "Kraków" → "krakowski"
    const result = await prisma.placowka.updateMany({
      where: { powiat: 'Kraków' },
      data: { powiat: 'krakowski' }
    });

    console.log(`✅ Zmieniono ${result.count} rekordów\n`);

    // Weryfikacja
    const afterKrakowski = await prisma.placowka.count({
      where: { powiat: 'krakowski' }
    });

    const afterKrakow = await prisma.placowka.count({
      where: { powiat: 'Kraków' }
    });

    console.log('📊 STAN PO NAPRAWIE:');
    console.log(`   - Powiat "krakowski": ${afterKrakowski} placówek ✅`);
    console.log(`   - Powiat "Kraków": ${afterKrakow} placówek`);
    console.log();

    // Szczegóły powiatu krakowski
    const krakowskiDetails = await prisma.placowka.groupBy({
      by: ['miejscowosc', 'typ_placowki'],
      where: { powiat: 'krakowski' },
      _count: { id: true }
    });

    console.log('📍 ROZBICIE POWIATU KRAKOWSKI:');
    const krakow = krakowskiDetails.filter(g => g.miejscowosc === 'Kraków');
    const inne = krakowskiDetails.filter(g => g.miejscowosc !== 'Kraków');

    const krakowDPS = krakow.find(k => k.typ_placowki === 'DPS')?._count.id || 0;
    const krakowSDS = krakow.find(k => k.typ_placowki === 'ŚDS')?._count.id || 0;
    const krakowTotal = krakowDPS + krakowSDS;

    console.log(`   Miasto Kraków: ${krakowTotal} (${krakowDPS} DPS + ${krakowSDS} ŚDS)`);
    console.log(`   Inne miejscowości: ${inne.reduce((sum, g) => sum + g._count.id, 0)}`);
    console.log();

    if (toCheckLimanowski.length > 0) {
      console.log('⚠️  UWAGA: Sprawdź ręcznie placówki "Kraków" w pow. limanowski (ID: ' +
        toCheckLimanowski.map(f => f.id).join(', ') + ')');
    }

    console.log('\n✅ NAPRAWA ZAKOŃCZONA POMYŚLNIE!');

  } catch (error) {
    console.error('\n❌ BŁĄD podczas naprawy:', error);
    throw error;
  }
}

fixData()
  .catch(console.error)
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });
