import requests
import json
import time

# Lista różnych instancji RSS-Bridge (jeśli jedna padnie, sprawdzamy kolejną)
INSTANCES = [
    "https://rss-bridge.org/bridge01/",
    "https://bridge.nodert.com/",
    "https://rssbridge.pw/",
    "https://rss-bridge.snopyta.org/"
]

FB_PAGE_ID = "100079093110723" 
KEYWORDS = ["warsztaty", "spotkanie", "zapraszamy", "uroczystość", "koncert", "pomoc"]

def get_fb_data():
    params = {
        "action": "display",
        "bridge": "Facebook",
        "context": "By page ID",
        "u": FB_PAGE_ID,
        "format": "Json"
    }
    
    for bridge_url in INSTANCES:
        print(f"Próbuję instancji: {bridge_url}...")
        try:
            response = requests.get(bridge_url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                raw_items = data.get("items", [])
                
                filtered_posts = []
                for item in raw_items[:10]:
                    content = item.get("content_html", "")
                    title = item.get("title", "")
                    full_text = f"{title} {content}".lower()
                    
                    found = [word for word in KEYWORDS if word in full_text]
                    
                    filtered_posts.append({
                        "title": title,
                        "url": item.get("url"),
                        "date": item.get("date_published"),
                        "has_keywords": len(found) > 0,
                        "matched_words": found
                    })

                with open('sds_posts_rss.json', 'w', encoding='utf-8') as f:
                    json.dump(filtered_posts, f, ensure_ascii=False, indent=4)
                
                print(f"--- SUKCES! Pobrano dane z {bridge_url} ---")
                return # Kończymy, bo udało się pobrać dane
            else:
                print(f"Błąd {response.status_code} na tej instancji.")
        
        except Exception as e:
            print(f"Nie udało się połączyć z {bridge_url}: {e}")
    
    print("Niestety, żadna z dostępnych instancji nie zadziałała w tej chwili.")

if __name__ == "__main__":
    get_fb_data()
