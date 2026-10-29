// Tiny CSV export — client-side only, no dependency. Proper RFC 4180
// quoting (commas, quotes, newlines) so a cell with a comma or embedded
// quote never corrupts the column count when opened in a spreadsheet.

// CSV-formula-injection guard: a cell whose value starts with =, +, -, @, or
// a tab is interpreted as a formula by Excel/Sheets when opened, not text —
// a real risk here since row values include page titles/reasoning strings
// that ultimately trace back to a live (possibly compromised) third-party
// site. Prefixing with a bare quote neutralizes it as plain text without
// changing what's displayed.
function neutralizeFormula(s: string): string {
  return /^[=+\-@\t]/.test(s) ? `'${s}` : s
}

export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = neutralizeFormula(String(v))
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = toCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = url
  el.download = filename
  el.click()
  URL.revokeObjectURL(url)
}
