# ✅ Update Checklist - Marzec 2026

**Cel:** Zaktualizować wszystkie ceny na rok 2026 w < 4 godziny  
**Data target:** Marzec 2026  
**Województwo:** Śląskie

---

## 📋 PRE-UPDATE (Styczeń-Luty 2026)

### Tydzień 1-2 (Styczeń):
- [ ] Przeczytaj `ZRODLA.md` - odśwież pamięć
- [ ] Sprawdź które MOPSy już publikują ceny 2026
- [ ] Lista bookmarków do wszystkich źródeł BIP
- [ ] Test: czy wszystkie linki działają?
- [ ] Backup: `cp placowki.csv placowki-2025-backup.csv`

### Tydzień 3-4 (Luty):
- [ ] Monitor publikacji (check co 2-3 dni):
  - [ ] BIP powiatu tarnogórskiego
  - [ ] BIP powiatu katowickiego
  - [ ] BIP powiatu gliwickiego
  - [ ] BIP powiatu bytomskiego
  - [ ] BIP powiatu bielskiego
  - [ ] BIP powiatu cieszyńskiego
- [ ] Gdy znajdziesz nową cenę → od razu note w spreadsheet

---

## 🎯 UPDATE PROCESS (Marzec 2026)

### STEP 1: Przygotowanie (15 min)
- [ ] Otwórz `ZRODLA.md`
- [ ] Otwórz `placowki.csv` 
- [ ] Otwórz spreadsheet do tracking (Google Sheets)
- [ ] Timer START ⏱️

### STEP 2: Źródła BIP (priorytet 1) - TARGET: 1h
```
Dla każdej placówki z BIP:
1. Wejdź na link z zrodlo_link
2. Szukaj document 2026 (zmień rok w URL)
3. Znajdź cenę (użyj zrodlo_szczegoly jako guide)
4. Update w CSV
5. Note: data_pobrania = 2026-03-XX
```

Placówki z BIP:
- [ ] DPS Przyjaźń (tarnogórski) - `https://bip.tarnowskiegory.pl/...`
- [ ] [Dodaj tutaj wszystkie placówki z typem BIP-Uchwała z ZRODLA.md]

**Progress:** ___/[X] placówek (___%)

### STEP 3: Źródła Email (priorytet 2) - TARGET: 1h
```
Dla każdej placówki Email:
1. Wyślij email z szablonem (patrz niżej)
2. Wait 2-3 dni na odpowiedź
3. Jak dostaniesz → update CSV
4. Jeśli brak odpowiedzi → telefon (backup)
```

Email template:
```
Temat: Zapytanie o cennik DPS/ŚDS 2026

Dzień dobry,

W zeszłym roku kontaktowałem/am się w sprawie cen 
pobytu w [NAZWA PLACÓWKI].

Czy mógłbym prosić o aktualne ceny na rok 2026?

Dziękuję,
Szymon
kompaseniora.pl
```

Placówki Email:
- [ ] ŚDS Nadzieja - `a.nowak@mops.katowice.pl`
- [ ] [Dodaj tutaj wszystkie placówki z typem Email z ZRODLA.md]

**Progress:** ___/[Y] placówek (___%)

### STEP 4: Źródła WWW (priorytet 3) - TARGET: 45min
```
Dla każdej placówki Strona-WWW:
1. Wejdź na stronę
2. Szukaj sekcji "Cennik" / "Opłaty"
3. Sprawdź czy zaktualizowane na 2026
4. Update CSV
```

Placówki WWW:
- [ ] ŚDS Senior+ - `https://senior-plus.bytom.pl/cennik`
- [ ] [Dodaj tutaj wszystkie placówki z typem Strona-WWW z ZRODLA.md]

**Progress:** ___/[Z] placówek (___%)

### STEP 5: Telefon (ostateczność) - TARGET: 1h
```
Dla trudnych przypadków:
1. Dzwoń rano (9-11)
2. Pytaj o "opłatę za pobyt 2026"
3. Notuj kto odpowiedział
4. Update CSV + kontakt_notatki
```

Placówki Telefon:
- [ ] DPS Słoneczny - `+48 32 888 77 66` (Pani Ewa, 9-11)
- [ ] [Dodaj tutaj wszystkie placówki z typem Telefon z ZRODLA.md]

**Progress:** ___/[W] placówek (___%)

### STEP 6: Weryfikacja (30 min)
- [ ] Sprawdź CSV - czy wszystkie ceny updated?
- [ ] Check outliers (ceny +/- 30% vs 2025 = podejrzane!)
- [ ] Test import do bazy
- [ ] Verify że strona działa

---

## ⏱️ TIME TRACKING

| Etap | Target | Actual | Notes |
|------|--------|--------|-------|
| Przygotowanie | 15 min | ___ min | |
| BIP sources | 60 min | ___ min | |
| Email sources | 60 min | ___ min | |
| WWW sources | 45 min | ___ min | |
| Telefon | 60 min | ___ min | |
| Weryfikacja | 30 min | ___ min | |
| **TOTAL** | **4h 30min** | **___ h ___ min** | |

**✅ SUCCESS jeśli < 4h!**  
**⚠️ OK jeśli 4-6h**  
**❌ Problem jeśli > 6h** (trzeba poprawić proces)

---

## 🚨 PROBLEMY & BACKUP PLANS

### Problem: Źródło BIP nie opublikowało cen 2026
**Backup:**
1. Check czy opublikowali gdzie indziej (strona MOPS)
2. Email do MOPS
3. Telefon do księgowości placówki
4. Assume +5% vs 2025 (jako temporary, mark jako "UNVERIFIED")

### Problem: Link nie działa (404)
**Backup:**
1. Szukaj w Google: "[nazwa placówki] cennik 2026"
2. Check archive.org dla starego linka
3. Kontakt bezpośredni (email/telefon)

### Problem: Brak odpowiedzi na email po 5 dniach
**Backup:**
1. Telefon
2. Jeśli brak odpowiedzi → assume old price + note

### Problem: Nowa struktura PDF/strony
**Backup:**
1. Ręcznie znajdź cenę
2. Update `zrodlo_szczegoly` w CSV
3. Note w ZRODLA.md dla przyszłości

---

## 📊 POST-UPDATE

### Immediately After:
- [ ] Commit CSV do git
- [ ] Import do bazy danych
- [ ] Test że search działa
- [ ] Deploy to production

### Lessons Learned (wypełnij!):
```
Co poszło dobrze:
- 
- 

Co było trudne:
- 
- 

Które źródła zmieniły format:
- 
- 

Ile czasu zajęło:
- Total: ___ h ___ min
- Per placówka average: ___ min

Improvements dla 2027:
- 
- 

Would I repeat this process? YES / NO / MAYBE
If NO or MAYBE, why?
- 
```

---

## 🎯 SUCCESS METRICS

**Minimum viable:**
- [ ] 90%+ placówek ma ceny 2026
- [ ] Update zajął < 8h
- [ ] Zero krytycznych błędów

**Target:**
- [ ] 95%+ placówek ma ceny 2026
- [ ] Update zajął < 4h
- [ ] Proces jest powtarzalny

**Excellent:**
- [ ] 100% placówek ma ceny 2026
- [ ] Update zajął < 3h
- [ ] 50%+ automatyczne (BIP nie zmieniło formatu)

---

**KONIEC CHECKLIST**

*Zapisz jako: `raw_dane/[wojewodztwo]/UPDATE-CHECKLIST-2026.md`*  
*Wypełnij podczas update w marcu 2026!*