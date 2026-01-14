import re
import json

# Wczytaj plik
with open('paths-output.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Wyciągnij wszystkie regiony używając regex
regions = []
pattern = r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*d:\s*'([^']+)'\s*\}"

for match in re.finditer(pattern, content, re.DOTALL):
    region_id = match.group(1)
    name = match.group(2)
    d = match.group(3)
    
    # Oblicz prosty centroid (środek bounding box)
    coords = re.findall(r'(-?\d+\.?\d*)', d)
    coords = [float(c) for c in coords]
    
    x_coords = coords[::2]
    y_coords = coords[1::2]
    
    centroid_x = (min(x_coords) + max(x_coords)) / 2
    centroid_y = (min(y_coords) + max(y_coords)) / 2
    
    # Określ status
    active = (region_id == 'PL-MA')
    upcoming = (region_id == 'PL-SL')
    
    regions.append({
        'id': region_id,
        'name': name,
        'd': d,
        'centroid': {'x': round(centroid_x, 2), 'y': round(centroid_y, 2)},
        'active': active,
        'upcoming': upcoming
    })

# Generuj TypeScript kod
print('export interface Region {')
print('  id: string;')
print('  name: string;')
print('  d: string;')
print('  centroid: { x: number; y: number };')
print('  active?: boolean;')
print('  upcoming?: boolean;')
print('}')
print('')
print('export const POLAND_REGIONS: Region[] = [')

for i, region in enumerate(regions):
    comma = ',' if i < len(regions) - 1 else ''
    
    print('  {')
    print(f"    id: '{region['id']}',")
    print(f"    name: '{region['name']}',")
    print(f"    d: '{region['d']}',")
    print(f"    centroid: {{ x: {region['centroid']['x']}, y: {region['centroid']['y']} }}", end='')
    
    if region['active']:
        print(',')
        print('    active: true', end='')
    elif region['upcoming']:
        print(',')
        print('    upcoming: true', end='')
    
    print()
    print(f'  }}{comma}')

print('];')

print(f'\n// Wygenerowano {len(regions)} województw')