import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFilieFacilities() {
  console.log('🔧 Starting branch facilities (filie) data correction...\n');

  try {
    // PAIR 1: Biecz (ID 1) + Gorlice (ID 2)
    console.log('📍 PAIR 1: Biecz + Gorlice');

    const biecz = await prisma.placowka.update({
      where: { id: 1 },
      data: {
        liczba_miejsc: 41,
        miejsca_za_zyciem: 31,
        notatki: '⚠️ Placówka ma filię w Gorlicach (ul. Wyszyńskiego 18).\n\nŁącznie 41 miejsc (31 "Za życiem"):\n• Biecz: 21 miejsc dziennych + 4 całodobowe\n• Gorlice (filia): 19 miejsc dziennych\n\nLiczby powyżej dotyczą obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${biecz.id} (Biecz main): ${biecz.liczba_miejsc} places, ${biecz.miejsca_za_zyciem} "Za życiem"`);

    const gorlice = await prisma.placowka.update({
      where: { id: 2 },
      data: {
        liczba_miejsc: 41,
        miejsca_za_zyciem: 31,
        notatki: '⚠️ To jest filia ŚDS Biecz.\n\nŁącznie 41 miejsc (31 "Za życiem"):\n• Biecz (główna): 21 miejsc dziennych + 4 całodobowe\n• Gorlice: 19 miejsc dziennych\n\nLiczby powyżej dotyczą obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${gorlice.id} (Gorlice branch): ${gorlice.liczba_miejsc} places, ${gorlice.miejsca_za_zyciem} "Za życiem"\n`);

    // PAIR 2: Vita - ID 16 (main) + ID 17, 18 (branches)
    console.log('📍 PAIR 2: Vita main + 2 branches');

    const vitaMain = await prisma.placowka.update({
      where: { id: 16 },
      data: {
        notatki: '⚠️ Placówka ma 2 filie: os. Słoneczne 15 i al. Grottgera 3.\n\nLiczba miejsc (102, w tym 22 "Za życiem") dotyczy wszystkich 3 lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${vitaMain.id} (Vita main): Added disclaimer`);

    const vitaBranch1 = await prisma.placowka.update({
      where: { id: 17 },
      data: {
        liczba_miejsc: 102,
        miejsca_za_zyciem: 22,
        notatki: '⚠️ To jest filia ŚDS "Vita" (główna: os. Młodości 8).\n\nLiczba miejsc dotyczy wszystkich 3 lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${vitaBranch1.id} (Vita branch 1): ${vitaBranch1.liczba_miejsc} places (fixed from 999), ${vitaBranch1.miejsca_za_zyciem} "Za życiem"`);

    const vitaBranch2 = await prisma.placowka.update({
      where: { id: 18 },
      data: {
        liczba_miejsc: 102,
        miejsca_za_zyciem: 22,
        notatki: '⚠️ To jest filia ŚDS "Vita" (główna: os. Młodości 8).\n\nLiczba miejsc dotyczy wszystkich 3 lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${vitaBranch2.id} (Vita branch 2): ${vitaBranch2.liczba_miejsc} places, ${vitaBranch2.miejsca_za_zyciem} "Za życiem"\n`);

    // PAIR 3: Aleksandry (ID 92) + Teligi (ID 93)
    console.log('📍 PAIR 3: Aleksandry + Teligi');

    const aleksandry = await prisma.placowka.update({
      where: { id: 92 },
      data: {
        notatki: '⚠️ Placówka ma filię przy ul. Teligi 26b.\n\nLiczba miejsc dotyczy obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${aleksandry.id} (Aleksandry main): Added disclaimer`);

    const teligi = await prisma.placowka.update({
      where: { id: 93 },
      data: {
        nazwa: 'Środowiskowy Dom Samopomocy - Filia ul. Teligi',
        notatki: '⚠️ To jest filia ŚDS przy ul. Aleksandry 1.\n\nLiczba miejsc dotyczy obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${teligi.id} (Teligi branch): Name corrected to "${teligi.nazwa}"\n`);

    // PAIR 4: Pasteura (ID 97) + Komandosów (ID 98)
    console.log('📍 PAIR 4: Pasteura + Komandosów');

    const pasteura = await prisma.placowka.update({
      where: { id: 97 },
      data: {
        notatki: '⚠️ Placówka ma filię przy ul. Komandosów 18.\n\nLiczba miejsc dotyczy obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${pasteura.id} (Pasteura main): Added disclaimer`);

    const komandosow = await prisma.placowka.update({
      where: { id: 98 },
      data: {
        notatki: '⚠️ To jest filia ŚDS przy ul. Pasteura 1.\n\nLiczba miejsc dotyczy obu lokalizacji łącznie.'
      }
    });
    console.log(`  ✅ ID ${komandosow.id} (Komandosów branch): Added disclaimer\n`);

    console.log('✨ All 8 facilities updated successfully!\n');

    // Verification queries
    console.log('🔍 VERIFICATION - Final values:');
    const facilityIds = [1, 2, 16, 17, 18, 92, 93, 97, 98];
    const facilities = await prisma.placowka.findMany({
      where: { id: { in: facilityIds } },
      select: {
        id: true,
        nazwa: true,
        liczba_miejsc: true,
        miejsca_za_zyciem: true,
        notatki: true
      },
      orderBy: { id: 'asc' }
    });

    facilities.forEach(f => {
      console.log(`\nID ${f.id}: ${f.nazwa}`);
      console.log(`  Miejsca: ${f.liczba_miejsc ?? 'null'}`);
      console.log(`  Za życiem: ${f.miejsca_za_zyciem ?? 'null'}`);
      console.log(`  Notatki: ${f.notatki ? '✓ Present' : '✗ Missing'}`);
    });

  } catch (error) {
    console.error('❌ Error updating facilities:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixFilieFacilities()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
