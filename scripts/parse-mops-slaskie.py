#!/usr/bin/env python3
"""
Parsuje PDF z wykazem OPS województwa śląskiego → CSV.
Źródło: raw_dane/slaskie/ops_slaskie.pdf
Wynik:  raw_dane/slaskie/ops_slaskie.csv

Uruchomienie:
  python3 scripts/parse-mops-slaskie.py
"""
import re
import csv
import sys
import pypdf

PDF_PATH = 'raw_dane/slaskie/ops_slaskie.pdf'
CSV_PATH = 'raw_dane/slaskie/ops_slaskie.csv'

POWIATY_GRODZKIE = [
    'Bielsko-Biała', 'Bytom', 'Chorzów', 'Częstochowa', 'Dąbrowa Górnicza',
    'Gliwice', 'Jastrzębie-Zdrój', 'Jaworzno', 'Katowice', 'Mysłowice',
    'Piekary Śląskie', 'Ruda Śląska', 'Rybnik', 'Siemianowice Śląskie',
    'Sosnowiec', 'Świętochłowice', 'Tychy', 'Zabrze', 'Żory',
]
POWIATY_ZIEMSKIE = [
    'będziński', 'bielski', 'bieruńsko-lędziński', 'cieszyński', 'częstochowski',
    'gliwicki', 'kłobucki', 'lubliniecki', 'mikołowski', 'myszkowski',
    'pszczyński', 'raciborski', 'rybnicki', 'tarnogórski', 'wodzisławski',
    'zawierciański', 'żywiecki',
]
# Posortowane malejąco wg długości (greedy match dla wielowyrazowych)
ALL_POWIATY = sorted(POWIATY_GRODZKIE + POWIATY_ZIEMSKIE, key=len, reverse=True)

NAME_KW = ['Centrum Usług', 'Miejsko-Gminny', 'Gminno-Miejski', 'Miejski Ośrodek',
           'Gminny Ośrodek', 'Ośrodek Pomocy', 'Gmina ']

def map_typ(nazwa: str) -> str:
    n = nazwa.lower()
    if 'centrum usług' in n:           return 'CUS'
    if 'miejski ośrodek pomocy rodzinie' in n: return 'MOPS'
    if 'miejski ośrodek' in n:         return 'MOPS'
    if 'miejsko-gminny' in n:          return 'GOPS'
    if 'gminno-miejski' in n:          return 'GOPS'
    if 'gminny ośrodek' in n:          return 'GOPS'
    return 'GOPS'  # plain OPS → GOPS

def parse_record(line: str) -> dict | None:
    line = line.strip()
    if not line:
        return None

    # 1. Wyciągnij email (na końcu)
    em = re.search(r'(\S+@\S+(?:\.\S+)+)\s*$', line)
    if not em:
        return None
    email = em.group(1).rstrip('.')
    line = line[:em.start()].strip()

    # 2. Wyciągnij kod pocztowy jako separator
    pc = re.search(r'\b(\d{2}-\d{3})\b', line)
    if not pc:
        return None
    before_pc = line[:pc.start()].strip()
    postal_code = pc.group(1)
    after_pc   = line[pc.end():].strip()

    # 3. Znajdź powiat
    powiat = None
    rest = before_pc
    for p in ALL_POWIATY:
        if before_pc == p or before_pc.startswith(p + ' '):
            powiat = p
            rest = before_pc[len(p):].strip()
            break
    if not powiat:
        print(f'  ⚠️  Nieznany powiat: "{before_pc[:40]}"', file=sys.stderr)
        powiat = before_pc.split()[0]
        rest = ' '.join(before_pc.split()[1:])

    # 4. Znajdź granicę gmina/nazwa
    gmina = powiat  # domyślnie dla grodzkich
    nazwa = rest
    for kw in NAME_KW:
        idx = rest.find(kw)
        if idx == 0:
            # Grodzkie — gmina = powiat, nazwa od razu
            gmina = powiat
            nazwa = rest
            break
        elif idx > 0:
            gmina = rest[:idx].strip()
            nazwa = rest[idx:].strip()
            break

    # 5. Parsuj część adresową (after_pc)
    # Format: {miejscowosc} [ulica/prefix] {nr} {telefon(y)}
    # Telefony — wzorzec: (XX) NNN-NN-NN lub NNN-NNN-NN lub "575-222 -40" itp.
    phone_pat = re.compile(
        r'(?:\(?\d{2,3}\)?\s+)?[\d]{3,}[\d\s\-]+(?:\s*\(do\s+\d+\))?'
    )
    phones = [m.group().strip() for m in phone_pat.finditer(after_pc)]
    # Usuń numery domów z listy telefonów (te krótkie to numery, nie telefony)
    phones = [p for p in phones if re.search(r'\d{5,}', p.replace(' ', '').replace('-', ''))]
    phone = ' | '.join(phones)

    # Usuń telefony z tekstu adresowego
    addr_text = phone_pat.sub('', after_pc).strip()
    # Usuń wielokrotne spacje
    addr_text = re.sub(r'\s{2,}', ' ', addr_text).strip()

    # Pierwsza "część" to miejscowosc
    # Miejscowość kończy się gdy zaczyna się "ul.", "pl.", "al.", "rynek", "os." lub liczba/litera numeru
    m = re.match(
        r'^([\w\s\-]+?)\s+(ul\.|pl\.|al\.|oś\.|rynek|os\.)\s+(.+)$', addr_text, re.IGNORECASE
    )
    if m:
        miejscowosc = m.group(1).strip()
        ulica_prefix = m.group(2)
        ulica_numer  = m.group(3).strip()
        adres = f"{ulica_prefix} {ulica_numer}"
    else:
        # Brak prefixu — miejscowosc + numer (np. "Jasienica 845")
        parts = addr_text.rsplit(None, 1)
        if len(parts) == 2 and re.match(r'^\d+\w*$', parts[1]):
            miejscowosc = parts[0].strip()
            adres = parts[1]
        else:
            miejscowosc = addr_text
            adres = ''

    return {
        'typ':          map_typ(nazwa),
        'wojewodztwo':  'śląskie',
        'powiat':       powiat,
        'gmina':        gmina,
        'nazwa':        nazwa,
        'kod_pocztowy': postal_code,
        'miejscowosc':  miejscowosc,
        'adres':        adres,
        'telefon':      phone,
        'email':        email,
    }


def main():
    reader = pypdf.PdfReader(PDF_PATH)
    all_lines: list[str] = []

    for page in reader.pages:
        for line in page.extract_text().split('\n'):
            line = line.strip()
            if not line:
                continue
            if 'Powiat Gmina Nazwa' in line:
                continue
            if line.startswith('* aktualne'):
                continue
            all_lines.append(line)

    # Złącz linie multi-phone w jeden rekord
    # (rekord kończy się emailem)
    records_raw: list[str] = []
    buffer = ''
    for line in all_lines:
        if buffer:
            buffer += ' ' + line
        else:
            buffer = line
        if re.search(r'\S+@\S+\.\S+\s*$', buffer):
            records_raw.append(buffer)
            buffer = ''
    if buffer:
        records_raw.append(buffer)

    records = []
    for raw in records_raw:
        r = parse_record(raw)
        if r:
            records.append(r)
        else:
            print(f'  ❌ Nie sparsowano: "{raw[:80]}"', file=sys.stderr)

    print(f'✅ Sparsowano {len(records)} rekordów z {len(reader.pages)} stron')

    fields = ['typ','wojewodztwo','powiat','gmina','nazwa','kod_pocztowy','miejscowosc','adres','telefon','email']
    with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(records)

    print(f'💾 Zapisano do {CSV_PATH}')

    # Podgląd 5 rekordów
    for r in records[:5]:
        print(f"  {r['powiat']:20} | {r['gmina']:20} | {r['typ']:4} | {r['miejscowosc']:20} | {r['email']}")


if __name__ == '__main__':
    main()
