// Safe Diff Engine (Phase D §3). Produces a transparent preview: current value,
// proposed value, a character-level diff, and all the context needed to make a
// safe decision. No write ever happens without a preview.

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete'
  text: string
}

// Minimal LCS-based char diff — enough to render an accurate before/after.
export function charDiff(a: string, b: string): DiffSegment[] {
  const n = a.length
  const m = b.length
  // DP table of LCS lengths (bounded; preview strings are short).
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffSegment[] = []
  const pushMerge = (type: DiffSegment['type'], ch: string) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += ch
    else out.push({ type, text: ch })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pushMerge('equal', a[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pushMerge('delete', a[i])
      i++
    } else {
      pushMerge('insert', b[j])
      j++
    }
  }
  while (i < n) pushMerge('delete', a[i++])
  while (j < m) pushMerge('insert', b[j++])
  return out
}

export interface Preview {
  recommendationId: string
  ruleId: string
  field: 'title' | 'metaDescription' | 'schema' | 'other'
  currentValue: string
  proposedValue: string
  diff: DiffSegment[]
  reason: string
  evidenceUrls: string[]
  expectedImpact: string
  confidence: number
  risk: { level: 'low' | 'medium' | 'high'; note: string }
  rollbackAvailable: boolean
  deployable: boolean // true only when it maps to a supported WordPress write
  warnings: string[]
}
