// Fix missing coordinates for 2 facilities
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCoordinates() {
  try {
    console.log('🔧 Updating missing coordinates...\n');

    // ID 118: ŚDS Marchocice
    const facility118 = await prisma.placowka.update({
      where: { id: 118 },
      data: {
        latitude: 50.3245841,  // Float, not String
        longitude: 20.1846801
      }
    });
    console.log('✅ Updated ID 118: ŚDS Marchocice');
    console.log(`   Coordinates: ${facility118.latitude}, ${facility118.longitude}\n`);

    // ID 168: DPS Nowy Sącz - using coordinates from Nominatim
    const facility168 = await prisma.placowka.update({
      where: { id: 168 },
      data: {
        latitude: 49.6221479,
        longitude: 20.6988344
      }
    });
    console.log('✅ Updated ID 168: DPS Nowy Sącz');
    console.log(`   Coordinates: ${facility168.latitude}, ${facility168.longitude}\n`);

    // Verify all facilities now have coordinates
    const missingCoords = await prisma.placowka.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        nazwa: true,
        miejscowosc: true
      }
    });

    console.log('📊 Facilities still missing coordinates:', missingCoords.length);
    if (missingCoords.length > 0) {
      console.log(missingCoords);
    } else {
      console.log('🎉 All facilities now have coordinates!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoordinates();
