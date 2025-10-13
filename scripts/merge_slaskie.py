#!/usr/bin/env python3
"""
Merge Śląskie placówki do produkcyjnego pliku data/placowki.csv

Workflow:
1. Czyta data/placowki.csv (32 Małopolskie)
2. Czyta raw_dane/slaskie/placowki_slaskie.csv (4 Śląskie)
3. Wybiera tylko 25 kolumn produkcyjnych (pomija notatki)
4. Merguje obie listy
5. Zapisuje jako data/placowki.csv (36 total)
"""

import csv
import os
from pathlib import Path

# Ścieżki plików
PRODUCTION_FILE = 'data/placowki.csv'
SLASKIE_FILE = 'raw_dane/slaskie/placowki_slaskie.csv'
BACKUP_FILE = 'data/placowki_backup.csv'

# 25 kolumn produkcyjnych (bez notatek)
PRODUCTION_COLUMNS = [
    'id', 'nazwa', 'typ_placowki', 'prowadzacy', 'data_aktualizacji',
    'zrodlo', 'wojewodztwo', 'powiat', 'gmina', 'miasto_wies',
    'ulica', 'kod_pocztowy', 'geo_lat', 'geo_long', 'telefon',
    'email', 'www', 'liczba_miejsc', 'profil_opieki', 'koszt_pobytu',
    'opis', 'godziny_otwarcia', 'facebook_url', 'instagram_url', 'dodatkowe_info'
]


def read_csv_file(filepath):
    """Czyta CSV i zwraca listę dictów"""
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        # Usuń BOM z kluczy jeśli istnieje
        rows = []
        for row in reader:
            clean_row = {k.lstrip('\ufeff'): v for k, v in row.items()}
            rows.append(clean_row)
        return rows


def filter_columns(row, columns):
    """Filtruje row żeby zawierał tylko wybrane kolumny"""
    return {col: row.get(col, '') for col in columns}


def main():
    print("🚀 Merge Śląskie → data/placowki.csv\n")
    
    # 1. Sprawdź czy pliki istnieją
    if not os.path.exists(PRODUCTION_FILE):
        print(f"❌ Błąd: Nie znaleziono {PRODUCTION_FILE}")
        return
    
    if not os.path.exists(SLASKIE_FILE):
        print(f"❌ Błąd: Nie znaleziono {SLASKIE_FILE}")
        return
    
    # 2. Backup produkcyjnego pliku
    print("📦 Tworzę backup...")
    os.system(f'cp {PRODUCTION_FILE} {BACKUP_FILE}')
    print(f"✅ Backup zapisany: {BACKUP_FILE}\n")
    
    # 3. Czytaj oba pliki
    print("📖 Czytam pliki...")
    malopolska_rows = read_csv_file(PRODUCTION_FILE)
    slaskie_rows = read_csv_file(SLASKIE_FILE)
    
    print(f"   Małopolska: {len(malopolska_rows)} placówek")
    
    # Debug - pokaż pierwsze klucze jeśli Małopolska pusta
    if len(malopolska_rows) == 0:
        print("   ⚠️  UWAGA: Małopolska pusta! Sprawdzam plik...")
        with open(PRODUCTION_FILE, 'r', encoding='utf-8-sig') as f:
            first_line = f.readline()
            print(f"   Pierwszy wiersz: {first_line[:100]}")
    elif len(malopolska_rows) > 0:
        print(f"   Przykładowe klucze: {list(malopolska_rows[0].keys())[:5]}")
    
    print(f"   Śląskie: {len(slaskie_rows)} placówek\n")
    
    # 4. Filtruj Śląskie do 25 kolumn
    print("🔧 Filtruję Śląskie do 25 kolumn produkcyjnych...")
    slaskie_filtered = [filter_columns(row, PRODUCTION_COLUMNS) for row in slaskie_rows]
    
    # 5. Merge list
    print("🔀 Merguję dane...")
    all_rows = malopolska_rows + slaskie_filtered
    
    # 6. Sprawdź duplikaty ID (jeśli kolumna id istnieje)
    if 'id' in PRODUCTION_COLUMNS and all_rows and 'id' in all_rows[0]:
        ids = [str(row.get('id', '')).strip() for row in all_rows if row.get('id')]
        unique_ids = set(ids)
        
        if len(ids) != len(unique_ids):
            print("⚠️  UWAGA: Znaleziono duplikaty ID!")
            duplicates = [id_val for id_val in unique_ids if ids.count(id_val) > 1]
            print(f"   Duplikaty: {duplicates}")
            print("   Kontynuować? (y/n): ", end='')
            if input().lower() != 'y':
                print("❌ Anulowano.")
                return
        else:
            print(f"✅ Sprawdzenie ID: {len(ids)} unikalnych ID")
    else:
        print("ℹ️  Pomijam sprawdzanie duplikatów ID...")
    
    # 7. Zapisz nowy plik
    print(f"💾 Zapisuję {PRODUCTION_FILE}...")
    with open(PRODUCTION_FILE, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=PRODUCTION_COLUMNS)
        writer.writeheader()
        writer.writerows(all_rows)
    
    # 8. Podsumowanie
    print("\n✅ GOTOWE!\n")
    print("📊 Statystyki:")
    print(f"   Małopolska: {len(malopolska_rows)} placówek")
    print(f"   Śląskie: {len(slaskie_filtered)} placówek")
    print(f"   RAZEM: {len(all_rows)} placówek")
    print(f"\n📁 Pliki:")
    print(f"   Produkcja: {PRODUCTION_FILE}")
    print(f"   Backup: {BACKUP_FILE}")
    print("\n🚀 Możesz teraz zaimportować do bazy:")
    print("   npx ts-node scripts/import-placowki.ts")


if __name__ == '__main__':
    main()