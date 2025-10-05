# kompaseniora.pl - Project Blueprint

## Executive Summary

**Projekt:** Transparentna wyszukiwarka publicznych domów pomocy społecznej z kalkulatorem kosztów  
**Właściciel:** Szymon  
**Domena:** kompaseniora.pl  
**Target:** Opiekunowie 30-50 lat + seniorzy 60+ szukający opieki  
**Unikalna pozycja:** Jedyna strona z oficjalnymi cenami DPS/SDS + kalkulatorem kosztów  

---

## 1. Problem & Solution

### Problem
- Rodziny muszą przeszukiwać dziesiątki PDFów z różnych powiatów
- Brak transparentności cen publicznych domów pomocy społecznej
- Chaos informacyjny - mieszanie publicznych i prywatnych placówek
- Brak narzędzi do planowania kosztów opieki

### Solution
- **Inteligentna wyszukiwarka:** Wpisz "Kamienica" → system znajdzie powiat limanowski
- **TERYT integration:** Rozpoznawanie miejscowości bez znajomości struktur administracyjnych
- Centralna wyszukiwarka wszystkich DPS/SDS w regionie
- Transparentne koszty z oficjalnych źródeł (MOPS)
- Kalkulator planowania budżetu opieki
- Edukacja o różnicach publiczne vs prywatne
- Geolokalizacja - "znajdź najbliżej mnie"

---

## 2. Market Analysis

### Konkurencja
| Portal | Focus | Słabe punkty |
|--------|-------|-------------|
| KRDO.pl | Rejestr branżowy | Nie user-friendly, brak cen |
| DomySeniora.pl | Content marketing | Brak transparentności cen |
| GodneLata.pl | Katalog ogólny | Przestarzały UX, mieszają publiczne z prywatnymi |

### Blue Ocean Strategy
**Tworzymy nową kategorię:** "Inteligentna wyszukiwarka publicznych domów pomocy społecznej"
- **TERYT integration:** Jedyni którzy rozumieją "Kamienica koło Limanowej" 
- **Przewaga nad konkurencją:** GodneLata/KRDO wymagają znajomości powiatów
- Nikt nie oferuje kalkulatora kosztów DPS
- Nikt nie separuje jasno publicznych od prywatnych
- Nikt nie ma oficjalnych danych cenowych z MOPSów

---

## 3. Tech Stack & Architecture

### Frontend
- **Next.js 14+** (React + API routes)
- **Tailwind CSS** - mobile-first design
- **TypeScript** - dla lepszej maintainability

### Backend & Data
- **SQLite** (start) → **PostgreSQL** (skala)
- **Prisma ORM** - zarządzanie schematem bazy
- **CSV import** - aktualizacja danych z MOPSów

### Hosting & Deployment
- **Vercel** - automatyczne deployment z GitHub (Free tier: 100GB bandwidth, unlimited builds)
- **Domain:** kompaseniora.pl
- **Analytics:** Google Analytics 4, Vercel Analytics (included in free)
- **Error tracking:** Sentry (free tier: 5k errors/month)
- **Performance:** Vercel Web Vitals monitoring (included)

### Key Libraries
- **React Hook Form** - formularze wyszukiwania
- **Leaflet/MapBox** - mapy z geolokalizacją
- **Chart.js** - wizualizacje w kalkulatorze
- **TERYT Libraries:**
  - `teryt-database-js` - offline baza TERYT
  - `fuse.js` - fuzzy search dla miejscowości
  - GUS API - aktualizacje bazy TERYT

---

## 4. Data Structure

### Placówki (CSV→DB)

id: unique identifier
nazwa: string
typ_placowki: "DPS" | "SDS" | "DPS/SDS"
prowadzacy: string
adres: {
ulica: string,
miejscowosc: string,
kod_pocztowy: string,
gmina: string,
powiat: string,
wojewodztwo: string
}
teryt: {
gmina_kod: string,
gmina_nazwa: string,
powiat_kod: string,
powiat_nazwa: string,
wojewodztwo_kod: string
}
geo: {lat: number, lng: number}
kontakt: {telefon, email, www}
miejsca: {liczba_miejsc, profil_opieki}
koszt_pobytu: number (PLN)
data_aktualizacji: date
zrodlo: string (link do PDF)

### TERYT Integration

- **Baza TERYT:** GUS API lub offline database
- **Fuzzy search:** Użytkownik wpisuje "Kamienica" → system znajdzie gmina Kamienica, powiat limanowski
- **Geolokalizacja:** "Znajdź najbliżej mnie" → TERYT + współrzędne GPS

### Aktualizacja danych
- **Częstotliwość:** Raz na rok (styczeń)
- **Źródła:** Oficjalne PDFy z powiatowych MOPSów
- **Proces:** Ręczne zbieranie → CSV → import do bazy

---

## 5. MVP Features (Małopolska)

### Core Functionality
1. **Inteligentna wyszukiwarka placówek**
   - **TERYT fuzzy search:** "Wpisz gdzie mieszka Twój bliski"
   - Auto-complete miejscowości z całej Małopolski
   - "Kamienica" → automatycznie powiat limanowski
   - Filtr po typie placówki (DPS/SDS)
   - Filtr po profilu opieki
   - Filtr po zakresie cenowym

2. **Mapa interaktywna z TERYT**
   - Geolokalizacja użytkownika + najbliższa gmina TERYT
   - "Znajdź najbliżej miejsca X" 
   - Pinezki z podstawowymi info + odległość

3. **Karty placówek**
   - Kontakt, adres, koszt
   - "Odległość od [wpisana miejscowość]"
   - Link do Google Maps
   - "Zadzwoń teraz" (mobile)

4. **Kalkulator podstawowy**
   - Wybór typu opieki
   - Orientacyjna lokalizacja
   - Wynik: zakres cenowy

### Content & SEO
- **Poradnik:** "Jak załatwić miejsce w DPS"
- **Porównania:** Publiczne vs prywatne koszty
- **FAQ:** Najczęstsze pytania o DPS/SDS

---

## 6. Advanced Features (Roadmap)

### Kalkulator zaawansowany (Lead Magnet)
- Szczegółowe potrzeby opieki
- Dodatkowe koszty (transport, wizyty)
- Personalizowany budżet → email

### Dostępność miejsc
- Partnerstwa z placówkami
- Status: dostępne/lista oczekujących
- Powiadomienia o wolnych miejscach

### Rozszerzenie geograficzne
1. **Faza 2:** Śląskie + Małopolskie
2. **Faza 3:** Cała Polska południowa
3. **Faza 4:** Wersja dla Polonii

### Monetyzacja
- Partnerstwa z prywatnymi domami opieki
- Sponsorowane artykuły o gadżetach dla seniorów
- Premium features dla placówek

---

## 7. UX/UI Strategy

### Mobile-First Design + TERYT UX
- **Grupa docelowa:** 70% będzie używać telefonu
- **Główny flow:** "Gdzie mieszka Twój bliski?" → wpisuje "Kamienica" → Zobacz listę DPS koło Limanowej → Zadzwoń
- **TERYT Magic:** Użytkownik nie musi znać struktur administracyjnych
- **Prostota:** Search input + autocomplete = 1 krok do wyniku

### Key Pages
1. **Homepage:** Hero z inteligentną wyszukiwarką "Wpisz miejscowość..." + value proposition
2. **Wyniki:** "DPS w okolicy miejscowości Kamienica" + lista + mapa + filtry
3. **Placówka:** Karta szczegółowa z kontaktem + "X km od Kamienica"
4. **Kalkulator:** Proste pytania → wynik
5. **Poradnik:** SEO content + lead generation

### Design Principles
- **Czytelność:** Duże fonty, kontrasty
- **Zaufanie:** "Oparte na oficjalnych danych GUS + MOPS"
- **Prostota:** Jeden input field zamiast formularzy z dropdownami
- **TERYT transparency:** "Znalazłem 3 DPS w powiecie limanowskim (najbliżej Kamienica)"

---

---

## 8. SEO & Content Strategy

### Target Keywords
**Primary:**
- "dom pomocy społecznej [miejscowość]" (Kamienica, Zarzecze, Mogilany)
- "ile kosztuje DPS [region]"
- "publiczne domy opieki [miejscowość]"

**Long-tail:**
- "dom opieki Kamienica koło Limanowej"
- "DPS Mogilany krakowski" 
- "jak załatwić miejsce w domu pomocy społecznej"
- "kalkulator kosztów opieki senior"

**TERYT SEO advantage:**
- Konkurencja: "domy opieki krakowski" (powiat)
- My: "dom opieki Zarzecze" (miejscowość) = less competition, higher conversion

### Content Calendar
**Miesiąc 1-3:**
- Poradnik procedur DPS
- Porównania kosztów publiczne vs prywatne
- FAQ dla rodzin

**Miesiąc 4-6:**
- Artykuły regionalne (po powiatach)
- Case studies użytkowników
- Treści dla Polonii

---

## 9. Launch Plan

### Pre-Launch (Miesiąc 1)
- [x] Setup domeny + hosting
- [x] Implementacja MVP
- [ ] Import danych Małopolska
- [ ] Podstawowe SEO content

### Soft Launch (Miesiąc 2)
- [ ] Beta testing z rodziną/znajomymi
- [ ] Podstawowe GA4 + tracking
- [ ] Social media setup
- [ ] Feedback loop

### Public Launch (Miesiąc 3)
- [ ] PR w lokalnych mediach
- [ ] SEO content optimization
- [ ] Outreach do społeczności senioralnych
- [ ] Monitoring konkurencji

---

## 10. Metrics & Success Criteria

### MVP Success Metrics
- **Traffic:** 1000 unique visitors/miesiąc
- **Engagement:** 3+ strony/sesja
- **Conversions:** 50 wywołań telefonicznych/miesiąc
- **SEO:** Top 10 dla 5 target keywords

### Long-term Goals
- **Year 1:** 10k users/miesiąc, pokrycie 3 województw
- **Year 2:** 50k users/miesiąc, wersja dla Polonii
- **Year 3:** Monetyzacja, krajowe pokrycie

---

## 11. Risk Analysis

### Technical Risks
- **Data quality:** Błędy w PDFach MOPSów
- **Scalability:** SQLite → PostgreSQL migration
- **Mobile performance:** Optymalizacja map

### Business Risks
- **Konkurencja:** Kopiowanie przez większych graczy
- **Legal:** Zmiany w przepisach o DPS
- **Seasonality:** Czy zapotrzebowanie jest stałe?

### Mitigation Strategies
- Regularna weryfikacja danych
- Focus na unique value (transparentność + kalkulator)
- Budowanie community przed skalowaniem

---

## 12. Next Steps

### Immediate (Następne 2 tygodnie)
1. [x] **Setup:** Domena + Next.js projekt + GitHub
2. [ ] **Data model:** Prisma schema + CSV import
3. [x] **Core pages:** Homepage + search + results

### Short-term (Miesiąc 1)
1. [ ] **MVP completion:** Wyszukiwarka + mapa + karty
2. [ ] **Content:** 5 kluczowych artykułów SEO
3. [ ] **Testing:** Friends & family beta

### Medium-term (Miesiące 2-3)
1. [ ] **Launch:** Public release + PR
2. [ ] **Optimization:** Based na user feedback
3. [ ] **Scale prep:** Plan for more województw

---

## 13. Development Environment

### Tech Specs
- **Platform:** macOS Monterey 12.0 (M1)
- **Python:** 3.13.2 (latest version, M1 native)
- **Node.js:** v22.20.0 (latest version, M1 native)
- **Git:** 2.30.1 (Apple Git-130)
- **VS Code:** 1.91.1 (Universal)
- **Package manager:** npm (included with Node.js)
- **Terminal:** Built-in Terminal.app

### M1 Specific Considerations
- **Node.js:** Use official installer (auto-detects M1) lub nvm
- **Homebrew:** Use M1 native version (`/opt/homebrew/`)
- **Python dependencies:** Some libraries may need Rosetta 2
- **Performance:** M1 development will be very fast

### Development Setup Commands
```bash
# Check current setup
node --version
npm --version
git --version
python3 --version

# Install if needed
# Node.js: https://nodejs.org
# Git: pre-installed on macOS

14. Core Development Standards
Mobile-First Design (CRITICAL)

Target: 70% użytkowników na telefonie
Breakpoints: Mobile → Tablet → Desktop
Touch targets: Min 44px dla przycisków
Text size: Min 16px (no zoom na iOS)

Accessibility for Seniors

High contrast: Min 4.5:1 ratio
Large fonts: 18px+ dla body text
Simple navigation: Max 3 kliki do celu
Clear error messages: Plain language, no technical jargon

### Security Basics
- **Input validation:** Sanitize wszystkich search queries
- **No sensitive data logs:** Nie logować danych osobowych
- **HTTPS only:** Produkcja tylko z SSL
- **Rate limiting:** Max 100 requests/minute per IP

### Performance Standards
- **Loading time:** <3s na 3G
- **Bundle size:** <300kb JavaScript total
- **Database:** Index wszystkich search fields
- **Images:** Optimize + lazy loading

### Code Quality
- **TypeScript strict mode:** Eliminacja runtime errors
- **Component responsibility:** 1 component = 1 funkcja
- **Error boundaries:** Graceful handling błędów React
- **Consistent naming:** camelCase JS, kebab-case CSS

### SEO Foundations
- **Meta tags:** Title, description każdej strony
- **Semantic HTML:** Proper headings (h1, h2, h3)
- **Alt texts:** Wszystkie obrazy z opisami
- **Sitemap:** Automatyczne generowanie

**Note:** Szczegółowe wytyczne (Advanced SEO, Complex Security) w osobnym dokumencie Standards gdy MVP będzie gotowe.

---

## 15. Terminal Commands Reference

### Project Setup
```bash
# Create and navigate to project folder
mkdir kompas-seniora
cd kompas-seniora

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint

# Install additional dependencies
npm install prisma @prisma/client
npm install fuse.js
npm install leaflet react-leaflet
npm install @types/leaflet

# Initialize Prisma
npx prisma init

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

Git Commands
bash

# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin [repository-url]

# Push to main branch
git push -u origin main

# Check status
git status

# Pull latest changes
git pull

Database Commands (Prisma)
bash

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma db reset

# Migrate database
npx prisma migrate dev --name init

File Operations
bash

# Create new file
touch filename.tsx

# Create new directory
mkdir components

# List files
ls -la

# Navigate directories
cd folder-name
cd ..
cd ~

# Remove file
rm filename.tsx

# Remove directory
rm -rf folder-name

### VS Code Commands
```bash
# Open VS Code in current directory
code .

# Open specific file
code filename.tsx

# Open VS Code with specific folder
code /path/to/project

# Install new package
npm install package-name

# Install dev dependency
npm install -D package-name

# Uninstall package
npm uninstall package-name

# Update packages
npm update

# Check outdated packages
npm outdated

# Install exact version
npm install package-name@1.2.3


# Kill process on port (if dev server stuck)
lsof -ti:3000 | xargs kill -9

# Find process on port
lsof -i :3000

# Stop current command
Ctrl + C

16. Development Collaboration Strategy
Token-Efficient Code Reviews
Problem: Każda sesja debug/refactor może kosztować tysiące tokenów
Efficient Workflow:

Pokazuj konkretny problem zamiast całego pliku
Opisuj oczekiwane zachowanie przed pokazaniem kodu
Pytaj o approach przed implementacją: "Jak zrobiłbyś autocomplete TERYT?"
Self-debugging first: Próbuj sam, potem pokazuj konkretny błąd

### Collaboration Patterns

**Step-by-Step Development:**
1. **Single step instructions** - tylko jeden krok na raz
2. **Wait for confirmation** - screenshot, "działa" lub "nie działa bo X"
3. **Debug current step** przed przejściem do następnego
4. **No assumptions** - nie zakładam że poprzedni krok się udał

**Example Workflow:**

Claude: "Krok 1: Stwórz nowy folder kompas-seniora i wejdź do niego"
User: [screenshot lub "zrobione"]
Claude: "Krok 2: npm create next-app@latest ."
User: "błąd: command not found npm"
Claude: "Najpierw musisz zainstalować Node.js. Idź na nodejs.org..."
User: [po instalacji] "działa, next-app utworzony"
Claude: "Krok 3: ..."

**Zamiast:** "Zrób kroki 1-5, potem powiedz jak poszło"  
**Lepiej:** "Krok 1: X. Potwierdź że działa przed następnym krokiem"

### Preferred Help Format
1. **Diagnosis:** "Co może powodować problem X?"
2. **Guidance:** "Jakie kroki żeby zaimplementować Y?"
3. **Code review:** "Czy ten approach ma sens?" [krótki snippet]
4. **Debugging:** "Błąd Z w linii N, co sprawdzić?"

### When to Share Full Code
- **Initial setup** (boilerplate, config)
- **Complex refactoring** (architecture changes) 
- **Integration issues** (multiple files interaction)

**Benefit:** Uczysz się więcej, płacisz mniej, rozwijasz skills

---




## 17. Development Milestones & Git History

### Commit History
```bash
# Project milestones in chronological order:

91d4352 - Initial commit from Create Next App (27 hours ago)
# Basic Next.js project structure with TypeScript + Tailwind

a89fbc7 - Add Prisma, Fuse.js, and Leaflet dependencies (27 hours ago)  
# Core libraries: database ORM + fuzzy search + maps

30106b4 - Configure SQLite database with TERYT schema (27 hours ago)
# Database schema for placówki with TERYT integration

4e130af - Fix Turbopack permissions issue - disable Turbopack (27 hours ago)
# Development environment troubleshooting

eb54660 - Add CSV import functionality and test data (13 minutes ago)
# Working data pipeline: CSV → Prisma → SQLite
# 2 test records successfully imported
# Ready for frontend development

9b447e4 - Implement working search functionality and complete MVP
# Interactive search with React state management
# Functional API endpoint with filtering capability
# Fixed SQLite compatibility issues
# Responsive UI with clickable phone numbers
# Complete MVP: Frontend ↔ API ↔ Database
# kompaseniora.pl is fully functional

c552516 - Add location search section and newsletter signup (29.09.2025)
# Landing Page - New Sections Added

**Location Search Section:**
- Added "Szukasz w konkretnej lokalizacji?" section with clean white card design
- Implemented DPS/ŚDS toggle tabs for filtering facility types
- Created 3-column grid layout (responsive: 1 col mobile, 3 cols desktop) with 9 major cities:
  - Column 1: Kraków, Limanowa, Nowy Targ
  - Column 2: Nowy Sącz, Wadowice, Oświęcim
  - Column 3: Tarnów, Zakopane, Myślenice
- Added hover effects: arrow icons animate on hover, background color changes
- "Zobacz wszystkie lokalizacje" CTA button with accent color styling

**Newsletter Signup Section:**
- Gradient background (accent-500 to accent-600) for visual impact
- Email capture form with responsive layout (stacked mobile, horizontal desktop)
- White border on input field with semi-transparent background
- White placeholder text that becomes dark when typing
- Privacy-focused copy: "Nie dzielimy się danymi z nikim. Wypisz się kiedy chcesz."
- Black CTA button for contrast against pink gradient

**UI Improvements:**
- Added hover scale animations (scale-105) to category buttons in hero section
- Consistent use of accent colors throughout new sections
- Mobile-first responsive design maintained across all new components

**Files Modified:**
- `app/page.tsx` (467 insertions, 126 deletions)
- `app/globals.css` (color palette refinements)

# Next milestones:
# - TERYT integration for fuzzy location search
# - Interactive maps with geolocation  
# - Cost calculator component
# - More data from Małopolska region
# - Production deployment to Vercel

### Common Development Issues & Solutions

**Data Format Issues:**
- **Problem:** Prisma wymaga ISO-8601 DateTime format dla pól typu `DateTime`
- **Solution:** Użyj `new Date(dateString)` w import scripts zamiast raw string
- **Example:** `data_aktualizacji: record.data_aktualizacji ? new Date(record.data_aktualizacji) : null`

**CSV Import Best Practices:**
- Zawsze sprawdzaj czy plik CSV istnieje przed importem (`fs.existsSync()`)
- Używaj `trim()` dla headers i values żeby usunąć whitespace
- Parsuj numery z `parseInt()` i `parseFloat()` z null checking
- Testuj import na małych plikach przed dużymi dataset

**Polish Characters & Encoding:**
- Upewnij się że CSV pliki są w UTF-8 encoding
- VS Code domyślnie zapisuje w UTF-8, ale sprawdź status bar (dolny prawy róg)
- Jeśli problemy z polskimi znakami: `fs.readFileSync(path, 'utf-8')` zawsze z encoding

**Database Schema Changes:**
- Po zmianie `schema.prisma` zawsze uruchom `npx prisma db push`
- Jeśli błędy walidacji: sprawdź czy typy danych w schema pasują do CSV
- DateTime fields wymagają Date objects, nie strings

---

## 18. Competitive Moat Strategy

### Problem
Landing page musi sprzedawać wartość BEZ pokazywania "jak to działa" konkurencji.

### Zasady Content Strategy

**Golden Rule: Benefits > Methods**

Każdy element public-facing content musi przejść test:
1. **Czy to pokazuje BENEFIT czy METODĘ?**
2. **Czy konkurencja może to skopiować po przeczytaniu?**
3. **Czy user NAPRAWDĘ potrzebuje wiedzieć JAK to działa?**

Odpowiedź na #3 jest prawie zawsze: **NIE**

### Przykłady BAD vs GOOD

❌ **BAD (Landing Page):**
> "Używamy fuzzy search z biblioteką fuse.js i bazy TERYT z GUS"

✅ **GOOD (Landing Page):**
> "Wpisz 'Kamienica' - znajdziemy dom opieki koło Limanowej"

---

❌ **BAD:**
> "Integrujemy się z API TERYT używając kodu gminy i powiatu"

✅ **GOOD:**
> "Nie musisz znać powiatów - po prostu wpisz miejscowość"

---

❌ **BAD:**
> "Scraping'ujemy PDFy z MOPS i normalizujemy dane przez CSV pipeline"

✅ **GOOD:**
> "Oficjalne ceny z urzędów miast - zawsze aktualne"

### Gdzie MOŻNA pokazać metodę

- **Blog posts** dla SEO (ale generyczne: "Jak budować wyszukiwarkę")
- **Dokumentacja techniczna** (zamknięta dla partnerów)
- **Pitch deck** dla inwestorów (NDA)

### Gdzie NIE WOLNO pokazać metody

- ❌ Landing page
- ❌ Marketing copy
- ❌ FAQ publiczne
- ❌ Social media posts
- ❌ Case studies (focus na wyniki, nie process)

### Implementation Checklist

Przed publikacją KAŻDEGO contentu:
- [ ] Usunąłem nazwy technologii (fuse.js, TERYT, Prisma)
- [ ] Skoncentrowałem się na user outcome, nie na procesie
- [ ] Konkurencja czytając to NIE wie jak to zrobić
- [ ] Content brzmi jak magia, nie jak tutorial

**Pamiętaj:** Twoja przewaga to execution + data + TERYT integration. Nie dawaj roadmap konkurencji za darmo.


---

## 19. GitHub Repository & Version Control

**Repository URL:** https://github.com/Kaczor4444/kompas-seniora  
**Setup Date:** 29 września 2025  
**Primary Branch:** main  
**Visibility:** Public

### Repository Structure

kompas-seniora/
├── app/
│   ├── page.tsx              # Main landing page (467 lines added in last commit)
│   ├── globals.css           # Global styles + CSS Variables color system
│   ├── layout.tsx            # Root layout with metadata
│   ├── favicon.ico
│   └── api/                  # (Future: API routes for search, filters)
├── prisma/
│   ├── schema.prisma         # Database schema with TERYT integration
│   └── dev.db               # SQLite database (local development)
├── public/                   # Static assets
├── components/               # (Future: reusable React components)
├── lib/                      # (Future: utility functions, Prisma client)
├── .gitignore               # Node modules, build files, .env
├── package.json             # Dependencies: Next.js, Prisma, Fuse.js, Leaflet
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind + custom color palette
├── next.config.js
└── README.md

### Git Workflow Best Practices
```bash
# Daily workflow
git status                    # Check what changed
git add app/page.tsx         # Stage specific files (or git add . for all)
git commit -m "Description"  # Descriptive commit message
git push                     # Push to GitHub

# When starting work session
git pull                     # Get latest changes (important if working from multiple devices)

# Check history
git log --oneline            # See recent commits
git show c552516             # View specific commit details

Commit Message Conventions
Format: "Action + What + Why (optional)"

Good examples:
✅ "Add newsletter section with gradient background"
✅ "Fix mobile responsive layout for location grid"
✅ "Update color palette - improve accessibility contrast"

Bad examples:
❌ "updates"
❌ "fix stuff"
❌ "wip"

Branch Strategy (Current: Simple)
main branch only (for MVP phase)

Future (when scaling):
- main (production-ready code)
- develop (active development)
- feature/feature-name (new features)

Backup & Recovery

Cloud backup: Automatic via GitHub (every push)
Local backup: Git keeps full history locally in .git/ folder
Recovery: git checkout [commit-hash] to restore any previous version
Undo last commit: git reset --soft HEAD~1 (keeps changes)

Integration with Vercel

# When ready to deploy:
1. Push code to GitHub (git push)
2. Connect Vercel to GitHub repo
3. Vercel auto-deploys on every push to main
4. Production URL: kompaseniora.vercel.app (or custom domain)

GitHub Features to Use

Issues: Track bugs, features, ideas
Projects: Kanban board for MVP tasks
Releases: Tag major versions (v1.0, v2.0)
README.md: Project documentation for other developers

Security Notes

.env files are in .gitignore - never commit secrets
Database (dev.db) is gitignored - not pushed to GitHub
Production will use PostgreSQL (not SQLite)

## Common Issues & Solutions

### Search not working for Polish characters
1. Check: `sqlite3 db.db "SELECT hex(powiat) FROM placowki LIMIT 1"`
2. Fix: Add `.normalize('NFC')` in import script
3. Use: Raw SQL with REPLACE() for each Polish character

### Import errors
1. Always log first record: `console.log(JSON.stringify(rows[0], null, 2))`
2. Check field names in error messages vs Prisma schema
3. Verify CSV encoding (UTF-8 without BOM)

### Finding old working code
1. `git log --oneline -20` to find relevant commit
2. `git show COMMIT:path/to/file` to view old version
3. `git diff COMMIT HEAD -- path` to see what changed

## 19. Token Management & Chat Strategy

### Token Limits
- **Total per chat:** 190,000 tokens
- **Current session:** ~95,000 tokens used (~50%)

### Reminder System
Claude będzie przypominał o wykorzystaniu tokenów:
- **50% pozostało (95k tokenów):** "⚠️ TOKEN UPDATE: Wykorzystaliśmy 50% tokenów. Zostało ~95k. Dobry moment na podsumowanie i nowy chat."
- **30% pozostało (57k tokenów):** "⚠️ TOKEN UPDATE: Pozostało 30% tokenów (~57k). Unikaj rozpoczynania nowych, złożonych zadań."
- **15% pozostało (28.5k tokenów):** "⚠️ TOKEN UPDATE: Pozostało tylko 15% tokenów (~28k). Zakończ bieżące zadanie i zaplanuj nowy chat."

### Best Practices
**DO:**
- Kończ chat na konstruktywnym sukcesie (działająca funkcjonalność, commit zrobiony)
- Rób podsumowanie przed 50% limitu jeśli projekt jest złożony
- Zapisuj lessons learned w osobnym pliku MD
- Commituj kod przed końcem chata

**DON'T:**
- Nie zaczynaj nowego, dużego zadania po przekroczeniu 50%
- Nie przerywaj w połowie refactoringu/debugowania
- Nie kończ bez commita i podsumowania

### Workflow
1. **Start nowego chata:** Jasny cel (np. "Dodaj kalkulator kosztów")
2. **Mid-chat (~50%):** Check-in - czy jesteśmy blisko celu?
3. **End chat (~80-90%):** Commit, podsumowanie, plan na następny chat
4. **Nowy chat:** Od czystej karty z jasnym następnym zadaniem

### Przykład dobrego zakończenia:
✅ Wyszukiwarka działa
✅ Commit zrobiony
✅ Lessons learned zapisane
📝 Następny chat: Dodaj kalkulator kosztów


---

## 20. Development Lessons Learned

### Session 2025-10-05: TERYT Integration

#### Debugging Best Practices
**Problem:** "olkusz" nie znajdował "olkuski" mimo logiki prefix matching
**Rozwiązanie:** Debug logi bezpośrednio w funkcji pokazały że `.includes('olkusz')` = false
**Lekcja:** 
- Przy string matching testuj edge cases natychmiast: `node -e "console.log('test')"`
- Dodawaj debug logi w core funkcjach, nie tylko w API endpoints
- Nie zakładaj - weryfikuj zachowanie funkcji built-in (includes, startsWith)

#### Git Workflow
**Problem:** Tylko 3 commity podczas 2h+ sesji
**Lepiej:** Commit po każdym working feature:
```bash
git commit -m "feat: Add TERYT normalization function"
git commit -m "feat: Implement prefix matching for Polish grammar"
git commit -m "feat: Add TERYT database schema"
git commit -m "feat: Add UI for TERYT suggestions"

Korzyść: Łatwiejszy rollback, czytelniejsza historia
Data Testing
Problem: Ręczne dodawanie testowych danych przez SQLite
Lepiej: Stwórz data/test-teryt.csv z przykładowymi lokalizacjami

nazwa,typ,gmina,powiat,wojewodztwo
Kamienica,gmina,Kamienica,limanowski,małopolskie
Zarzecze,miejscowosc,Zarzecze,krakowski,małopolskie

nazwa,typ,gmina,powiat,wojewodztwo
Kamienica,gmina,Kamienica,limanowski,małopolskie
Zarzecze,miejscowosc,Zarzecze,krakowski,małopolskie

Korzyść: Reprodukowalne testy, łatwe czyszczenie
Consistency in Scripts

Problem: Mix TypeScript (import-csv.ts) i JavaScript (import-teryt.js) Decyzja: Unifikuj - wszystko .ts dla consistency Plan: Rename import-teryt.js → import-teryt.ts w następnej sesji
Production Thinking

Dobre pytania zadane podczas sesji:

    "Czy miejscowość musi być w bazie żeby ją znaleźć?" → Wykryto lukę w TERYT coverage
    "Jak dodać nowe dane - import uaktualni bazę?" → Myślenie o maintenance

Token Management

Wykorzystanie: ~95k/190k (50%) Przypomnienia:

    50% → moment na podsumowanie
    80%+ → nie zaczynaj nowych features Dla przyszłości: Kompleksowe zadania (deploy, refactoring) zostawiaj na świeże sesje

21. Quick Reference Commands
Development
bash

# Start dev server
npm run dev

# Database operations
npx prisma db push              # Apply schema changes
npx prisma studio               # Open database GUI
sqlite3 prisma/dev.db "query"   # Direct SQL query

# Import data
node scripts/import-teryt.js    # TERYT locations
npx ts-node scripts/import-csv.ts  # Placówki

# Git workflow
git status
git add .
git commit -m "type: description"
git push

Testing Locations
bash

# Check database
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM placowki;"
sqlite3 prisma/dev.db "SELECT DISTINCT powiat FROM teryt_locations;"

# Test URLs
http://localhost:3000/api/search?q=kamienica
http://localhost:3000/search?q=olkusz
http://localhost:3000/placowka/297

Debug String Matching
bash

# Quick REPL tests
node -e "console.log('olkuski'.includes('olkusz'))"
node -e "console.log('olkuski'.startsWith('olkus'))"

22. Next Session TODO

    Rozszerz TERYT o wszystkie miejscowości Małopolski (~3000)
    Deploy na Vercel (kompaseniora.pl)
    Unifikuj scripts do TypeScript
    Dodaj data/test-teryt.csv dla reproduced testing
    Fix: usuń błędny wpis "https://mops.krakow.pl/..." z powiatu






