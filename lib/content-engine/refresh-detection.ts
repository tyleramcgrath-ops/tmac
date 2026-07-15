import { PrismaClient } from '@prisma/client';

export interface RefreshDetectionInput {
  pageUrl: string;
  wordCount: number;
  lastModifiedDays: number;
  trafficTrend30d: number; // % change
  rankingTrend30d: number; // position change
  ctrTrend30d: number; // % change
  currentRank: number;
  currentCtr: number;
  ga4Sessions: number;
  ga4Pageviews: number;
  ga4Conversions: number;
  indexStatus: string;
  hasSchema: boolean;
  isMoneyPage: boolean;
}

export interface RefreshOpportunity {
  pageUrl: string;
  priority: 'high' | 'medium' | 'low';
  refreshReasons: string[];
  trafficTrend30d: number;
  rankingTrend30d: number;
  ctrTrend30d: number;
  lastRefreshed: Date | null;
  suggestedRefreshDate: Date;
  daysStale: number;
  estimatedPotential: number; // Traffic recovery potential
  suggestedImprovements: string[];
}

export class RefreshDetectionEngine {
  constructor(private prisma: PrismaClient) {}

  async detectRefreshOpportunities(inputs: RefreshDetectionInput[]): Promise<RefreshOpportunity[]> {
    const opportunities: RefreshOpportunity[] = [];

    for (const input of inputs) {
      const refreshNeeded = this.analyzeRefreshNeed(input);
      if (refreshNeeded) {
        opportunities.push(refreshNeeded);
      }
    }

    // Sort by priority and potential
    opportunities.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.estimatedPotential - a.estimatedPotential
      );
    });

    return opportunities;
  }

  private analyzeRefreshNeed(input: RefreshDetectionInput): RefreshOpportunity | null {
    const reasons: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'low';

    // Check for traffic decline
    if (input.trafficTrend30d < -20) {
      reasons.push('traffic_decline');
      priority = 'high';
    } else if (input.trafficTrend30d < -10) {
      reasons.push('traffic_decline');
      priority = 'medium';
    }

    // Check for ranking decline
    if (input.rankingTrend30d > 5) {
      reasons.push('ranking_decline');
      if (priority === 'low') priority = 'medium';
    } else if (input.rankingTrend30d > 10) {
      reasons.push('ranking_decline');
      priority = 'high';
    }

    // Check for CTR decline
    if (input.ctrTrend30d < -20) {
      reasons.push('ctr_decline');
      if (priority === 'low') priority = 'medium';
    }

    // Check for outdated content
    if (input.lastModifiedDays > 180) {
      reasons.push('outdated_content');
      if (priority === 'low') priority = 'medium';
    }

    // Check for thin content
    if (input.wordCount < 300) {
      reasons.push('thin_content');
      if (priority === 'low') priority = 'medium';
    }

    // Check for missing schema
    if (!input.hasSchema && input.isMoneyPage) {
      reasons.push('missing_schema');
      if (priority === 'low') priority = 'medium';
    }

    // Check for indexation issues
    if (input.indexStatus !== 'indexed') {
      reasons.push('indexation_issue');
      priority = 'high';
    }

    // Money pages need more attention
    if (input.isMoneyPage && reasons.length > 0) {
      priority = 'high';
    }

    if (reasons.length === 0) return null;

    const potential = this.estimateRecoveryPotential(input, reasons);
    const suggestedImprovements = this.suggestImprovements(input, reasons);

    return {
      pageUrl: input.pageUrl,
      priority,
      refreshReasons: reasons,
      trafficTrend30d: input.trafficTrend30d,
      rankingTrend30d: input.rankingTrend30d,
      ctrTrend30d: input.ctrTrend30d,
      lastRefreshed: null, // Would be fetched from DB in real implementation
      suggestedRefreshDate: this.calculateRefreshDate(priority, input.lastModifiedDays),
      daysStale: input.lastModifiedDays,
      estimatedPotential: potential,
      suggestedImprovements,
    };
  }

  private estimateRecoveryPotential(input: RefreshDetectionInput, reasons: string[]): number {
    let potential = 0;

    // Current traffic baseline
    const trafficBaseline = input.ga4Sessions;

    // Estimate recovery based on trends and session volume
    if (input.trafficTrend30d < -20 && trafficBaseline > 10) {
      // High decline = high recovery potential
      potential = Math.abs(input.trafficTrend30d) * 2;
    } else if (input.trafficTrend30d < -10) {
      potential = Math.abs(input.trafficTrend30d);
    }

    // Ranking decline recovery
    if (input.rankingTrend30d > 5) {
      potential += input.rankingTrend30d * 3;
    }

    // Money pages have higher value
    if (input.isMoneyPage) {
      potential *= 1.5;
    }

    // Old content refresh has high potential
    if (input.lastModifiedDays > 365) {
      potential += 50;
    }

    return Math.round(potential);
  }

  private suggestImprovements(input: RefreshDetectionInput, reasons: string[]): string[] {
    const improvements: string[] = [];

    if (reasons.includes('traffic_decline')) {
      improvements.push('Update content with latest information');
      improvements.push('Add fresh examples and case studies');
      improvements.push('Improve meta description for CTR');
    }

    if (reasons.includes('ranking_decline')) {
      improvements.push('Strengthen topical relevance');
      improvements.push('Add internal links from related pages');
      improvements.push('Improve entity coverage');
    }

    if (reasons.includes('ctr_decline')) {
      improvements.push('Rewrite meta title for clarity');
      improvements.push('Improve meta description');
      improvements.push('Add schema for rich snippets');
    }

    if (reasons.includes('outdated_content')) {
      improvements.push('Update statistics and data');
      improvements.push('Refresh dated examples');
      improvements.push('Add recent case studies');
    }

    if (reasons.includes('thin_content')) {
      improvements.push('Expand content to 600+ words');
      improvements.push('Add more sections and depth');
      improvements.push('Include images and multimedia');
    }

    if (reasons.includes('missing_schema')) {
      improvements.push('Add Schema.org markup');
      improvements.push('Use appropriate schema type');
      improvements.push('Complete all schema fields');
    }

    if (reasons.includes('indexation_issue')) {
      improvements.push('Check robots.txt and meta robots');
      improvements.push('Remove noindex if present');
      improvements.push('Ensure page is crawlable');
    }

    return improvements.slice(0, 3); // Top 3 suggestions
  }

  private calculateRefreshDate(priority: string, lastModifiedDays: number): Date {
    const today = new Date();
    let daysToAdd = 30; // Default 1 month

    if (priority === 'high') {
      daysToAdd = 7; // Urgent - within a week
    } else if (priority === 'medium') {
      daysToAdd = 14; // 2 weeks
    }

    // Consider how stale content is
    if (lastModifiedDays > 365) {
      daysToAdd = Math.min(daysToAdd, 7); // Very old = urgent
    }

    return new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }
}
