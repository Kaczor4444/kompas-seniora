import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Mapowanie nazw z bazy na nazwy z Excel
const nameMapping: Record<number, string> = {
  1: 'Biecz',
  2: 'Gorlice', // filia
  3: 'Tomaszkowice',
  4: 'Chełmek',
  5: 'Jelcza',
  6: 'Chrzanów',
  7: 'Dobczyce',
  8: 'Zagórzany',
  9: 'Jabłonka',
  10: 'Jerzmanowice',
  11: 'Kalwaria Zebrzydowska',
  12: 'Kolbark',
  13: 'Klucze',
  14: 'Kozłów',
  15: 'os. Wandy 23',
  16: 'os. Młodości 8',
  17: 'os. Słoneczne 15',
  18: 'al. Grottgera 3',
  90: 'Józefa 1',
  91: 'Olszańska 5',
  92: 'Aleksandry 1',
};

async function importZaZyciem() {
  console.log('📊 Importowanie danych "Za życiem"...\n');
  
  const filePath = path.join(process.cwd(), 'raw_dane/malopolskie/Wykaz środowiskowych domów samopomocy(5).xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });
  
  let updated = 0;
  let notFound = 0;
  let skipped = 0;
  
  for (const row of data as any[]) {
    const miejsca_dotowane = row['Liczba miejsc dotowanych'];
    const miejsca_za_zyciem = row['Miejsca z podwyższoną dotacją "Za życiem"'];
    const adres = row['Adres środowiskowego domu samopomocy oraz filii']?.toString() || '';
    
    if (!adres) {
      skipped++;
      continue;
    }
    
    // Znajdź po adresie
    let found = false;
    for (const [idStr, searchTerm] of Object.entries(nameMapping)) {
      const id = parseInt(idStr);
      
      if (adres.includes(searchTerm)) {
        const placowka = await prisma.placowka.findUnique({
          where: { id },
          select: { id: true, nazwa: true, liczba_miejsc: true }
        });
        
        if (placowka) {
          await prisma.placowka.update({
            where: { id },
            data: {
              liczba_miejsc: miejsca_dotowane || placowka.liczba_miejsc,
              miejsca_za_zyciem: miejsca_za_zyciem || null
            }
          });
          
          console.log(`✅ [ID ${id}] ${placowka.nazwa}`);
          console.log(`   Miejsca: ${miejsca_dotowane} (w tym ${miejsca_za_zyciem || 0} Za życiem)\n`);
          updated++;
          found = true;
          break;
        }
      }
    }
    
    if (!found && miejsca_za_zyciem > 0) {
      console.log(`❌ NIE ZNALEZIONO: ${adres.substring(0, 50)}\n`);
      notFound++;
    }
  }
  
  console.log('\n📊 PODSUMOWANIE:');
  console.log(`   ✅ Zaktualizowano: ${updated}`);
  console.log(`   ❌ Nie znaleziono: ${notFound}`);
  console.log(`   ⏭️  Pominięto: ${skipped}`);
  
  await prisma.$disconnect();
}

importZaZyciem().catch(console.error);
