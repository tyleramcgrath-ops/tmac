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

  const speak = useCallback((text: string) => {
    if (!enabledRef.current || !supportedRef.current || !text) return
    const synth = window.speechSynthesis

    const utter = () => {
      try {
        // One voice at a time — a new line interrupts the last. Guarded
        // rather than unconditional: Chrome drops an utterance that is queued
        // in the same tick as a cancel() on an already-idle synth, which
        // silently swallowed the first thing the room ever tried to say.
        if (synth.speaking || synth.pending) synth.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.98
        u.pitch = 0.92
        u.onstart = () => setSpeaking(true)
        u.onend = () => setSpeaking(false)
        u.onerror = () => setSpeaking(false)
        synth.speak(u)
      } catch {}
    }

    // Chrome populates getVoices() asynchronously and speaks nothing at all if
    // asked before the list arrives — the failure mode is silence, with no
    // error and no onerror, which is exactly what a user reports as "the
    // voice doesn't work". Wait once for the list, but never block on it: if
    // 'voiceschanged' doesn't fire, speak anyway on the default voice.
    if (synth.getVoices().length === 0) {
      let fired = false
      const go = () => {
        if (fired) return
        fired = true
        synth.removeEventListener('voiceschanged', go)
        utter()
      }
      synth.addEventListener('voiceschanged', go)
      window.setTimeout(go, 300)
      return
    }
    utter()
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    enabledRef.current = v
    setEnabledState(v)
    writeEnabled(v)
    if (!v) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
      }
      return
    }
    // Say something the moment it is switched on. Without this the toggle is
    // unfalsifiable: the only two lines the room speaks unprompted (the wake
    // greeting and the briefing summary) have both already fired by the time
    // the control fades in, so turning voice on produced silence that was
    // indistinguishable from it being broken. Speaking here also lands inside
    // the click, which is the user gesture browsers want before audio.
    speak('Voice on. I have the room.')
  }, [speak])

  return <Ctx.Provider value={{ enabled, setEnabled, supported, speak, speaking }}>{children}</Ctx.Provider>
}

export function useVoice(): VoiceState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}
