'use client'

// The conversation loop: microphone in, Hermes in the middle, voice out, with
// the Compass reflecting each stage.
//
//   listen() → 'listening' → transcript → ask() → 'thinking'
//            → reply → speak() → 'speaking' → 'idle'
//
// Kept out of page.tsx so DeskRoom stays a room and not a chat client. The
// room supplies its own C() and otherwise calls two functions.
//
// COMPASS OWNERSHIP — this hook only drives the compass while a turn is
// actually in flight, and releases it with a single 'idle' when the turn ends.
// It never asserts 'idle' on a loop. agent-signal.ts deliberately keeps
// ambient roster signals ('warning'/'thinking') as the only other source, and
// two things writing the compass every render would fight and flicker.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CompassState } from '../compass'
import { useVoice } from './use-voice'
import { useMic } from './use-mic'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface CompassChat {
  ask: (text: string) => Promise<void>
  listen: () => void
  stop: () => void
  busy: boolean
  error: string | null
  history: ChatTurn[]
  // Hands-free. When on, the mic reopens after each spoken reply — but only
  // once speechSynthesis has genuinely finished, never on a timer.
  conversation: boolean
  setConversation: (v: boolean) => void
  supported: boolean
}

export function useCompassChat(onState: (s: CompassState) => void): CompassChat {
  const voice = useVoice()
  const mic = useMic()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ChatTurn[]>([])
  const [conversation, setConversationState] = useState(false)

  // Refs for anything read inside callbacks whose identity must stay stable —
  // same reasoning as use-voice.tsx, where a listener captured once on mount
  // would otherwise hold a stale copy forever.
  const onStateRef = useRef(onState)
  const historyRef = useRef<ChatTurn[]>([])
  const conversationRef = useRef(false)
  const busyRef = useRef(false)
  const engagedRef = useRef(false)
  const wasSpeakingRef = useRef(false)

  useEffect(() => {
    onStateRef.current = onState
  })

  const ask = useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean || busyRef.current) return

      setError(null)
      busyRef.current = true
      setBusy(true)

      const next = [...historyRef.current, { role: 'user' as const, content: clean }]
      historyRef.current = next
      setHistory(next)

      try {
        const res = await fetch('/api/compass/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next }),
        })
        const data = (await res.json().catch(() => null)) as
          | { reply?: string; error?: string }
          | null

        if (!res.ok || !data?.reply) {
          // The route already turns configuration and upstream problems into
          // readable sentences ("out of credit", "not configured on this
          // deployment"); show that rather than inventing our own.
          throw new Error(data?.error || 'The Compass could not answer.')
        }

        const withReply = [...next, { role: 'assistant' as const, content: data.reply }]
        historyRef.current = withReply
        setHistory(withReply)
        voice.speak(data.reply)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'The Compass could not answer.'
        setError(message)
        onStateRef.current('error')
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    },
    [voice],
  )

  const listen = useCallback(() => {
    // Never open the mic while the Compass is talking — the browser will
    // transcribe its own synthesized speech straight back in and the two will
    // loop until the tab is closed.
    if (busyRef.current || voice.speaking) return
    mic.start((text) => {
      void ask(text)
    })
  }, [ask, mic, voice.speaking])

  const stop = useCallback(() => {
    mic.stop()
  }, [mic])

  const setConversation = useCallback(
    (v: boolean) => {
      conversationRef.current = v
      setConversationState(v)
      if (v) listen()
      else mic.stop()
    },
    [listen, mic],
  )

  // Reflect the live stage on the compass, but only while we own it.
  useEffect(() => {
    const engaged = busy || voice.speaking || mic.listening
    if (engaged) {
      engagedRef.current = true
      onStateRef.current(busy ? 'thinking' : voice.speaking ? 'speaking' : 'listening')
    } else if (engagedRef.current) {
      // One release, then silence — so ambient roster signals aren't stomped
      // on every render by a hook that has nothing to say.
      engagedRef.current = false
      onStateRef.current('idle')
    }
  }, [busy, voice.speaking, mic.listening])

  // Hands-free re-arm, gated on a real speaking → silent transition rather
  // than on `speaking` merely being false (which is also true before the
  // first word is ever spoken, and would open the mic on mount).
  useEffect(() => {
    const finished = wasSpeakingRef.current && !voice.speaking
    wasSpeakingRef.current = voice.speaking
    if (!finished || !conversationRef.current) return

    const id = setTimeout(() => {
      if (conversationRef.current && !busyRef.current && !voice.speaking) listen()
    }, 400)
    return () => clearTimeout(id)
  }, [voice.speaking, listen])

  // If voice output is off there is nothing to wait on, so hands-free has to
  // re-arm off the end of the request instead.
  useEffect(() => {
    if (busy || !conversationRef.current || voice.enabled || mic.listening) return
    const id = setTimeout(() => {
      if (conversationRef.current && !busyRef.current) listen()
    }, 400)
    return () => clearTimeout(id)
  }, [busy, voice.enabled, mic.listening, listen])

  return {
    ask,
    listen,
    stop,
    busy,
    error,
    history,
    conversation,
    setConversation,
    supported: mic.supported,
  }
}
