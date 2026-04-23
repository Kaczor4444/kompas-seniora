'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Send, Bot, RotateCcw, MapPin, Building2, Search, BookOpen, ThumbsUp, ThumbsDown, Info, HelpCircle } from 'lucide-react'
import { useChatbotAnalytics } from '@/src/hooks/useChatbotAnalytics'

interface Action {
  type: 'placowka' | 'mapa' | 'search' | 'artykul'
  id?: number
  powiat?: string
  query?: string
  href?: string
  label: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: Action[]
  feedback?: 'positive' | 'negative' | null
}

type View = 'main' | 'search-type' | 'info-type' | 'chat'

const STORAGE_KEY = 'kompasseniora_chat_history'
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000 // 24h

const QUICK_PROMPTS = [
  "Jaki DPS polecacie w Krakowie?",
  "Ile kosztuje pobyt w DPS?",
  "Czym różni się DPS od ŚDS?",
  "Pokaż placówki w powiecie nowosądeckim",
]

// Sanitize user input (XSS protection)
function sanitizeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function WelcomeWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('main')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [waveAnimation, setWaveAnimation] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const analytics = useChatbotAnalytics()

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { messages: storedMessages, timestamp } = JSON.parse(stored)
        if (Date.now() - timestamp < STORAGE_EXPIRY) {
          setMessages(storedMessages)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          messages: messages.slice(-20), // max 20 messages
          timestamp: Date.now(),
        }))
      } catch (err) {
        console.error('Failed to save chat history:', err)
      }
    }
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Esc = close chatbot
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }

      // Cmd+K = open chatbot
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        if (!sessionStart) {
          setSessionStart(Date.now())
          analytics.trackOpen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, sessionStart, analytics])

  // Stop wave animation after first open
  useEffect(() => {
    if (isOpen) {
      setWaveAnimation(false)
    }
  }, [isOpen])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const sanitized = sanitizeText(text)
    const newMessages: Message[] = [...messages, { role: 'user', content: sanitized }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Track message
    analytics.trackMessage(text.length, newMessages.length - 1)

    try {
      const resp = await fetch('/api/asystent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await resp.json()

      if (!resp.ok || data.error) {
        let errorMessage = 'Przepraszam, wystąpił błąd.'
        let errorType: '429' | '503' | '500' | 'network' = '500'

        if (resp.status === 429) {
          errorMessage = 'Zbyt wiele zapytań. Poczekaj chwilę (ok. 1 min) i spróbuj ponownie.'
          errorType = '429'
        } else if (resp.status === 503) {
          errorMessage = 'Chatbot chwilowo niedostępny. Spróbuj później lub skorzystaj z menu powyżej.'
          errorType = '503'
        } else if (data.error) {
          errorMessage = data.error
        }

        analytics.trackError(errorType, errorMessage)

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMessage,
          actions: [],
        }])
        return
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        actions: data.actions || [],
      }])
    } catch (err) {
      console.error('Chat error:', err)
      analytics.trackError('network', 'Connection failed')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił problem z połączeniem. Sprawdź internet i spróbuj ponownie.',
        actions: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleAction(action: Action) {
    analytics.trackAction(action.type, action.id || action.query)
    setIsOpen(false)

    if (action.type === 'placowka' && action.id) {
      router.push(`/placowka/${action.id}`)
    } else if (action.type === 'mapa' && action.powiat) {
      router.push(`/search?powiat=${encodeURIComponent(action.powiat)}&view=map`)
    } else if (action.type === 'search' && action.query) {
      router.push(`/search?q=${encodeURIComponent(action.query)}`)
    } else if (action.type === 'artykul' && action.href) {
      router.push(action.href)
    }
  }

  function getActionIcon(type: string) {
    switch (type) {
      case 'placowka': return <Building2 size={11} />
      case 'mapa': return <MapPin size={11} />
      case 'search': return <Search size={11} />
      case 'artykul': return <BookOpen size={11} />
      default: return null
    }
  }

  function resetToMain() {
    setView('main')
  }

  function resetChat() {
    setMessages([])
    setView('main')
    localStorage.removeItem(STORAGE_KEY)
  }

  function handleClose() {
    if (sessionStart) {
      const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000)
      analytics.trackClose(messages.length, durationSeconds)
      setSessionStart(null)
    }
    setIsOpen(false)
    setView('main')
  }

  function openChat() {
    setView('chat')
    if (!sessionStart) {
      setSessionStart(Date.now())
      analytics.trackOpen()
    }
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Cześć! Jestem asystentem KompasSeniora. Pomogę Ci znaleźć odpowiednią placówkę opieki dla Twojego bliskiego w Małopolsce. O co chcesz zapytać?',
        actions: [
          { type: 'search', query: 'dps', href: '/search?type=dps', label: 'Pokaż wszystkie DPS' },
          { type: 'artykul', href: '/poradniki', label: 'Poradniki' },
        ],
      }])
    }
  }

  function handleFeedback(messageIndex: number, type: 'positive' | 'negative') {
    setMessages(prev => prev.map((m, i) =>
      i === messageIndex ? { ...m, feedback: type } : m
    ))
    analytics.trackFeedback(messageIndex, type === 'positive')
  }

  function useQuickPrompt(prompt: string) {
    setInput(prompt)
    setTimeout(() => sendMessage(), 100)
  }

  const showBackButton = view === 'search-type' || view === 'info-type'

  return (
    <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in flex flex-col" style={{ maxHeight: '500px' }}>

          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-start justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {showBackButton && (
                <button
                  onClick={resetToMain}
                  className="text-slate-400 hover:text-white transition-colors mr-1"
                  title="Wstecz"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div>
                <p className="text-white font-black text-base">
                  {view === 'chat' ? 'Asystent AI 🤖' :
                   view === 'search-type' ? 'Jaki rodzaj? 🏥' :
                   view === 'info-type' ? 'Informacje 📚' :
                   'W czym mogę pomóc? 👋'}
                </p>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  {view === 'chat' ? 'Pytaj o placówki w Małopolsce' :
                   view === 'search-type' ? 'Wybierz typ placówki' :
                   view === 'info-type' ? 'Wybierz temat' :
                   'Wybierz opcję poniżej'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3 mt-0.5">
              {view === 'chat' && (
                <button onClick={resetChat} className="text-slate-400 hover:text-white transition-colors" title="Zacznij od nowa">
                  <RotateCcw size={14} />
                </button>
              )}
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* EKRAN 1: MAIN - W czym mogę pomóc? */}
          {view === 'main' && (
            <>
              <div className="p-3 space-y-2">
                <button
                  onClick={() => setView('search-type')}
                  className="flex items-center justify-between w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-emerald-900">🔍 Szukam placówki</p>
                    <p className="text-xs text-emerald-700 font-medium">DPS lub ŚDS w Małopolsce</p>
                  </div>
                  <ChevronRight size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                <button
                  onClick={() => setView('info-type')}
                  className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-blue-900">ℹ️ Chcę się dowiedzieć</p>
                    <p className="text-xs text-blue-700 font-medium">Artykuły i poradniki</p>
                  </div>
                  <ChevronRight size={16} className="text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                <button
                  onClick={openChat}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">💬 Mam pytanie</p>
                    <p className="text-xs text-slate-600 font-medium">Zapytaj asystenta AI</p>
                  </div>
                  <Bot size={16} className="text-slate-500 group-hover:text-slate-700 flex-shrink-0" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 pb-3 px-4">Małopolska · 184 placówki · Dane z BIP</p>
            </>
          )}

          {/* EKRAN 2a: SEARCH-TYPE - Jaki rodzaj placówki? */}
          {view === 'search-type' && (
            <>
              <div className="p-3 space-y-2">
                <Link
                  href="/search?type=dps"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">🏠 DPS</p>
                    <p className="text-xs text-slate-600 font-medium">Całodobowa opieka stacjonarna</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>

                <Link
                  href="/search?type=śds"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">🏥 ŚDS</p>
                    <p className="text-xs text-slate-600 font-medium">Opieka dzienna, wraca na noc</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>

                <Link
                  href="/asystent?start=true"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-white">🤷 Nie wiem, pomóż wybrać</p>
                    <p className="text-xs text-emerald-100 font-medium">Asystent dopasuje typ dla Ciebie</p>
                  </div>
                  <HelpCircle size={16} className="text-white flex-shrink-0" />
                </Link>
              </div>
              <p className="text-center text-[10px] text-slate-400 pb-3 px-4">89 DPS · 95 ŚDS · Bezpłatnie</p>
            </>
          )}

          {/* EKRAN 2b: INFO-TYPE - O czym chcesz się dowiedzieć? */}
          {view === 'info-type' && (
            <>
              <div className="p-3 space-y-2">
                <Link
                  href="/poradniki/wybor-opieki/wybor-placowki"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">📖 Czym jest DPS?</p>
                    <p className="text-xs text-slate-600 font-medium">Pełny przewodnik po DPS</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>

                <Link
                  href="/poradniki/wybor-opieki/wybor-placowki"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">📖 Czym jest ŚDS?</p>
                    <p className="text-xs text-slate-600 font-medium">Wszystko o ŚDS</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>

                <Link
                  href="/poradniki/wybor-opieki/wybor-placowki"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">🎯 Jak wybrać placówkę?</p>
                    <p className="text-xs text-slate-600 font-medium">Kryteria wyboru</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>

                <Link
                  href="/poradniki/finanse-prawne/koszty-dps"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">💰 Ile kosztuje?</p>
                    <p className="text-xs text-slate-600 font-medium">Ceny i finansowanie</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              </div>
              <p className="text-center text-[10px] text-slate-400 pb-3 px-4">
                <Link href="/poradniki" className="hover:text-blue-600 transition-colors">
                  Zobacz wszystkie artykuły →
                </Link>
              </p>
            </>
          )}

          {/* EKRAN 3: CHAT - AI Assistant */}
          {view === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: '340px' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    </div>

                    {/* Thumbs up/down feedback */}
                    {msg.role === 'assistant' && i > 0 && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleFeedback(i, 'positive')}
                          className={`text-xs p-1 rounded transition-colors ${
                            msg.feedback === 'positive'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'text-slate-400 hover:text-emerald-600'
                          }`}
                          title="Pomocna odpowiedź"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, 'negative')}
                          className={`text-xs p-1 rounded transition-colors ${
                            msg.feedback === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'text-slate-400 hover:text-red-600'
                          }`}
                          title="Niepomocna odpowiedź"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}

                    {/* Przyciski akcji */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[90%]">
                        {msg.actions.map((action, j) => (
                          <button
                            key={j}
                            onClick={() => handleAction(action)}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 hover:border-emerald-400 transition-all font-medium shadow-sm"
                          >
                            {getActionIcon(action.type)}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] text-slate-500">Przeszukuję 184 placówki...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions (only on initial message) */}
              {messages.length === 1 && (
                <div className="px-2 pb-2 flex flex-wrap gap-1">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => useQuickPrompt(prompt)}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full transition-colors border border-slate-200 hover:border-emerald-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 p-2 flex gap-2 flex-shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Napisz pytanie..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  disabled={loading}
                  maxLength={500}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-400 pb-2 px-4">
                Odpowiada wyłącznie na podstawie danych z bazy ·
                <kbd className="text-[8px] px-1 py-0.5 bg-slate-200 rounded ml-1">Esc</kbd> zamknij
              </p>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl hover:scale-105 transition-all active:scale-95 overflow-hidden flex items-center justify-center bg-white ${
          waveAnimation ? 'animate-wave' : ''
        }`}
        aria-label="Pomoc w wyborze placówki"
      >
        {isOpen ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <X size={20} className="text-slate-700" />
          </div>
        ) : (
          <img src="/images/advisor-sm.webp" alt="Doradca" className="w-full h-full object-cover" />
        )}
      </button>
    </div>
  )
}
