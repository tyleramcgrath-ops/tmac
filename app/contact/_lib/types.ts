// Domain types for Contact. Shared by the client workspace and the two
// AI routes, so the model's output and the UI can never drift apart.

export type Channel = 'email' | 'text' | 'call' | 'linkedin' | 'in-person'

export type Urgency = 'now' | 'this-week' | 'soon'

export type Circle = 'inner' | 'active' | 'dormant'

/** A person in your network. `lastContact` is an ISO date (YYYY-MM-DD). */
export interface Person {
  id: string
  name: string
  role: string
  company: string
  /** Where you met / how you know them — the memory that makes a note land. */
  context: string
  /** Free-form notes: what they care about, what they're working on. */
  notes: string
  tags: string[]
  lastContact: string
  /** How you usually talk to them. */
  channel: Channel
  circle: Circle
  location?: string
  /** True when the user added them by hand in this session. */
  custom?: boolean
}

/** One prioritised reconnection, as returned by the model. */
export interface Pick {
  personId: string
  rank: number
  /** 0–100. How alive the relationship is right now. */
  warmth: number
  urgency: Urgency
  /** Six words or so — the reason at a glance. */
  headline: string
  /** Two or three sentences: why this person, why now. */
  reason: string
  talkingPoints: string[]
  channel: Channel
  /** A first line the user could actually send. */
  opener: string
}

export interface Brief {
  id: string
  createdAt: number
  intent: string
  summary: string
  picks: Pick[]
  /** Model note on who was deliberately left out and why. */
  passedOver?: string
  model?: string
}

export type Tone = 'warm' | 'direct' | 'playful' | 'formal'

export interface Draft {
  id: string
  personId: string
  personName: string
  channel: Channel
  tone: Tone
  intent: string
  body: string
  createdAt: number
  sent?: boolean
}

export interface Account {
  name: string
  email: string
  /** Used to sign drafts and set the voice. */
  role: string
  createdAt: number
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'Email',
  text: 'Text',
  call: 'Call',
  linkedin: 'LinkedIn',
  'in-person': 'In person',
}

export const URGENCY_LABEL: Record<Urgency, string> = {
  now: 'Reach out today',
  'this-week': 'This week',
  soon: 'Soon',
}

export const TONE_LABEL: Record<Tone, string> = {
  warm: 'Warm',
  direct: 'Direct',
  playful: 'Playful',
  formal: 'Formal',
}
