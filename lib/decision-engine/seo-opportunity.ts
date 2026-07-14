import { PrismaClient } from '@prisma/client';

export interface SEOOpportunityComponents {
  rankingGapScore: number;
  ctrGapScore: number;
  impressionScore: number;
  schemaGapsScore: number;
  internalLinkingScore: number;
  indexabilityScore: number;
  coreWebVitalsScore: number;
  contentFreshnessScore: number;
  backlinksScore: number;
  duplicateContentScore: number;
}

export interface SEOOpportunityWeights {
  rankingGap: number;
  ctrGap: number;
  impressions: number;
  schemaGaps: number;
  internalLinking: number;
  indexability: number;
  coreWebVitals: number;
  contentFreshness: number;
  backlinks: number;
  duplicateContent: number;
}

export interface SEOOpportunityResult {
  pageId: string;
  components: SEOOpportunityComponents;
  weights: SEOOpportunityWeights;
  totalScore: number;
  identifiedOpportunities: string[];
  explanation: string;
}

export class SEOOpportunityEngine {
  private prisma: PrismaClient;
  private defaultWeights: SEOOpportunityWeights = {
    rankingGap: 0.3,
    ctrGap: 0.25,
    impressions: 0.2,
    schemaGaps: 0.15,
    internalLinking: 0.08,
    indexability: 0.07,
    coreWebVitals: 0.06,
    contentFreshness: 0.05,
    backlinks: 0.02,
    duplicateContent: 0.02,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async calculateSEOOpportunity(
    pageId: string,
    signals: {
      currentRank: number;
      targetRank: number;
      currentCTR: number;
      industryCTR: number;
      impressions: number;
      schemaTypes: string[];
      schemaCompleteness: number;
      internalLinkCount: number;
      isIndexed: boolean;
      hasNoindex: boolean;
      pageSpeedScore: number;
      coreWebVitalsStatus: string;
      contentAgeInDays: number;
      inboundLinks: number;
      hasDuplicateContent: boolean;
    },
    weights?: Partial<SEOOpportunityWeights>
  ): Promise<SEOOpportunityResult> {
    const finalWeights: SEOOpportunityWeights = {
      ...this.defaultWeights,
      ...weights,
    };

    const components = this.calculateComponents(signals, finalWeights);

    const totalScore =
      components.rankingGapScore * finalWeights.rankingGap +
      components.ctrGapScore * finalWeights.ctrGap +
      components.impressionScore * finalWeights.impressions +
      components.schemaGapsScore * finalWeights.schemaGaps +
      components.internalLinkingScore * finalWeights.internalLinking +
      components.indexabilityScore * finalWeights.indexability +
      components.coreWebVitalsScore * finalWeights.coreWebVitals +
      components.contentFreshnessScore * finalWeights.contentFreshness +
      components.backlinksScore * finalWeights.backlinks +
      components.duplicateContentScore * finalWeights.duplicateContent;

    const opportunities = this.identifyOpportunities(components, signals);
    const explanation = this.generateExplanation(
      components,
      finalWeights,
      totalScore,
      opportunities
    );

    return {
      pageId,
      components,
      weights: finalWeights,
      totalScore: Math.min(100, totalScore),
      identifiedOpportunities: opportunities,
      explanation,
    };
  }

  private calculateComponents(
    signals: any,
    weights: SEOOpportunityWeights
  ): SEOOpportunityComponents {
    return {
      rankingGapScore: this.scoreRankingGap(
        signals.currentRank,
        signals.targetRank
      ),
      ctrGapScore: this.scoreCTRGap(signals.currentCTR, signals.industryCTR),
      impressionScore: this.scoreImpressions(signals.impressions),
      schemaGapsScore: this.scoreSchemaGaps(
        signals.schemaTypes,
        signals.schemaCompleteness
      ),
      internalLinkingScore: this.scoreInternalLinking(
        signals.internalLinkCount
      ),
      indexabilityScore: this.scoreIndexability(
        signals.isIndexed,
        signals.hasNoindex
      ),
      coreWebVitalsScore: this.scoreCoreWebVitals(
        signals.coreWebVitalsStatus,
        signals.pageSpeedScore
      ),
      contentFreshnessScore: this.scoreContentFreshness(
        signals.contentAgeInDays
      ),
      backlinksScore: this.scoreBacklinks(signals.inboundLinks),
      duplicateContentScore: this.scoreDuplicateContent(
        signals.hasDuplicateContent
      ),
    };
  }

  private scoreRankingGap(currentRank: number, targetRank: number): number {
    if (currentRank === 0 || currentRank > 100) return 0; // Not ranking

    // Gap between current and target rank
    const gap = currentRank - targetRank;

    // Normalize: if gap is 50 positions, that's high opportunity
    if (gap <= 0) return 0; // Already at or better than target
    if (gap <= 5) return 30; // Already competitive
    if (gap <= 10) return 60; // Good opportunity
    if (gap <= 20) return 80; // Significant opportunity
    return 95; // Very far from target, major opportunity
  }

  private scoreCTRGap(currentCTR: number, industryCTR: number): number {
    if (currentCTR === 0 || industryCTR === 0) return 0;

    const gap = industryCTR - currentCTR;
    const percentageGap = (gap / industryCTR) * 100;

    if (percentageGap <= 0) return 0;
    if (percentageGap <= 10) return 20;
    if (percentageGap <= 25) return 50;
    if (percentageGap <= 50) return 75;
    return 95;
  }

  private scoreImpressions(impressions: number): number {
    // More impressions = more opportunity for improvement
    // Normalize: 1000 impressions = 50, 10000 = 100
    if (impressions === 0) return 10; // Some potential even with few impressions
    return Math.min(100, (Math.log10(impressions) / 4) * 100);
  }

  private scoreSchemaGaps(
    schemaTypes: string[],
    schemaCompleteness: number
  ): number {
    // No schema at all = high opportunity
    if (!schemaTypes || schemaTypes.length === 0) return 80;

    // Incomplete schema
    if (schemaCompleteness < 50) return 70;
    if (schemaCompleteness < 80) return 50;
    if (schemaCompleteness < 100) return 20;

    return 0; // Complete schema
  }

  private scoreInternalLinking(linkCount: number): number {
    // Fewer internal links = opportunity for improvement
    if (linkCount === 0) return 90;
    if (linkCount < 5) return 70;
    if (linkCount < 10) return 50;
    if (linkCount < 20) return 30;
    return 10;
  }

  private scoreIndexability(isIndexed: boolean, hasNoindex: boolean): number {
    if (hasNoindex) return 95; // Critical - should be indexed
    if (!isIndexed) return 85; // Not indexed - big issue
    return 0; // Properly indexed
  }

  private scoreCoreWebVitals(
    coreWebVitalsStatus: string,
    pageSpeedScore: number
  ): number {
    if (coreWebVitalsStatus === 'failed') return 90;
    if (coreWebVitalsStatus === 'needs-improvement') return 70;
    if (coreWebVitalsStatus === 'good') {
      // Even good scores have room for improvement
      if (pageSpeedScore < 50) return 60;
      if (pageSpeedScore < 75) return 40;
      return 20;
    }
    return 10;
  }

  private scoreContentFreshness(contentAgeInDays: number): number {
    // Older content = more opportunity for refresh
    if (contentAgeInDays > 365) return 80; // Over a year old
    if (contentAgeInDays > 180) return 60; // Over 6 months
    if (contentAgeInDays > 90) return 40; // Over 3 months
    if (contentAgeInDays > 30) return 20; // Over a month
    return 5; // Recently updated
  }

  private scoreBacklinks(inboundLinks: number): number {
    // Fewer backlinks = opportunity to build links
    if (inboundLinks === 0) return 70;
    if (inboundLinks < 5) return 50;
    if (inboundLinks < 20) return 30;
    if (inboundLinks < 50) return 15;
    return 5;
  }

  private scoreDuplicateContent(hasDuplicate: boolean): number {
    if (hasDuplicate) return 85; // Critical - canonical/duplicate issue
    return 0;
  }

  private identifyOpportunities(
    components: SEOOpportunityComponents,
    signals: any
  ): string[] {
    const opportunities: string[] = [];

    if (components.rankingGapScore > 50) {
      opportunities.push(
        `Ranking opportunity: Currently rank #${signals.currentRank}, can reach #${signals.targetRank}`
      );
    }

    if (components.ctrGapScore > 50) {
      const ctrGap = (
        ((signals.industryCTR - signals.currentCTR) / signals.industryCTR) *
        100
      ).toFixed(1);
      opportunities.push(`CTR optimization: ${ctrGap}% gap vs. industry average`);
    }

    if (components.impressionScore > 60) {
      opportunities.push(
        `High impression volume (${signals.impressions}) with room for improvement`
      );
    }

    if (components.schemaGapsScore > 50) {
      opportunities.push('Schema markup incomplete or missing - add structured data');
    }

    if (components.internalLinkingScore > 50) {
      opportunities.push(
        'Internal linking opportunity: Only linked from ' +
          signals.internalLinkCount +
          ' pages'
      );
    }

    if (components.indexabilityScore > 50) {
      if (signals.hasNoindex) {
        opportunities.push('Critical: Page has noindex tag - should be indexed');
      } else {
        opportunities.push('Page not being indexed - investigate crawl/indexation');
      }
    }

    if (components.coreWebVitalsScore > 50) {
      opportunities.push(`Core Web Vitals: ${signals.coreWebVitalsStatus}`);
    }

    if (components.contentFreshnessScore > 50) {
      opportunities.push(
        `Content is ${signals.contentAgeInDays} days old - consider refreshing`
      );
    }

    if (components.duplicateContentScore > 50) {
      opportunities.push('Duplicate content issue detected - resolve with canonical');
    }

    return opportunities;
  }

  private generateExplanation(
    components: SEOOpportunityComponents,
    weights: SEOOpportunityWeights,
    totalScore: number,
    opportunities: string[]
  ): string {
    const drivers: { name: string; score: number; weight: number }[] = [
      { name: 'Ranking gap', score: components.rankingGapScore, weight: weights.rankingGap },
      { name: 'CTR gap', score: components.ctrGapScore, weight: weights.ctrGap },
      { name: 'Impressions', score: components.impressionScore, weight: weights.impressions },
      { name: 'Schema', score: components.schemaGapsScore, weight: weights.schemaGaps },
    ].sort((a, b) => b.score * b.weight - a.score * a.weight);

    const topDriver = drivers[0];
    const opportunityCount = opportunities.length;

    let explanation = `Page has ${opportunityCount} identified SEO opportunities. `;

    if (topDriver.score > 50) {
      explanation += `Primary opportunity: ${topDriver.name}. `;
    }

    if (totalScore > 70) {
      explanation += 'Significant SEO improvement potential.';
    } else if (totalScore > 40) {
      explanation += 'Moderate SEO improvement potential.';
    } else {
      explanation += 'Limited SEO improvement potential currently.';
    }

    return explanation;
  }

  async saveSEOOpportunityScore(
    organizationId: string,
    projectId: string,
    pageId: string,
    auditId: string,
    result: SEOOpportunityResult
  ) {
    const existing = await this.prisma.seoOpportunityScore.findUnique({
      where: { pageId_auditId: { pageId, auditId } },
    });

    if (existing) {
      return this.prisma.seoOpportunityScore.update({
        where: { pageId_auditId: { pageId, auditId } },
        data: {
          rankingGapScore: result.components.rankingGapScore,
          ctrGapScore: result.components.ctrGapScore,
          impressionScore: result.components.impressionScore,
          schemaGapsScore: result.components.schemaGapsScore,
          internalLinkingScore: result.components.internalLinkingScore,
          indexabilityScore: result.components.indexabilityScore,
          coreWebVitalsScore: result.components.coreWebVitalsScore,
          contentFreshnessScore: result.components.contentFreshnessScore,
          backlinksScore: result.components.backlinksScore,
          duplicateContentScore: result.components.duplicateContentScore,
          weightsUsed: JSON.stringify(result.weights),
          totalSeoOpportunity: result.totalScore,
          identifiedOpportunities: JSON.stringify(result.identifiedOpportunities),
          explanation: result.explanation,
        },
      });
    } else {
      return this.prisma.seoOpportunityScore.create({
        data: {
          pageId,
          auditId,
          organizationId,
          projectId,
          rankingGapScore: result.components.rankingGapScore,
          ctrGapScore: result.components.ctrGapScore,
          impressionScore: result.components.impressionScore,
          schemaGapsScore: result.components.schemaGapsScore,
          internalLinkingScore: result.components.internalLinkingScore,
          indexabilityScore: result.components.indexabilityScore,
          coreWebVitalsScore: result.components.coreWebVitalsScore,
          contentFreshnessScore: result.components.contentFreshnessScore,
          backlinksScore: result.components.backlinksScore,
          duplicateContentScore: result.components.duplicateContentScore,
          weightsUsed: JSON.stringify(result.weights),
          totalSeoOpportunity: result.totalScore,
          identifiedOpportunities: JSON.stringify(result.identifiedOpportunities),
          explanation: result.explanation,
        },
      });
    }
  }
}
