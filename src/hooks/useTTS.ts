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
  setSpeedLevel: (level: number) => void;
  setReadWholePage: (v: boolean) => void;
  setPlayAutomatically: (v: boolean) => void;
  setVoice: (v: SpeechSynthesisVoice) => void;
  reset: () => void;
  enable: () => void;
  disable: () => void;
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
const SKIP_TAGS = new Set(['NAV','FOOTER','HEADER','BUTTON','INPUT','SELECT','TEXTAREA','SCRIPT','STYLE']);

function findTextElement(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;

  // Bail out if we're inside a skip zone
  while (node && node !== document.body) {
    if (node.dataset.a11yToolbar !== undefined) return null;
    if (SKIP_TAGS.has(node.tagName)) return null;
    if (node.getAttribute('aria-hidden') === 'true') return null;
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
  const [speedLevel, setSpeedLevelState]         = useState(3);       // default = 1.0×
  const [readWholePage, setReadWholePageState]   = useState(false);
  const [playAutomatically, setPlayAutoState]    = useState(false);
  const [voices, setVoices]                      = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState]   = useState<SpeechSynthesisVoice | null>(null);

  const isEnabledRef   = useRef(false);
  const rateRef        = useRef(SPEED_RATES[2]);
  const voiceRef       = useRef<SpeechSynthesisVoice | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);
  const hoverTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'pl-PL';
    utt.rate = rateRef.current;
    utt.pitch = 1;
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.onstart = () => setIsPlaying(true);
    utt.onend   = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt);
  }, []);

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
    highlightedRef.current?.classList.remove('tts-reading');
    highlightedRef.current = null;
  }, []);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (!isEnabledRef.current) return;
    const el = e.target as HTMLElement;
    const textEl = findTextElement(el);
    if (!textEl || textEl === highlightedRef.current) return;

    clearHighlight();
    textEl.classList.add('tts-reading');
    highlightedRef.current = textEl;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const text = textEl.textContent?.trim() ?? '';
      if (text.length > 2) speakText(text);
    }, 350);
  }, [clearHighlight, speakText]);

  // ── Enable / Disable ──────────────────────────────────────────────
  const enable = useCallback(() => {
    isEnabledRef.current = true;
    setIsEnabled(true);
    // readWholePage is read from ref so we use a snapshot
    // We read it from the state closure — it's captured at call time
  }, []);

  const disable = useCallback(() => {
    isEnabledRef.current = false;
    window.speechSynthesis.cancel();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    clearHighlight();
    document.removeEventListener('mouseover', handleMouseOver);
    setIsEnabled(false);
    setIsPlaying(false);
  }, [handleMouseOver, clearHighlight]);

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
  }, [handleMouseOver, clearHighlight]);

  return {
    isEnabled, isPlaying,
    speedLevel, readWholePage, playAutomatically,
    voices, selectedVoice,
    setSpeedLevel, setReadWholePage, setPlayAutomatically, setVoice, reset,
    enable, disable,
  };
}
