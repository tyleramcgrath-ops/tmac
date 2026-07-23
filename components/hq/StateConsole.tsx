'use client'

import {
  CORE_STATES,
  ENVIRONMENT_STATES,
  TIMES_OF_DAY,
  WEATHERS,
} from '@/lib/hq/state'
import type { CoreState, EnvironmentState, SceneModel, TimeOfDay, Weather } from '@/lib/hq/state'
import type { CameraPreset } from './scene/Cameras'

const CAMERAS: CameraPreset[] = ['hero', 'executive', 'conversation', 'atmospheric', 'boardroom']

/**
 * Preview console — an explicitly isolated demonstration harness, not product
 * chrome and not fabricated telemetry (Bible §16 / Blueprint §16). Closed by
 * default; drives visual state only. Toggle with the corner control, the
 * backtick key, or ?console=1.
 */
export function StateConsole({
  open,
  onToggle,
  scene,
  cam,
  motion,
  pins,
  setParam,
}: {
  open: boolean
  onToggle: () => void
  scene: SceneModel
  cam: CameraPreset
  motion: 'full' | 'reduced' | null
  pins: { core: CoreState | null; env: EnvironmentState | null; time: TimeOfDay | null; weather: Weather | null }
  setParam: (key: string, value: string | null) => void
}) {
  return (
    <>
      <button type="button" className="hq-console-tab" aria-expanded={open} onClick={onToggle}>
        {open ? 'Close' : 'Preview'}
      </button>

      {open && (
        <aside className="hq-console" aria-label="State preview (demonstration only)">
          <header>
            <span className="hq-console-eyebrow">Preview console</span>
            <p className="hq-console-note">Demonstration harness — drives the scene only. Not connected to any project.</p>
          </header>

          <Group label="Camera">
            {CAMERAS.map((c) => (
              <Chip key={c} active={cam === c} onClick={() => setParam('cam', c === 'hero' ? null : c)}>
                {c}
              </Chip>
            ))}
          </Group>

          <Group label="Core state">
            {CORE_STATES.map((s) => (
              <Chip key={s} active={pins.core === s} onClick={() => setParam('core', pins.core === s ? null : s)}>
                {s}
              </Chip>
            ))}
          </Group>

          <Group label="Environment">
            {ENVIRONMENT_STATES.map((s) => (
              <Chip key={s} active={pins.env === s} onClick={() => setParam('env', pins.env === s ? null : s)}>
                {s}
              </Chip>
            ))}
          </Group>

          <Group label="Time of day">
            {TIMES_OF_DAY.map((t) => (
              <Chip key={t} active={pins.time === t} onClick={() => setParam('time', pins.time === t ? null : t)}>
                {t}
              </Chip>
            ))}
          </Group>

          <Group label="Weather">
            {WEATHERS.map((w) => (
              <Chip key={w} active={pins.weather === w} onClick={() => setParam('weather', pins.weather === w ? null : w)}>
                {w}
              </Chip>
            ))}
          </Group>

          <Group label="Motion">
            <Chip active={motion !== 'reduced'} onClick={() => setParam('motion', null)}>
              system default
            </Chip>
            <Chip active={motion === 'reduced'} onClick={() => setParam('motion', 'reduced')}>
              reduced
            </Chip>
          </Group>

          <footer className="hq-console-readout">
            <span>{scene.core}</span>
            <span>{scene.env}</span>
            <span>{scene.time}</span>
            <span>{scene.weather}</span>
          </footer>
        </aside>
      )}
    </>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="hq-console-group">
      <legend>{label}</legend>
      <div className="hq-chip-row">{children}</div>
    </fieldset>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`hq-chip ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  )
}
