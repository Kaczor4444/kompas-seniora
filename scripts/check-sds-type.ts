import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSDSType() {
  const sds = await prisma.placowka.findMany({
    where: {
      miejscowosc: 'Kraków',
      OR: [
        { typ_placowki: { contains: 'ŚDS' } },
        { typ_placowki: { contains: 'SDS' } },
        { typ_placowki: { contains: 'Środowiskowy' } }
      ]
    },
    select: {
      id: true,
      nazwa: true,
      typ_placowki: true,
      miejscowosc: true,
      powiat: true
    },
    orderBy: { id: 'asc' }
  });

  console.log('ŚDS w Krakowie:', sds.length);
  console.log('');
  
  sds.forEach(f => {
    console.log(`[ID: ${f.id}] ${f.nazwa}`);
    console.log(`  typ_placowki: "${f.typ_placowki}"`);
    console.log(`  powiat: "${f.powiat}"`);
    console.log('');
  });
  
  // Sprawdź jakie dokładnie wartości są w kolumnie typ_placowki dla ŚDS
  const allTypes = await prisma.placowka.findMany({
    where: {
      miejscowosc: 'Kraków'
    },
    select: {
      typ_placowki: true
    }
  });
  
  const uniqueTypes = [...new Set(allTypes.map(t => t.typ_placowki))];
  console.log('Unikalne wartości typ_placowki w Krakowie:');
  uniqueTypes.forEach(t => console.log('  -', t));
}

checkSDSType()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
