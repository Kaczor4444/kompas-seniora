#!/usr/bin/env python3
"""
Merge script for kompaseniora.pl
Merges Małopolskie + Śląskie CSV files into production data/placowki.csv

ID Strategy:
- Małopolskie: 0-999 (ŚDS: 1-99, DPS: 100-199, Inne: 200-299)
- Śląskie: 2000-2999 (ŚDS: 2000-2099, DPS: 2100-2199, Inne: 2200-2299)
"""

import csv
import os
from datetime import datetime

# Paths
RAW_MALOPOLSKIE = 'raw_dane/malopolskie/placowki_malopolska.csv'
RAW_SLASKIE = 'raw_dane/slaskie/placowki_slaskie.csv'
OUTPUT_FILE = 'data/placowki.csv'

# Production columns (25 columns - pierwsze 25 z 29)
PRODUCTION_COLUMNS = [
    'id', 'nazwa', 'typ_placowki', 'prowadzacy', 'data_aktualizacji',
    'zrodlo', 'wojewodztwo', 'powiat', 'gmina', 'miasto_wies',
    'ulica', 'kod_pocztowy', 'geo_lat', 'geo_long', 'telefon',
    'email', 'www', 'liczba_miejsc', 'profil_opieki', 'koszt_pobytu',
    'opis', 'godziny_otwarcia', 'facebook_url', 'instagram_url', 'dodatkowe_info'
]

def read_csv_file(filepath):
    """Read CSV file and return rows"""
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return []
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)

def write_csv_file(filepath, rows):
    """Write rows to CSV file"""
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=PRODUCTION_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

def filter_production_columns(row):
    """Keep only production columns (first 25)"""
    return {col: row.get(col, '') for col in PRODUCTION_COLUMNS}

def main():
    print("🚀 MERGE SCRIPT - kompaseniora.pl")
    print("=" * 70)
    print()
    
    # Read Małopolskie
    print(f"📂 Reading: {RAW_MALOPOLSKIE}")
    malopolskie = read_csv_file(RAW_MALOPOLSKIE)
    print(f"   ✅ Loaded {len(malopolskie)} placówek")
    
    if malopolskie:
        ids = [int(row['id']) for row in malopolskie if row['id'].isdigit()]
        print(f"   📊 ID range: {min(ids)}-{max(ids)}")
    print()
    
    # Read Śląskie
    print(f"📂 Reading: {RAW_SLASKIE}")
    slaskie = read_csv_file(RAW_SLASKIE)
    print(f"   ✅ Loaded {len(slaskie)} placówek")
    
    if slaskie:
        ids = [int(row['id']) for row in slaskie if row['id'].isdigit()]
        print(f"   📊 ID range: {min(ids)}-{max(ids)}")
        if ids and (min(ids) < 2000 or max(ids) > 2999):
            print(f"   ⚠️  WARNING: Śląskie IDs should be 2000-2999!")
    print()
    
    # Merge and filter
    print("🔀 Merging data...")
    all_rows = malopolskie + slaskie
    production_rows = [filter_production_columns(row) for row in all_rows]
    
    print(f"   ✅ Total placówek: {len(production_rows)}")
    print(f"   📋 Columns: {len(PRODUCTION_COLUMNS)}")
    print()
    
    # Verify IDs are unique
    ids_set = set()
    duplicates = []
    for row in production_rows:
        row_id = row['id']
        if row_id in ids_set:
            duplicates.append(row_id)
        ids_set.add(row_id)
    
    if duplicates:
        print(f"   ⚠️  WARNING: Duplicate IDs found: {duplicates}")
    else:
        print(f"   ✅ All IDs unique")
    print()
    
    # Write output
    print(f"💾 Writing: {OUTPUT_FILE}")
    write_csv_file(OUTPUT_FILE, production_rows)
    print(f"   ✅ File saved!")
    print()
    
    # Summary by województwo
    print("📊 SUMMARY BY WOJEWÓDZTWO:")
    wojewodztwa = {}
    for row in production_rows:
        woj = row.get('wojewodztwo', 'Unknown')
        wojewodztwa[woj] = wojewodztwa.get(woj, 0) + 1
    
    for woj, count in sorted(wojewodztwa.items()):
        print(f"   {woj}: {count} placówek")
    print()
    
    # Summary by typ_placowki
    print("📊 SUMMARY BY TYP_PLACOWKI:")
    typy = {}
    for row in production_rows:
        typ = row.get('typ_placowki', 'Unknown')
        typy[typ] = typy.get(typ, 0) + 1
    
    for typ, count in sorted(typy.items()):
        print(f"   {typ}: {count} placówek")
    print()
    
    print("=" * 70)
    print("✅ MERGE COMPLETE!")
    print(f"📁 Output: {OUTPUT_FILE}")
    print(f"📊 Total: {len(production_rows)} placówek")
    print()
    print("🎯 Next steps:")
    print("   1. Verify: head -20 data/placowki.csv")
    print("   2. Import: npx ts-node scripts/import-placowki.ts")
    print("=" * 70)

if __name__ == '__main__':
    main()