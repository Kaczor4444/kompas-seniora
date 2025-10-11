# 🚀 Natural Language Search (NLS) - Vision & Roadmap

**DOKUMENTACJA STANOWI CAŁOŚĆ Z:**
- `docs/current-state-snapshot.md` (Aktualny stan - przeczytaj NAJPIERW!)
- `docs/nls-vision-roadmap.md` ← TEN PLIK
- `docs/migration-plan-v2.md` (Konkretny plan działania)

**Data utworzenia:** 2025-10-11  
**Ostatnia aktualizacja:** 2025-10-11  
**Autor:** Claude (Anthropic) + Szymon  
**Status:** 📋 Wizja długoterminowa (6-12 miesięcy)

---

## ⚠️ WAŻNE: Przeczytaj w kolejności

1. `current-state-snapshot.md` → Co masz teraz
2. **TEN PLIK** → Dokąd idziemy (wizja)
3. `migration-plan-v2.md` → Jak tam dojść (akcja)

---

**Projekt:** kompaseniora.pl  
**Cel:** Transformacja z prostej wyszukiwarki do AI-powered platform

---

## 🎯 EXECUTIVE SUMMARY

### **Problem:**
Obecna wyszukiwarka wymaga od użytkownika:
- Znajomości struktury administracyjnej (powiat, województwo)
- Klikania przez multiple dropdowns
- Myślenia "jak komputer"

**Rezultat:** Wysoki bounce rate, niska konwersja

### **Rozwiązanie: Natural Language Search**
User pisze **naturalnie**, system rozumie **inteligentnie**:

```
User: "mama ma alzheimera, mieszka w krakowie, ile to kosztuje?"

System rozumie:
→ Choroba: alzheimer
→ Lokalizacja: Kraków (powiat krakowski, woj. małopolskie)
→ Intent: koszt
→ Action: Pokaż kalkulator + lista placówek
```

### **Impact:**
- 🎯 **4x wyższa konwersja** (5% → 20%)
- 📈 **10x więcej traffic** (1,000 → 10,000 visitors/month)
- 🏆 **Featured Snippets** w Google (Position #0)
- 💰 **Competitive moat** (konkurencja potrzebuje 6-12 miesięcy żeby dogonić)

---

## 🔥 DLACZEGO TO GAME CHANGER

### **1. User Experience**

**PRZED (Konkurencja - GodneLata.pl):**
```
Krok 1: Wybierz województwo [dropdown] 👎
Krok 2: Wybierz miasto [dropdown] 👎
Krok 3: Typ placówki [checkbox] 👎
Krok 4: Zakres cenowy [slider] 👎
Krok 5: SZUKAJ [button] 👎

Bounce rate: 70%
Time on site: 1-2 min
Konwersja: 5%
```

**PO (Ty z NLS):**
```
Krok 1: "alzheimer kraków tanio" [naturalny język] ✅

System: 
"Znalazłem 7 placówek dla osób z alzheimerem w Krakowie
Najtańsza: 4,500 PLN/mies
Najdroższa: 7,800 PLN/mies"

[Lista placówek] [Kalkulator] [Poradnik]

Bounce rate: 25%
Time on site: 5-8 min
Konwersja: 20%
```

---

### **2. SEO Dominacja**

**Long-tail Keywords:**
```
Bez NLS: 50-100 keywords
Z NLS: 500-1,000 keywords

Przykłady które WYGRASZ:
✅ "dom opieki dla osoby z alzheimerem kraków"
✅ "ile kosztuje dps demencja małopolska"
✅ "opieka po udarze tarnów"
✅ "hospicjum parkinson śląskie"
✅ "najtańszy dom seniora kraków"
```

**Featured Snippets (Position #0):**
```
User googla: "ile kosztuje dom opieki dla osoby z alzheimerem"

Google pokazuje:
┌─────────────────────────────────────┐
│ kompaseniora.pl                     │
│ Średni koszt: 5,200 - 7,800 PLN    │
│ 23 placówki w Małopolsce            │
│ [Kalkulator] [Lista]                │
└─────────────────────────────────────┘
```

**Voice Search Ready:**
```
"Ok Google, znajdź dom opieki dla babci z demencją w Tarnowie"
→ Google czyta TWOJĄ odpowiedź! 🎤
```

---

### **3. Competitive Moat (Data Flywheel)**

```
Więcej użytkowników 
  ↓
Więcej natural language queries
  ↓
Lepszy model (uczy się z każdego query)
  ↓
Lepsze wyniki
  ↓
Jeszcze więcej użytkowników
  ↓
🔄 REPEAT
```

**Po roku:** Masz 100,000+ real user queries = unbeatable training data

**Konkurencja?** Musi zaczynać od zera. Potrzebują 6-12 miesięcy minimum.

---

## 🛠️ IMPLEMENTATION - 3 POZIOMY

### **POZIOM 1: Regex Magic (NO AI)** 🪄

**Czas implementacji:** 1-2 tygodnie  
**Koszt:** $0/month  
**Skuteczność:** 70-80%

**Jak działa:**
```typescript
// Prosty pattern matching
const PATTERNS = {
  cost: /ile (kosztuje|koszty|cena)/i,
  cheap: /tan(io|i|szy)/i,
  disease: /(alzheimer|demencja|parkinson)/i,
  location: /(w|koło|blisko) (krakow|tarnow)/i
};

function analyzeQuery(q: string) {
  const intent = {};
  
  if (PATTERNS.cost.test(q)) intent.showCalculator = true;
  if (PATTERNS.cheap.test(q)) intent.sortBy = 'price_asc';
  
  const disease = q.match(PATTERNS.disease);
  if (disease) intent.tag = disease[1];
  
  return intent;
}
```

**Przykład:**
```
Input: "najtańszy dom dla alzheimera koło krakowa"

Parse:
→ cheap: true → sortBy: 'price_asc'
→ disease: 'alzheimer' → tag: 'alzheimer'  
→ location: 'krakow' → city: 'Kraków'

SQL:
WHERE profil_opieki HAS 'alzheimer'
  AND powiat IN ('krakowski', ...)
ORDER BY koszt_PLN ASC
```

**Co wygrywasz:**
- ✅ Podstawowe intent detection
- ✅ Tag matching (alzheimer, demencja)
- ✅ Cost/cheapness detection
- ✅ Location parsing
- ✅ Zero kosztów

---

### **POZIOM 2: Semantic Search (Embeddings)** 🧠

**Czas implementacji:** 2-3 tygodnie  
**Koszt:** ~$0.20/month (10k searches)  
**Skuteczność:** 85-90%

**Jak działa:**
```typescript
// 1. Generate embeddings dla tagów (ONCE at setup)
const tagEmbeddings = {
  'alzheimer': await openai.embeddings.create({
    input: "choroba alzheimera, demencja starcza, zaburzenia pamięci, nie pamięta",
    model: "text-embedding-3-small" // Cheap!
  }),
  'po-udarze': await openai.embeddings.create({
    input: "po udarze mózgu, rehabilitacja poudarowa, niedowład, sparaliżowany",
    model: "text-embedding-3-small"
  })
};

// 2. User query → embedding
const query = "mama przestała mnie rozpoznawać";
const queryEmbed = await openai.embeddings.create({
  input: query,
  model: "text-embedding-3-small"
});

// 3. Znajdź najbliższy tag (cosine similarity)
const match = findClosestTag(queryEmbed, tagEmbeddings);
// Result: 'alzheimer' (similarity: 0.89)
```

**Co wygrywasz:**
- ✅ Rozumie synonimy ("nie pamięta" = alzheimer)
- ✅ Rozumie parafrazy ("przestała rozpoznawać" = demencja)
- ✅ Działa dla fraz których NIE widziałeś wcześniej
- ✅ Multi-language ready (Polski + English)
- ✅ Bardzo tanie (~2 grosze za 1000 queries)

**Przykład:**
```
User: "tata nie może chodzić, potrzebuje rehabilitacji"

Embedding similarity:
→ 'po-udarze': 0.92 ✅ MATCH!
→ 'alzheimer': 0.23
→ 'parkinson': 0.45

Action: Filtruj po tag: 'po-udarze' + filter: 'rehabilitacja'
```

---

### **POZIOM 3: Full GPT Integration** 🤖

**Czas implementacji:** 4-6 tygodni  
**Koszt:** ~$1.50/month (10k searches)  
**Skuteczność:** 95-98%

**Jak działa:**
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Fast & cheap
  messages: [
    {
      role: "system",
      content: `Jesteś asystentem wyszukiwarki domów opieki.
      Analizujesz zapytania i zwracasz JSON.
      
      Dostępne tagi: ${TAGS.join(', ')}
      Dostępne województwa: małopolskie, śląskie
      
      Format odpowiedzi:
      {
        "intent": "cost" | "location" | "profile",
        "tags": ["alzheimer"],
        "location": {"wojewodztwo": "małopolskie", "miasto": "Kraków"},
        "filters": {"przyjmuje_lezacych": true},
        "sortBy": "price",
        "showCalculator": true
      }`
    },
    {
      role: "user",
      content: "Moja babcia ma 82 lata, po udarze, nie może chodzić. Szukam w Tarnowie. Ile kosztuje?"
    }
  ],
  response_format: { type: "json_object" }
});

const analysis = JSON.parse(completion.choices[0].message.content);
// Perfect structured data! 🎯
```

**Przykład wyniku:**
```json
{
  "intent": "cost",
  "tags": ["po-udarze", "osoby-starsze"],
  "location": {
    "wojewodztwo": "małopolskie",
    "miasto": "Tarnów",
    "powiat": "tarnowski"
  },
  "filters": {
    "przyjmuje_lezacych": true
  },
  "sortBy": null,
  "showCalculator": true,
  "userMessage": "Znalazłem 3 placówki w Tarnowie przyjmujące osoby leżące po udarze. Średni koszt: 6,200 PLN/miesiąc."
}
```

**Co wygrywasz:**
- ✅ Near-perfect understanding (95%+)
- ✅ Context awareness (rozumie "ona", "tam" z poprzednich pytań)
- ✅ Multi-turn conversations
- ✅ Generuje user-friendly messages
- ✅ Handles edge cases (typos, slang, dialekty)
- ✅ Nadal BARDZO tanie (~15 groszy za 1000 queries)

---

## 📊 COST BREAKDOWN

**Monthly costs at different scales:**

| Scale | Poziom 1 (Regex) | Poziom 2 (Embeddings) | Poziom 3 (GPT) |
|-------|------------------|------------------------|----------------|
| 1,000 searches | $0 | $0.02 | $0.15 |
| 10,000 searches | $0 | $0.20 | $1.50 |
| 100,000 searches | $0 | $2.00 | $15.00 |

**ROI przy 10k searches/month:**
```
Koszt: $1.50/month
Dodatkowa konwersja: 15% więcej (4x improvement)
Dodatkowi użytkownicy: ~150 kontaktów/month
Value per contact: ~100 PLN (CPM w Google Ads)
Total value: 15,000 PLN

ROI: 10,000x 🚀
```

---

## 📅 TIMELINE & MILESTONES

### **FAZA 1: Foundation (Teraz - 2 tygodnie)**
```
Week 1:
✅ Rozbuduj Prisma schema (+3 pola minimum)
✅ Import Śląskie z tagami profili
✅ Podstawowy regex matching (Poziom 1)
✅ Update UI - smart search bar

Week 2:
✅ 5-10 landing pages (/opieka/alzheimer)
✅ Analytics setup (track queries)
✅ A/B test: stara vs nowa wyszukiwarka
✅ Documentation
```

**Success Metrics:**
- [ ] 70%+ queries correctly parsed
- [ ] 2x click-through rate na autocomplete
- [ ] Zero regressions (stare features działają)

---

### **FAZA 2: Smart Search (Miesiąc 2-3)**
```
Week 3-4:
✅ OpenAI embeddings integration
✅ Semantic tag matching
✅ Live suggestions (while typing)

Week 5-6:
✅ Auto-generated landing pages (50+ URLs)
✅ FAQ content dla każdego profilu
✅ Schema.org markup (rich snippets)
```

**Success Metrics:**
- [ ] 85%+ queries correctly parsed
- [ ] 20+ keywords ranking top 10
- [ ] 3x organic traffic

---

### **FAZA 3: Full NLS (Miesiąc 4-6)**
```
Week 7-10:
✅ GPT-4 mini integration
✅ Conversational interface
✅ Multi-turn context (remembers previous queries)
✅ Learning from user behavior

Week 11-12:
✅ Voice search optimization
✅ Mobile conversational UI
✅ Personalization (user preferences)
```

**Success Metrics:**
- [ ] 95%+ queries correctly parsed
- [ ] 50+ Featured Snippets
- [ ] 10x organic traffic vs start

---

### **FAZA 4: Advanced (Miesiąc 6-12)**
```
Month 7-9:
✅ Chatbot assistant (embedded on site)
✅ Email assistant (query via email → response)
✅ WhatsApp integration

Month 10-12:
✅ Multi-language (English for Polonia)
✅ Predictive search (before they finish typing)
✅ Personalized recommendations
```

---