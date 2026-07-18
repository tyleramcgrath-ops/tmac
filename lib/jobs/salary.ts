// Best-effort salary parsing. Job boards report pay in wildly inconsistent
// formats ("$120k - $150k", "£65,000", "90000-110000 USD", hourly rates), so
// this only ever produces a rough annual USD-ish estimate for sorting/filtering
// — never treat the result as authoritative.
const HOURLY_TO_YEARLY = 2080 // 40h * 52w

export function parseSalary(text: string | null | undefined): {
  min: number | null
  max: number | null
} {
  if (!text) return { min: null, max: null }

  const isHourly = /\bhour(ly)?\b|\/\s*hr\b/i.test(text)
  const numbers = text
    .replace(/,/g, '')
    .match(/\d+(\.\d+)?\s*[kK]?/g)

  if (!numbers || numbers.length === 0) return { min: null, max: null }

  const values = numbers
    .map((n) => {
      const isK = /[kK]$/.test(n.trim())
      const num = parseFloat(n)
      return isK ? num * 1000 : num
    })
    .filter((n) => n > 0)

  if (values.length === 0) return { min: null, max: null }

  let min = Math.min(...values)
  let max = Math.max(...values)

  if (isHourly) {
    min *= HOURLY_TO_YEARLY
    max *= HOURLY_TO_YEARLY
  }

  // Guard against noise like a phone number or job id being picked up.
  if (max > 5_000_000) return { min: null, max: null }

  return { min, max }
}
