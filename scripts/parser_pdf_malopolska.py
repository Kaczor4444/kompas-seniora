import csv
import pandas as pd
from tabula import read_pdf
from typing import List, Dict, Any # DODANE: Naprawia błąd NameError

# --- STAŁE KONFIGURACYJNE ---
ROK_DANYCH = 2025 
INPUT_FILE_PDF = "malopolska_koszt_DPS_2025.pdf" # Zmieni się na 2026 w trakcie użytkowania
OUTPUT_FILE_CSV = f"dane_malopolska_{ROK_DANYCH}_OCZYSZCZONE.csv"
URL_UCHWALY = "http://bip.malopolska.pl/uchwala/2026/koszty_dps.pdf" 

FIELDNAMES = [
    "Rok_Danych", "ID_Placowki", "Powiat", "Nazwa_Placowki", "Adres_Pelny", 
    "Typ_Opieki", "Cena_Num", "URL_Zrodlo", "Status_Weryfikacji",
]

# --- 1. LOGIKA EKSTRAKCJI Z PDF (ULEPSZONA) ---

def extract_raw_data_from_pdf(pdf_path: str) -> List[List[Any]]:
    """Używa tabula-py w trybie lattice do wyciągnięcia tabel z większą odpornością."""
    print(f"-> Rozpoczynanie parsowania pliku w trybie LATTICE: {pdf_path}")
    
    # Obszar skanowania na stronach (dla typowej uchwały): [top, left, bottom, right]
    area_to_scan = [60, 20, 750, 780] 

    try:
        dfs = read_pdf(
            pdf_path, 
            pages='all', 
            area=area_to_scan, 
            multiple_tables=True, 
            lattice=True,
            stream=False 
        )
    except Exception as e:
        print(f"BŁĄD PARSOWANIA TABULA-PY: {e}")
        return []

    if not dfs:
        print("BŁĄD: Nie znaleziono żadnych tabel. Sprawdź obszar skanowania.")
        return []

    all_rows = []
    
    # ⚠️ Wymaga analizy na podstawie Twojego screenshota (wskazuje na 6 kolumn: Lp, Powiat, Nazwa/Adres, Typ, Koszt, Dodatkowy opis/kolumna)
    for df in dfs:
        # Konwersja na listę list (surowe wiersze)
        rows_list = df.values.tolist() 
        
        for row in rows_list:
             # Odrzuć wiersze nagłówkowe (zawierające kluczowe słowa z nagłówka tabeli)
            row_str = " ".join(map(str, row)).lower()
            if any(key in row_str for key in ["powiat", "nazwa", "lp."]):
                continue
            
            # Odrzuć wiersze, które są w większości puste
            if sum(1 for x in row if str(x).strip() and str(x) != 'nan') < 2:
                continue
                
            all_rows.append(row)
    
    print(f"-> Pomyślnie wyciągnięto {len(all_rows)} wierszy z PDF.")
    return all_rows

# --- 2. LOGIKA TRANSFORMACJI (CLEAN-UP) ---

def normalize_price(price_string: str) -> float:
    # Funkcja do czyszczenia ceny (działała poprawnie)
    if not price_string: return 0.00
    price_clean = str(price_string).lower().replace("zł", "").replace("pln", "").replace(" ", "").replace("*", "").replace("(", "").replace(")", "").strip()
    if price_clean.count(',') == 1 and price_clean.count('.') == 0:
        price_clean = price_clean.replace(",", ".")
    if price_clean.count('.') > 1:
        price_clean = price_clean.replace('.', '', price_clean.count('.') - 1)
    try: return round(float(price_clean), 2)
    except ValueError: return 0.00


def transform_malopolska_data(raw_data: List[List[Any]], rok: int, url_source: str) -> List[Dict[str, Any]]:
    """Przekształca surowe dane do ustrukturyzowanej listy słowników, z elastycznym mapowaniem kolumn."""
    transformed_records = []
    
    for row in raw_data:
        # Tabula-py potrafi zwrócić różną liczbę kolumn. Sprawdzamy, gdzie są kluczowe dane.
        # W uchwałach małopolskich dane są typowo w kolumnach: 1(Powiat), 2(Nazwa/Adres), 3(Typ), 4(Koszt)
        
        # Pamiętaj, że tabula-py może dodać kolumnę o indeksie 0, lub złączyć adres z nazwą.
        
        # Ustalenie, która kolumna zawiera Cenę (najważniejsze)
        koszt_col_index = -1
        for i in range(len(row) - 1, 0, -1):
             if normalize_price(str(row[i])) > 0:
                 koszt_col_index = i
                 break
        
        if koszt_col_index == -1: continue # Pomijaj wiersze bez ceny

        # Ustalenie pozostałych kolumn na podstawie pozycji Kosztu (Heurystyka)
        koszt_tekstowy = str(row[koszt_col_index]).strip()
        typ_opieki = str(row[koszt_col_index - 1]).strip() if koszt_col_index > 0 else ""
        nazwa_i_adres = str(row[koszt_col_index - 2]).strip() if koszt_col_index > 1 else ""
        powiat = str(row[koszt_col_index - 3]).strip() if koszt_col_index > 2 else ""

        # Uproszczona filtracja, jeśli dane są w złym miejscu (np. Powiat=nan)
        if str(powiat).lower() == 'nan' or not powiat:
             continue 

        # Logika separacji Nazwy od Adresu
        if ',' in nazwa_i_adres:
            nazwa = nazwa_i_adres.split(',', 1)[0].strip()
            adres = nazwa_i_adres.split(',', 1)[-1].strip()
        else:
            nazwa = nazwa_i_adres
            adres = ""
            
        placowka_id = f"{powiat.replace(' ', '_').lower()}_{nazwa.replace(' ', '_').lower()}"
        
        transformed_records.append({
            "Rok_Danych": rok,
            "ID_Placowki": placowka_id,
            "Powiat": powiat,
            "Nazwa_Placowki": nazwa,
            "Adres_Pelny": adres,
            "Typ_Opieki": typ_opieki,
            "Cena_Num": normalize_price(koszt_tekstowy),
            "URL_Zrodlo": url_source,
            "Status_Weryfikacji": "Oczekuje_Walidacji_Ceny", 
        })
        
    return transformed_records

# --- 3. EKSPORT DANYCH ---

def export_to_csv(data: List[Dict[str, Any]], filename: str):
    """Eksportuje przetworzone dane do pliku CSV."""
    if not data: print("Brak danych do eksportu."); return

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES, delimiter=';')
        writer.writeheader()
        writer.writerows(data)
    
    print(f"\n✅ Sukces: {len(data)} rekordów wyeksportowano do {filename}")

# --- URUCHOMIENIE SKRYPTU ---
if __name__ == "__main__":
    
    print("--- Uruchamianie Modułu Parsowania PDF (tabula-py) ---")
    
    # KROK 1: Wyciągnięcie danych z PDF
    raw_data_rows = extract_raw_data_from_pdf(INPUT_FILE_PDF)

    if raw_data_rows:
        # KROK 2: Transformacja i czyszczenie
        final_data = transform_malopolska_data(raw_data_rows, ROK_DANYCH, URL_UCHWALY)
        
        # KROK 3: Eksport do CSV
        export_to_csv(final_data, OUTPUT_FILE_CSV)
        
        print("\n--- Weryfikacja (próbka) ---")
        for record in final_data[:5]:
             print(f"  > Powiat: {record['Powiat']}, Placówka: {record['Nazwa_Placowki']}, Cena: {record['Cena_Num']}")