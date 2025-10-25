const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string z .env
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_QhEmIM4fuWa9@ep-orange-feather-ah5c17d5-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log('🚀 Starting database seed with pg...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon Postgres\n');

    // Wczytaj dane JSON
    const placowkiPath = path.join(__dirname, 'placowki.json');
    const terytPath = path.join(__dirname, 'teryt.json');

    console.log('📖 Loading data files...');
    const placowki = JSON.parse(fs.readFileSync(placowkiPath, 'utf8'));
    const teryty = JSON.parse(fs.readFileSync(terytPath, 'utf8'));

    console.log(`  ✅ Placówki: ${placowki.length} records`);
    console.log(`  ✅ TERYT: ${teryty.length} records\n`);

    // Sprawdź czy tabele są puste
    const countPlacowka = await client.query('SELECT COUNT(*) FROM "Placowka"');
    const countTeryt = await client.query('SELECT COUNT(*) FROM "TerytLocation"');

    console.log(`📊 Current database state:`);
    console.log(`  Placowka: ${countPlacowka.rows[0].count} records`);
    console.log(`  TerytLocation: ${countTeryt.rows[0].count} records\n`);

    if (countPlacowka.rows[0].count > 0 || countTeryt.rows[0].count > 0) {
      console.log('⚠️  Database already contains data!');
      console.log('   Clearing tables before import...\n');
      
      await client.query('TRUNCATE "Placowka", "TerytLocation" RESTART IDENTITY CASCADE');
      console.log('✅ Tables cleared\n');
    }

    // Import Placówek
    console.log('📥 Importing Placowka records...');
    let placowkaCount = 0;

    for (const placowka of placowki) {
      const query = `
        INSERT INTO "Placowka" (
          nazwa, typ_placowki, prowadzacy, ulica, miejscowosc, 
          kod_pocztowy, gmina, powiat, wojewodztwo, telefon, 
          email, www, liczba_miejsc, profil_opieki, koszt_pobytu, 
          data_aktualizacji, zrodlo, latitude, longitude, 
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
      `;

      const values = [
        placowka.nazwa,
        placowka.typ_placowki,
        placowka.prowadzacy,
        placowka.ulica,
        placowka.miejscowosc,
        placowka.kod_pocztowy,
        placowka.gmina,
        placowka.powiat,
        placowka.wojewodztwo,
        placowka.telefon,
        placowka.email,
        placowka.www,
        placowka.liczba_miejsc,
        placowka.profil_opieki,
        placowka.koszt_pobytu,
        placowka.data_aktualizacji ? new Date(placowka.data_aktualizacji) : null,
        placowka.zrodlo,
        placowka.latitude,
        placowka.longitude,
        new Date(placowka.createdAt),
        new Date(placowka.updatedAt)
      ];

      await client.query(query, values);
      placowkaCount++;

      if (placowkaCount % 10 === 0) {
        process.stdout.write(`  Progress: ${placowkaCount}/${placowki.length}\r`);
      }
    }

    console.log(`  ✅ Imported ${placowkaCount} placówek\n`);

    // Import TERYT locations (batch)
    console.log('📥 Importing TerytLocation records...');
    let terytCount = 0;
    const batchSize = 100;

    for (let i = 0; i < teryty.length; i += batchSize) {
      const batch = teryty.slice(i, i + batchSize);
      
      // Build multi-row insert
      const placeholders = [];
      const values = [];
      let valueIndex = 1;

      for (const teryt of batch) {
        const rowPlaceholders = [];
        for (let j = 0; j < 6; j++) {
          rowPlaceholders.push(`$${valueIndex++}`);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);

        values.push(
          teryt.nazwa,
          teryt.nazwa_normalized,
          teryt.typ,
          teryt.gmina,
          teryt.powiat,
          teryt.wojewodztwo
        );
      }

      const query = `
        INSERT INTO "TerytLocation" (
          nazwa, nazwa_normalized, typ, gmina, powiat, wojewodztwo
        ) VALUES ${placeholders.join(', ')}
      `;

      await client.query(query, values);
      terytCount += batch.length;
      process.stdout.write(`  Progress: ${terytCount}/${teryty.length}\r`);
    }

    console.log(`  ✅ Imported ${terytCount} TERYT locations\n`);

    // Weryfikacja
    console.log('🔍 Verifying import...');
    const finalCountPlacowka = await client.query('SELECT COUNT(*) FROM "Placowka"');
    const finalCountTeryt = await client.query('SELECT COUNT(*) FROM "TerytLocation"');

    console.log(`  📊 Placowka: ${finalCountPlacowka.rows[0].count} records`);
    console.log(`  📊 TerytLocation: ${finalCountTeryt.rows[0].count} records\n`);

    if (finalCountPlacowka.rows[0].count == placowki.length && 
        finalCountTeryt.rows[0].count == teryty.length) {
      console.log('✅ SUCCESS! All data imported correctly.\n');
    } else {
      console.log('⚠️  WARNING: Record count mismatch!');
      console.log(`  Expected Placowka: ${placowki.length}, Got: ${finalCountPlacowka.rows[0].count}`);
      console.log(`  Expected TERYT: ${teryty.length}, Got: ${finalCountTeryt.rows[0].count}\n`);
    }

    // Sample records
    console.log('📝 Sample records:');
    const samplePlacowka = await client.query('SELECT * FROM "Placowka" LIMIT 1');
    const sampleTeryt = await client.query('SELECT * FROM "TerytLocation" WHERE typ = \'miejscowosc\' LIMIT 1');

    console.log('\n  Placowka:', samplePlacowka.rows[0]?.nazwa);
    console.log('  TERYT:', sampleTeryt.rows[0]?.nazwa, `(${sampleTeryt.rows[0]?.typ})`);

  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🎉 Seed completed successfully!');
  }
}

main();
