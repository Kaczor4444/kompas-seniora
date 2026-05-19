#!/usr/bin/env node
// Eksport danych placówek do CSV dla Tableau Public
// Użycie: node scripts/export-tableau.js

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escapeCsv(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const TYPY_LABEL = {
  'DPS': 'DPS',
  'ŚDS': 'ŚDS',
  'Klub Senior+': 'Klub Senior+',
  'Dzienny Dom Senior+': 'DD Senior+',
};

async function main() {
  const placowki = await prisma.placowka.findMany({
    where: {
      typ_placowki: { in: ['DPS', 'ŚDS', 'Klub Senior+', 'Dzienny Dom Senior+'] },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      nazwa: true,
      typ_placowki: true,
      ulica: true,
      miejscowosc: true,
      kod_pocztowy: true,
      powiat: true,
      wojewodztwo: true,
      latitude: true,
      longitude: true,
      liczba_miejsc: true,
      koszt_pobytu: true,
      profil_opieki: true,
      telefon: true,
      www: true,
    },
    orderBy: [
      { typ_placowki: 'asc' },
      { powiat: 'asc' },
      { miejscowosc: 'asc' },
    ],
  });

  const headers = [
    'id',
    'nazwa',
    'typ',
    'typ_krotki',
    'ulica',
    'miejscowosc',
    'kod_pocztowy',
    'powiat',
    'wojewodztwo',
    'latitude',
    'longitude',
    'liczba_miejsc',
    'koszt_pobytu',
    'profil_opieki',
    'telefon',
    'www',
  ];

  const rows = placowki.map(p => [
    p.id,
    escapeCsv(p.nazwa),
    escapeCsv(p.typ_placowki),
    escapeCsv(TYPY_LABEL[p.typ_placowki] || p.typ_placowki),
    escapeCsv(p.ulica || ''),
    escapeCsv(p.miejscowosc),
    escapeCsv(p.kod_pocztowy || ''),
    escapeCsv(p.powiat),
    escapeCsv(p.wojewodztwo),
    p.latitude ?? '',
    p.longitude ?? '',
    p.liczba_miejsc ?? '',
    p.koszt_pobytu ?? '',
    escapeCsv(p.profil_opieki || ''),
    escapeCsv(p.telefon || ''),
    escapeCsv(p.www || ''),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const outPath = path.join(process.cwd(), 'tableau_export.csv');
  fs.writeFileSync(outPath, '﻿' + csv, 'utf8'); // BOM dla Excel/Sheets

  console.log(`✅ Wyeksportowano ${placowki.length} placówek → ${outPath}`);

  const stats = placowki.reduce((acc, p) => {
    acc[p.typ_placowki] = (acc[p.typ_placowki] || 0) + 1;
    return acc;
  }, {});
  console.log('Podział:');
  Object.entries(stats).forEach(([typ, n]) => console.log(`  ${typ}: ${n}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
