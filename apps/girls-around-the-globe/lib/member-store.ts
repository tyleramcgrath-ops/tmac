"use client";

// Browser-only stand-in for the accounts/swipes/matches/chat backend.
// Everything lives in localStorage under one key so it's easy to replace with
// API calls later.

import { useCallback, useSyncExternalStore } from "react";
import { getProfile } from "./profiles";

export type Member = {
  name: string;
  age: number;
  gender: "woman" | "man" | "nonbinary";
  showMe: "women" | "men" | "everyone";
  city: string;
  bio: string;
  joinedAt: string;
};

export type Message = {
  from: "me" | "them";
  text: string;
  at: string;
};

type State = {
  member: Member | null;
  // Every profile id the visitor has swiped on, either direction.
  seen: string[];
  matches: string[];
  threads: Record<string, Message[]>;
  passport: string | null;
};

const KEY = "gatg:v2";
const EMPTY: State = { member: null, seen: [], matches: [], threads: {}, passport: null };

let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: State) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode); keep the in-memory copy for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getServerSnapshot = () => EMPTY;

export function useStore() {
  const state = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const setMember = useCallback((member: Member | null) => write({ ...read(), member }), []);

  // Returns true when the swipe produced a match.
  const swipe = useCallback((id: string, liked: boolean): boolean => {
    const s = read();
    const seen = s.seen.includes(id) ? s.seen : [...s.seen, id];
    const isMatch = liked && !!getProfile(id)?.likesYou;
    const matches = isMatch && !s.matches.includes(id) ? [id, ...s.matches] : s.matches;
    write({ ...s, seen, matches });
    return isMatch;
  }, []);

  const unmatch = useCallback((id: string) => {
    const s = read();
    const threads = { ...s.threads };
    delete threads[id];
    write({ ...s, matches: s.matches.filter((m) => m !== id), threads });
  }, []);

  const send = useCallback((id: string, msg: Message) => {
    const s = read();
    write({ ...s, threads: { ...s.threads, [id]: [...(s.threads[id] ?? []), msg] } });
  }, []);

  const setPassport = useCallback((passport: string | null) => write({ ...read(), passport }), []);

  const resetDeck = useCallback(() => write({ ...read(), seen: [] }), []);

  return { ...state, setMember, swipe, unmatch, send, setPassport, resetDeck };
}
