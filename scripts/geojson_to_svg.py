# -*- coding: utf-8 -*-
import json
import os
import urllib.request
import ssl

def download_and_convert():
    # Rozwiązanie problemów z certyfikatami SSL na macOS
    context = ssl._create_unverified_context()

    # Ustalanie ścieżek projektu
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_path = os.path.join(project_root, 'src', 'data', 'malopolskie-counties.ts')

    # Adres pliku GeoJSON z powiatami całej Polski (od jusuff)
    url = "https://raw.githubusercontent.com/jusuff/PolandGeoJson/main/data/poland.counties.json"
    
    print(f"--- START ---")
    print(f"Pobieranie danych z: {url}...")
    
    try:
        with urllib.request.urlopen(url, context=context) as response:
            all_data = json.loads(response.read().decode())
    except Exception as e:
        print(f"!!! BŁĄD POBIERANIA: {e}")
        return

    # Filtrowanie: Szukamy powiatów z małopolskiego (TERC zaczyna się od 12)
    malopolska_features = []
    for f in all_data['features']:
        props = f['properties']
        terc_code = str(props.get('terc', ''))
        
        if terc_code.startswith('12'):
            malopolska_features.append(f)

    if not malopolska_features:
        print("!!! BŁĄD: Nie znaleziono powiatów dla Małopolski.")
        return

    print(f"Znaleziono {len(malopolska_features)} powiatów. Przeliczam koordynaty...")

    # Obliczanie granic mapy (viewBox)
    all_coords = []
    for f in malopolska_features:
        geom = f['geometry']
        if geom['type'] == 'Polygon':
            polys = [geom['coordinates'][0]]
        else:
            polys = [p[0] for p in geom['coordinates']]
        for poly in polys:
            all_coords.extend(poly)

    min_x = min(p[0] for p in all_coords)
    max_x = max(p[0] for p in all_coords)
    min_y = min(p[1] for p in all_coords)
    max_y = max(p[1] for p in all_coords)

    # Parametry SVG
    width = 600
    scale = width / (max_x - min_x)
    height = (max_y - min_y) * scale

    counties_ts = []
    for f in malopolska_features:
        props = f['properties']
        geom = f['geometry']
        polygons = geom['coordinates'] if geom['type'] == 'Polygon' else [p[0] for p in geom['coordinates']]
        
        paths = []
        c_x, c_y, total_p = 0, 0, 0
        
        for poly in polygons:
            path_parts = []
            for i, p in enumerate(poly):
                x = (p[0] - min_x) * scale
                y = height - (p[1] - min_y) * scale
                path_parts.append(f"{'M' if i==0 else 'L'}{x:.2f},{y:.2f}")
                c_x += x; c_y += y; total_p += 1
            paths.append(" ".join(path_parts) + "Z")

        counties_ts.append({
            "id": str(props.get('terc', '')),
            "name": props.get('name', 'Nieznany'),
            "centroid": {
                "x": c_x/total_p if total_p > 0 else 0, 
                "y": c_y/total_p if total_p > 0 else 0
            },
            "d": " ".join(paths)
        })

    # Zapis pliku wyjściowego .ts
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("/* eslint-disable */\n")
            f.write("export const MALOPOLSKIE_COUNTIES = " + json.dumps(counties_ts, indent=2, ensure_ascii=False) + ";\n")
            f.write(f"export const MAP_META = {{ viewBox: '0 0 {width} {height:.2f}' }};\n")
        
        print(f"--- SUKCES ---")
        print(f"Wygenerowano: {output_path}")
        print(f"Liczba powiatów: {len(counties_ts)}")
    except Exception as e:
        print(f"!!! BŁĄD ZAPISU: {e}")

if __name__ == "__main__":
    download_and_convert()