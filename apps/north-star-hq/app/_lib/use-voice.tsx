'use client'

// Text-to-speech via the browser's native Web Speech API (speechSynthesis) —
// no external API, no key, no server round-trip. Opt-in and persisted in the
// same 'ns-hq' localStorage bucket the room already uses for timeMode/visited.
// One-way voice output only (the Compass speaks); there is no microphone
// input here.
//
// A single VoiceProvider (mounted once in page.tsx, alongside AuthProvider)
// backs every useVoice() call so toggling the control in the room's header
// is immediately reflected in every consumer (BriefingPanel, CommandConsole,
// ...) — independent per-component state would silently desync the moment
// more than one component read it.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

function readEnabled(): boolean {
  try {
    return Boolean(JSON.parse(localStorage.getItem('ns-hq') || '{}').voice)
  } catch {
    return false
  }
}

function writeEnabled(v: boolean) {
  try {
    const saved = JSON.parse(localStorage.getItem('ns-hq') || '{}')
    localStorage.setItem('ns-hq', JSON.stringify({ ...saved, voice: v }))
  } catch {}
}

// Windows and Chrome both ship two tiers of voice. The legacy ones
// ("Microsoft David Desktop", "Microsoft Zira") are the flat, robotic
// formant-synthesis voices from a decade ago; the modern ones are neural and
// carry "Natural", "Online", or "Google" in their name. speechSynthesis hands
// out a legacy voice by default, which is why an unconfigured room sounds like
// a 1998 screen reader. Rank rather than hard-code: the exact names differ by
// OS version and locale, and a missing hard-coded voice would fall back to the
// worst option silently.
function rankVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase()
  let score = 0
  if (/natural/.test(n)) score += 100
  if (/online/.test(n)) score += 60
  if (/google/.test(n)) score += 50
  if (/aria|jenny|guy|ryan|sonia/.test(n)) score += 20 // the good neural set
  if (/desktop|david|zira|mark/.test(n)) score -= 60   // legacy formant voices
  if (v.lang?.toLowerCase().startsWith('en')) score += 15
  if (v.localService) score -= 5                       // remote ones sound better
  return score
}

function pickBest(voices: SpeechSynthesisVoice[]): string {
  if (!voices.length) return ''
  return [...voices].sort((a, b) => rankVoice(b) - rankVoice(a))[0]?.name ?? ''
}

interface VoiceState {
  enabled: boolean
  setEnabled: (v: boolean) => void
  supported: boolean
  speak: (text: string) => void
  // Every voice the browser offers, best-sounding first, plus the chosen one.
  // Surfaced so the room can let someone pick rather than being stuck with
  // whatever the OS defaults to.
  voices: SpeechSynthesisVoice[]
  voiceName: string
  setVoiceName: (name: string) => void
  // True only for the actual duration the browser is producing audio (driven
  // by the SpeechSynthesisUtterance's own onstart/onend/onerror — never a
  // fixed timer guessing how long a line takes to read), so the Compass's
  // glow genuinely tracks when it's talking, not a fake loop.
  speaking: boolean
}

const Ctx = createContext<VoiceState | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false)
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  // speak() reads these rather than the state values it closes over, so its
  // identity never changes. The room's wake listener and the briefing effect
  // both capture speak once on mount — while voice is still off — so a
  // [enabled]-dependent callback would leave them holding a permanently
  // muted copy and nothing would ever be spoken aloud.
  const enabledRef = useRef(false)
  const supportedRef = useRef(false)
  const voiceNameRef = useRef('')

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceNameState] = useState('')

  useEffect(() => {
    const sup = typeof window !== 'undefined' && 'speechSynthesis' in window
    supportedRef.current = sup
    setSupported(sup)
    const en = readEnabled()
    enabledRef.current = en
    setEnabledState(en)
  }, [])

  // getVoices() is empty on first call in Chrome and fills in asynchronously,
  // so this has to run on voiceschanged as well as on mount — reading once
  // would leave the list permanently empty and fall back to the default voice.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const load = () => {
      const all = window.speechSynthesis.getVoices()
      if (!all.length) return
      const sorted = [...all].sort((a, b) => rankVoice(b) - rankVoice(a))
      setVoices(sorted)

      // Honour a saved choice only while that voice still exists — voices come
      // and go with OS updates and network state, and a stale name would
      // silently resolve to nothing and play the default.
      let saved = ''
      try {
        saved = String(JSON.parse(localStorage.getItem('ns-hq') || '{}').voiceName || '')
      } catch {}
      const chosen = saved && all.some((v) => v.name === saved) ? saved : pickBest(all)
      voiceNameRef.current = chosen
      setVoiceNameState(chosen)
    }

    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const setVoiceName = useCallback((name: string) => {
    voiceNameRef.current = name
    setVoiceNameState(name)
    try {
      const saved = JSON.parse(localStorage.getItem('ns-hq') || '{}')
      localStorage.setItem('ns-hq', JSON.stringify({ ...saved, voiceName: name }))
    } catch {}
    // Preview it, so choosing from a list of opaque names is not guesswork.
    if (enabledRef.current && supportedRef.current) {
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance('Compass online.')
        const v = window.speechSynthesis.getVoices().find((x) => x.name === name)
        if (v) u.voice = v
        u.rate = 0.98
        u.pitch = 0.92
        window.speechSynthesis.speak(u)
      } catch {}
    }
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    enabledRef.current = v
    setEnabledState(v)
    writeEnabled(v)
    if (!v && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!enabledRef.current || !supportedRef.current || !text) return
    try {
      window.speechSynthesis.cancel() // one voice at a time — a new line interrupts the last
      const u = new SpeechSynthesisUtterance(text)
      // Read from the ref, not state — speak()'s identity has to stay stable
      // for the listeners that captured it on mount (see above).
      const chosen = window.speechSynthesis.getVoices().find((v) => v.name === voiceNameRef.current)
      if (chosen) u.voice = chosen
      u.rate = 0.98
      u.pitch = 0.92
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    } catch {}
  }, [])

  return (
    <Ctx.Provider value={{ enabled, setEnabled, supported, speak, speaking, voices, voiceName, setVoiceName }}>
      {children}
    </Ctx.Provider>
  )
}

export function useVoice(): VoiceState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}
