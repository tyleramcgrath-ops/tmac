export function scoreTone(score: number): { text: string; bg: string; ring: string } {
  if (score >= 70) return { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' }
  if (score >= 40) return { text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200' }
  return { text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' }
}

export function ScoreBadge({ score, size = 'md' }: { score: number | null; size?: 'sm' | 'md' | 'lg' }) {
  if (score === null) {
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">—</span>
  }
  const tone = scoreTone(score)
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${tone.text} ${tone.bg} ${tone.ring} ${sizes[size]}`}>
      {score}
    </span>
  )
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const tone = scoreTone(score)
  const circumference = 2 * Math.PI * 28
  const stroke = score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={stroke} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tone.text}`}>{score}</span>
      </div>
      <span className="max-w-[7rem] text-center text-xs font-medium leading-tight text-slate-600">{label}</span>
    </div>
  )
}

export function CheckMark({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="font-semibold text-emerald-600">✓</span>
  ) : (
    <span className="font-semibold text-red-500">✕</span>
  )
}
