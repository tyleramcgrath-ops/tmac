import { describe, expect, it } from 'vitest'
import {
  CORE_STATES,
  ENVIRONMENT_STATES,
  TIMES_OF_DAY,
  composeScene,
  deriveEnvironment,
  deriveSky,
  deriveTimeOfDay,
  isCoreState,
  isEnvironmentState,
  isTimeOfDay,
  narrate,
  type ProductTruth,
} from '@/lib/hq/state'

const calm: ProductTruth = {
  activity: 'idle',
  confidence: 'high',
  attention: 'none',
  overnightWork: false,
}

describe('deriveTimeOfDay', () => {
  it('maps the local clock onto dawn/day/dusk/night', () => {
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 6))).toBe('dawn')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 12))).toBe('day')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 18))).toBe('dusk')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 23))).toBe('night')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 3))).toBe('night')
  })

  it('handles the boundary hours exactly', () => {
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 5))).toBe('dawn')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 8))).toBe('day')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 17))).toBe('dusk')
    expect(deriveTimeOfDay(new Date(2026, 6, 23, 20))).toBe('night')
  })
})

describe('deriveEnvironment (Bible §06 state mapping)', () => {
  it('healthy and confident yields the confident room', () => {
    expect(deriveEnvironment(calm, 'day')).toBe('confident')
  })

  it('an explicit warning always wins', () => {
    expect(deriveEnvironment({ ...calm, attention: 'warning' }, 'day')).toBe('warning')
    expect(
      deriveEnvironment({ ...calm, attention: 'warning', activity: 'completion' }, 'night'),
    ).toBe('warning')
  })

  it('the concern core state couples to the warning environment', () => {
    expect(deriveEnvironment({ ...calm, activity: 'concern' }, 'day')).toBe('warning')
  })

  it('completion couples to success (returning sunlight)', () => {
    expect(deriveEnvironment({ ...calm, activity: 'completion' }, 'day')).toBe('success')
  })

  it('opportunity couples to the confident sunrise room (Bible §05)', () => {
    expect(deriveEnvironment({ ...calm, activity: 'opportunity' }, 'dusk')).toBe('confident')
  })

  it('overnight agent work at night yields the overnight room', () => {
    expect(deriveEnvironment({ ...calm, overnightWork: true }, 'night')).toBe('overnight')
  })

  it('overnight work during the day does not fake a night room', () => {
    expect(deriveEnvironment({ ...calm, overnightWork: true }, 'day')).toBe('confident')
  })

  it('thinking and listening cool the room to analyzing', () => {
    expect(deriveEnvironment({ ...calm, activity: 'thinking' }, 'day')).toBe('analyzing')
    expect(deriveEnvironment({ ...calm, activity: 'listening' }, 'day')).toBe('analyzing')
  })

  it('low or unknown confidence yields the uncertain room', () => {
    expect(deriveEnvironment({ ...calm, confidence: 'low' }, 'day')).toBe('uncertain')
    expect(deriveEnvironment({ ...calm, confidence: 'unknown' }, 'day')).toBe('uncertain')
  })
})

describe('deriveSky', () => {
  it('night shows stars, the moon and the North Star itself', () => {
    const sky = deriveSky('confident', 'night', 'clear')
    expect(sky.stars).toBe(true)
    expect(sky.moon).toBe(true)
    expect(sky.northStar).toBe(true)
  })

  it('a storm hides the North Star and the moon', () => {
    const sky = deriveSky('warning', 'night', 'storm')
    expect(sky.rain).toBe(true)
    expect(sky.storm).toBe(true)
    expect(sky.cloudDensity).toBe(2)
    expect(sky.northStar).toBe(false)
    expect(sky.moon).toBe(false)
  })

  it('the overnight environment is a night sky regardless of clock', () => {
    const sky = deriveSky('overnight', 'day', 'clear')
    expect(sky.stars).toBe(true)
    expect(sky.northStar).toBe(true)
  })

  it('warning defaults to a storm, uncertainty to fog', () => {
    expect(deriveSky('uncertain', 'day').fog).toBe(true)
    expect(deriveSky('uncertain', 'day').rain).toBe(false)
    expect(deriveSky('warning', 'day').storm).toBe(true)
    expect(deriveSky('warning', 'day').fog).toBe(false)
  })

  it('an aurora only shows on a clear night, alongside stars', () => {
    expect(deriveSky('confident', 'night', 'aurora').aurora).toBe(true)
    expect(deriveSky('confident', 'night', 'aurora').stars).toBe(true)
    expect(deriveSky('confident', 'day', 'aurora').aurora).toBe(false)
  })

  it('snow is distinct from rain', () => {
    const sky = deriveSky('confident', 'day', 'snow')
    expect(sky.snow).toBe(true)
    expect(sky.rain).toBe(false)
  })

  it('a confident clear day keeps some ambient cloud so the exterior stays alive', () => {
    expect(deriveSky('confident', 'day', 'clear').cloudDensity).toBe(1)
  })
})

describe('narrate (accessibility narration, Bible §06/§17)', () => {
  it('covers every core state, environment and time of day', () => {
    for (const core of CORE_STATES) {
      for (const env of ENVIRONMENT_STATES) {
        for (const time of TIMES_OF_DAY) {
          const text = narrate(core, env, time)
          expect(text.length).toBeGreaterThan(20)
          expect(text).toMatch(/North Star/)
        }
      }
    }
  })

  it('never claims the system has feelings', () => {
    const banned = /\b(happy|sad|excited|afraid|worried|feels?|feeling|emotion)\b/i
    for (const core of CORE_STATES) {
      for (const env of ENVIRONMENT_STATES) {
        expect(narrate(core, env, 'day')).not.toMatch(banned)
      }
    }
  })

  it('describes concern without theatrical danger language', () => {
    const text = narrate('concern', 'warning', 'day')
    expect(text).not.toMatch(/\b(danger|critical|alarm|emergency|panic)\b/i)
    expect(text).toMatch(/attention/)
  })
})

describe('composeScene', () => {
  it('assembles core, environment, time, sky and narration coherently', () => {
    const scene = composeScene({ ...calm, activity: 'thinking' }, 'day')
    expect(scene.core).toBe('thinking')
    expect(scene.env).toBe('analyzing')
    expect(scene.time).toBe('day')
    expect(scene.narration).toMatch(/investigating/)
  })

  it('accepts a Date and derives time of day from it', () => {
    const scene = composeScene(calm, new Date(2026, 6, 23, 23, 30))
    expect(scene.time).toBe('night')
    expect(scene.sky.stars).toBe(true)
  })

  it('honours an explicit weather override and reflects it in narration', () => {
    const scene = composeScene(calm, 'night', 'aurora')
    expect(scene.weather).toBe('aurora')
    expect(scene.sky.aurora).toBe(true)
    expect(scene.narration).toMatch(/aurora/i)
  })

  it('defaults warning to a storm when no weather is given', () => {
    const scene = composeScene({ ...calm, attention: 'warning' }, 'day')
    expect(scene.env).toBe('warning')
    expect(scene.weather).toBe('storm')
    expect(scene.sky.storm).toBe(true)
  })
})

describe('preview parameter guards', () => {
  it('accepts only real states', () => {
    expect(isCoreState('speaking')).toBe(true)
    expect(isCoreState('dancing')).toBe(false)
    expect(isCoreState(null)).toBe(false)
    expect(isEnvironmentState('warning')).toBe(true)
    expect(isEnvironmentState('party')).toBe(false)
    expect(isTimeOfDay('dusk')).toBe(true)
    expect(isTimeOfDay('midnight')).toBe(false)
  })
})
