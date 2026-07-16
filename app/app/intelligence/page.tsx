'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, Zap, Target, AlertCircle, CheckCircle, Eye, Network, Layers,
  ArrowRight, ChevronDown, ChevronRight, Brain, Sparkles, type LucideIcon,
} from 'lucide-react'
import type { PageResult, Analytics } from '@/lib/demo-data'
import { analyzeOrganic, type OrganicIntelligence, type TopicCluster, type OpportunityScore } from '@/lib/organic-intelligence'

interface IntelligenceState {
  loading: boolean
  intelligence: OrganicIntelligence | null
  error: string | null
  expandedCluster: string | null
  expandedOpportunity: string | null
}

export default function IntelligencePage() {
  const [state, setState] = useState<IntelligenceState>({
    loading: true,
    intelligence: null,
    error: null,
    expandedCluster: null,
    expandedOpportunity: null,
  })

  useEffect(() => {
    // Load and analyze crawl data
    try {
      const pagesData = localStorage.getItem('rf_app_pages')
      const analyticsData = localStorage.getItem('rf_app_analytics')
      const businessName = localStorage.getItem('rf_app_name') || 'Your Business'

      const pages = pagesData ? JSON.parse(pagesData) : []
      const analytics = analyticsData ? JSON.parse(analyticsData) : null

      if (!pages || !analytics) {
        setState(prev => ({ ...prev, error: 'No crawl data found', loading: false }))
        return
      }

      // Run organic intelligence analysis
      const intelligence = analyzeOrganic(pages, analytics, businessName)

      setState(prev => ({ ...prev, intelligence, loading: false }))
    } catch (err) {
      setState(prev => ({ ...prev, error: String(err), loading: false }))
    }
  }, [])

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[var(--rf-muted)]">Analyzing your site...</div>
      </div>
    )
  }

  if (state.error || !state.intelligence) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-[var(--rf-red)] mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Analysis Error</h2>
        <p className="text-[var(--rf-muted)]">{state.error}</p>
      </div>
    )
  }

  const intel = state.intelligence

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-[var(--rf-cyan)]" />
          <h1 className="text-3xl font-semibold text-white">Organic Intelligence</h1>
        </div>
        <p className="text-[var(--rf-muted)]">Automatic keyword discovery, topic clustering, and ranking opportunities</p>
      </div>

      {/* Executive Summary */}
      <div className="rf-card rf-topline p-6 border-l-2 border-[var(--rf-cyan)]/30">
        <h2 className="text-lg font-semibold text-white mb-4">Analysis Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-2">Business Type</div>
            <div className="text-base font-semibold text-white">{intel.businessType}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-2">Inferred Keywords</div>
            <div className="text-base font-semibold text-[var(--rf-cyan)]">{intel.summary.estimatedKeywordCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-2">Topic Clusters</div>
            <div className="text-base font-semibold text-[var(--rf-green)]">{intel.summary.topicClusters}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-2">Competitive Pos.</div>
            <div className="text-base font-semibold capitalize text-[var(--rf-amber)]">{intel.summary.competitivePosition}</div>
          </div>
        </div>
        <p className="text-sm text-[var(--rf-text)]">{intel.summary.recommendation}</p>
      </div>

      {/* Keyword Opportunities */}
      <div className="rf-card rf-topline p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--rf-green)]" />
          <h2 className="text-lg font-semibold text-white">Top Keyword Opportunities</h2>
          <span className="text-sm text-[var(--rf-muted)]">({intel.opportunities.length} total)</span>
        </div>

        <div className="space-y-2">
          {intel.opportunities.slice(0, 8).map((opp, idx) => (
            <OpportunityCard key={idx} opportunity={opp} index={idx} />
          ))}
        </div>
      </div>

      {/* Topic Clusters */}
      <div className="rf-card rf-topline p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[var(--rf-blue)]" />
          <h2 className="text-lg font-semibold text-white">Topic Clusters</h2>
        </div>

        <div className="space-y-3">
          {intel.topicClusters.slice(0, 6).map(cluster => (
            <TopicClusterCard
              key={cluster.id}
              cluster={cluster}
              isExpanded={state.expandedCluster === cluster.id}
              onToggle={() =>
                setState(prev => ({
                  ...prev,
                  expandedCluster: prev.expandedCluster === cluster.id ? null : cluster.id,
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Money Pages */}
      <div className="rf-card rf-topline p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[var(--rf-amber)]" />
          <h2 className="text-lg font-semibold text-white">Identified Money Pages</h2>
        </div>

        <div className="space-y-2">
          {intel.moneyPages.slice(0, 5).map((page, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-2 h-2 rounded-full bg-[var(--rf-amber)] mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">{page.url}</p>
                  <span className="text-xs text-[var(--rf-muted)] whitespace-nowrap">{page.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--rf-muted)]">Confidence:</span>
                  <span className="text-[var(--rf-green)]">{page.confidence}%</span>
                  <span className="text-[var(--rf-muted)]">Value:</span>
                  <span className="text-[var(--rf-cyan)]">{page.estimatedValue}/100</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--rf-muted)] flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rf-card rf-topline p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[var(--rf-green)]" />
            <h3 className="font-semibold text-white">Quick Wins (Next 7 Days)</h3>
          </div>
          <div className="space-y-2">
            {intel.roadmap.quickWins.slice(0, 4).map((opp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--rf-green)]/[0.08] border-l-2 border-[var(--rf-green)]">
                <p className="text-sm font-semibold text-white mb-1">{opp.keyword}</p>
                <p className="text-xs text-[var(--rf-muted)]">{opp.reasoning.substring(0, 80)}...</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rf-card rf-topline p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--rf-cyan)]" />
            <h3 className="font-semibold text-white">30-Day Roadmap</h3>
          </div>
          <div className="space-y-2">
            {intel.roadmap.thirtyDayWins.slice(0, 4).map((opp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--rf-cyan)]/[0.08] border-l-2 border-[var(--rf-cyan)]">
                <p className="text-sm font-semibold text-white mb-1">{opp.keyword}</p>
                <p className="text-xs text-[var(--rf-muted)]">Score: {opp.overallScore}/100</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content & Technical Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rf-card rf-topline p-6">
          <h3 className="font-semibold text-white mb-4">Content Wins</h3>
          <div className="space-y-2">
            {intel.roadmap.contentWins.map((win, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-[var(--rf-green)] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[var(--rf-text)]">{win}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rf-card rf-topline p-6">
          <h3 className="font-semibold text-white mb-4">Technical Wins</h3>
          <div className="space-y-2">
            {intel.roadmap.technicalWins.map((win, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-[var(--rf-blue)] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[var(--rf-text)]">{win}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Analysis */}
      <div className="rf-card rf-topline p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-[var(--rf-amber)]" />
          <h2 className="text-lg font-semibold text-white">Competitor Gap Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Likely Competitors</h3>
            <div className="space-y-2">
              {intel.competitors.likelyCompetitors.map((comp, idx) => (
                <div key={idx} className="text-sm text-[var(--rf-text)] p-2 rounded bg-white/[0.02]">
                  {comp}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Content Gaps (vs. Competitors)</h3>
            <div className="space-y-2">
              {intel.competitors.contentGaps.map((gap, idx) => (
                <div key={idx} className="text-sm text-[var(--rf-muted)] p-2 rounded bg-white/[0.02]">
                  • {gap}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 60 & 90 Day Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rf-card rf-topline p-6">
          <h3 className="font-semibold text-white mb-4">60-Day Opportunities</h3>
          <div className="space-y-2">
            {intel.roadmap.sixtyDayWins.map((opp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <p className="text-sm font-semibold text-white mb-1">{opp.keyword}</p>
                <div className="flex gap-3 text-xs text-[var(--rf-muted)]">
                  <span>Score: {opp.overallScore}</span>
                  <span>Value: {opp.estimatedTrafficValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rf-card rf-topline p-6">
          <h3 className="font-semibold text-white mb-4">90-Day Long-Term</h3>
          <div className="space-y-2">
            {intel.roadmap.ninetyDayWins.map((opp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <p className="text-sm font-semibold text-white mb-1">{opp.keyword}</p>
                <p className="text-xs text-[var(--rf-muted)]">{opp.reasoning.substring(0, 60)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OpportunityCard({ opportunity, index }: { opportunity: OpportunityScore; index: number }) {
  const rankColor =
    opportunity.overallScore > 80
      ? 'text-[var(--rf-green)]'
      : opportunity.overallScore > 60
        ? 'text-[var(--rf-cyan)]'
        : 'text-[var(--rf-amber)]'

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[var(--rf-muted)]">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <h4 className="font-semibold text-white truncate">{opportunity.keyword}</h4>
          <span className={`text-xs font-bold whitespace-nowrap ${rankColor}`}>{opportunity.overallScore}/100</span>
        </div>
        <p className="text-xs text-[var(--rf-muted)] mb-2">{opportunity.topic}</p>
        <p className="text-xs text-[var(--rf-text)] mb-2">{opportunity.reasoning.substring(0, 100)}...</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-[var(--rf-muted)]">Business Value: {opportunity.businessValue}/100</span>
          <span className="text-[var(--rf-muted)]">Traffic Est: {opportunity.estimatedTrafficValue}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--rf-muted)] flex-shrink-0" />
    </div>
  )
}

function TopicClusterCard({
  cluster,
  isExpanded,
  onToggle,
}: {
  cluster: TopicCluster
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className="p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{cluster.primaryTopic}</h3>
          <div className="flex gap-4 text-xs text-[var(--rf-muted)]">
            <span>{cluster.keywords.length} keywords</span>
            <span>{cluster.pages.length} pages</span>
            <span>Authority: {cluster.authority}/100</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--rf-muted)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="pt-4 border-t border-white/[0.1]">
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--rf-muted)] mb-2">Key Keywords</p>
            <div className="flex flex-wrap gap-2">
              {cluster.keywords.slice(0, 5).map(kw => (
                <span key={kw.keyword} className="px-2 py-1 rounded bg-white/[0.08] text-xs text-white">
                  {kw.keyword}
                </span>
              ))}
            </div>
          </div>

          {cluster.contentGaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--rf-muted)] mb-2">Content Gaps</p>
              <ul className="space-y-1">
                {cluster.contentGaps.slice(0, 3).map((gap, idx) => (
                  <li key={idx} className="text-xs text-[var(--rf-text)] flex gap-2">
                    <span className="text-[var(--rf-amber)]">•</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
