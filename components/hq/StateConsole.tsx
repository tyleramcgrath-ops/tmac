'use client'

import { CORE_STATES, ENVIRONMENT_STATES, TIMES_OF_DAY } from '@/lib/hq/state'
import type { CoreState, EnvironmentState, SceneModel, TimeOfDay } from '@/lib/hq/state'
import type { ShotKind } from './HeadquartersScene'

/**
 * Preview console — an explicitly isolated demonstration harness, NOT product
 * chrome and NOT fabricated telemetry (Bible §16). It exists so the Core and
 * room states required by the deck (idle, speaking, concern, close-up,
 * reduced-motion) can be inspected and screenshotted deterministically. It is
 * closed by default and never claims anything about a real business.
 *
 * Toggle with the backtick key, the corner control, or ?console=1.
 */
export function StateConsole({
  open,
  onOpenChange,
  scene,
  shot,
  motion,
  pinnedCore,
  pinnedEnv,
  pinnedTime,
  setParam,
  onPulseCompletion,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  scene: SceneModel
  shot: ShotKind
  motion: 'full' | 'reduced' | null
  pinnedCore: CoreState | null
  pinnedEnv: EnvironmentState | null
  pinnedTime: TimeOfDay | null
  setParam: (key: string, value: string | null) => void
  onPulseCompletion: () => void
}) {
  return (
    <>
      <button
        type="button"
        className="hq-console-tab"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {open ? 'Close' : 'Preview'}
      </button>

      {open && (
        <aside className="hq-console" aria-label="State preview (demonstration only)">
          <header>
            <span className="hq-console-eyebrow">Preview console</span>
            <p className="hq-console-note">
              Demonstration harness — drives visual state only. Not connected to any project.
            </p>
          </header>

          <Group label="Core state">
            {CORE_STATES.map((s) =>
              s === 'completion' ? (
                <button
                  key={s}
                  type="button"
                  className="hq-chip"
                  onClick={onPulseCompletion}
                  title="Play the one-shot completion wave"
                >
                  {s} ⟳
                </button>
              ) : (
                <button
                  key={s}
                  type="button"
                  className={`hq-chip ${pinnedCore === s ? 'is-active' : ''}`}
                  aria-pressed={pinnedCore === s}
                  onClick={() => setParam('core', pinnedCore === s ? null : s)}
                >
                  {s}
                </button>
              ),
            )}
          </Group>

          <Group label="Environment">
            {ENVIRONMENT_STATES.map((s) => (
              <button
                key={s}
                type="button"
                className={`hq-chip ${pinnedEnv === s ? 'is-active' : ''}`}
                aria-pressed={pinnedEnv === s}
                onClick={() => setParam('env', pinnedEnv === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </Group>

          <Group label="Time of day">
            {TIMES_OF_DAY.map((t) => (
              <button
                key={t}
                type="button"
                className={`hq-chip ${pinnedTime === t ? 'is-active' : ''}`}
                aria-pressed={pinnedTime === t}
                onClick={() => setParam('time', pinnedTime === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </Group>

          <Group label="Camera">
            <button
              type="button"
              className={`hq-chip ${shot === 'room' ? 'is-active' : ''}`}
              onClick={() => setParam('shot', null)}
            >
              full room
            </button>
            <button
              type="button"
              className={`hq-chip ${shot === 'close' ? 'is-active' : ''}`}
              onClick={() => setParam('shot', 'close')}
            >
              close-up
            </button>
          </Group>

          <Group label="Motion">
            <button
              type="button"
              className={`hq-chip ${motion !== 'reduced' ? 'is-active' : ''}`}
              onClick={() => setParam('motion', null)}
            >
              system default
            </button>
            <button
              type="button"
              className={`hq-chip ${motion === 'reduced' ? 'is-active' : ''}`}
              onClick={() => setParam('motion', 'reduced')}
            >
              reduced
            </button>
          </Group>

          <footer className="hq-console-readout">
            <span>core · {scene.core}</span>
            <span>env · {scene.env}</span>
            <span>time · {scene.time}</span>
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
