// Test MOPS CSV export
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatDateOnly(date) {
  return date.toISOString().split('T')[0];
}

function escapeCsv(value) {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function testExport() {
  const headers = [
    'id', 'city', 'cityDisplay', 'typ', 'gmina', 'name', 'phone', 'email',
    'address', 'website', 'wojewodztwo', 'latitude', 'longitude',
    'verified', 'lastVerified', 'notes', 'createdAt', 'updatedAt'
  ];

  const mops = await prisma.mopsContact.findMany({
    orderBy: [
      { wojewodztwo: 'asc' },
      { cityDisplay: 'asc' }
    ],
    take: 3
  });

  console.log('CSV Header:');
  console.log(headers.join(','));
  console.log('\nFirst 3 rows:');

  mops.forEach(m => {
    const row = [
      m.id,
      escapeCsv(m.city),
      escapeCsv(m.cityDisplay),
      escapeCsv(m.typ),
      escapeCsv(m.gmina || ''),
      escapeCsv(m.name),
      escapeCsv(m.phone),
      escapeCsv(m.email || ''),
      escapeCsv(m.address),
      escapeCsv(m.website || ''),
      escapeCsv(m.wojewodztwo),
      m.latitude || '',
      m.longitude || '',
      m.verified ? 'true' : 'false',
      m.lastVerified ? formatDateOnly(m.lastVerified) : '',
      escapeCsv(m.notes || ''),
      formatDateOnly(m.createdAt),
      formatDateOnly(m.updatedAt)
    ];
    console.log(row.join(','));
  });

  console.log(`\n✅ Successfully tested CSV export format for ${mops.length} records`);
  await prisma.$disconnect();
}

testExport().catch(console.error);
