import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Cache dla placówek (1 godzina)
export const revalidate = 3600

// Validation schema
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(500),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
})

// Simple in-memory rate limiting (10 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }

  if (limit.count >= 10) {
    return false
  }

  limit.count++
  return true
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, 300000)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.' },
        { status: 429 }
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

    const { messages } = validation.data

    const placowki = await prisma.placowka.findMany({
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
      take: 200,
    })

    const placowkiTekst = placowki.map(p => {
      const czesci = [
        `• [ID:${p.id}] ${p.nazwa} (${p.typ_placowki})`,
        `  Lokalizacja: ${p.miejscowosc}${p.ulica ? ', ' + p.ulica : ''}, powiat ${p.powiat}`,
        p.prowadzacy ? `  Prowadzący: ${p.prowadzacy}` : null,
        p.profil_opieki ? `  Profil opieki: ${p.profil_opieki}` : null,
        p.liczba_miejsc ? `  Liczba miejsc: ${p.liczba_miejsc}` : null,
        p.koszt_pobytu ? `  Koszt pobytu: ${p.koszt_pobytu.toLocaleString('pl-PL')} zł/miesiąc` : null,
        p.telefon ? `  Telefon: ${p.telefon}` : null,
        p.email ? `  Email: ${p.email}` : null,
      ].filter(Boolean)
      return czesci.join('\n')
    }).join('\n\n')

    const systemPrompt = `Jesteś pomocnym asystentem serwisu KompasSeniora.pl — katalogu placówek opieki dla seniorów w Małopolsce.

TWOJA ROLA:
- Pomagasz rodzinom znaleźć odpowiednią placówkę opieki dla seniora
- Odpowiadasz WYŁĄCZNIE na pytania dotyczące placówek opieki, DPS, ŚDS i opieki nad seniorami
- Jeśli ktoś pyta o coś niezwiązanego, grzecznie odmawiasz i wracasz do tematu

ZASADY ODPOWIEDZI:
- Odpowiadaj tylko na podstawie danych które masz poniżej
- Pisz po polsku, krótko i rzeczowo (max 4-5 zdań)
- Gdy wspominasz konkretną placówkę, zawsze podaj jej ID w formacie [ID:123]
- Gdy pytanie dotyczy konkretnego powiatu/miejscowości, zaproponuj pokazanie na mapie

RÓŻNICA DPS vs ŚDS:
- DPS — całodobowa opieka stacjonarna
- ŚDS — opieka dzienna, osoba wraca do domu na noc, dla osób z zaburzeniami psychicznymi

DOSTĘPNE ARTYKUŁY (linkuj gdy pasuje):
- /poradniki/wybor-opieki/wybor-placowki → "Jak wybrać dom opieki?"
- /poradniki/finanse-prawne/koszty-dps → "Ile kosztuje pobyt w DPS?"
- /poradniki/finanse-prawne/procedura-umieszczenia → "Jak umieścić bliskiego w DPS?"
- /poradniki/dla-seniora/przygotowanie-do-dps → "Jak przygotować się do przeprowadzki?"

FORMAT ODPOWIEDZI:
⚠️ KRYTYCZNE: Twoja odpowiedź MUSI być TYLKO czystym JSON-em. Żadnego tekstu przed ani po JSON!
⚠️ ZAWSZE zaczynaj od { i kończ na }

{
  "answer": "treść odpowiedzi tekstowej (krótka, max 3-4 zdania)",
  "actions": [
    {"type": "placowka", "id": 123, "label": "Zobacz placówkę"},
    {"type": "mapa", "powiat": "olkuski", "label": "Pokaż na mapie"},
    {"type": "search", "query": "dps krakow", "label": "Szukaj DPS w Krakowie"},
    {"type": "artykul", "href": "/poradniki", "label": "Jak wybrać DPS?"}
  ]
}

Pole "actions" może być pustą tablicą [] jeśli nie ma sensownych akcji.
⚠️ PAMIĘTAJ: Odpowiedź w polu "answer" powinna być KRÓTKA (3-4 zdania max), bo użytkownik ma małe okno czatu!
Dodawaj akcje gdy:
- Wspominasz konkretną placówkę → dodaj akcję "placowka" z jej ID
- Pytanie o konkretny powiat/miasto → dodaj akcję "mapa"
- Pytanie ogólne o DPS/ŚDS → dodaj akcję "search"
- Pytanie o procedury/koszty/formalności → dodaj akcję "artykul"

PRZYKŁADY DOBRYCH ODPOWIEDZI:

User: "Szukam DPS w Krakowie dla mamy z demencją"
Assistant: {
  "answer": "W Krakowie i powiecie krakowskim mamy 9 placówek DPS. Dla osoby z demencją polecam sprawdzić placówki z profilem opieki C (chroniczni psychicznie) lub P (przewlekle psychicznie chorzy). Koszt pobytu to zwykle 3000-4500 zł/miesiąc. Sprawdź konkretne placówki na mapie.",
  "actions": [
    {"type": "mapa", "powiat": "krakowski", "label": "Pokaż DPS w Krakowie na mapie"},
    {"type": "search", "query": "dps kraków", "label": "Szukaj DPS w Krakowie"},
    {"type": "artykul", "href": "/poradniki/wybor-opieki/wybor-placowki", "label": "Jak wybrać DPS?"}
  ]
}

User: "Czym się różni DPS od ŚDS?"
Assistant: {
  "answer": "DPS (Dom Pomocy Społecznej) to całodobowa opieka stacjonarna — senior mieszka w placówce. ŚDS (Środowiskowy Dom Samopomocy) to opieka dzienna dla osób z zaburzeniami psychicznymi — senior wraca do domu na noc. DPS jest płatny (3000-6000 zł/miesiąc), ŚDS jest bezpłatny.",
  "actions": [
    {"type": "artykul", "href": "/poradniki/wybor-opieki/wybor-placowki", "label": "Dowiedz się więcej"}
  ]
}

User: "Ile kosztuje DPS?"
Assistant: {
  "answer": "Koszt pobytu w DPS w Małopolsce waha się od 2500 do 6000 zł miesięcznie, średnio około 3500-4000 zł. Cena zależy od powiatu i profilu opieki. Senior płaci ze swojej emerytury, a rodzina dopłaca różnicę jeśli emerytura nie wystarcza.",
  "actions": [
    {"type": "artykul", "href": "/poradniki/finanse-prawne/koszty-dps", "label": "Szczegóły o kosztach"},
    {"type": "search", "query": "dps", "label": "Zobacz ceny w poszczególnych placówkach"}
  ]
}

DANE PLACÓWEK:
${placowkiTekst}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const rawText = response.content
      .map(c => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim()

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          answer: parsed.answer || rawText,
          actions: parsed.actions || [],
        })
      }
    } catch {}

    return NextResponse.json({ answer: rawText, actions: [] })
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
