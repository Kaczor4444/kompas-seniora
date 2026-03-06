import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Czyszczenie tabeli MopsContact...\n');

  const count = await prisma.mopsContact.count();
  console.log(`📊 Aktualnie w bazie: ${count} rekordów`);

  const result = await prisma.mopsContact.deleteMany({});
  console.log(`✅ Usunięto: ${result.count} rekordów`);

  const finalCount = await prisma.mopsContact.count();
  console.log(`📊 Po wyczyszczeniu: ${finalCount} rekordów\n`);

  console.log('✨ Tabela wyczyszczona - gotowa do nowego importu!');
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
