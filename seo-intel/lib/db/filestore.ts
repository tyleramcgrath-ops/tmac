import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import type { Report, ReportSummary } from '../types'
import type { Store } from './index'

// Zero-dependency local store: one JSON file per report under .data/reports,
// plus a settings.json. Used when DATABASE_URL is not configured.

const DATA_DIR = path.join(process.cwd(), '.data')
const REPORTS_DIR = path.join(DATA_DIR, 'reports')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

export class FileStore implements Store {
  async init(): Promise<void> {
    await mkdir(REPORTS_DIR, { recursive: true })
  }

  private reportPath(id: string): string {
    // ids are generated UUIDs; sanitize anyway so a crafted id can't escape the dir
    return path.join(REPORTS_DIR, `${id.replace(/[^a-zA-Z0-9-]/g, '')}.json`)
  }

  async saveReport(report: Report): Promise<void> {
    await writeFile(this.reportPath(report.id), JSON.stringify(report), 'utf8')
  }

  async getReport(id: string): Promise<Report | null> {
    try {
      return JSON.parse(await readFile(this.reportPath(id), 'utf8')) as Report
    } catch {
      return null
    }
  }

  async listReports(): Promise<ReportSummary[]> {
    const files = await readdir(REPORTS_DIR)
    const summaries: ReportSummary[] = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const r = JSON.parse(await readFile(path.join(REPORTS_DIR, file), 'utf8')) as Report
        summaries.push({
          id: r.id,
          input: r.input,
          status: r.status,
          createdAt: r.createdAt,
          overallScore: r.overallScore,
        })
      } catch {
        // skip unreadable files
      }
    }
    return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async deleteReport(id: string): Promise<boolean> {
    try {
      await rm(this.reportPath(id))
      return true
    } catch {
      return false
    }
  }

  private async readSettings(): Promise<Record<string, string>> {
    try {
      return JSON.parse(await readFile(SETTINGS_FILE, 'utf8'))
    } catch {
      return {}
    }
  }

  async getSetting(key: string): Promise<string | null> {
    return (await this.readSettings())[key] ?? null
  }

  async setSetting(key: string, value: string): Promise<void> {
    const settings = await this.readSettings()
    settings[key] = value
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8')
  }

  async deleteSetting(key: string): Promise<void> {
    const settings = await this.readSettings()
    delete settings[key]
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8')
  }
}
