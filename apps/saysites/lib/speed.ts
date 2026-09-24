// The publish-time speed gate: nothing goes live below 95 on mobile.
//
// This is the static half of the gate. It checks the rendered output for the
// things that sink a mobile PageSpeed score (page weight, scripts, render-
// blocking requests, unsized or eagerly loaded images) before any browser is
// involved. The measured half (a Lighthouse run against the preview) is added
// with the hosting work in Phase 1; both must pass to publish.

import type { RenderedPage } from './render'

export const BUDGET = {
  // Uncompressed bytes. Compression shrinks these ~4-5x on the wire.
  htmlBytes: 100_000,
  cssBytes: 30_000,
  eagerImages: 1,
} as const

export interface SpeedIssue {
  code: string
  message: string
}

export interface SpeedResult {
  pass: boolean
  htmlBytes: number
  cssBytes: number
  issues: SpeedIssue[]
}

export function checkSpeed(page: RenderedPage): SpeedResult {
  const { html, css } = page
  const htmlBytes = Buffer.byteLength(html, 'utf8')
  const cssBytes = Buffer.byteLength(css, 'utf8')
  const issues: SpeedIssue[] = []

  if (htmlBytes > BUDGET.htmlBytes) issues.push({ code: 'html-too-large', message: `Page HTML is ${kb(htmlBytes)}; the budget is ${kb(BUDGET.htmlBytes)}.` })
  if (cssBytes > BUDGET.cssBytes) issues.push({ code: 'css-too-large', message: `Page CSS is ${kb(cssBytes)}; the budget is ${kb(BUDGET.cssBytes)}.` })

  // No executable JavaScript. JSON-LD is data, not script.
  const scripts = html.match(/<script\b[^>]*>/gi) ?? []
  const executable = scripts.filter((s) => !/type="application\/ld\+json"/i.test(s))
  if (executable.length) issues.push({ code: 'javascript', message: `The page ships ${executable.length} script tag(s); published pages run no JavaScript.` })

  // No render-blocking external stylesheets or web fonts.
  if (/<link\b[^>]*rel="stylesheet"/i.test(html)) issues.push({ code: 'blocking-stylesheet', message: 'The page loads an external stylesheet, which blocks rendering.' })
  if (/@import|@font-face/i.test(css)) issues.push({ code: 'font-or-import', message: 'The CSS imports another file or downloads a font.' })

  // Every image sized (no layout shift), and at most one loaded eagerly.
  const imgs = html.match(/<img\b[^>]*>/gi) ?? []
  const unsized = imgs.filter((i) => !/\bwidth="\d+"/.test(i) || !/\bheight="\d+"/.test(i))
  if (unsized.length) issues.push({ code: 'unsized-images', message: `${unsized.length} image(s) have no width/height, which shifts the layout while loading.` })
  const eager = imgs.filter((i) => !/\bloading="lazy"/.test(i))
  if (eager.length > BUDGET.eagerImages) issues.push({ code: 'eager-images', message: `${eager.length} images load eagerly; only the hero image should.` })

  return { pass: issues.length === 0, htmlBytes, cssBytes, issues }
}

function kb(bytes: number): string {
  return `${Math.round(bytes / 100) / 10} KB`
}
