// Reads a spreadsheet (.xlsx or .csv) into plain row objects keyed by a
// normalized header ("Bar Number" -> "barnumber"), so adapters can match
// columns without caring about spacing, case or punctuation.

import { readFile } from 'node:fs/promises'
import ExcelJS from 'exceljs'

export const headerKey = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((v) => v.trim() !== ''))
}

function cellText(v) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((t) => t.text).join('')
    if ('text' in v) return String(v.text) // hyperlink cells
    if ('result' in v) return cellText(v.result) // formula cells
  }
  return String(v)
}

/** Returns { headers: string[], rows: Record<headerKey, string>[] } from the first sheet. */
export async function readTable(path) {
  let grid
  if (/\.csv$/i.test(path)) {
    grid = parseCsv((await readFile(path, 'utf8')).replace(/^﻿/, ''))
  } else if (/\.xlsx$/i.test(path)) {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(path)
    const ws = wb.worksheets[0]
    if (!ws) throw new Error(`${path} has no worksheets`)
    grid = []
    ws.eachRow({ includeEmpty: false }, (r) => {
      const vals = []
      for (let c = 1; c <= ws.columnCount; c++) vals.push(cellText(r.getCell(c).value))
      grid.push(vals)
    })
  } else {
    throw new Error(`Unsupported file type: ${path} (use .xlsx or .csv; open .xls files in Excel and save as .xlsx)`)
  }
  // The header is the first row with at least two non-empty cells (some
  // exports start with a title line).
  const hi = grid.findIndex((r) => r.filter((v) => String(v).trim()).length >= 2)
  if (hi < 0) return { headers: [], rows: [] }
  const headers = grid[hi].map((h) => String(h).trim())
  const keys = headers.map(headerKey)
  const rows = grid.slice(hi + 1).map((r) => Object.fromEntries(keys.map((k, i) => [k, String(r[i] ?? '').trim()])))
  return { headers, rows }
}
