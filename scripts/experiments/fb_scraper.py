import json
import time
from playwright.sync_api import sync_playwright, TimeoutError

TARGET_URL = "https://www.facebook.com/p/%C5%9Arodowiskowy-Dom-Samopomocy-w-O%C5%9Bwi%C4%99cimiu-%C5%9ADS-100079093110723/"
KEYWORDS = ["warsztaty", "spotkanie", "zapraszamy", "uroczystość", "koncert", "wycieczka", "pomoc"]
MAX_POSTS = 10

def scrape_fb_sds():
    posts_found = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) # Zostawiamy False, żebyś widziała co się dzieje
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            print(f"Otwieram: {TARGET_URL}")
            page.goto(TARGET_URL, wait_until="networkidle")
            time.sleep(5)

            # Próba kliknięcia w cookies
            try:
                page.get_by_role("button", name="Zezwól na wszystkie pliki cookie").click(timeout=3000)
                print("Zaakceptowano cookies.")
            except:
                pass

            print("Szukam postów... Jeśli zobaczysz okno logowania, zamknij je ręcznie (X).")
            
            attempts = 0
            while len(posts_found) < MAX_POSTS and attempts < 10:
                # Czekamy chwilę na załadowanie artykułów
                page.wait_for_selector('div[role="article"]', timeout=10000)
                articles = page.locator('div[role="article"]').all()
                
                for art in articles:
                    try:
                        content = art.inner_text()
                        if content and len(content) > 30:
                            if content not in [p['text'] for p in posts_found]:
                                found_keywords = [word for word in KEYWORDS if word.lower() in content.lower()]
                                
                                posts_found.append({
                                    "text": content[:500] + "..." if len(content) > 500 else content,
                                    "has_keywords": len(found_keywords) > 0,
                                    "matched_words": found_keywords,
                                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                                })
                                print(f"Znaleziono post {len(posts_found)}/{MAX_POSTS}")
                                
                                if len(posts_found) >= MAX_POSTS:
                                    break
                    except:
                        continue # Jeśli post zniknął przy przewijaniu, leć dalej
                
                # Przewijanie
                page.mouse.wheel(0, 2000)
                time.sleep(3)
                attempts += 1

            # Zapis danych
            with open('sds_posts.json', 'w', encoding='utf-8') as f:
                json.dump(posts_found, f, ensure_ascii=False, indent=4)
            
            print(f"\nGotowe! Zapisano {len(posts_found)} postów w sds_posts.json")

        except Exception as e:
            print(f"Wystąpił błąd: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    scrape_fb_sds()
