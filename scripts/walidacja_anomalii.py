import pandas as pd
import csv

# --- STAŁE KONFIGURACYJNE ---
# Upewnij się, że ta nazwa pasuje do pliku CSV z 76 rekordami
INPUT_FILE_CSV = "dane_malopolska_2025_OCZYSZCZONE.csv" 
# Ostateczny plik, który będzie Twoim Wzorcem (Blueprint)
OUTPUT_FILE_CSV_VALIDATED = "dane_malopolska_2025_WALIDOWANE_ANOMALIE.csv" 
DELIMITER = ';'

# Parametry walidacji (możesz je dostosować po analizie)
# 1. Twarde granice: Zbyt niskie/wysokie ceny (w zł)
MIN_PRICE_THRESHOLD = 4000.00 
MAX_PRICE_THRESHOLD = 12000.00 
# 2. Statystyczne odchylenie: Cena jest podejrzana, jeśli odbiega o więcej niż 30% od średniej dla swojego typu opieki
DEVIATION_THRESHOLD = 0.30 

# --- LOGIKA WALIDACJI ---

def validate_prices(df: pd.DataFrame) -> pd.DataFrame:
    """Sprawdza ceny pod kątem anomalii i dodaje kolumnę walidacyjną."""
    
    # Inicjalizacja statusu dla wszystkich rekordów
    df['Status_Weryfikacji'] = 'OK'
    
    # Krok 1: Walidacja twardego zakresu (np. 1 zł lub 50000 zł)
    df.loc[
        (df['Cena_Num'] < MIN_PRICE_THRESHOLD) | 
        (df['Cena_Num'] > MAX_PRICE_THRESHOLD), 
        'Status_Weryfikacji'
    ] = 'ANOMALIA_CENA_ZAKRES'

    # Krok 2: Walidacja statystyczna (na podstawie Typu Opieki)
    
    # 1. Obliczanie statystyk (średnia i odchylenie) dla każdego Typu Opieki
    stats = df.groupby('Typ_Opieki')['Cena_Num'].agg(['mean', 'std']).reset_index()
    stats.columns = ['Typ_Opieki', 'Cena_Srednia_Typ', 'Cena_Std_Typ']
    
    # 2. Łączenie statystyk
    df = pd.merge(df, stats, on='Typ_Opieki', how='left')
    
    # 3. Obliczanie progu odchylenia (np. Średnia +/- 30%)
    df['Cena_Gorna_Granica'] = df['Cena_Srednia_Typ'] * (1 + DEVIATION_THRESHOLD)
    df['Cena_Dolna_Granica'] = df['Cena_Srednia_Typ'] * (1 - DEVIATION_THRESHOLD)

    # 4. Flagowanie anomalii statystycznej (tylko tych, które przeszły Krok 1)
    df.loc[
        (df['Status_Weryfikacji'] == 'OK') & 
        ((df['Cena_Num'] < df['Cena_Dolna_Granica']) | 
         (df['Cena_Num'] > df['Cena_Gorna_Granica'])), 
        'Status_Weryfikacji'
    ] = 'ANOMALIA_CENA_STATYSTYCZNA'

    # Usuń kolumny pomocnicze przed zapisem
    df = df.drop(columns=['Cena_Srednia_Typ', 'Cena_Std_Typ', 'Cena_Gorna_Granica', 'Cena_Dolna_Granica'])

    return df

# --- URUCHOMIENIE SKRYPTU ---
if __name__ == "__main__":
    
    print("--- Moduł 3: Uruchamianie Walidacji Anomali Ceny ---")
    
    try:
        df_input = pd.read_csv(INPUT_FILE_CSV, sep=DELIMITER)
    except FileNotFoundError:
        print(f"BŁĄD: Plik wejściowy {INPUT_FILE_CSV} nie znaleziony. Upewnij się, że plik z 76 rekordami jest na miejscu.")
        exit()
    
    # Walidacja
    df_validated = validate_prices(df_input)
    
    # Eksport
    df_validated.to_csv(OUTPUT_FILE_CSV_VALIDATED, sep=DELIMITER, index=False, quoting=csv.QUOTE_MINIMAL)
    
    anomalies = df_validated[df_validated['Status_Weryfikacji'].str.contains('ANOMALIA')]
    
    print(f"\n✅ SUKCES: Walidacja zakończona. {len(df_validated)} rekordów przetworzono.")
    print(f"Znaleziono {len(anomalies)} rekordów oznaczonych jako ANOMALIA.")
    print(f"Plik Blueprint/Wzorzec: {OUTPUT_FILE_CSV_VALIDATED}")
    
    # Weryfikacja anomalii
    print("\n--- Rekordy wymagające ręcznej weryfikacji (TOP 10) ---")
    if not anomalies.empty:
        print(anomalies[['Powiat', 'Nazwa_Placowki', 'Typ_Opieki', 'Cena_Num', 'Status_Weryfikacji']].head(10).to_markdown(index=False, numalign="left", stralign="left"))
    else:
        print("Brak anomalii w tych 76 rekordach!")