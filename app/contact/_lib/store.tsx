'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SEED_PEOPLE } from './seed'
import type { Account, Brief, Draft, Person } from './types'

// Contact keeps its state on the device. There is no server-side account in
// this build: the workspace is real and fully interactive, and everything a
// user creates (people, briefs, drafts, "sent" history) survives a reload via
// localStorage. Only the AI calls go to the server.

const KEY = 'contact.so:v1'

interface Persisted {
  account: Account | null
  people: Person[]
  briefs: Brief[]
  drafts: Draft[]
  dismissed: string[]
}

const EMPTY: Persisted = {
  account: null,
  people: SEED_PEOPLE,
  briefs: [],
  drafts: [],
  dismissed: [],
}

interface StoreValue extends Persisted {
  /** False until localStorage has been read — used to gate skeletons. */
  ready: boolean
  signIn: (account: Account) => void
  signOut: () => void
  addPerson: (person: Person) => void
  updatePerson: (id: string, patch: Partial<Person>) => void
  removePerson: (id: string) => void
  addBrief: (brief: Brief) => void
  saveDraft: (draft: Draft) => void
  markDraftSent: (id: string) => void
  removeDraft: (id: string) => void
  dismiss: (personId: string) => void
  undismissAll: () => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function read(): Persisted {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      account: parsed.account ?? null,
      people: parsed.people?.length ? parsed.people : SEED_PEOPLE,
      briefs: parsed.briefs ?? [],
      drafts: parsed.drafts ?? [],
      dismissed: parsed.dismissed ?? [],
    }
  } catch {
    return EMPTY
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY)
  const [ready, setReady] = useState(false)

  // Read after mount so server and client render the same first paint.
  useEffect(() => {
    setState(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Private mode / quota — the session still works, it just won't persist.
    }
  }, [state, ready])

  const patch = useCallback((fn: (prev: Persisted) => Persisted) => {
    setState(fn)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      signIn: (account) => patch((p) => ({ ...p, account })),
      signOut: () => patch((p) => ({ ...p, account: null })),
      addPerson: (person) => patch((p) => ({ ...p, people: [person, ...p.people] })),
      updatePerson: (id, next) =>
        patch((p) => ({
          ...p,
          people: p.people.map((person) => (person.id === id ? { ...person, ...next } : person)),
        })),
      removePerson: (id) =>
        patch((p) => ({ ...p, people: p.people.filter((person) => person.id !== id) })),
      addBrief: (brief) => patch((p) => ({ ...p, briefs: [brief, ...p.briefs].slice(0, 12) })),
      saveDraft: (draft) =>
        patch((p) => ({
          ...p,
          drafts: [draft, ...p.drafts.filter((d) => d.id !== draft.id)].slice(0, 60),
        })),
      markDraftSent: (id) =>
        patch((p) => {
          const draft = p.drafts.find((d) => d.id === id)
          const today = new Date().toISOString().slice(0, 10)
          return {
            ...p,
            drafts: p.drafts.map((d) => (d.id === id ? { ...d, sent: true } : d)),
            // Sending is the one action that changes the network itself.
            people: draft
              ? p.people.map((person) =>
                  person.id === draft.personId ? { ...person, lastContact: today } : person
                )
              : p.people,
          }
        }),
      removeDraft: (id) => patch((p) => ({ ...p, drafts: p.drafts.filter((d) => d.id !== id) })),
      dismiss: (personId) =>
        patch((p) => ({ ...p, dismissed: [...new Set([...p.dismissed, personId])] })),
      undismissAll: () => patch((p) => ({ ...p, dismissed: [] })),
      resetDemo: () => {
        const account = state.account
        setState({ ...EMPTY, account })
      },
    }),
    [state, ready, patch]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}
