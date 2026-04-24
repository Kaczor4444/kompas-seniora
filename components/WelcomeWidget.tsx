'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Send, Bot, RotateCcw, MapPin, Building2, Search, BookOpen, ThumbsUp, ThumbsDown, Info, HelpCircle, Mic, MicOff, Volume2, VolumeX, Calculator } from 'lucide-react'
import { useChatbotAnalytics } from '@/src/hooks/useChatbotAnalytics'

// Type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface Action {
  type: 'placowka' | 'mapa' | 'search' | 'artykul' | 'kalkulator'
  id?: number
  powiat?: string
  query?: string
  href?: string
  label: string
  facilityType?: 'dps' | 'sds' // Type filter for search actions
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: Action[]
  feedback?: 'positive' | 'negative' | null
}

type View = 'main' | 'search-type' | 'info-type' | 'chat' | 'location'

const STORAGE_KEY = 'kompasseniora_chat_history'
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000 // 24h

const QUICK_PROMPTS = [
  { text: "Jak znaleźć DPS?", href: "/poradniki/wybor-opieki/wybor-placowki" },
  { text: "Ile kosztuje pobyt w DPS?", href: "/kalkulator" },
  { text: "Czym różni się DPS od ŚDS?", href: "/poradniki/wybor-opieki/dps-vs-sds" },
  { text: "Pokaż placówki w Krakowie", href: "/search?q=Kraków&powiat=krakowski&view=list" },
]

// Sanitize user input (XSS protection)
function sanitizeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function WelcomeWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('chat') // Default to chat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [bounceAnimation, setBounceAnimation] = useState(false)
  const [handWaveAnimation, setHandWaveAnimation] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'dps' | 'sds' | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{nazwa: string, powiat: string}>>([])
  const [selectedLocation, setSelectedLocation] = useState<{nazwa: string, powiat: string} | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
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

  // Auto-open chat when chatbot opens
  useEffect(() => {
    if (isOpen && view === 'chat' && messages.length === 0) {
      openChat()
    }
  }, [isOpen])

  // Reset location state when entering location view
  useEffect(() => {
    if (view === 'location') {
      setLocationInput('')
      setSelectedLocation(null)
      setLocationSuggestions([])
    }
  }, [view])

  // Location autocomplete
  useEffect(() => {
    if (locationInput.length < 2) {
      setLocationSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teryt/suggest?q=${encodeURIComponent(locationInput)}`)
        const data = await res.json()
        if (data.suggestions && data.suggestions.length > 0) {
          setLocationSuggestions(data.suggestions.slice(0, 5)) // max 5 suggestions
        } else {
          setLocationSuggestions([])
        }
      } catch (err) {
        console.error('Location autocomplete error:', err)
        setLocationSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [locationInput])

  // No bounce animation - removed per user request

  // Hand wave when chatbot opens
  useEffect(() => {
    if (isOpen) {
      setHandWaveAnimation(true)
      const timer = setTimeout(() => {
        setHandWaveAnimation(false)
      }, 1200) // 0.6s × 2 repetitions
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        setVoiceSupported(true)
        const recognition = new SpeechRecognition()
        recognition.lang = 'pl-PL' // Polish language
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsRecording(false)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)

          // Show user-friendly error
          if (event.error === 'not-allowed') {
            alert('Brak dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki.')
          }
        }

        recognition.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    // Mark as interacted (hide quick prompts)
    setHasInteracted(true)

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
    } else if (action.type === 'search') {
      // Build search URL with filters
      const params = new URLSearchParams()
      params.set('view', 'list')

      if (action.facilityType) {
        params.set('type', action.facilityType)
      }
      if (action.powiat) {
        params.set('powiat', encodeURIComponent(action.powiat))
      }
      if (action.query) {
        params.set('q', encodeURIComponent(action.query))
      }

      router.push(`/search?${params.toString()}`)
    } else if (action.type === 'artykul' && action.href) {
      router.push(action.href)
    } else if (action.type === 'kalkulator') {
      router.push('/kalkulator')
    }
  }

  function getActionIcon(type: string) {
    switch (type) {
      case 'placowka': return <Building2 size={11} />
      case 'mapa': return <MapPin size={11} />
      case 'search': return <Search size={11} />
      case 'artykul': return <BookOpen size={11} />
      case 'kalkulator': return <Calculator size={11} />
      default: return null
    }
  }

  function resetToMain() {
    // No main menu anymore - just close chatbot
    handleClose()
  }

  function resetChat() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    // Re-initialize chat with welcome message
    openChat()
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
        content: 'Cześć! Jestem Olek 👋\n\nPomogę Ci znaleźć DPS lub ŚDS w Małopolsce i odpowiem na pytania o opiekę nad seniorem.\n\nWybierz temat z listy lub zadaj swoje pytanie:',
        actions: [],
      }])
    }
  }

  function handleFeedback(messageIndex: number, type: 'positive' | 'negative') {
    setMessages(prev => prev.map((m, i) =>
      i === messageIndex ? { ...m, feedback: type } : m
    ))
    analytics.trackFeedback(messageIndex, type === 'positive')
  }

  function useQuickPrompt(href: string) {
    // Close chatbot and redirect to article/page
    setIsOpen(false)
    router.push(href)
  }

  function startVoiceRecording() {
    if (!voiceSupported || !recognitionRef.current) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Spróbuj Chrome lub Edge.')
      return
    }

    try {
      setIsRecording(true)
      recognitionRef.current.start()
      analytics.trackMessage(0, messages.length) // Track voice usage
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
      alert('Nie można uruchomić mikrofonu. Sprawdź uprawnienia.')
    }
  }

  function stopVoiceRecording() {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  // Text-to-Speech functions
  function speakText(text: string, messageIndex: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Twoja przeglądarka nie obsługuje czytania tekstu. Spróbuj Chrome lub Edge.')
      return
    }

    // Stop current speech if any
    window.speechSynthesis.cancel()

    // Strip HTML tags from text
    const plainText = text.replace(/<[^>]*>/g, '')

    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = 'pl-PL'
    utterance.rate = 0.9 // Slightly slower for seniors
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      setSpeakingIndex(messageIndex)
    }

    utterance.onend = () => {
      setSpeakingIndex(null)
    }

    utterance.onerror = () => {
      setSpeakingIndex(null)
      alert('Nie udało się odczytać tekstu. Spróbuj ponownie.')
    }

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
    }
  }

  function finalSearch() {
    let url = `/search?view=list`

    if (selectedType) {
      url += `&type=${selectedType}`
    }

    // Only add location if user actually selected something from autocomplete AND input is not empty
    if (selectedLocation && locationInput.trim() !== '') {
      url += `&q=${encodeURIComponent(selectedLocation.nazwa)}`
      url += `&powiat=${encodeURIComponent(selectedLocation.powiat)}`
    }

    router.push(url)
    setIsOpen(false)

    // Reset location state for next search
    setLocationInput('')
    setSelectedLocation(null)
    setLocationSuggestions([])
  }

  const showBackButton = false // Disabled - no main menu to go back to
  // const showBackButton = view === 'search-type' || view === 'info-type' || view === 'location'

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
                  {view === 'chat' ? 'W czym mogę pomóc? 👋' :
                   view === 'search-type' ? 'Jaki rodzaj? 🏥' :
                   view === 'info-type' ? 'Informacje 📚' :
                   view === 'location' ? 'Gdzie szukasz? 📍' :
                   'W czym mogę pomóc? 👋'}
                </p>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  {view === 'chat' ? 'Asystent KompasSeniora' :
                   view === 'search-type' ? 'Wybierz typ placówki' :
                   view === 'info-type' ? 'Wybierz temat' :
                   view === 'location' ? 'Wpisz miejscowość' :
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
          {/* TEMPORARILY DISABLED - focusing on chat only
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
          */}

          {/* EKRAN 2a: SEARCH-TYPE - Jaki rodzaj placówki? */}
          {view === 'search-type' && (
            <>
              <div className="p-3 space-y-2">
                <button
                  onClick={() => {
                    setSelectedType('dps')
                    setView('location')
                  }}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">🏠 DPS</p>
                    <p className="text-xs text-slate-600 font-medium">Całodobowa opieka stacjonarna</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                <button
                  onClick={() => {
                    setSelectedType('sds')
                    setView('location')
                  }}
                  className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
                >
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-black text-slate-900">🏥 ŚDS</p>
                    <p className="text-xs text-slate-600 font-medium">Opieka dzienna, wraca na noc</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

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

          {/* EKRAN 3: LOCATION - Gdzie szukasz? */}
          {view === 'location' && (
            <>
              <div className="p-3 space-y-3">
                {/* Input field with autocomplete */}
                <div className="relative">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-300 focus-within:bg-white transition-all">
                    <MapPin size={16} className="text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => {
                        const newValue = e.target.value
                        setLocationInput(newValue)
                        // Reset selected location when user modifies text
                        setSelectedLocation(null)
                        // If user clears the field completely, also clear suggestions
                        if (newValue.trim() === '') {
                          setLocationSuggestions([])
                        }
                      }}
                      placeholder="Wpisz miejscowość..."
                      className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="off"
                    />
                  </div>

                  {/* Autocomplete suggestions dropdown */}
                  {locationSuggestions.length > 0 && !selectedLocation && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedLocation(suggestion)
                            setLocationInput(suggestion.nazwa)
                            setLocationSuggestions([])
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          <p className="text-sm font-bold text-slate-900">{suggestion.nazwa}</p>
                          <p className="text-xs text-slate-500">powiat {suggestion.powiat}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search button - enabled only when location is actually selected */}
                <button
                  onClick={finalSearch}
                  disabled={!selectedLocation || locationInput.trim() === ''}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  Szukaj
                </button>

                {/* Skip button */}
                <button
                  onClick={finalSearch}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 transition-all text-xs font-bold text-slate-600"
                >
                  ⏭️ Pomiń (pokaż wszystkie)
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 pb-3 px-4">184 placówki w Małopolsce</p>
            </>
          )}

          {/* EKRAN 4: CHAT - AI Assistant */}
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

                    {/* Thumbs up/down feedback + TTS button */}
                    {msg.role === 'assistant' && i > 0 && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => speakingIndex === i ? stopSpeaking() : speakText(msg.content, i)}
                          className={`text-xs p-1 rounded transition-colors ${
                            speakingIndex === i
                              ? 'bg-blue-100 text-blue-700 animate-pulse'
                              : 'text-slate-400 hover:text-blue-600'
                          }`}
                          title={speakingIndex === i ? "Zatrzymaj czytanie" : "Przeczytaj na głos"}
                        >
                          {speakingIndex === i ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>
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

              {/* Quick suggestions (only before first interaction) */}
              {!hasInteracted && view === 'chat' && (
                <div className="px-2 pb-2 flex flex-wrap gap-1">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => useQuickPrompt(prompt.href)}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full transition-colors border border-slate-200 hover:border-emerald-300"
                    >
                      {prompt.text}
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
                <kbd className="text-[8px] px-1 py-0.5 bg-slate-200 rounded ml-1">Esc</kbd> zamknij
              </p>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl hover:scale-105 transition-all active:scale-95 overflow-hidden flex items-center justify-center bg-white ${
          isOpen && handWaveAnimation ? 'animate-hand-wave' : ''
        }`}
        aria-label="Pomoc w wyborze placówki"
      >
        {isOpen ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <X size={20} className="text-slate-700" />
          </div>
        ) : (
          <img
            src="/images/advisor-sm.webp"
            alt="Doradca"
            className="w-full h-full object-cover"
          />
        )}
      </button>
    </div>
  )
}
