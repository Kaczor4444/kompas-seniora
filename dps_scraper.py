import json
import time
from playwright.sync_api import sync_playwright

# URL strony z aktualnościami DPS Oświęcim
TARGET_URL = "http://www.dpsoswiecim.pl/index.php/aktualnosci"

def scrape_dps_news():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"Pobieram dane z: {TARGET_URL}")
        page.goto(TARGET_URL)
        
        # Czekamy na załadowanie listy artykułów
        page.wait_for_selector(".item-page")
        
        posts = []
        # Szukamy nagłówków i treści (selektory dla tej konkretnej strony)
        articles = page.locator(".items-row").all()
        
        for art in articles:
            title = art.locator("h2").inner_text().strip()
            # Pobieramy krótki opis
            summary = art.inner_text().replace(title, "").strip()[:300]
            
            posts.append({
                "title": title,
                "summary": summary,
                "source": "DPS Oświęcim",
                "date": time.strftime("%Y-%m-%d")
            })
            
        with open('dps_news.json', 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=4)
            
        print(f"Sukces! Pobrano {len(posts)} aktualności.")
        browser.close()

if __name__ == "__main__":
    scrape_dps_news()
