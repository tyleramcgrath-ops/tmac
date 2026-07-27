'use client'

// The double helix. Each rung is one real data source: the two nucleotides
// orbit a shared axis and the bond between them is drawn only when that
// source is genuinely connected. A source that isn't connected leaves a
// visible break in the strand — the picture is only whole when the business
// actually is wired up, which is the entire point of showing it.
//
// The orbit is pure CSS: a point circling an axis seen edge-on moves as
// x = sin(t) with depth = cos(t), so each nucleotide's horizontal position,
// scale and opacity track one shared keyframe cycle, and the bond is widest
// exactly when the two are furthest apart. Staggering the delay down the
// strand produces the twist. No animation frame loop, and it stops dead for
// anyone who asked for reduced motion.

export interface Strand {
  id: string
  label: string
  connected: boolean
  detail: string | null
}

export default function Helix({
  strands,
  activeId,
  onHover,
}: {
  strands: Strand[]
  activeId: string | null
  onHover: (id: string | null) => void
}) {
  return (
    <div className="ns-dna" role="img" aria-label={dnaLabel(strands)}>
      {strands.map((s, i) => (
        <div
          key={s.id}
          className="ns-dna-rung"
          style={{ ['--i' as string]: i }}
          data-connected={s.connected ? 'true' : undefined}
          data-active={activeId === s.id ? 'true' : undefined}
          onMouseEnter={() => onHover(s.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="ns-dna-bond" aria-hidden />
          <span className="ns-dna-node a" aria-hidden />
          <span className="ns-dna-node b" aria-hidden />
        </div>
      ))}
    </div>
  )
}

function dnaLabel(strands: Strand[]): string {
  const on = strands.filter((s) => s.connected)
  const off = strands.filter((s) => !s.connected)
  const parts = [`${on.length} of ${strands.length} data sources connected`]
  if (on.length) parts.push(`Connected: ${on.map((s) => s.label).join(', ')}`)
  if (off.length) parts.push(`Not connected: ${off.map((s) => s.label).join(', ')}`)
  return `${parts.join('. ')}.`
}
