// Opening hours: schema.org lines ("Mo-Fr 08:00-17:00") <-> one row per day,
// which is what the settings form edits.

export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
export type Day = (typeof DAYS)[number]
export const DAY_NAMES: Record<Day, string> = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' }

// null = closed that day.
export type WeekHours = Record<Day, { open: string; close: string } | null>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export function closedWeek(): WeekHours {
  return { Mo: null, Tu: null, We: null, Th: null, Fr: null, Sa: null, Su: null }
}

// Reads lines like "Mo-Fr 08:00-17:00", "Sa 09:00-13:00" or "Mo,We 10:00-14:00".
export function toWeek(lines: readonly string[] = []): WeekHours {
  const week = closedWeek()
  for (const line of lines) {
    const m = line.trim().match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/)
    if (!m || !TIME.test(m[2]) || !TIME.test(m[3])) continue
    for (const part of m[1].split(',')) {
      const [a, b] = part.split('-') as [Day, Day | undefined]
      const i = DAYS.indexOf(a)
      const j = b ? DAYS.indexOf(b) : i
      if (i < 0 || j < 0) continue
      for (let k = i; k <= j; k++) week[DAYS[k]] = { open: m[2], close: m[3] }
    }
  }
  return week
}

// Groups runs of days with the same hours: Mo-Fr 08:00-17:00, Sa 09:00-13:00.
export function fromWeek(week: WeekHours): string[] {
  const out: string[] = []
  let i = 0
  while (i < DAYS.length) {
    const h = week[DAYS[i]]
    if (!h || !TIME.test(h.open) || !TIME.test(h.close)) {
      i++
      continue
    }
    let j = i
    while (j + 1 < DAYS.length && same(week[DAYS[j + 1]], h)) j++
    out.push(`${DAYS[i]}${j > i ? `-${DAYS[j]}` : ''} ${h.open}-${h.close}`)
    i = j + 1
  }
  return out
}

function same(a: { open: string; close: string } | null, b: { open: string; close: string }): boolean {
  return !!a && a.open === b.open && a.close === b.close
}
