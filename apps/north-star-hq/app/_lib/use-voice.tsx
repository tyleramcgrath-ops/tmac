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

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

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
}

const Ctx = createContext<VoiceState | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    setEnabledState(readEnabled())
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    writeEnabled(v)
    if (!v && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported || !text) return
      try {
        window.speechSynthesis.cancel() // one voice at a time — a new line interrupts the last
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.98
        u.pitch = 0.92
        window.speechSynthesis.speak(u)
      } catch {}
    },
    [enabled, supported]
  )

  return <Ctx.Provider value={{ enabled, setEnabled, supported, speak }}>{children}</Ctx.Provider>
}

export function useVoice(): VoiceState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}
