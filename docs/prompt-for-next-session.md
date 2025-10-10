# 🚀 Prompt dla następnej sesji - kompaseniora.pl

Skopiuj i wklej to na początku nowej sesji z Claude:

---

## 📋 CONTEXT DLA CLAUDE

```
Kontynuujemy projekt kompaseniora.pl - wyszukiwarka domów opieki dla seniorów.

OSTATNIA SESJA (2025-10-10):
✅ Zaimplementowaliśmy kompletny system autocomplete dropdown
✅ Multi-filter search (województwo, powiat, typ placówki)
✅ Partial search dla "Pokaż wszystkie"
✅ Keyboard navigation (↓↑ Enter ESC)
✅ Tooltips z wyjaśnieniami DPS/ŚDS
✅ Wszystkie testy passed (5/5)

AKTUALNY STAN:
- 13,833 lokalizacji TERYT (Małopolskie)
- 32 placówki (tylko Małopolskie)
- 0 placówek Śląskie (TERYT jest, brak placówek)
- Autocomplete w 100% funkcjonalny
- Console.logi aktywne (celowo - dla debugowania)

TECH STACK:
- Next.js 15 + TypeScript + Prisma
- SQLite (dev.db)
- Tailwind CSS
- React Leaflet

KLUCZOWE PLIKI:
- app/api/teryt/suggest/route.ts (autocomplete API)
- src/components/hero/HeroSection.tsx (search UI)
- app/search/page.tsx (search results)
- docs/lessons-learned-autocomplete.md (WAŻNE - przeczytaj!)

WAŻNE TECHNICAL DETAILS (z lessons learned):
1. Mapowanie województw: 'malopolskie' → 'małopolskie' (polskie znaki!)
2. Click handlers w dropdown: onMouseDown, nie onClick
3. Partial search: param partial=true dla "Pokaż wszystkie"
4. Debounce 300ms, minimum 2 znaki

PRZED ROZPOCZĘCIEM NOWYCH ZMIAN:
1. Przeczytaj docs/lessons-learned-autocomplete.md
2. Sprawdź aktualny stan bazy: sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Placowka;"
3. Potwierdź czy wszystko działa: npm run dev

NAJBLIŻSZE ZADANIA (ROADMAP):
Priorytet 1: Import danych Śląskie
- raw_dane/slaskie/linki do danych.txt
- CSV/XLS → Prisma import
- Test autocomplete z 2 województwami

Priorytet 2: Cleanup przed produkcją
- Usuń console.logi (opcjonalne - na razie zostaw)
- Error handling improvements
- Environment variables

Priorytet 3: UX improvements
- Animacje fade-in/out
- Mobile optimization
- SEO meta tags

NIE ZMIENIAJ bez pytania:
- Mapowanie województw (działa!)
- onMouseDown w dropdown (działa!)
- Partial search logic (działa!)
- getPluralForm function (polska gramatyka)

PYTAJ UŻYTKOWNIKA gdy:
- Niepewność co do designu/UX
- Zmiany mogą wpłynąć na istniejącą funkcjonalność
- Decyzje dotyczące danych/importu
- Wybór między opcjami równoważnymi

DEVELOPMENT WORKFLOW:
- Krok po kroku (nie zakładaj że poprzedni krok się udał)
- Commit często, dobre opisy
- Testuj przed następnym krokiem
- git push po każdej większej zmianie

GIT:
- Repository: https://github.com/Kaczor4444/kompas-seniora
- Branch: main
- Ostatni commit: c165ad3

PYTANIE NA START:
Co robimy dzisiaj? 
- Import Śląskie?
- Nowa funkcja?
- Bugfix?
- Coś innego?
```

---

## 🎯 OPCJONALNIE - Jeśli chcesz konkretnie nad czymś pracować:

Dodaj na końcu:

```
DZISIAJ CHCĘ:
[Wpisz tutaj co chcesz zrobić, np:]
- Zaimportować placówki ze Śląskiego
- Dodać filtr po cenie
- Poprawić mobile UI
- Coś innego...
```

---

## 💡 TIPS:

1. **Zawsze** dołącz plik `docs/lessons-learned-autocomplete.md` do Project Knowledge
2. Jeśli Claude pyta o coś co jest w lessons learned → przypomnij mu że ma przeczytać
3. Przy bugach przypominaj: "Sprawdź lessons learned - może ten problem już rozwiązywaliśmy"
4. Nowe lessons learned dodawaj do tego samego pliku (sekcja po sekcji)

---

**Zapisz to jako:** `docs/prompt-for-next-session.md`

**Na początku następnej sesji:**
1. Otwórz nowy chat z Claude
2. Skopiuj całą sekcję "CONTEXT DLA CLAUDE" 
3. Wklej jako pierwszą wiadomość
4. Upewnij się że `lessons-learned-autocomplete.md` jest w Project Knowledge
5. Let's go! 🚀
