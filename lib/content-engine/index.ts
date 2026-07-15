import { PrismaClient } from '@prisma/client';
import { ContentMetricsEngine } from './metrics';
import { GapAnalysisEngine } from './gap-analysis';
import { RefreshDetectionEngine } from './refresh-detection';

export class ContentOptimizationEngine {
  private metricsEngine: ContentMetricsEngine;
  private gapAnalysisEngine: GapAnalysisEngine;
  private refreshEngine: RefreshDetectionEngine;

  constructor(private prisma: PrismaClient) {
    this.metricsEngine = new ContentMetricsEngine(prisma);
    this.gapAnalysisEngine = new GapAnalysisEngine(prisma);
    this.refreshEngine = new RefreshDetectionEngine(prisma);
  }

  getMetricsEngine(): ContentMetricsEngine {
    return this.metricsEngine;
  }

  getGapAnalysisEngine(): GapAnalysisEngine {
    return this.gapAnalysisEngine;
  }

  getRefreshDetectionEngine(): RefreshDetectionEngine {
    return this.refreshEngine;
  }

  /**
   * Orchestrate complete content analysis for a project
   * Returns prioritized recommendations based on actual project data
   */
  async analyzeProjectContent(organizationId: string, projectId: string) {
    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        businessProfile: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.businessProfile) {
      throw new Error('Business profile required for content analysis');
    }

    const { businessProfile } = project;

    // Get content inventory
    const inventory = await this.prisma.contentInventory.findMany({
      where: {
        projectId,
      },
      include: {
        metrics: true,
      },
    });

    // Analyze gaps
    const gaps = await this.gapAnalysisEngine.analyzeGaps({
      industry: businessProfile.industry,
      businessServices: businessProfile.primaryServices as string[],
      businessLocations: businessProfile.primaryLocations as string[],
      primaryConversionGoal: businessProfile.primaryConversionGoal,
      targetKeywords: [],
      currentPageTypes: inventory.map((p) => p.contentType),
      competitorPageTypes: [], // Would integrate competitor data
      moneyPages: businessProfile.primaryConversionGoal
        .split(',')
        .map((g) => g.trim()),
    });

    // Detect refresh opportunities
    const refreshInputs = inventory.map((page) => ({
      pageUrl: page.pageUrl,
      wordCount: page.wordCount,
      lastModifiedDays: page.lastModified
        ? Math.floor((Date.now() - page.lastModified.getTime()) / (1000 * 60 * 60 * 24))
        : 730,
      trafficTrend30d: 0, // Would calculate from historical data
      rankingTrend30d: 0, // Would calculate from GSC data
      ctrTrend30d: 0, // Would calculate from GSC data
      currentRank: 0,
      currentCtr: page.gscAverageCtr,
      ga4Sessions: page.ga4Sessions,
      ga4Pageviews: page.ga4Pageviews,
      ga4Conversions: page.ga4Conversions,
      indexStatus: page.indexStatus,
      hasSchema: page.hasSchema,
      isMoneyPage: page.isMoneyPage,
    }));

    const refreshOpportunities = await this.refreshEngine.detectRefreshOpportunities(refreshInputs);

    return {
      projectId,
      inventoryCount: inventory.length,
      contentGaps: gaps.slice(0, 10), // Top 10 gaps
      refreshOpportunities: refreshOpportunities.slice(0, 10), // Top 10 refresh opportunities
      summary: {
        totalPages: inventory.length,
        averageWordCount: Math.round(
          inventory.reduce((sum, p) => sum + p.wordCount, 0) / Math.max(inventory.length, 1)
        ),
        averageScore: Math.round(
          inventory.reduce((sum, p) => sum + (p.metrics?.overallScore || 0), 0) / Math.max(inventory.length, 1)
        ),
        topOpportunities: this.rankTopOpportunities(gaps, refreshOpportunities),
      },
    };
  }

  private rankTopOpportunities(gaps: any[], refreshOpportunities: any[]): string[] {
    const opportunities: string[] = [];

    // High-impact gaps
    const highPriorityGaps = gaps.filter((g) => g.priority === 'high').slice(0, 3);
    for (const gap of highPriorityGaps) {
      opportunities.push(
        `Create ${gap.recommendedPageType}: "${gap.suggestedTitle}" (est. ${gap.estimatedTrafficPotential} traffic)`
      );
    }

    // Urgent refreshes
    const urgentRefreshes = refreshOpportunities
      .filter((r) => r.priority === 'high')
      .slice(0, 3);
    for (const refresh of urgentRefreshes) {
      opportunities.push(
        `Refresh: ${refresh.pageUrl} (declining ${Math.abs(Math.round(refresh.trafficTrend30d))}% - recover ${refresh.estimatedPotential} traffic)`
      );
    }

    return opportunities.slice(0, 5);
  }
}

export { ContentMetricsEngine } from './metrics';
export { GapAnalysisEngine } from './gap-analysis';
export { RefreshDetectionEngine } from './refresh-detection';
export type { ContentMetricsInput, ContentMetricsResult } from './metrics';
export type { GapAnalysisInput, ContentGap } from './gap-analysis';
export type { RefreshDetectionInput, RefreshOpportunity } from './refresh-detection';
