'use client'

// Speech-to-text via the browser's native Web Speech API — the mirror of
// use-voice.tsx, which only ever speaks. No external API, no key, no server
// round-trip, and deliberately the same provider shape so the room can hold
// one VoiceProvider and one MicProvider side by side and have both reflected
// everywhere at once.
//
// Chrome and Edge only. Firefox and Safari ship no SpeechRecognition, so
// `supported` is false there and the room should hide the control rather than
// offer a button that silently does nothing.
//
// FEEDBACK HAZARD — read before wiring this up. The microphone must not be
// open while the Compass is speaking. The browser will happily transcribe
// synthesized speech straight back in, the room will treat it as the next
// question, and the two loop until someone closes the tab. The caller owns
// that guard: gate start() on useVoice().speaking being false, and resume
// only after the utterance's onend has fired.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Minimal local typings. The DOM lib doesn't ship SpeechRecognition, and the
// alternative is `any` at every call site.
interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function readEnabled(): boolean {
  try {
    return Boolean(JSON.parse(localStorage.getItem('ns-hq') || '{}').mic)
  } catch {
    return false
  }
}

function writeEnabled(v: boolean) {
  try {
    const saved = JSON.parse(localStorage.getItem('ns-hq') || '{}')
    localStorage.setItem('ns-hq', JSON.stringify({ ...saved, mic: v }))
  } catch {}
}

interface MicState {
  enabled: boolean
  setEnabled: (v: boolean) => void
  supported: boolean
  // True only while the browser actually has the microphone open, driven by
  // the recognizer's own onstart/onend rather than by us guessing — so the
  // Compass's 'listening' state tracks reality and never sticks lit after the
  // recognizer has quietly given up.
  listening: boolean
  // Imperative, matching speak(). Resolves one utterance: onFinal fires once
  // with the transcript, then the recognizer closes. The room decides whether
  // to call start() again — this hook never re-arms itself, because auto-
  // restart belongs with the code that knows whether the Compass is talking.
  start: (onFinal: (text: string) => void) => void
  stop: () => void
}

const Ctx = createContext<MicState | null>(null)

export function MicProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)

  // Same reasoning as use-voice.tsx: start() reads refs rather than the state
  // it closes over, so its identity never changes and a listener captured once
  // on mount doesn't hold a permanently-disabled copy.
  const enabledRef = useRef(false)
  const supportedRef = useRef(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const onFinalRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    const sup = getCtor() !== null
    supportedRef.current = sup
    setSupported(sup)
    const en = readEnabled()
    enabledRef.current = en
    setEnabledState(en)
  }, [])

  const stop = useCallback(() => {
    const rec = recRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {}
  }, [])

  const setEnabled = useCallback(
    (v: boolean) => {
      enabledRef.current = v
      setEnabledState(v)
      writeEnabled(v)
      if (!v) {
        // Turning the control off must close the mic immediately — leaving it
        // open after the user opted out is the one behaviour nobody forgives.
        try {
          recRef.current?.abort()
        } catch {}
        setListening(false)
      }
    },
    [],
  )

  const start = useCallback((onFinal: (text: string) => void) => {
    if (!enabledRef.current || !supportedRef.current) return
    const Ctor = getCtor()
    if (!Ctor) return

    // One recognizer at a time. Starting a second while the first is live
    // throws InvalidStateError in Chrome and leaves both wedged.
    try {
      recRef.current?.abort()
    } catch {}

    onFinalRef.current = onFinal
    const rec = new Ctor()
    recRef.current = rec
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)

    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r?.isFinal) text += r[0]?.transcript ?? ''
      }
      text = text.trim()
      if (text) onFinalRef.current?.(text)
    }

    rec.onerror = (e) => {
      // 'no-speech' is the user simply not saying anything and 'aborted' is us
      // calling abort() — neither is worth surfacing. Anything else is real,
      // but the room learns about it by watching `listening` go false.
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[mic] recognition error:', e.error)
      }
    }

    rec.onend = () => {
      setListening(false)
      if (recRef.current === rec) recRef.current = null
    }

    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }, [])

  // A tab closed or navigated away mid-utterance should release the mic.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch {}
    }
  }, [])

  return (
    <Ctx.Provider value={{ enabled, setEnabled, supported, listening, start, stop }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMic(): MicState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMic must be used within MicProvider')
  return ctx
}
