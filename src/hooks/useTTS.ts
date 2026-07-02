'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceGender = 'female' | 'male' | 'unknown';

export interface TTSVoice {
  voice: SpeechSynthesisVoice;
  gender: VoiceGender;
  label: string;
}

export interface TTSState {
  isEnabled: boolean;
  isPlaying: boolean;
  speedLevel: number;           // 1–5
  readWholePage: boolean;       // false = hover mode, true = read all
  playAutomatically: boolean;   // auto-start when enabled
  voices: TTSVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  readingIndex: number;         // -1 = not in navigation mode
  readingTotal: number;
  setSpeedLevel: (level: number) => void;
  setReadWholePage: (v: boolean) => void;
  setPlayAutomatically: (v: boolean) => void;
  setVoice: (v: SpeechSynthesisVoice) => void;
  reset: () => void;
  enable: () => void;
  disable: () => void;
  speakNext: () => void;
  speakPrev: () => void;
}

const SPEED_RATES: number[] = [0.6, 0.8, 1.0, 1.3, 1.7];

const FEMALE_PATTERNS = /zosia|kobieta|female|woman|agnieszka|paulina|anna|ewa|monika|google polish/i;
const MALE_PATTERNS   = /marek|mężczyzna|male|man|piotr|krzysztof|adam|janusz/i;

function classifyVoice(v: SpeechSynthesisVoice): TTSVoice {
  const n = v.name;
  const gender: VoiceGender = FEMALE_PATTERNS.test(n) ? 'female' : MALE_PATTERNS.test(n) ? 'male' : 'unknown';
  const label = gender === 'female' ? 'Kobieta' : gender === 'male' ? 'Mężczyzna' : v.name;
  return { voice: v, gender, label };
}

const BLOCK_TAGS = new Set([
  'P','H1','H2','H3','H4','H5','H6','LI','TD','TH','BLOCKQUOTE','FIGCAPTION','LABEL','DT','DD','CAPTION','SUMMARY',
]);
const INLINE_TAGS = new Set(['A','SPAN','STRONG','EM','B','I','U','ABBR','CITE','CODE']);
const SKIP_TAGS = new Set(['FOOTER','INPUT','SELECT','TEXTAREA','SCRIPT','STYLE']);

function getReadableText(el: HTMLElement): string {
  return el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim() || '';
}

// Maps a charIndex from SpeechSynthesisUtterance text back to a DOM Range.
// Only works when spoken text comes from textContent (not aria-label/title).
function getTextRange(el: HTMLElement, charIndex: number, charLength: number): Range | null {
  try {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let cumulative = 0;
    let startNode: Text | null = null, startOff = 0;
    let endNode: Text | null = null, endOff = 0;
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const len = node.textContent?.length ?? 0;
      if (!startNode && cumulative + len > charIndex) {
        startNode = node; startOff = charIndex - cumulative;
      }
      if (startNode && cumulative + len >= charIndex + charLength) {
        endNode = node; endOff = charIndex + charLength - cumulative;
        break;
      }
      cumulative += len;
    }
    if (!startNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode ?? startNode, endNode ? endOff : Math.min(startOff + charLength, startNode.length));
    return range;
  } catch { return null; }
}

const CSS_HL_SUPPORTED = typeof CSS !== 'undefined' && 'highlights' in CSS;

function setWordHighlight(range: Range | null) {
  if (!CSS_HL_SUPPORTED || !range) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (CSS as any).highlights.set('tts-word', new (window as any).Highlight(range));
}

function clearWordHighlight() {
  if (!CSS_HL_SUPPORTED) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (CSS as any).highlights.delete('tts-word');
}

// Inject ::highlight(tts-word) rule via JS — Turbopack rejects it in CSS files
let highlightStyleInjected = false;
function injectHighlightStyle() {
  if (highlightStyleInjected || !CSS_HL_SUPPORTED) return;
  const style = document.createElement('style');
  style.textContent = '::highlight(tts-word){color:#7c2d12;background-color:#fbbf24;}';
  document.head.appendChild(style);
  highlightStyleInjected = true;
}

function collectReadableElements(): HTMLElement[] {
  let root: Element | null = null;
  for (const sel of ['main', 'article', '[role="main"]']) {
    root = document.querySelector(sel);
    if (root) break;
  }
  return (Array.from((root ?? document.body).querySelectorAll('h1,h2,h3,h4,h5,h6,p,li')) as HTMLElement[])
    .filter(el => {
      const t = el.textContent?.trim() ?? '';
      return t.length > 10
        && !el.closest('[data-a11y-toolbar]')
        && !el.closest('nav')
        && !el.closest('footer');
    });
}

function findTextElement(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;

  // Bail out if we're inside a skip zone
  while (node && node !== document.body) {
    if (node.dataset.a11yToolbar !== undefined) return null;
    if (SKIP_TAGS.has(node.tagName)) return null;
    if (node.getAttribute('aria-hidden') === 'true') return null;
    node = node.parentElement;
  }

  // Priority: button — read just the button, not its parent block
  node = el;
  while (node && node !== document.body) {
    if (node.tagName === 'BUTTON' && getReadableText(node).length > 0) return node;
    node = node.parentElement;
  }

  // Walk up looking for a block-level container first
  node = el;
  while (node && node !== document.body) {
    if (BLOCK_TAGS.has(node.tagName) && (node.textContent?.trim().length ?? 0) > 3) return node;
    node = node.parentElement;
  }

  // Fallback: if the element itself (or ancestor) is an inline tag with text, use it
  node = el;
  while (node && node !== document.body) {
    if (INLINE_TAGS.has(node.tagName) && (node.textContent?.trim().length ?? 0) > 0) return node;
    node = node.parentElement;
  }

  return null;
}

export function useTTS(): TTSState {
  const [isEnabled, setIsEnabled]               = useState(false);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [speedLevel, setSpeedLevelState]         = useState(3);
  const [readWholePage, setReadWholePageState]   = useState(false);
  const [playAutomatically, setPlayAutoState]    = useState(false);
  const [voices, setVoices]                      = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState]   = useState<SpeechSynthesisVoice | null>(null);
  const [readingIndex, setReadingIndex]          = useState(-1);
  const [readingTotal, setReadingTotal]          = useState(0);

  const isEnabledRef       = useRef(false);
  const rateRef            = useRef(SPEED_RATES[2]);
  const voiceRef           = useRef<SpeechSynthesisVoice | null>(null);
  const highlightedRef     = useRef<HTMLElement | null>(null);
  const speakingElRef      = useRef<HTMLElement | null>(null);
  const hoverTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readingElementsRef = useRef<HTMLElement[]>([]);
  const readingIndexRef    = useRef(-1);

  // Load voices
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const pl = all.filter(v => v.lang.startsWith('pl'));
      const raw = pl.length > 0 ? pl : all.slice(0, 8);
      const classified = raw.map(classifyVoice);
      setVoices(classified);
      if (!voiceRef.current && raw.length > 0) {
        voiceRef.current = raw[0];
        setSelectedVoiceState(raw[0]);
      }
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const setSpeedLevel = useCallback((level: number) => {
    const rate = SPEED_RATES[level - 1] ?? 1.0;
    rateRef.current = rate;
    setSpeedLevelState(level);
  }, []);

  const setReadWholePage = useCallback((v: boolean) => setReadWholePageState(v), []);
  const setPlayAutomatically = useCallback((v: boolean) => setPlayAutoState(v), []);

  const setVoice = useCallback((v: SpeechSynthesisVoice) => {
    voiceRef.current = v;
    setSelectedVoiceState(v);
  }, []);

  const reset = useCallback(() => {
    rateRef.current = SPEED_RATES[2];
    setSpeedLevelState(3);
    setReadWholePageState(false);
    setPlayAutoState(false);
  }, []);

  const clearSpeakingHighlight = useCallback(() => {
    speakingElRef.current?.classList.remove('tts-speaking');
    speakingElRef.current = null;
  }, []);

  const speakText = useCallback((text: string, el?: HTMLElement) => {
    window.speechSynthesis.cancel();
    clearSpeakingHighlight();
    clearWordHighlight();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'pl-PL';
    utt.rate = rateRef.current;
    utt.pitch = 1;
    if (voiceRef.current) utt.voice = voiceRef.current;
    if (el) {
      speakingElRef.current = el;
      el.classList.add('tts-speaking');
      // Word-by-word highlight — only when text comes from textContent
      const fromTextContent = text === (el.textContent?.trim() ?? '');
      if (fromTextContent) {
        utt.onboundary = (ev: SpeechSynthesisEvent) => {
          if (ev.name !== 'word') return;
          setWordHighlight(getTextRange(el, ev.charIndex, ev.charLength ?? 1));
        };
      }
    }
    utt.onstart = () => setIsPlaying(true);
    utt.onend   = () => { clearWordHighlight(); clearSpeakingHighlight(); setIsPlaying(false); };
    utt.onerror = () => { clearWordHighlight(); clearSpeakingHighlight(); setIsPlaying(false); };
    window.speechSynthesis.speak(utt);
  }, [clearSpeakingHighlight]);

  // ── Whole-page reading ─────────────────────────────────────────────
  const speakWholePageRef = useRef<() => void>(() => {});
  speakWholePageRef.current = () => {
    let root: Element | null = null;
    for (const sel of ['main','article','[role="main"]']) {
      root = document.querySelector(sel);
      if (root) break;
    }
    if (!root) root = document.body;
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('nav,footer,header,[data-a11y-toolbar],script,style,[aria-hidden="true"],.sr-only').forEach(el => el.remove());
    const text = (clone.textContent || '').replace(/\s+/g,' ').trim();
    if (text.length > 5) speakText(text);
  };

  // ── Hover-to-read ──────────────────────────────────────────────────
  const clearHighlight = useCallback(() => {
    highlightedRef.current?.classList.remove('tts-hover');
    highlightedRef.current = null;
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (!isEnabledRef.current) return;
    const el = e.target as HTMLElement;
    const textEl = findTextElement(el);
    if (!textEl || textEl === highlightedRef.current) return;

    clearHighlight();
    textEl.classList.add('tts-hover');
    highlightedRef.current = textEl;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const text = getReadableText(textEl);
      if (text.length > 2) speakText(text, textEl);
    }, 350);
  }, [clearHighlight, speakText]);

  // ── Navigation ────────────────────────────────────────────────────
  const speakAt = useCallback((idx: number) => {
    const els = readingElementsRef.current;
    if (idx < 0 || idx >= els.length) return;
    readingIndexRef.current = idx;
    setReadingIndex(idx);
    const el = els[idx];
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const text = el.textContent?.trim() ?? '';
    if (text.length > 2) speakText(text, el);
  }, [speakText]);

  const speakNext = useCallback(() => {
    if (!isEnabledRef.current) {
      injectHighlightStyle();
      isEnabledRef.current = true;
      setIsEnabled(true);
    }
    if (readingElementsRef.current.length === 0) {
      const els = collectReadableElements();
      readingElementsRef.current = els;
      setReadingTotal(els.length);
      readingIndexRef.current = -1;
      setReadingIndex(-1);
    }
    speakAt(readingIndexRef.current + 1);
  }, [speakAt]);

  const speakPrev = useCallback(() => {
    speakAt(readingIndexRef.current - 1);
  }, [speakAt]);

  // ── Enable / Disable ──────────────────────────────────────────────
  const enable = useCallback(() => {
    injectHighlightStyle();
    isEnabledRef.current = true;
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    isEnabledRef.current = false;
    window.speechSynthesis.cancel();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    clearHighlight();
    clearSpeakingHighlight();
    readingElementsRef.current = [];
    readingIndexRef.current = -1;
    setReadingIndex(-1);
    setReadingTotal(0);
    document.removeEventListener('mouseover', handleMouseOver);
    setIsEnabled(false);
    setIsPlaying(false);
  }, [handleMouseOver, clearHighlight, clearSpeakingHighlight]);

  // React to isEnabled + readWholePage changes
  const readWholePageRef = useRef(false);
  useEffect(() => { readWholePageRef.current = readWholePage; }, [readWholePage]);

  useEffect(() => {
    if (!isEnabled) return;
    if (readWholePage) {
      // Whole page mode
      document.removeEventListener('mouseover', handleMouseOver);
      clearHighlight();
      speakWholePageRef.current();
    } else {
      // Hover mode
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      document.addEventListener('mouseover', handleMouseOver, { passive: true });
    }
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isEnabled, readWholePage, handleMouseOver, clearHighlight]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    document.removeEventListener('mouseover', handleMouseOver);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    clearHighlight();
    clearSpeakingHighlight();
  }, [handleMouseOver, clearHighlight, clearSpeakingHighlight]);

  return {
    isEnabled, isPlaying,
    speedLevel, readWholePage, playAutomatically,
    voices, selectedVoice,
    readingIndex, readingTotal,
    setSpeedLevel, setReadWholePage, setPlayAutomatically, setVoice, reset,
    enable, disable,
    speakNext, speakPrev,
  };
}
