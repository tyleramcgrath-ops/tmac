/**
 * North Star Headquarters — state engine.
 *
 * Bible §14 (Implementation Architecture) requires a state engine that maps
 * product truth onto the Core, the room and the environment. This module is
 * that mapping, kept pure and free of React so it can be unit-tested and so
 * the scene renderer stays a dumb projection of a single `SceneModel`.
 *
 * Bible §06 (Environmental Intelligence): the room changes with meaning, not
 * mood theater. North Star never claims emotions — copy describes state
 * (confident, uncertain, investigating, blocked, completed) and the visual
 * language communicates confidence, urgency, uncertainty and progress.
 */

/** Core states, Bible §05. `completion` is transient — see COMPLETION_HOLD_MS. */
export const CORE_STATES = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'opportunity',
  'concern',
  'completion',
] as const
export type CoreState = (typeof CORE_STATES)[number]

/** Environmental states, Bible §06 state mapping. */
export const ENVIRONMENT_STATES = [
  'confident', // healthy and confident: warm early-morning light, clear horizon
  'analyzing', // cooler neutral light, reduced exterior distraction
  'uncertain', // unknown or low confidence: soft fog, dimmer distant view
  'warning', // amber accents, heavier clouds, slower mechanical movement
  'overnight', // deep night, visible stars
  'success', // returning sunlight, richer brass, brief completion wave
] as const
export type EnvironmentState = (typeof ENVIRONMENT_STATES)[number]

export const TIMES_OF_DAY = ['dawn', 'day', 'dusk', 'night'] as const
export type TimeOfDay = (typeof TIMES_OF_DAY)[number]

/**
 * Product truth — the honest inputs the scene is allowed to react to.
 * Bible §16 rejects fabricated telemetry: every field here must ultimately be
 * fed by a real subsystem. In Phase 1 (headquarters + Core only) the preview
 * console sets these values explicitly and is clearly labeled as a preview.
 */
export interface ProductTruth {
  /** What North Star is doing right now. */
  activity: CoreState
  /** Belief quality across the active project. */
  confidence: 'high' | 'moderate' | 'low' | 'unknown'
  /** Whether anything currently deserves the user's attention. */
  attention: 'none' | 'watch' | 'warning'
  /** True while agents are running scheduled overnight work. */
  overnightWork: boolean
}

/** Sky composition flags — structural (rendered or not), derived, never set directly. */
export interface SkyModel {
  stars: boolean
  /** The actual North Star, visible during night states, aligned with the Core (Bible §02). */
  northStar: boolean
  moon: boolean
  /** Dawn/sunrise glow at the horizon. */
  sunrise: boolean
  rain: boolean
  fog: boolean
  /** 0 = clear horizon, 1 = ambient cloud, 2 = heavy weather. */
  cloudDensity: 0 | 1 | 2
}

/** The single object the scene renders. */
export interface SceneModel {
  core: CoreState
  env: EnvironmentState
  time: TimeOfDay
  sky: SkyModel
  /** Non-visual state description for the accessibility layer (aria-live). */
  narration: string
}

/** How long the transient completion state holds before settling back to idle. */
export const COMPLETION_HOLD_MS = 2600

/** Local-clock time of day. Dawn 05–08, day 08–17, dusk 17–20, night 20–05. */
export function deriveTimeOfDay(date: Date): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

/**
 * Map product truth to the environmental state, Bible §06.
 * Precedence: explicit warning > overnight work > core-coupled states
 * (§05 couples opportunity→sunrise, concern→warning weather, completion→success)
 * > confidence.
 */
export function deriveEnvironment(truth: ProductTruth, time: TimeOfDay): EnvironmentState {
  if (truth.attention === 'warning' || truth.activity === 'concern') return 'warning'
  if (truth.activity === 'completion') return 'success'
  if (truth.activity === 'opportunity') return 'confident'
  if (truth.overnightWork && time === 'night') return 'overnight'
  if (truth.activity === 'thinking' || truth.activity === 'listening') return 'analyzing'
  if (truth.confidence === 'low' || truth.confidence === 'unknown') return 'uncertain'
  return 'confident'
}

/** Structural sky flags for a given environment + time. */
export function deriveSky(env: EnvironmentState, time: TimeOfDay): SkyModel {
  const night = time === 'night' || env === 'overnight'
  return {
    stars: night,
    // Bible §02: the actual North Star may become visible during night
    // states, aligned with the Core. Heavy weather hides it.
    northStar: night && env !== 'warning',
    moon: night && env !== 'warning',
    sunrise: (time === 'dawn' && env !== 'warning') || env === 'success' || env === 'confident',
    rain: env === 'warning',
    fog: env === 'uncertain',
    cloudDensity: env === 'warning' ? 2 : env === 'analyzing' || env === 'uncertain' ? 1 : night ? 0 : 1,
  }
}

/**
 * Non-visual narration for the accessibility layer.
 * Bible §06 temperature language: describe state, never feelings.
 * Bible §17 voice: calm, direct, brief, evidence-first.
 */
export function narrate(core: CoreState, env: EnvironmentState, time: TimeOfDay): string {
  const coreLine: Record<CoreState, string> = {
    idle: 'North Star is at rest.',
    listening: 'North Star is listening.',
    thinking: 'North Star is investigating.',
    speaking: 'North Star is speaking.',
    opportunity: 'North Star has aligned on an opportunity.',
    concern: 'North Star has found something that deserves attention.',
    completion: 'North Star has completed a task.',
  }
  const envLine: Record<EnvironmentState, string> = {
    confident: 'The room is confident: warm light and a clear horizon.',
    analyzing: 'The room is analyzing: cooler, quieter light.',
    uncertain: 'Confidence is low: soft fog beyond the window.',
    warning: 'A warning is active: amber accents and heavier weather.',
    overnight: 'Overnight operation: deep night with visible stars.',
    success: 'Work verified: returning sunlight.',
  }
  const timeLine: Record<TimeOfDay, string> = {
    dawn: 'It is dawn at headquarters.',
    day: 'It is daytime at headquarters.',
    dusk: 'It is dusk at headquarters.',
    night: 'It is night at headquarters.',
  }
  return `${coreLine[core]} ${envLine[env]} ${timeLine[time]}`
}

/** Compose the full scene model from product truth. */
export function composeScene(truth: ProductTruth, now: Date | TimeOfDay = new Date()): SceneModel {
  const time = typeof now === 'string' ? now : deriveTimeOfDay(now)
  const env = deriveEnvironment(truth, time)
  const sky = deriveSky(env, time)
  return { core: truth.activity, env, time, sky, narration: narrate(truth.activity, env, time) }
}

/** Type guards for URL-driven preview parameters. */
export function isCoreState(v: string | null | undefined): v is CoreState {
  return typeof v === 'string' && (CORE_STATES as readonly string[]).includes(v)
}
export function isEnvironmentState(v: string | null | undefined): v is EnvironmentState {
  return typeof v === 'string' && (ENVIRONMENT_STATES as readonly string[]).includes(v)
}
export function isTimeOfDay(v: string | null | undefined): v is TimeOfDay {
  return typeof v === 'string' && (TIMES_OF_DAY as readonly string[]).includes(v)
}
