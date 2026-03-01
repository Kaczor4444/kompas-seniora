// Naprawa placówki ID 58 - miejscowość "Kraków" → "Limanowa"
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

async function fixFacility() {
  console.log('🔧 NAPRAWA PLACÓWKI ID 58\n');

  const facility = await prisma.placowka.findUnique({
    where: { id: 58 }
  });

  if (!facility) {
    console.log('❌ Nie znaleziono placówki o ID 58');
    return;
  }

  console.log('📋 OBECNE DANE:');
  console.log(`   Nazwa: ${facility.nazwa}`);
  console.log(`   Adres: ${facility.ulica}, ${facility.miejscowosc}`);
  console.log(`   Kod: ${facility.kod_pocztowy}`);
  console.log(`   Powiat: ${facility.powiat}`);
  console.log(`   Email: ${facility.email}`);
  console.log();

  console.log('🔍 DOWODY BŁĘDU:');
  console.log('   ✓ Kod pocztowy 34-600 = LIMANOWA (nie Kraków!)');
  console.log('   ✓ Email: dpslimanowa.pl = LIMANOWA');
  console.log('   ✓ Powiat limanowski = POPRAWNY');
  console.log('   ✗ Miejscowość "Kraków" = BŁĄD (powinno być "Limanowa")');
  console.log();

  console.log('✨ PROPONOWANA ZMIANA:');
  console.log('   miejscowosc: "Kraków" → "Limanowa"');
  console.log('   (powiat pozostaje: "limanowski")');
  console.log();

  // Pytanie o potwierdzenie
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

  // Wykonaj naprawę
  console.log('\n🔄 WYKONYWANIE NAPRAWY...\n');

  try {
    const updated = await prisma.placowka.update({
      where: { id: 58 },
      data: { miejscowosc: 'Limanowa' }
    });

    console.log('✅ POMYŚLNIE ZAKTUALIZOWANO!\n');
    console.log('📋 NOWE DANE:');
    console.log(`   Nazwa: ${updated.nazwa}`);
    console.log(`   Adres: ${updated.ulica}, ${updated.miejscowosc}`);
    console.log(`   Kod: ${updated.kod_pocztowy}`);
    console.log(`   Powiat: ${updated.powiat}`);
    console.log();

    // Weryfikacja - sprawdź czy teraz są spójne dane
    const verification = await prisma.placowka.findMany({
      where: {
        OR: [
          { miejscowosc: 'Kraków', powiat: 'limanowski' },
          { miejscowosc: 'Limanowa', powiat: { not: 'limanowski' } }
        ]
      }
    });

    if (verification.length > 0) {
      console.log('⚠️  UWAGA: Znaleziono inne niespójności:');
      verification.forEach(f => {
        console.log(`   [${f.id}] ${f.nazwa} - ${f.miejscowosc} / pow. ${f.powiat}`);
      });
    } else {
      console.log('✅ Brak innych niespójności w bazie!');
    }

    console.log('\n✅ NAPRAWA ZAKOŃCZONA POMYŚLNIE!');

  } catch (error) {
    console.error('\n❌ BŁĄD podczas naprawy:', error);
    throw error;
  }
}

fixFacility()
  .catch(console.error)
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });
