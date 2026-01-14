# -*- coding: utf-8 -*-
import pandas as pd
import json
from shapely.geometry import Point, shape
import os

def map_facilities():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Ścieżki dopasowane do Twojej struktury src/data
    geojson_path = os.path.join(project_root, 'src', 'data', 'malopolskie-counties.geojson')
    facilities_path = os.path.join(project_root, 'src', 'data', 'placowki.csv')
    output_path = os.path.join(project_root, 'src', 'data', 'placowki_z_powiatami.csv')

    print(f"--- START MAPOWANIA (BEZ GEOPANDAS) ---")
    
    if not os.path.exists(geojson_path):
        print(f"!!! BŁĄD: Brak pliku GeoJSON w {geojson_path}")
        return
    if not os.path.exists(facilities_path):
        print(f"!!! BŁĄD: Brak pliku CSV w {facilities_path}")
        return

    # 1. Wczytaj granice powiatów z GeoJSON
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    counties = []
    for feature in geojson_data['features']:
        # Pobieramy nazwę (obsługujemy różne formaty kluczy)
        props = feature['properties']
        name = props.get('name') or props.get('JPT_NAZWA_') or props.get('nazwa')
        
        counties.append({
            'name': name,
            'polygon': shape(feature['geometry']) # Zamiana JSON na obiekt geograficzny
        })

    # 2. Wczytaj placówki
    df = pd.read_csv(facilities_path)
    
    # Funkcja sprawdzająca punkt w wielokącie
    def find_county(row):
        try:
            # Tworzymy punkt z lat/lng (upewnij się, że takie masz nagłówki w CSV!)
            p = Point(float(row['lng']), float(row['lat']))
            for county in counties:
                if county['polygon'].contains(p):
                    return county['name']
        except Exception as e:
            return None
        return "Poza Małopolską"

    print(f"Przetwarzam {len(df)} placówek...")
    df['powiat_nazwa'] = df.apply(find_county, axis=1)

    # 3. Zapisz wynik
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"--- SUKCES: Wynik zapisano w {output_path} ---")

if __name__ == "__main__":
    map_facilities()