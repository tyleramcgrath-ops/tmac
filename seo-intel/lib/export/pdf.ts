import PDFDocument from 'pdfkit'
import type { Report, ScoreEntry } from '../types'

// PDF report export via pdfkit (runs as a server external package).

const BLUE = '#1d4ed8'
const SLATE = '#334155'
const LIGHT = '#64748b'

export function reportToPdf(report: Report): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const r = report.results

    // ── Cover / header ──
    doc.fontSize(22).fillColor(BLUE).text('SEO Competitor Intelligence Report', { align: 'left' })
    doc.moveDown(0.3)
    doc.fontSize(11).fillColor(SLATE)
    doc.text(`Page: ${report.input.url}`)
    doc.text(`Keyword: "${report.input.keyword}"  •  Country: ${report.input.country.toUpperCase()}  •  Device: ${report.input.device}`)
    doc.text(`Generated: ${new Date(report.createdAt).toLocaleString()}`)
    doc.moveDown(1)

    // ── Scores ──
    if (r?.scores) {
      heading(doc, 'Scores')
      const entries = Object.values(r.scores) as ScoreEntry[]
      for (const s of entries) {
        doc.fontSize(10).fillColor(SLATE).text(`${s.label}: `, { continued: true })
          .fillColor(scoreColor(s.score)).text(`${s.score}/100`, { continued: true })
          .fillColor(LIGHT).text(`  —  ${s.explanation}`)
        doc.moveDown(0.2)
      }
      doc.moveDown(0.8)
    }

    // ── Executive summary ──
    if (r?.ai?.executiveSummary) {
      heading(doc, 'Executive Summary')
      doc.fontSize(10).fillColor(SLATE).text(r.ai.executiveSummary)
      doc.moveDown(0.8)
    }

    // ── Competitors ──
    if (r?.serp) {
      heading(doc, 'Top 10 Competitors')
      for (const result of r.serp.results) {
        doc.fontSize(10).fillColor(SLATE).text(`#${result.position}  ${result.title}`)
        doc.fontSize(8).fillColor(LIGHT).text(result.url)
        doc.moveDown(0.25)
      }
      doc.moveDown(0.8)
    }

    // ── Comparison table (condensed) ──
    const user = r?.userAnalysis
    if (user?.page && r) {
      heading(doc, 'Side-by-Side Snapshot')
      const crawled = r.competitors.filter((c) => c.page && !c.page.crawlError)
      const median = (vals: number[]) => (vals.length ? [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0)
      const lines: [string, string, string][] = [
        ['Metric', 'Your page', 'Competitor median'],
        ['Word count', String(user.page.wordCount), String(median(crawled.map((c) => c.page!.wordCount)))],
        ['Title length', String(user.page.titleLength), String(median(crawled.map((c) => c.page!.titleLength)))],
        ['H2 sections', String(user.page.h2Count), String(median(crawled.map((c) => c.page!.h2Count)))],
        ['Internal links', String(user.page.links.internal), String(median(crawled.map((c) => c.page!.links.internal)))],
        ['Schema types', String(user.page.schemaTypes.length), String(median(crawled.map((c) => c.page!.schemaTypes.length)))],
        ['Images', String(user.page.images.count), String(median(crawled.map((c) => c.page!.images.count)))],
      ]
      for (const [a, b, c] of lines) {
        doc.fontSize(9).fillColor(SLATE).text(`${a.padEnd(20)}  ${b.padEnd(14)}  ${c}`, { lineGap: 1 })
      }
      doc.moveDown(0.8)
    }

    // ── Technical issues ──
    if (r?.technicalIssues.length) {
      heading(doc, 'Technical SEO Issues')
      for (const issue of r.technicalIssues) {
        doc.fontSize(10).fillColor(issue.severity === 'critical' ? '#dc2626' : issue.severity === 'warning' ? '#d97706' : LIGHT)
          .text(`[${issue.severity.toUpperCase()}] `, { continued: true })
          .fillColor(SLATE).text(issue.issue)
        doc.fontSize(8).fillColor(LIGHT).text(issue.detail)
        doc.moveDown(0.3)
      }
      doc.moveDown(0.8)
    }

    // ── Action plan ──
    if (r?.recommendations.length) {
      heading(doc, 'Priority Action Plan')
      for (const rec of r.recommendations) {
        doc.fontSize(10).fillColor(SLATE).text(`${rec.priority}. ${rec.issue}`)
        doc.fontSize(8).fillColor(LIGHT)
        doc.text(`Why: ${rec.why}`)
        doc.text(`Fix: ${rec.fix}`)
        doc.text(`Impact: ${rec.impact}  •  Difficulty: ${rec.difficulty}  •  Category: ${rec.category}`)
        doc.moveDown(0.4)
      }
    }

    // ── Warnings / data availability ──
    if (r?.warnings.length) {
      doc.moveDown(0.5)
      heading(doc, 'Data Availability Notes')
      for (const w of r.warnings) {
        doc.fontSize(8).fillColor(LIGHT).text(`• ${w}`)
      }
    }

    doc.end()
  })
}

function heading(doc: PDFKit.PDFDocument, text: string) {
  if (doc.y > doc.page.height - 140) doc.addPage()
  doc.fontSize(14).fillColor(BLUE).text(text)
  doc.moveDown(0.4)
}

function scoreColor(score: number): string {
  return score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
}
