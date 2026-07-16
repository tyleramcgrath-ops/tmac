'use client'

import type { PreviewScenario } from '@/lib/north-star-preview-data'

export type WingDestination = 'digital-dna' | 'decisions' | 'intelligence' | 'results'

const WING: { id: WingDestination; label: string }[] = [
  { id: 'digital-dna', label: 'DIGITAL DNA' },
  { id: 'decisions', label: 'DECISIONS' },
  { id: 'intelligence', label: 'INTELLIGENCE' },
  { id: 'results', label: 'RESULTS' },
]

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/**
 * The wing is wayfinding, not a menu of text swaps — each entry opens a real
 * destination (a right-side drawer) and the dot beside it is that
 * destination's honest state. Visual language ported from the confirmed
 * North Star Executive Office baseline (north-star-station @ 546fb87,
 * CommandWing.tsx), trimmed to the three destinations this preview actually
 * has: Digital DNA (replacing that baseline's Business Twin), Decisions
 * (the approval folder), and Intelligence (the activity wall).
 */
export function CommandWing({
  scenario,
  active,
  onOpen,
  onNavigate,
}: {
  scenario: PreviewScenario
  active: WingDestination | null
  onOpen: (id: WingDestination) => void
  onNavigate?: () => void
}) {
  const open = (id: WingDestination) => {
    onOpen(id)
    onNavigate?.()
  }

  const dotClassFor = (id: WingDestination): string => {
    if (id === 'digital-dna') {
      const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
      return understood === scenario.digitalDna.length && scenario.digitalDna.length > 0
        ? 'bg-[#7fcf9f] shadow-[0_0_8px_rgba(127,207,159,0.5)]'
        : 'bg-[#d8b46a] shadow-[0_0_8px_rgba(216,180,106,0.4)]'
    }
    if (id === 'decisions') {
      return scenario.pendingApproval
        ? 'bg-[#d8b46a] shadow-[0_0_8px_rgba(216,180,106,0.4)]'
        : 'bg-[#6a6252]'
    }
    if (id === 'intelligence') {
      const needsAttention = scenario.activity.some((a) => a.status === 'needs-attention')
      return needsAttention ? 'bg-[#e08a7f] shadow-[0_0_8px_rgba(224,138,127,0.45)]' : 'bg-[#7fcf9f] shadow-[0_0_8px_rgba(127,207,159,0.5)]'
    }
    return scenario.history.length ? 'bg-[#7fcf9f] shadow-[0_0_8px_rgba(127,207,159,0.5)]' : 'bg-[#6a6252]'
  }

  return (
    <aside className="relative flex h-full w-52 flex-col px-7 py-7">
      {/* not a panel — a pool of shadow at the hall's left edge that the
          wayfinding is etched into */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(1,2,4,0.94),rgba(1,2,4,0.66)_55%,rgba(1,2,4,0.12)_85%,transparent)] backdrop-blur-[2px]"
      />
      {/* brushed metal, not flat shadow */}
      <div aria-hidden="true" className="hq-wing-metal pointer-events-none absolute inset-0" />
      {/* acknowledges Digital DNA: invisible until the business is
          genuinely understood, inherited from the room via --dna-warmth */}
      <div aria-hidden="true" className="hq-wing-warmth pointer-events-none absolute inset-0" />

      <div className="relative flex items-center gap-3">
        <div className="relative grid size-9 place-items-center">
          <div className="absolute size-9 rounded-full bg-[radial-gradient(circle,rgba(224,198,142,0.35),transparent_70%)] opacity-60" />
          <div className="size-2.5 rounded-full bg-[#e0c68e]" />
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-[0.2em] text-[#f4efe6]">NORTH STAR</div>
          <div className="text-[9px] tracking-[0.44em] text-[#a99f8c]">EXECUTIVE OFFICE</div>
        </div>
      </div>

      <nav className="relative mt-12 flex flex-col">
        {WING.map(({ id, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => open(id)}
              className={`group relative flex cursor-pointer items-center gap-2.5 border-l py-3 pl-5 text-left text-[12px] font-medium uppercase tracking-[0.2em] transition-[color,border-color,transform,padding] duration-300 [text-shadow:0_1px_6px_rgba(1,2,5,0.9)] hover:pl-[1.35rem] active:scale-[0.98] active:pl-[1.15rem] ${
                isActive ? 'border-[#c8b48a]/80 text-[#f5edda]' : 'border-transparent text-[#c1b8a6] hover:text-[#f0e7d4]'
              }`}
            >
              <span>{label}</span>
              <span aria-hidden="true" className={`ml-auto size-1.5 shrink-0 rounded-full ${dotClassFor(id)}`} />
            </button>
          )
        })}
      </nav>

      <div className="relative mt-auto">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center text-xs font-semibold tracking-[0.08em] text-[#cdc4b4]">
            {initialsOf(scenario.business.name)}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.12em] text-[#e7e0d3]">{scenario.business.name.toUpperCase()}</div>
            <div className="text-[10px] tracking-[0.1em] text-[#a29883]">Executive Access</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
