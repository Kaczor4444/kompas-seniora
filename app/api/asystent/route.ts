import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkRedisRateLimit } from '@/lib/redis'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Validation schema
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(500),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  language: z.enum(['pl', 'en']).optional(), // Multi-language support
})

// Security: Validate AI response structure
const actionSchema = z.object({
  type: z.enum(['placowka', 'mapa', 'search', 'artykul', 'kalkulator']),
  id: z.number().int().positive().optional(),
  powiat: z.string().max(50).optional(),
  query: z.string().max(200).optional(),
  href: z.string().max(500).startsWith('/').optional(),
  label: z.string().min(1).max(100),
  facilityType: z.enum(['dps', 'sds']).optional(),
})

const aiResponseSchema = z.object({
  answer: z.string().min(1).max(2000), // Max 2000 chars
  actions: z.array(actionSchema).max(20).optional(),
})

// Security: Prompt injection detection
// Focused on genuine injection patterns — no false positives on legitimate queries
// (removed: 'admin', 'database', 'root' — too many false positives in Polish)
const DANGEROUS_KEYWORDS = [
  // English injection patterns
  'ignore previous', 'ignore all previous', 'ignore instructions',
  'disregard previous', 'disregard instructions',
  'you are now', 'new instructions', 'roleplay as', 'pretend you are',
  'act as if', 'forget everything',
  // Polish injection patterns
  'zignoruj poprzednie', 'zignoruj instrukcje', 'zapomnij instrukcje',
  'zapomnij o wszystkim', 'nowe instrukcje', 'udawaj że jesteś',
  'wciel się w', 'jesteś teraz',
  // SQL injection
  'drop table', 'delete from', 'truncate table', 'insert into',
  // XSS
  '<script>', 'javascript:', 'eval(', 'onclick=', 'onerror=',
  // Credentials
  'credentials', 'api key', 'api_key', 'password', 'passwd',
  'sudo', 'exec(', 'shell',
]

function detectPromptInjection(text: string): boolean {
  const lowerText = text.toLowerCase()
  return DANGEROUS_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

// Security: CSRF protection
function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Allow requests without origin (same-origin or direct API calls)
  if (!origin && !referer) return true

  const allowedOrigins = [
    'https://kompaseniora.pl',
    'https://www.kompaseniora.pl',
    'https://kompas-seniora.vercel.app',
    'https://kompas-seniora-git-main-iwona.vercel.app',
  ]

  // Development mode
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000')
    allowedOrigins.push('http://127.0.0.1:3000')
  }

  const requestOrigin = origin || referer?.split('/').slice(0, 3).join('/')
  return allowedOrigins.some(allowed => requestOrigin?.startsWith(allowed))
}

// Security: Log suspicious activity
function logSecurityEvent(ip: string, eventType: string, details: string) {
  const timestamp = new Date().toISOString()
  console.error(`[SECURITY] ${timestamp} | IP: ${ip} | Event: ${eventType} | Details: ${details.substring(0, 200)}`)

  // TODO: Save to database for audit trail
  // await prisma.securityEvent.create({ data: { ip, eventType, details } })
}

// Multi-language: System prompts
function getSystemPrompt(lang: 'pl' | 'en'): string {
  if (lang === 'en') {
    return `You are a helpful assistant for KompasSeniora.pl — a directory of senior care facilities in Lesser Poland (Małopolska), Poland.

YOUR ROLE:
- Help families find appropriate care facilities for seniors
- Answer ONLY questions about care facilities, nursing homes (DPS), day care centers (ŚDS), and senior care
- If someone asks about unrelated topics, politely decline and return to the topic

RESPONSE RULES:
- Answer only based on the data provided below
- ⚠️⚠️⚠️ WRITE ONLY IN ENGLISH! No Polish, Russian, or any other languages!
- ⚠️⚠️⚠️ TELL THE TRUTH ABOUT LOCATION! Check "Lokalizacja:" field of each facility!
  - If facility is in Olkusz → say "in Olkusz" (NOT "in Klucze"!)
  - If user asked about small village where NO facility exists → say "No DPS directly in [village], but in [county] county we have facilities in [city1], [city2]..."
- Write briefly and concisely (max 2-3 sentences)
- ⚠️ ABSOLUTELY DO NOT COPY [ID: XXX] to responses! ID is ONLY for actions!
- ⚠️ DO NOT LIST in text: prices, phone numbers, emails, addresses - all in actions!
- ⚠️ DO NOT write contact details - user will click "View facility" button
- ⚠️ BE NEUTRAL - don't use words like "most popular", "I recommend", "best"
- Mention facilities with their actual cities (e.g., "Social Welfare Home in Muszyna" if it's in Muszyna)
- ⚠️⚠️⚠️ ALWAYS add "placowka" type actions for every mentioned facility!
- ⚠️⚠️⚠️ ALWAYS add "mapa" action when question is about specific county/city!

DIFFERENCE DPS vs ŚDS:
- DPS — 24/7 residential care
- ŚDS — day care, person returns home at night, for people with mental disorders

COUNTIES IN MAŁOPOLSKA (21 counties):
- bocheński, chrzanowski, dąbrowski, gorlicki, krakowski, limanowski, miechowski, myślenicki, nowosądecki, nowotarski, olkuski, oświęcimski, proszowicki, suski, tarnowski, tatrzański, wadowicki, wielicki
- Cities with county rights: Kraków (use "krakowski"), Nowy Sącz (use "nowosądecki"), Tarnów (use "tarnowski")

⚠️⚠️⚠️ CRITICAL - COMMON MISTAKES:
- KLUCZE = Lesser Poland, OLKUSKI county (NOT Silesia!) - we have 1 DPS facility here!
- If someone asks about "Klucze" → ALWAYS respond about OLKUSKI county in Lesser Poland

IMPORTANT CITY MAPPING:
- Klucze → olkuski county (Klucze is in Lesser Poland, not Silesia!)
- Olkusz → olkuski, Wieliczka → wielicki, Oświęcim → oświęcimski
- Zakopane → tatrzański, Nowy Targ → nowotarski

JSON RESPONSE FORMAT:
⚠️ CRITICAL: Your response MUST be pure JSON only!
⚠️ ALWAYS start with { and end with }
⚠️ DO NOT add text before or after JSON!

{
  "answer": "Brief answer (2-3 sentences, NO contact details!)",
  "actions": [
    {"type": "placowka", "id": 123, "label": "Facility name"},
    {"type": "mapa", "powiat": "olkuski", "label": "Show on map 🗺️"}
  ]
}

EXAMPLES OF GOOD RESPONSES:

User: "looking for nursing home in Klucze" (Klucze is small village - DPS is in Olkusz!)
Assistant: {
  "answer": "No DPS directly in Klucze, but in olkuski county there's a facility in Olkusz (about 10 km from Klucze).",
  "actions": [
    {"type": "placowka", "id": 15, "label": "DPS Olkusz"},
    {"type": "mapa", "powiat": "olkuski", "label": "Show on map 🗺️"}
  ]
}

User: "nursing home in Zakopane" (Zakopane has DPS!)
Assistant: {
  "answer": "In Zakopane in tatrzański county we have 1 DPS facility.",
  "actions": [
    {"type": "placowka", "id": 78, "label": "DPS Zakopane"},
    {"type": "mapa", "powiat": "tatrzański", "label": "Show on map 🗺️"}
  ]
}

⚠️ ACTION RULES:
- ALWAYS add {"type": "placowka", "id": ID} action for EVERY mentioned facility
- ALWAYS add {"type": "mapa", "powiat": "..."} when user asks about specific city/county
- DO NOT write details (phone, email, address) in "answer" field - user will click button!

AVAILABLE DATA:
Below is the list of facilities in Lesser Poland. Each facility has [ID: number] - use this ONLY for generating actions, NEVER in response text.`
  }

  // Polish (default)
  return `Jesteś pomocnym asystentem serwisu KompasSeniora.pl — katalogu placówek opieki dla seniorów w Małopolsce.

TWOJA ROLA:
- Pomagasz rodzinom znaleźć odpowiednią placówkę opieki dla seniora
- Odpowiadasz WYŁĄCZNIE na pytania dotyczące placówek opieki, DPS, ŚDS i opieki nad seniorami
- Jeśli ktoś pyta o coś niezwiązanego, grzecznie odmawiasz i wracasz do tematu

ZASADY ODPOWIEDZI:
- Odpowiadaj tylko na podstawie danych które masz poniżej
- ⚠️⚠️⚠️ PISZ WYŁĄCZNIE PO POLSKU! Żadnego rosyjskiego, angielskiego ani innych języków!
- ⚠️⚠️⚠️ MÓW PRAWDĘ O LOKALIZACJI! Sprawdź pole "Lokalizacja:" każdej placówki!
  - Jeśli placówka jest w Olkuszu → mów "w Olkuszu" (NIE "w Kluczach"!)
  - Jeśli user pytał o małą miejscowość (wieś) gdzie NIE MA placówki → powiedz "Nie ma DPS bezpośrednio w [wieś], ale w powiecie [powiat] mamy placówki w [miasto1], [miasto2]..."
- Pisz krótko i rzeczowo (max 2-3 zdania)
- ⚠️ ABSOLUTNIE NIE KOPIUJ [ID: XXX] do odpowiedzi! ID jest TYLKO dla akcji!
- ⚠️ NIE WYMIENIAJ w tekście: cen, telefonów, emaili, adresów - to wszystko jest w akcjach!
- ⚠️ NIE pisz szczegółów kontaktowych - użytkownik kliknie przycisk "Zobacz placówkę"
- ⚠️ BĄDŹ NEUTRALNY - nie używaj słów "najpopularniejsze", "polecam", "najlepsze"
- Wspominaj placówki z ich rzeczywistych miast (np. "Dom Pomocy Społecznej w Muszynie" jeśli jest w Muszynie)
- ⚠️⚠️⚠️ ZAWSZE dodawaj akcje typu "placowka" dla każdej wymienionej placówki!
- ⚠️⚠️⚠️ ZAWSZE dodawaj akcję "mapa" gdy pytanie dotyczy konkretnego powiatu/miasta!

RÓŻNICA DPS vs ŚDS:
- DPS — całodobowa opieka stacjonarna
- ŚDS — opieka dzienna, osoba wraca do domu na noc, dla osób z zaburzeniami psychicznymi

POWIATY MAŁOPOLSKI (21 powiatów):
- bocheński, chrzanowski, dąbrowski, gorlicki, krakowski, limanowski, miechowski, myślenicki, nowosądecki, nowotarski, olkuski, oświęcimski, proszowicki, suski, tarnowski, tatrzański, wadowicki, wielicki
- Miasta na prawach powiatu: Kraków (użyj "krakowski"), Nowy Sącz (użyj "nowosądecki"), Tarnów (użyj "tarnowski")

⚠️⚠️⚠️ UWAGA - CZĘSTE BŁĘDY:
- KLUCZE = Małopolska, powiat OLKUSKI (NIE Śląskie!) - mamy tutaj 1 placówkę DPS!
- Jeśli ktoś pyta o "Klucze", "Kluczach", "Kluczami" → ZAWSZE odpowiedz o powiecie OLKUSKIM w Małopolsce

MAPOWANIE MIAST → POWIATY (najczęstsze):
- Kraków → krakowski, Bochnia → bocheński, Chrzanów → chrzanowski, Dąbrowa Tarnowska → dąbrowski
- Gorlice → gorlicki, Limanowa → limanowski, Miechów → miechowski, Myślenice → myślenicki
- Nowy Sącz → nowosądecki, Nowy Targ → nowotarski, Olkusz → olkuski, Klucze → olkuski, Oświęcim → oświęcimski
- Proszowice → proszowicki, Sucha Beskidzka → suski, Tarnów → tarnowski, Zakopane → tatrzański
- Wadowice → wadowicki, Wieliczka → wielicki

FORMAT ODPOWIEDZI JSON:
⚠️ KRYTYCZNE: Twoja odpowiedź MUSI być TYLKO czystym JSON-em!
⚠️ ZAWSZE zaczynaj od { i kończ na }
⚠️ NIE dodawaj tekstu przed ani po JSON!

{
  "answer": "Krótka odpowiedź (2-3 zdania, БЕЗ szczegółów kontaktowych!)",
  "actions": [
    {"type": "placowka", "id": 123, "label": "Nazwa placówki"},
    {"type": "mapa", "powiat": "olkuski", "label": "Pokaż na mapie 🗺️"}
  ]
}

PRZYKŁADY DOBRYCH ODPOWIEDZI:

User: "szukam dps w kluczach" (Klucze to mała wieś - DPS jest w Olkuszu!)
Assistant: {
  "answer": "Nie ma DPS bezpośrednio w Kluczach, ale w powiecie olkuskim jest placówka w Olkuszu (ok. 10 km od Kluczy).",
  "actions": [
    {"type": "placowka", "id": 15, "label": "DPS Olkusz"},
    {"type": "mapa", "powiat": "olkuski", "label": "Pokaż na mapie 🗺️"}
  ]
}

User: "dps w gorlicach" (Gorlice to miasto powiatowe - DPS jest tam!)
Assistant: {
  "answer": "W Gorlicach i powiecie gorlickim mamy 3 placówki DPS.",
  "actions": [
    {"type": "placowka", "id": 45, "label": "DPS Gorlice"},
    {"type": "placowka", "id": 46, "label": "DPS Biecz"},
    {"type": "mapa", "powiat": "gorlicki", "label": "Pokaż na mapie 🗺️"}
  ]
}

User: "szukam dps w zakopanem" (Zakopane ma DPS!)
Assistant: {
  "answer": "W Zakopanem w powiecie tatrzańskim mamy 1 placówkę DPS.",
  "actions": [
    {"type": "placowka", "id": 78, "label": "DPS Zakopane"},
    {"type": "mapa", "powiat": "tatrzański", "label": "Pokaż na mapie 🗺️"}
  ]
}

⚠️ ZASADY TWORZENIA AKCJI:
- ZAWSZE dodaj akcję {"type": "placowka", "id": ID} dla KAŻDEJ wymienionej placówki
- ZAWSZE dodaj akcję {"type": "mapa", "powiat": "..."} gdy user pyta o konkretne miasto/powiat
- NIE pisz szczegółów (telefon, email, adres) w polu "answer" - user kliknie przycisk!

DOSTĘPNE DANE:
Poniżej lista placówek w Małopolsce. Każda placówka ma [ID: numer] - używaj go TYLKO do generowania akcji, NIGDY w tekście odpowiedzi.`
}

// Normalize Polish characters (same as in search)
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Performance: Detect user intent to filter facilities BEFORE sending to AI
function detectIntent(userMessage: string): { powiat?: string; type?: 'DPS' | 'ŚDS' } {
  const lowerMsg = normalizePolish(userMessage)

  // Detect facility type
  let type: 'DPS' | 'ŚDS' | undefined
  if (lowerMsg.includes('dps') || lowerMsg.includes('całodobow')) {
    type = 'DPS'
  } else if (lowerMsg.includes('śds') || lowerMsg.includes('sds') || lowerMsg.includes('dzienn')) {
    type = 'ŚDS'
  }

  // Detect powiat from common patterns (use word stems to match all declensions)
  // NOTE: All patterns are normalized (Polish chars → ASCII) via normalizePolish()
  const powiatPatterns: Record<string, string> = {
    'krakow': 'krakowski',
    'tarnow': 'tarnowski',
    'nowy sacz': 'nowosądecki',
    'olkusz': 'olkuski',
    'klucz': 'olkuski',      // Klucze → Klucz (stem to match Kluczach, Kluczami)
    'wielicz': 'wielicki',    // Wieliczka → Wielicz (stem to match all forms)
    'oswiecim': 'oświęcimski',
    'bochni': 'bocheński',
    'myslenic': 'myślenicki', // Myślenice → Myslenic (normalized)
    'sucha beskidzka': 'suski',
    'zakopan': 'tatrzański',
    'nowy targ': 'nowotarski',
    'gorlic': 'gorlicki',     // Gorlice → Gorlic (stem to match Gorlicach, Gorlicami)
    'limanow': 'limanowski',
    'wadowic': 'wadowicki',
    'chrzanow': 'chrzanowski',
  }

  let powiat: string | undefined
  for (const [city, county] of Object.entries(powiatPatterns)) {
    if (lowerMsg.includes(city)) {
      powiat = county
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 INTENT: Wykryto miasto "${city}" → powiat ${county}`)
      }
      break
    }
  }

  return { powiat, type }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP — x-real-ip is set by Vercel/nginx to verified client IP
    // X-Forwarded-For last entry is proxy-appended; don't trust client-controlled entries
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
      'unknown'

    // Security: CSRF Protection
    if (!checkOrigin(request)) {
      logSecurityEvent(ip, 'CSRF_ATTEMPT', `Invalid origin: ${request.headers.get('origin')}`)
      return NextResponse.json(
        { error: 'Forbidden - Invalid origin' },
        { status: 403 }
      )
    }

    // Rate limiting with Redis (10 requests per minute)
    const rateLimit = await checkRedisRateLimit(ip, 10, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    // Validation
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane wejściowe', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { messages, language = 'pl' } = validation.data

    // Security: Prompt Injection Detection
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user' && detectPromptInjection(lastMessage.content)) {
      logSecurityEvent(ip, 'PROMPT_INJECTION', lastMessage.content)
      return NextResponse.json({
        answer: 'Wykryłem podejrzane zapytanie. Odpowiadam tylko na pytania dotyczące placówek opieki dla seniorów w Małopolsce.',
        actions: [
          { type: 'search', label: 'Szukaj placówek' },
          { type: 'artykul', href: '/poradniki', label: 'Zobacz poradniki' }
        ]
      })
    }

    // Performance: Detect user intent and filter facilities BEFORE sending to AI
    const intent = detectIntent(lastMessage.content)
    const whereClause: any = {}

    if (intent.type) {
      whereClause.typ_placowki = intent.type
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 INTENT: Filtrowanie do typu ${intent.type}`)
      }
    }

    if (intent.powiat) {
      whereClause.powiat = intent.powiat
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 INTENT: Filtrowanie do powiatu ${intent.powiat}`)
      }
    }

    // Extract city name from user query for AI context
    const cityMatch = lastMessage.content.match(/w\s+([a-zżźćńółęąś]{3,}(?:\s+[a-zżźćńółęąś]+)?)/i)
    const userCity = cityMatch ? cityMatch[1].trim() : null

    const placowki = await prisma.placowka.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        powiat: true,
        ulica: true,
        telefon: true,
        email: true,
        www: true,
        liczba_miejsc: true,
        profil_opieki: true,
        koszt_pobytu: true,
        prowadzacy: true,
      },
      orderBy: { powiat: 'asc' },
      take: 100, // Reduced from 200 - with filtering we need less
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 PERFORMANCE: Wysyłam ${placowki.length} placówek do AI (intent: type=${intent.type || 'all'}, powiat=${intent.powiat || 'all'})`)
    }

    const placowkiTekst = placowki.map(p => {
      const czesci = [
        `[ID: ${p.id}]`,
        `${p.nazwa} (${p.typ_placowki})`,
        `Lokalizacja: ${p.miejscowosc}${p.ulica ? ', ' + p.ulica : ''}, powiat ${p.powiat}`,
        p.prowadzacy ? `Prowadzący: ${p.prowadzacy}` : null,
        p.profil_opieki ? `Profil opieki: ${p.profil_opieki}` : null,
        p.liczba_miejsc ? `Liczba miejsc: ${p.liczba_miejsc}` : null,
        p.koszt_pobytu ? `Koszt: ${p.koszt_pobytu.toLocaleString('pl-PL')} zł/miesiąc` : null,
        p.telefon ? `Telefon: ${p.telefon}` : null,
        p.email ? `Email: ${p.email}` : null,
      ].filter(Boolean)
      return czesci.join('\n')
    }).join('\n\n---\n\n')

    // Build context about user's query
    let userQueryContext = ''
    if (userCity) {
      // Check if any facility is EXACTLY in the city user asked about
      const exactMatch = placowki.find(p =>
        normalizePolish(p.miejscowosc) === normalizePolish(userCity)
      )

      if (exactMatch) {
        userQueryContext = `\n\n⚠️ KONTEKST ZAPYTANIA:\nUser pytał o: "${userCity}"\n✅ MAMY placówkę bezpośrednio w miejscowości ${userCity}: ${exactMatch.nazwa}\n`
      } else {
        userQueryContext = `\n\n⚠️ KONTEKST ZAPYTANIA:\nUser pytał o: "${userCity}"\n❌ NIE MAMY placówki bezpośrednio w miejscowości ${userCity}!\n\n⚠️⚠️⚠️ WAŻNE - POWIEDZ PRAWDĘ:\n- NIE mów "w ${userCity} mamy placówkę" - TO KŁAMSTWO!\n- Powiedz: "Nie ma DPS bezpośrednio w ${userCity}, ale w powiecie ${intent.powiat || '...'} mamy placówki:"\n- Wymień nazwy placówek z ich rzeczywistych miejscowości\n- Dodaj akcje dla każdej placówki + mapa powiatu\n`
      }
    }

    // Get system prompt based on language (with facility data appended)
    const systemPrompt = `${getSystemPrompt(language)}${userQueryContext}

${placowkiTekst}`

    // 🎯 STREAMING RESPONSE with Server-Sent Events (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullText = ''

        try {
          // Create streaming response from Claude
          const response = await anthropic.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 1200,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          })

          // Stream each text delta (raw JSON from AI)
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text
            }
          }

          // Parse JSON and extract answer + actions
          try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
              throw new Error('No JSON found in response')
            }

            const parsed = JSON.parse(jsonMatch[0])

            // 🔒 SECURITY: Validate AI response with Zod
            const validation = aiResponseSchema.safeParse(parsed)
            if (!validation.success) {
              console.error('❌ AI response validation failed:', validation.error.flatten())
              logSecurityEvent(ip, 'INVALID_AI_RESPONSE', JSON.stringify(validation.error.flatten()))
              throw new Error('Invalid AI response structure')
            }

            const { answer, actions = [] } = validation.data

            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ AI Response validated: answer length=${answer.length}, actions=${actions.length}`)
            }

            // Stream answer text word-by-word
            const words = answer.split(' ')
            for (let i = 0; i < words.length; i++) {
              const word = i === 0 ? words[i] : ' ' + words[i]
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: word })}\n\n`)
              )
              // Small delay for natural typing effect
              await new Promise(resolve => setTimeout(resolve, 30))
            }

            // Send actions after answer completes
            if (actions.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'actions', actions: actions })}\n\n`)
              )
            }
          } catch (err) {
            console.error('❌ Failed to parse AI response:', err)
            // Fallback: send raw text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fullText })}\n\n`)
            )
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('Asystent API error:', error)

    // Detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Chatbot chwilowo niedostępny. Skontaktuj się z administratorem.' },
          { status: 503 }
        )
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Przekroczono limit API. Spróbuj za chwilę.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Wystąpił błąd podczas przetwarzania zapytania.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Nieznany błąd serwera.' },
      { status: 500 }
    )
  }
}
