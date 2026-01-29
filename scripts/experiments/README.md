# Experimental Scripts

## 🧪 Facebook Scrapers (NOT WORKING)

Testowe skrypty do zbierania danych z profili Facebook ŚDS (Środowiskowe Domy Samopomocy).

### Pliki:
- `fb_scraper.py` - próba scrapingu przez Selenium/BeautifulSoup
- `fb_rss_bridge.py` - próba przez RSS Bridge
- `dps_scraper.py` - scraper dla DPS

### ❌ Wynik testów:
Facebook ma silną ochronę przed automatycznym scrapingiem:
- Wykrywa boty (Selenium, Puppeteer)
- Blokuje automated requests
- Wymaga logowania dla większości treści
- Rate limiting i IP bans

### ✅ Alternatywne podejścia:
1. **Manual collection** - ręczne kopiowanie ze stron FB
2. **Official FB Graph API** - wymaga app review (trudne dla scraping use case)
3. **Direct contact** - poproś placówki o udostępnienie danych
4. **Public RSS feeds** - jeśli placówka ma włączone (rzadkie)

### 📝 Wnioski:
Automatyczne zbieranie danych z FB nie jest możliwe bez naruszenia ToS.
Lepiej skupić się na oficjalnych źródłach (strony www, MOPS, GUS).

---

**Created:** 2025-01-29
**Status:** Archived (not in use)
