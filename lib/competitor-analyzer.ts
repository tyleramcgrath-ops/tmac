// Competitor Analyzer: Detects meaningful changes from crawl snapshots

export interface PageSnapshot {
  url: string
  title?: string
  metaDescription?: string
  h1?: string
  canonical?: string
  robots?: string // content of robots meta tag
  schema?: string[] // array of schema.org types
  internalLinks?: number
  hasNoindex?: boolean
  status?: number
}

export interface CompetitorSnapshot {
  pages: PageSnapshot[]
  robots?: string // robots.txt content
  sitemap?: string[] // sitemap URLs if available
  pageCount: number
  schemaScore: number
  technicalScore: number
  contentScore: number
}

export interface DetectedChange {
  type:
    | "newPages"
    | "removedPages"
    | "titleChanges"
    | "metaChanges"
    | "h1Changes"
    | "canonicalChanges"
    | "schemaChanges"
    | "linkingChanges"
    | "navigationChanges"
    | "robotsChanges"
    | "sitemapChanges"
    | "contentExpansion"
    | "contentRemoval"
  severity: "critical" | "high" | "medium" | "low"
  description: string
  count: number
  affectedPages?: string[]
  impact?: "competitive_threat" | "opportunity" | "neutral"
  impactReason?: string
}

export function analyzeCompetitorChanges(
  previousSnapshot: CompetitorSnapshot | null,
  currentSnapshot: CompetitorSnapshot
): DetectedChange[] {
  const changes: DetectedChange[] = []

  if (!previousSnapshot) {
    // First crawl - baseline established
    return changes
  }

  const previousUrls = new Map(previousSnapshot.pages.map((p) => [p.url, p]))
  const currentUrls = new Map(currentSnapshot.pages.map((p) => [p.url, p]))

  // ─────────────────────────────────────────────────────────────────────────────
  // NEW PAGES
  // ─────────────────────────────────────────────────────────────────────────────

  const newPages: string[] = []
  for (const [url] of currentUrls) {
    if (!previousUrls.has(url)) {
      newPages.push(url)
    }
  }

  if (newPages.length > 0) {
    // Categorize new pages to detect topical expansion
    const contentExpansionPages = newPages.filter((url) => {
      const page = currentUrls.get(url)!
      return page.title && page.title.length > 20
    })

    if (contentExpansionPages.length > 3) {
      changes.push({
        type: "contentExpansion",
        severity: "high",
        description: `Competitor published ${contentExpansionPages.length} new pages (topical expansion detected)`,
        count: contentExpansionPages.length,
        affectedPages: contentExpansionPages.slice(0, 10),
        impact: "competitive_threat",
        impactReason:
          "Competitor is building topical authority. Monitor rankings for overlap with your content.",
      })
    } else if (newPages.length > 5) {
      changes.push({
        type: "newPages",
        severity: "high",
        description: `Competitor added ${newPages.length} new pages`,
        count: newPages.length,
        affectedPages: newPages.slice(0, 10),
        impact: "competitive_threat",
        impactReason: "Competitor content growth. Check for keyword overlap.",
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REMOVED PAGES
  // ─────────────────────────────────────────────────────────────────────────────

  const removedPages: string[] = []
  for (const [url] of previousUrls) {
    if (!currentUrls.has(url)) {
      removedPages.push(url)
    }
  }

  if (removedPages.length > 0) {
    if (removedPages.length > 5) {
      changes.push({
        type: "removedPages",
        severity: "medium",
        description: `Competitor removed ${removedPages.length} pages from indexability`,
        count: removedPages.length,
        affectedPages: removedPages.slice(0, 10),
        impact: "opportunity",
        impactReason:
          "Pages are no longer crawlable (removed, 410, noindex, or robots.txt blocked). Content opportunity if still valuable.",
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  const titleChanges: string[] = []
  for (const [url, oldPage] of previousUrls) {
    const newPage = currentUrls.get(url)
    if (newPage && oldPage.title && newPage.title && oldPage.title !== newPage.title) {
      titleChanges.push(url)
    }
  }

  if (titleChanges.length > 5) {
    changes.push({
      type: "titleChanges",
      severity: "medium",
      description: `Competitor updated titles on ${titleChanges.length} pages (possible keyword strategy shift)`,
      count: titleChanges.length,
      affectedPages: titleChanges.slice(0, 10),
      impact: "neutral",
      impactReason: "Monitor their rankings. May indicate focus on different keywords.",
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // META DESCRIPTION CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  const metaChanges: string[] = []
  for (const [url, oldPage] of previousUrls) {
    const newPage = currentUrls.get(url)
    if (
      newPage &&
      oldPage.metaDescription &&
      newPage.metaDescription &&
      oldPage.metaDescription !== newPage.metaDescription
    ) {
      metaChanges.push(url)
    }
  }

  if (metaChanges.length > 3) {
    changes.push({
      type: "metaChanges",
      severity: "low",
      description: `Competitor updated meta descriptions on ${metaChanges.length} pages`,
      count: metaChanges.length,
      affectedPages: metaChanges.slice(0, 10),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // H1 CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  const h1Changes: string[] = []
  for (const [url, oldPage] of previousUrls) {
    const newPage = currentUrls.get(url)
    if (newPage && oldPage.h1 && newPage.h1 && oldPage.h1 !== newPage.h1) {
      h1Changes.push(url)
    }
  }

  if (h1Changes.length > 5) {
    changes.push({
      type: "h1Changes",
      severity: "low",
      description: `Competitor changed H1 tags on ${h1Changes.length} pages`,
      count: h1Changes.length,
      affectedPages: h1Changes.slice(0, 10),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEMA CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  const schemaChanges: string[] = []
  for (const [url, oldPage] of previousUrls) {
    const newPage = currentUrls.get(url)
    if (newPage) {
      const oldSchema = new Set(oldPage.schema || [])
      const newSchema = new Set(newPage.schema || [])

      let changed = false
      for (const type of newSchema) {
        if (!oldSchema.has(type)) {
          changed = true
          break
        }
      }

      if (!changed) {
        for (const type of oldSchema) {
          if (!newSchema.has(type)) {
            changed = true
            break
          }
        }
      }

      if (changed) {
        schemaChanges.push(url)
      }
    }
  }

  if (schemaChanges.length > 2) {
    changes.push({
      type: "schemaChanges",
      severity: "high",
      description: `Competitor added or modified schema markup on ${schemaChanges.length} pages`,
      count: schemaChanges.length,
      affectedPages: schemaChanges.slice(0, 10),
      impact: "opportunity",
      impactReason:
        "Competitor is improving for rich snippets/AI readiness. Check if you have equivalent schema coverage.",
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL LINKING CHANGES (aggregate)
  // ─────────────────────────────────────────────────────────────────────────────

  let prevTotalLinks = 0
  let currTotalLinks = 0

  for (const page of previousSnapshot.pages) {
    prevTotalLinks += page.internalLinks || 0
  }

  for (const page of currentSnapshot.pages) {
    currTotalLinks += page.internalLinks || 0
  }

  const linkDiff = currTotalLinks - prevTotalLinks
  if (Math.abs(linkDiff) > prevTotalLinks * 0.2) {
    changes.push({
      type: "linkingChanges",
      severity: linkDiff > 0 ? "high" : "medium",
      description: `Competitor ${linkDiff > 0 ? "increased" : "decreased"} internal linking by ${Math.abs(Math.round((linkDiff / prevTotalLinks) * 100))}%`,
      count: Math.abs(linkDiff),
      impact: linkDiff > 0 ? "neutral" : "opportunity",
      impactReason: linkDiff > 0 ? "Internal linking restructure detected." : "Linking decreased.",
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ROBOTS & SITEMAP CHANGES
  // ─────────────────────────────────────────────────────────────────────────────

  if (
    previousSnapshot.robots &&
    currentSnapshot.robots &&
    previousSnapshot.robots !== currentSnapshot.robots
  ) {
    changes.push({
      type: "robotsChanges",
      severity: "high",
      description: "Competitor changed robots.txt (crawl directives modified)",
      count: 1,
      impact: "neutral",
      impactReason: "Check if they're blocking new sections or opening indexation.",
    })
  }

  if (
    previousSnapshot.sitemap &&
    currentSnapshot.sitemap &&
    previousSnapshot.sitemap.length !== currentSnapshot.sitemap.length
  ) {
    changes.push({
      type: "sitemapChanges",
      severity: "medium",
      description: `Competitor modified sitemap structure (${previousSnapshot.sitemap.length} → ${currentSnapshot.sitemap.length} sitemaps)`,
      count: Math.abs(currentSnapshot.sitemap.length - previousSnapshot.sitemap.length),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCORE CHANGES (technical, content, schema)
  // ─────────────────────────────────────────────────────────────────────────────

  const technicalScoreDiff = currentSnapshot.technicalScore - previousSnapshot.technicalScore
  if (technicalScoreDiff < -10) {
    changes.push({
      type: "robotsChanges", // reuse for technical issues
      severity: "high",
      description: `Competitor's technical SEO score declined (${previousSnapshot.technicalScore} → ${currentSnapshot.technicalScore})`,
      count: 1,
      impact: "opportunity",
      impactReason: "They have new technical issues. Monitor for recovery window to gain ranking advantage.",
    })
  }

  const contentScoreDiff = currentSnapshot.contentScore - previousSnapshot.contentScore
  if (contentScoreDiff > 15) {
    changes.push({
      type: "contentExpansion",
      severity: "high",
      description: `Competitor's content quality/coverage improved significantly (+${contentScoreDiff} points)`,
      count: 1,
      impact: "competitive_threat",
      impactReason: "Content depth increasing. Ensure you have equivalent or better coverage.",
    })
  }

  return changes
}

export function calculateChangeImpact(change: DetectedChange): {
  priority: "critical" | "high" | "medium" | "low"
  actionable: boolean
} {
  const impactMap: Record<string, { priority: "critical" | "high" | "medium" | "low"; actionable: boolean }> = {
    newPages: { priority: "high", actionable: true },
    contentExpansion: { priority: "critical", actionable: true },
    contentRemoval: { priority: "medium", actionable: false },
    removedPages: { priority: "medium", actionable: true },
    titleChanges: { priority: "low", actionable: true },
    metaChanges: { priority: "low", actionable: true },
    h1Changes: { priority: "low", actionable: false },
    canonicalChanges: { priority: "medium", actionable: false },
    schemaChanges: { priority: "high", actionable: true },
    linkingChanges: { priority: "medium", actionable: true },
    navigationChanges: { priority: "low", actionable: false },
    robotsChanges: { priority: "high", actionable: true },
    sitemapChanges: { priority: "low", actionable: false },
  }

  return impactMap[change.type] || { priority: "medium", actionable: true }
}
