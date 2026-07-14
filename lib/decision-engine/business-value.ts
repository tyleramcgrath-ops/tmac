import { PrismaClient } from '@prisma/client';

export interface BusinessValueComponents {
  revenueScore: number;
  conversionScore: number;
  strategicScore: number;
  navigationScore: number;
  authorityScore: number;
  trendScore: number;
  manualPriorityScore: number;
}

export interface BusinessValueWeights {
  revenue: number;
  conversions: number;
  strategic: number;
  navigation: number;
  authority: number;
  trend: number;
  manualPriority: number;
}

export interface BusinessValueResult {
  pageId: string;
  components: BusinessValueComponents;
  weights: BusinessValueWeights;
  totalScore: number;
  explanation: string;
}

export class BusinessValueEngine {
  private prisma: PrismaClient;
  private defaultWeights: BusinessValueWeights = {
    revenue: 0.4,
    conversions: 0.25,
    strategic: 0.2,
    navigation: 0.1,
    authority: 0.05,
    trend: 0,
    manualPriority: 0,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async calculateBusinessValue(
    pageId: string,
    signals: {
      monthlyVisitors: number;
      conversions: number;
      conversionRate: number;
      conversionValue: number;
      thirtyDayTrend: number;
      strategicImportance: number;
      manualPriority: number;
      navigationLevel: number;
      inboundCount: number;
      internalLinkCount: number;
      isHomepage: boolean;
      primaryPageType: string;
    },
    weights?: Partial<BusinessValueWeights>
  ): Promise<BusinessValueResult> {
    const finalWeights: BusinessValueWeights = {
      ...this.defaultWeights,
      ...weights,
    };

    // Calculate component scores (0-100)
    const components = this.calculateComponents(signals, finalWeights);

    // Apply weights and sum
    const totalScore =
      components.revenueScore * finalWeights.revenue +
      components.conversionScore * finalWeights.conversions +
      components.strategicScore * finalWeights.strategic +
      components.navigationScore * finalWeights.navigation +
      components.authorityScore * finalWeights.authority +
      components.trendScore * finalWeights.trend +
      components.manualPriorityScore * finalWeights.manualPriority;

    const explanation = this.generateExplanation(
      components,
      finalWeights,
      totalScore,
      signals
    );

    return {
      pageId,
      components,
      weights: finalWeights,
      totalScore: Math.min(100, totalScore),
      explanation,
    };
  }

  private calculateComponents(
    signals: {
      monthlyVisitors: number;
      conversions: number;
      conversionRate: number;
      conversionValue: number;
      thirtyDayTrend: number;
      strategicImportance: number;
      manualPriority: number;
      navigationLevel: number;
      inboundCount: number;
      internalLinkCount: number;
      isHomepage: boolean;
      primaryPageType: string;
    },
    weights: BusinessValueWeights
  ): BusinessValueComponents {
    // Revenue Score: based on conversion value and traffic
    const revenueScore = this.scoreRevenue(
      signals.conversionValue,
      signals.monthlyVisitors
    );

    // Conversion Score: based on conversions and conversion rate
    const conversionScore = this.scoreConversions(
      signals.conversions,
      signals.conversionRate,
      signals.monthlyVisitors
    );

    // Strategic Score: based on manual priority and page type
    const strategicScore = this.scoreStrategic(
      signals.strategicImportance,
      signals.isHomepage,
      signals.primaryPageType
    );

    // Navigation Score: based on navigation position and inbound links
    const navigationScore = this.scoreNavigation(
      signals.navigationLevel,
      signals.inboundCount,
      signals.isHomepage,
      signals.internalLinkCount
    );

    // Authority Score: based on inbound links
    const authorityScore = this.scoreAuthority(signals.inboundCount);

    // Trend Score: based on 30-day trend
    const trendScore = this.scoreTrend(signals.thirtyDayTrend);

    // Manual Priority Score
    const manualPriorityScore = Math.min(
      100,
      signals.manualPriority * 10
    );

    return {
      revenueScore,
      conversionScore,
      strategicScore,
      navigationScore,
      authorityScore,
      trendScore,
      manualPriorityScore,
    };
  }

  private scoreRevenue(conversionValue: number, monthlyVisitors: number): number {
    if (conversionValue === 0) return 0;

    // Normalize conversion value (assume max typical monthly revenue is $100k)
    const revenueScore = Math.min(100, (conversionValue / 100000) * 100);

    // Boost if also has significant traffic
    if (monthlyVisitors > 1000) return Math.min(100, revenueScore * 1.2);
    return revenueScore;
  }

  private scoreConversions(
    conversions: number,
    conversionRate: number,
    monthlyVisitors: number
  ): number {
    if (conversions === 0) return 0;

    // Normalize conversions (assume max is 1000 conversions/month)
    let score = Math.min(100, (conversions / 1000) * 100);

    // Boost for high conversion rate
    if (conversionRate > 0.05) score *= 1.3; // 5% CR
    else if (conversionRate > 0.02) score *= 1.15; // 2% CR
    else if (conversionRate > 0.01) score *= 1.05; // 1% CR

    // Ensure score is within bounds
    return Math.min(100, score);
  }

  private scoreStrategic(
    strategicImportance: number,
    isHomepage: boolean,
    pageType: string
  ): number {
    let score = strategicImportance * 10; // 0-10 scale to 0-100

    // Homepage is always highly strategic
    if (isHomepage) score = Math.max(score, 95);

    // Certain page types are strategically important
    if (
      pageType === 'service' ||
      pageType === 'product' ||
      pageType === 'contact'
    ) {
      score = Math.max(score, 70);
    }

    return Math.min(100, score);
  }

  private scoreNavigation(
    navigationLevel: number,
    inboundCount: number,
    isHomepage: boolean,
    internalLinkCount: number
  ): number {
    if (isHomepage) return 100;

    // Shallower pages are more navigable (fewer slashes)
    let score = Math.max(0, 100 - navigationLevel * 10);

    // Boost for high inbound links (popular entry point)
    if (inboundCount > 20) score = Math.min(100, score + 20);
    else if (inboundCount > 10) score = Math.min(100, score + 10);

    // Boost for many internal links (hub page)
    if (internalLinkCount > 50) score = Math.min(100, score + 15);

    return Math.min(100, score);
  }

  private scoreAuthority(inboundCount: number): number {
    // Normalize inbound links (assume max is 100+ inbound links)
    return Math.min(100, (inboundCount / 100) * 100);
  }

  private scoreTrend(thirtyDayTrend: number): number {
    // Trend is percentage growth (-100 to +infinity)
    // Positive trend boosts score, negative reduces
    if (thirtyDayTrend > 0) {
      // Cap at +100% growth = 50 point bonus
      return Math.min(50, thirtyDayTrend / 2);
    } else {
      // Negative trend reduces score
      return Math.max(-50, thirtyDayTrend / 2);
    }
  }

  private generateExplanation(
    components: BusinessValueComponents,
    weights: BusinessValueWeights,
    totalScore: number,
    signals: any
  ): string {
    const drivers: string[] = [];

    // Identify top drivers
    const sorted = [
      { name: 'Revenue', score: components.revenueScore, weight: weights.revenue },
      { name: 'Conversions', score: components.conversionScore, weight: weights.conversions },
      { name: 'Strategic', score: components.strategicScore, weight: weights.strategic },
      { name: 'Navigation', score: components.navigationScore, weight: weights.navigation },
    ].sort((a, b) => b.score * b.weight - a.score * a.weight);

    if (sorted[0].score > 50) {
      drivers.push(`${sorted[0].name} is the primary business value driver`);
    }
    if (sorted[1].score > 50) {
      drivers.push(`${sorted[1].name} contributes significantly`);
    }

    if (signals.isHomepage) {
      drivers.push('Homepage has highest strategic importance');
    }

    if (signals.thirtyDayTrend > 10) {
      drivers.push('Positive growth trend adds value');
    } else if (signals.thirtyDayTrend < -10) {
      drivers.push('Declining trend reduces value');
    }

    return drivers.join('. ') || 'Page has moderate business value across multiple dimensions';
  }

  async saveBusinessValueScore(
    organizationId: string,
    projectId: string,
    pageUrl: string,
    result: BusinessValueResult
  ) {
    const existing = await this.prisma.businessValueScore.findUnique({
      where: { projectId_pageUrl: { projectId, pageUrl } },
    });

    if (existing) {
      return this.prisma.businessValueScore.update({
        where: { projectId_pageUrl: { projectId, pageUrl } },
        data: {
          revenueScore: result.components.revenueScore,
          conversionScore: result.components.conversionScore,
          strategicScore: result.components.strategicScore,
          navigationScore: result.components.navigationScore,
          authorityScore: result.components.authorityScore,
          trendScore: result.components.trendScore,
          manualPriorityScore: result.components.manualPriorityScore,
          weightsUsed: JSON.stringify(result.weights),
          totalBusinessValue: result.totalScore,
          explanation: result.explanation,
        },
      });
    } else {
      return this.prisma.businessValueScore.create({
        data: {
          pageUrl,
          organizationId,
          projectId,
          revenueScore: result.components.revenueScore,
          conversionScore: result.components.conversionScore,
          strategicScore: result.components.strategicScore,
          navigationScore: result.components.navigationScore,
          authorityScore: result.components.authorityScore,
          trendScore: result.components.trendScore,
          manualPriorityScore: result.components.manualPriorityScore,
          weightsUsed: JSON.stringify(result.weights),
          totalBusinessValue: result.totalScore,
          explanation: result.explanation,
        },
      });
    }
  }
}
