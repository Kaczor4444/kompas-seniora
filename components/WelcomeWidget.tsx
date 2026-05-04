'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Send, Bot, RotateCcw, MapPin, Building2, Search, BookOpen, ThumbsUp, ThumbsDown, Info, HelpCircle, Volume2, VolumeX, Calculator, Globe } from 'lucide-react'
import { useChatbotAnalytics } from '@/src/hooks/useChatbotAnalytics'
import { translations, t, type Language } from '@/lib/translations'

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

// Quick prompts will be loaded dynamically from translations

// Validate shape of a single action from SSE stream (client-side guard)
function isValidAction(a: unknown): a is Action {
  if (!a || typeof a !== 'object') return false
  const obj = a as Record<string, unknown>
  const validTypes = ['placowka', 'mapa', 'search', 'artykul', 'kalkulator']
  return (
    validTypes.includes(obj.type as string) &&
    typeof obj.label === 'string' && obj.label.length <= 100 &&
    (!obj.id || (typeof obj.id === 'number' && obj.id > 0)) &&
    (!obj.href || (typeof obj.href === 'string' && obj.href.startsWith('/'))) &&
    (!obj.powiat || typeof obj.powiat === 'string') &&
    (!obj.query || typeof obj.query === 'string')
  )
}

// Validate shape of messages restored from localStorage
function isValidStoredMessages(data: unknown): data is Message[] {
  if (!Array.isArray(data)) return false
  return data.every(m =>
    m !== null &&
    typeof m === 'object' &&
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.length <= 2000 &&
    (!m.actions || Array.isArray(m.actions))
  )
}

export default function WelcomeWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('chat') // Default to chat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [handWaveAnimation, setHandWaveAnimation] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'dps' | 'sds' | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{nazwa: string, powiat: string}>>([])
  const [selectedLocation, setSelectedLocation] = useState<{nazwa: string, powiat: string} | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>('') // For retry
  const [showTooltip, setShowTooltip] = useState(false) // Onboarding tooltip
  const [language, setLanguage] = useState<Language>('pl') // Language (pl/en)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const pendingQueryRef = useRef<string | null>(null)
  const sendMessageRef = useRef<((text?: string) => void) | null>(null)
  const languageRef = useRef<Language>('pl')
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
        const parsed = JSON.parse(stored)
        const { messages: storedMessages, timestamp } = parsed
        if (
          Date.now() - timestamp < STORAGE_EXPIRY &&
          isValidStoredMessages(storedMessages)
        ) {
          setMessages(storedMessages)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
      localStorage.removeItem(STORAGE_KEY)
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

  // "Zapytaj Asystenta AI o placówkę" — event z listy wyników
  useEffect(() => {
    function handleAskAboutFacility(e: CustomEvent<{ name: string; city: string }>) {
      const { name, city, type, powiat, price, profiles } = e.detail as {
        name: string; city: string; type?: string; powiat?: string;
        price?: number | null; profiles?: string | null;
      }

      let query: string
      if (languageRef.current === 'en') {
        const typeLabel = type === 'DPS' ? 'Residential Care Home (DPS)' : type === 'ŚDS' ? 'Day Care Center (ŚDS)' : type ?? ''
        const parts = [`Describe this facility in English: ${typeLabel} "${name}", located in ${city}${powiat ? `, ${powiat} county` : ''}.`]
        if (price) parts.push(`Monthly cost: ${price} PLN.`)
        else if (price === 0 || price === null) parts.push('Funded by NFZ (no monthly cost).')
        if (profiles) parts.push(`Care profiles: ${profiles}.`)
        parts.push('What type of care does it offer and who is it for?')
        query = parts.join(' ')
      } else {
        const parts = [`Opowiedz mi o placówce "${name}" w ${city}${powiat ? ` (powiat ${powiat})` : ''}.`]
        if (price) parts.push(`Koszt: ${price} zł/miesiąc.`)
        if (profiles) parts.push(`Profile opieki: ${profiles}.`)
        parts.push('Dla kogo jest ta placówka i co oferuje?')
        query = parts.join(' ')
      }
      pendingQueryRef.current = query
      setIsOpen(true)
      setView('chat')
      if (!sessionStart) setSessionStart(Date.now())
    }
    window.addEventListener('askAboutFacility', handleAskAboutFacility as EventListener)
    return () => window.removeEventListener('askAboutFacility', handleAskAboutFacility as EventListener)
  }, [sessionStart])

  // Wykonaj pending query gdy widget jest otwarty i gotowy
  useEffect(() => {
    if (isOpen && view === 'chat' && pendingQueryRef.current && !loading) {
      const q = pendingQueryRef.current
      pendingQueryRef.current = null
      setTimeout(() => sendMessageRef.current?.(q), 150)
    }
  }, [isOpen, view, loading])

  // Auto-open chat when chatbot opens
  useEffect(() => {
    if (isOpen && view === 'chat' && messages.length === 0) {
      openChat()
    }
  }, [isOpen])

  // Auto-focus on input when chat opens
  useEffect(() => {
    if (isOpen && view === 'chat' && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, view])

  // Onboarding tooltip - show once on first chat open
  useEffect(() => {
    if (isOpen && view === 'chat' && messages.length === 0) {
      const hasSeenTooltip = localStorage.getItem('chatbot_tooltip_seen')
      if (!hasSeenTooltip) {
        let innerTimer: ReturnType<typeof setTimeout>
        const timer = setTimeout(() => {
          setShowTooltip(true)
          innerTimer = setTimeout(() => {
            setShowTooltip(false)
            localStorage.setItem('chatbot_tooltip_seen', 'true')
          }, 8000)
        }, 1500)
        return () => {
          clearTimeout(timer)
          clearTimeout(innerTimer)
        }
      }
    }
  }, [isOpen, view, messages.length])

  // Update welcome message when language changes
  useEffect(() => {
    const plWelcome = translations.pl.chatbot.welcome
    const enWelcome = translations.en.chatbot.welcome
    setMessages(prev => {
      if (prev.length === 0 || prev[0].role !== 'assistant') return prev
      if (prev[0].content !== plWelcome && prev[0].content !== enWelcome) return prev
      return [{ ...prev[0], content: t(language, 'chatbot.welcome') }, ...prev.slice(1)]
    })
  }, [language])

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

  // Preload and cache best Polish voice for TTS
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        const polishVoices = voices.filter(v => v.lang.toLowerCase().includes('pl'))

        const preferredNames = [
          'Zofia',             // macOS pl-PL
          'Paulina',           // Google Cloud
          'Jakub',             // Google Cloud (męski)
          'Google polski',     // Chrome
          'Microsoft Paulina', // Windows
        ]

        for (const preferred of preferredNames) {
          const voice = polishVoices.find(v => v.name.includes(preferred))
          if (voice) {
            cachedVoiceRef.current = voice
            return
          }
        }

        if (polishVoices.length > 0) {
          cachedVoiceRef.current = polishVoices[0]
        }
      }

      // Load voices immediately
      loadVoices()

      // Listen for voiceschanged event (Safari/macOS fix)
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  async function sendMessage(retryText?: string) {
    const text = retryText || input.trim()
    if (!text || loading) return

    // Mark as interacted (hide quick prompts)
    setHasInteracted(true)

    // Save for retry (React text nodes are XSS-safe — no sanitization needed)
    setLastUserMessage(text)

    // If retry, remove last error message
    const baseMessages = retryText ? messages.slice(0, -1) : messages
    const newMessages: Message[] = [...baseMessages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Track message
    analytics.trackMessage(text.length, newMessages.length - 1)

    // Hoisted before try so finally block can always cancel stream and clear timeout
    // (covers both fetch phase AND stream reading phase — not just headers)
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 60000)
    // Track whether placeholder message was added, to avoid empty bubble on abort
    let placeholderAdded = false

    try {
      const resp = await fetch('/api/asystent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language: language,
        }),
        signal: abortController.signal,
      })
      // Do NOT clear timeout here — it must cover stream reading too, not just headers

      if (!resp.ok) {
        let errorMessage = t(language, 'chatbot.errors.generic')
        let errorType: '429' | '503' | '500' | 'network' = '500'

        if (resp.status === 429) {
          errorMessage = t(language, 'chatbot.errors.tooManyRequests')
          errorType = '429'
        } else if (resp.status === 503) {
          errorMessage = t(language, 'chatbot.errors.unavailable')
          errorType = '503'
        }

        analytics.trackError(errorType, errorMessage)

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMessage,
          actions: [],
        }])
        return
      }

      // 🎯 STREAMING RESPONSE - Read SSE events
      // reader hoisted so finally block can cancel it on error/timeout
      reader = resp.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      // Create placeholder message that will be updated
      const messageIndex = newMessages.length
      placeholderAdded = true
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        actions: [],
      }])

      let streamedText = ''
      let streamedActions: Action[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data: any
            try {
              data = JSON.parse(line.slice(6))
            } catch {
              continue // skip malformed SSE lines
            }

            if (data.type === 'text') {
              streamedText += data.content
              // Update message with new text
              setMessages(prev => {
                const updated = [...prev]
                updated[messageIndex] = {
                  role: 'assistant',
                  content: streamedText,
                  actions: streamedActions,
                }
                return updated
              })
            } else if (data.type === 'actions') {
              streamedActions = Array.isArray(data.actions)
                ? data.actions.filter(isValidAction)
                : []
              // Update message with actions
              setMessages(prev => {
                const updated = [...prev]
                updated[messageIndex] = {
                  role: 'assistant',
                  content: streamedText,
                  actions: streamedActions,
                }
                return updated
              })
            } else if (data.type === 'done') {
              setLoading(false)
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)

      // Handle timeout/abort
      if (err instanceof Error && err.name === 'AbortError') {
        analytics.trackError('500', 'Request timeout')
        setMessages(prev => {
          // Remove empty placeholder if abort fired during stream reading
          const base = placeholderAdded ? prev.slice(0, -1) : prev
          return [...base, {
            role: 'assistant',
            content: t(language, 'chatbot.errors.generic') + ' (timeout)',
            actions: [],
          }]
        })
      } else {
        analytics.trackError('network', 'Connection failed')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t(language, 'chatbot.errors.network'),
          actions: [],
        }])
      }
    } finally {
      setLoading(false)
      reader?.cancel().catch(() => {})
      clearTimeout(timeoutId)
    }
  }

  // Keep refs in sync each render
  sendMessageRef.current = sendMessage
  languageRef.current = language

  function handleAction(action: Action) {
    const trackableType = action.type === 'kalkulator' ? 'search' : action.type
    analytics.trackAction(trackableType, action.id || action.query)
    setIsOpen(false)

    if (action.type === 'placowka' && action.id) {
      router.push(`/placowka/${action.id}`)
    } else if (action.type === 'mapa' && action.powiat) {
      // Use URLSearchParams to avoid double encoding
      const params = new URLSearchParams()
      params.set('powiat', action.powiat)
      params.set('view', 'map')
      router.push(`/search?${params.toString()}`)
    } else if (action.type === 'search') {
      // Build search URL with filters
      const params = new URLSearchParams()
      params.set('view', 'list')

      if (action.facilityType) {
        params.set('type', action.facilityType)
      }
      if (action.powiat) {
        // URLSearchParams.set() already encodes - NO encodeURIComponent!
        params.set('powiat', action.powiat)
      }
      if (action.query) {
        // URLSearchParams.set() already encodes - NO encodeURIComponent!
        params.set('q', action.query)
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
    // No main menu anymore - reset to chat view
    setView('chat')
  }

  function resetChat() {
    localStorage.removeItem(STORAGE_KEY)
    setHasInteracted(false)
    setMessages([{
      role: 'assistant',
      content: t(language, 'chatbot.welcome'),
      actions: [],
    }])
  }

  function handleClose() {
    if (sessionStart) {
      const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000)
      analytics.trackClose(messages.length, durationSeconds)
      setSessionStart(null)
    }
    setIsOpen(false)
    setView('chat') // Fixed: 'main' view is disabled, use 'chat' instead
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
        content: t(language, 'chatbot.welcome'),
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

  // Text-to-Speech functions
  function speakText(text: string, messageIndex: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(language === 'en'
        ? 'Your browser does not support text reading. Try Chrome or Edge.'
        : 'Twoja przeglądarka nie obsługuje czytania tekstu. Spróbuj Chrome lub Edge.')
      return
    }

    // Limit TTS to 1000 chars to prevent abuse via long AI-generated text
    const safeText = text.length > 1000 ? text.slice(0, 1000) + '...' : text

    // Stop current speech if any
    window.speechSynthesis.cancel()

    // Strip HTML tags and emoji from text
    const plainText = safeText
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Extended pictographs
      .trim()

    const utterance = new SpeechSynthesisUtterance(plainText)

    // 🎯 USE CACHED VOICE (zamiast pobierać getVoices() za każdym razem!)
    const targetLang = language === 'en' ? 'en-US' : 'pl-PL'
    // Only use cached Polish voice when language matches
    if (cachedVoiceRef.current && targetLang === 'pl-PL') {
      utterance.voice = cachedVoiceRef.current
    } else if (targetLang !== 'pl-PL') {
      // For English, let the browser pick the best available voice
      const voices = window.speechSynthesis.getVoices()
      const enVoice = voices.find(v => v.lang.startsWith('en-') && v.localService) ||
                      voices.find(v => v.lang.startsWith('en'))
      if (enVoice) utterance.voice = enVoice
    } else {
      const voices = window.speechSynthesis.getVoices()
      const plVoice = voices.find(v => v.lang === 'pl-PL')
      if (plVoice) { utterance.voice = plVoice; cachedVoiceRef.current = plVoice }
    }

    utterance.lang = targetLang
    utterance.rate = 0.91 // Natural conversation speed (zwiększone o ~7%)
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
      alert(language === 'en'
        ? 'Failed to read text. Please try again.'
        : 'Nie udało się odczytać tekstu. Spróbuj ponownie.')
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
        <div className="mb-3 w-72 sm:w-96 md:w-[28rem] lg:w-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in flex flex-col" style={{ maxHeight: '500px' }}>

          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-start justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={resetToMain}
                  className="text-slate-400 hover:text-white transition-colors mr-1"
                  title="Wstecz"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {view === 'chat' && (
                <div className="relative flex-shrink-0">
                  <img
                    src="/images/advisor-sm.webp"
                    alt="Ola"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
                </div>
              )}
              <div>
                <p className="text-white font-black text-base">
                  {view === 'chat' ? t(language, 'chatbot.title') :
                   view === 'search-type' ? 'Jaki rodzaj? 🏥' :
                   view === 'info-type' ? 'Informacje 📚' :
                   view === 'location' ? 'Gdzie szukasz? 📍' :
                   t(language, 'chatbot.title')}
                </p>
                {view !== 'chat' && (
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">
                    {view === 'search-type' ? 'Wybierz typ placówki' :
                     view === 'info-type' ? 'Wybierz temat' :
                     view === 'location' ? 'Wpisz miejscowość' :
                     'Wybierz opcję poniżej'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3 mt-0.5">
              {view === 'chat' && (
                <>
                  <button
                    onClick={resetChat}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Zacznij od nowa"
                    aria-label="Zacznij rozmowę od nowa"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const newLang = language === 'pl' ? 'en' : 'pl'
                      setLanguage(newLang)
                      setMessages([{
                        role: 'assistant',
                        content: t(newLang, 'chatbot.welcome'),
                        actions: [],
                      }])
                      setHasInteracted(false)
                    }}
                    title={language === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
                    aria-label={language === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
                    className="flex items-center gap-0.5 bg-slate-700 hover:bg-slate-600 rounded-full px-1.5 py-0.5 transition-colors"
                  >
                    <span className={`text-[9px] font-bold transition-colors ${language === 'pl' ? 'text-white' : 'text-slate-400'}`}>PL</span>
                    <span className="text-slate-500 text-[9px]">/</span>
                    <span className={`text-[9px] font-bold transition-colors ${language === 'en' ? 'text-white' : 'text-slate-400'}`}>EN</span>
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label={t(language, 'chatbot.close')}
                title={t(language, 'chatbot.close')}
              >
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
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {/* 🔒 SECURITY: Plain text only - NO dangerouslySetInnerHTML! */}
                      {msg.content}
                    </div>

                    {/* Retry button for error messages */}
                    {msg.role === 'assistant' && i === messages.length - 1 &&
                     (msg.content.includes('błąd') || msg.content.includes('Przepraszam') ||
                      msg.content.includes('niedostępny') || msg.content.includes('problem')) && (
                      <button
                        onClick={() => sendMessage(lastUserMessage)}
                        className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-all shadow-sm"
                        title={t(language, 'chatbot.retry')}
                      >
                        <RotateCcw size={12} /> {t(language, 'chatbot.retry')}
                      </button>
                    )}

                    {/* Thumbs up/down feedback + TTS button */}
                    {msg.role === 'assistant' && i > 0 && !msg.content.includes('błąd') && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => speakingIndex === i ? stopSpeaking() : speakText(msg.content, i)}
                          className={`text-xs p-1 rounded transition-colors ${
                            speakingIndex === i
                              ? 'bg-blue-100 text-blue-700 animate-pulse'
                              : 'text-slate-400 hover:text-blue-600'
                          }`}
                          title={speakingIndex === i ? "Zatrzymaj czytanie" : "Przeczytaj na głos"}
                          aria-label={speakingIndex === i ? "Zatrzymaj czytanie" : "Przeczytaj na głos"}
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
                          aria-label="Pomocna odpowiedź"
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
                          aria-label="Niepomocna odpowiedź"
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
                  <div className="flex items-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 mb-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <div className="text-sm text-slate-800 font-bold">{t(language, 'chatbot.searching')}</div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions (only before first interaction) */}
              {!hasInteracted && view === 'chat' && (
                <div className="px-2 pb-2 flex flex-wrap gap-1 items-center">
                  {t(language, 'prompts').map((prompt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => useQuickPrompt(prompt.href)}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full transition-colors border border-slate-200 hover:border-emerald-300"
                    >
                      {prompt.text}
                    </button>
                  ))}
                  {messages.length > 0 && (
                    <button
                      onClick={() => speakingIndex === 0 ? stopSpeaking() : speakText(messages[0].content, 0)}
                      className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-full border transition-colors ${
                        speakingIndex === 0
                          ? 'bg-blue-100 border-blue-300 text-blue-700 animate-pulse'
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                      }`}
                      title={speakingIndex === 0 ? 'Zatrzymaj' : 'Odczytaj powitanie'}
                      aria-label={speakingIndex === 0 ? 'Zatrzymaj czytanie' : 'Odczytaj powitanie na głos'}
                    >
                      {speakingIndex === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 p-2 flex gap-2 flex-shrink-0 relative">
                {/* Onboarding tooltip */}
                {showTooltip && (
                  <div className="absolute bottom-full left-2 right-2 mb-2 animate-fade-in">
                    <div className="bg-emerald-600 text-white text-xs px-4 py-3 rounded-xl shadow-lg relative">
                      <button
                        onClick={() => {
                          setShowTooltip(false)
                          localStorage.setItem('chatbot_tooltip_seen', 'true')
                        }}
                        className="absolute top-1 right-1 text-white/80 hover:text-white"
                        aria-label="Zamknij podpowiedź"
                      >
                        <X size={14} />
                      </button>
                      <p className="font-bold mb-1">{t(language, 'chatbot.tooltip.title')}</p>
                      <p className="text-xs text-emerald-50">
                        {t(language, 'chatbot.tooltip.example')}
                      </p>
                      {/* Arrow pointing down */}
                      <div className="absolute -bottom-2 left-4 w-4 h-4 bg-emerald-600 transform rotate-45"></div>
                    </div>
                  </div>
                )}

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={t(language, 'chatbot.placeholder')}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  disabled={loading}
                  maxLength={500}
                  aria-label="Wpisz pytanie do asystenta"
                  aria-describedby="chatbot-help-text"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Wyślij wiadomość"
                  title="Wyślij wiadomość"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 pb-2 px-4">
                {messages.length > 1 && (
                  <button
                    onClick={resetChat}
                    className="text-[9px] text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1 transition-colors"
                    aria-label={t(language, 'chatbot.clearChat')}
                  >
                    <RotateCcw size={10} /> {t(language, 'chatbot.clearChat')}
                  </button>
                )}
                <p className="text-[9px] text-slate-400">
                  <kbd className="text-[8px] px-1 py-0.5 bg-slate-200 rounded">Esc</kbd> zamknij
                </p>
              </div>
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
