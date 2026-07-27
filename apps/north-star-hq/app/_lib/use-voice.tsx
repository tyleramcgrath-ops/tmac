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

interface VoiceState {
  enabled: boolean
  setEnabled: (v: boolean) => void
  supported: boolean
  speak: (text: string) => void
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

  useEffect(() => {
    const sup = typeof window !== 'undefined' && 'speechSynthesis' in window
    supportedRef.current = sup
    setSupported(sup)
    const en = readEnabled()
    enabledRef.current = en
    setEnabledState(en)
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
      u.rate = 0.98
      u.pitch = 0.92
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    } catch {}
  }, [])

  return <Ctx.Provider value={{ enabled, setEnabled, supported, speak, speaking }}>{children}</Ctx.Provider>
}

export function useVoice(): VoiceState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}
