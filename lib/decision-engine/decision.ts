import { PrismaClient } from '@prisma/client';

export interface PagePriorityDecision {
  pageUrl: string;
  businessValueScore: number;
  seoOpportunityScore: number;
  businessWeight: number;
  seoWeight: number;
  finalPriorityScore: number;
  priorityRank: number;
  percentile: number;
  explainability: {
    businessValueDriver: string;
    seoOpportunityDriver: string;
    combinedRationale: string;
    whyThisPage: string;
    whyNow: string;
    keyFactors: string[];
    risks: string[];
  };
  summary: string;
}

export class DecisionEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async decidePagePriority(
    pageUrl: string,
    businessValueScore: number,
    seoOpportunityScore: number,
    businessValueExplanation: string,
    seoOpportunityExplanation: string,
    pageMetadata: {
      isHomepage: boolean;
      primaryPageType: string;
      currentRank: number;
      monthlyVisitors: number;
      conversions: number;
      conversionValue: number;
      isIndexed: boolean;
      hasNoindex: boolean;
    },
    businessWeight: number = 0.6,
    seoWeight: number = 0.4
  ): Promise<PagePriorityDecision> {
    // Normalize scores to 0-1 for weighted calculation
    const businessNormalized = businessValueScore / 100;
    const seoNormalized = seoOpportunityScore / 100;

    // Calculate final priority score
    const finalPriorityScore =
      businessNormalized * businessWeight + seoNormalized * seoWeight;

    // Generate explainability
    const explainability = this.generateExplainability(
      pageUrl,
      businessValueScore,
      seoOpportunityScore,
      businessValueExplanation,
      seoOpportunityExplanation,
      pageMetadata,
      finalPriorityScore
    );

    const summary = this.generateSummary(
      pageMetadata,
      businessValueScore,
      seoOpportunityScore,
      finalPriorityScore
    );

    return {
      pageUrl,
      businessValueScore,
      seoOpportunityScore,
      businessWeight,
      seoWeight,
      finalPriorityScore: finalPriorityScore * 100, // Scale back to 0-100
      priorityRank: 0, // Will be set after sorting all pages
      percentile: 0, // Will be set after sorting all pages
      explainability,
      summary,
    };
  }

  async rankAllPages(
    projectId: string,
    auditId: string,
    decisions: PagePriorityDecision[]
  ): Promise<PagePriorityDecision[]> {
    // Sort by final priority score descending
    const sorted = decisions.sort(
      (a, b) => b.finalPriorityScore - a.finalPriorityScore
    );

    // Assign ranks and percentiles
    const total = sorted.length;
    const ranked = sorted.map((decision, index) => ({
      ...decision,
      priorityRank: index + 1,
      percentile: ((total - index) / total) * 100,
    }));

    return ranked;
  }

  private generateExplainability(
    pageUrl: string,
    businessValueScore: number,
    seoOpportunityScore: number,
    businessValueExplanation: string,
    seoOpportunityExplanation: string,
    pageMetadata: any,
    finalScore: number
  ): PagePriorityDecision['explainability'] {
    const businessValueDriver = this.identifyPrimaryDriver(businessValueScore);
    const seoOpportunityDriver = this.identifyPrimaryDriver(seoOpportunityScore);

    const combinedRationale = this.buildCombinedRationale(
      businessValueScore,
      seoOpportunityScore,
      businessValueDriver,
      seoOpportunityDriver
    );

    const whyThisPage = this.buildWhyThisPage(pageMetadata, businessValueDriver);

    const whyNow = this.buildWhyNow(
      businessValueScore,
      seoOpportunityScore,
      pageMetadata
    );

    const keyFactors = this.identifyKeyFactors(
      pageMetadata,
      businessValueScore,
      seoOpportunityScore
    );

    const risks = this.identifyRisks(pageMetadata, businessValueScore);

    return {
      businessValueDriver,
      seoOpportunityDriver,
      combinedRationale,
      whyThisPage,
      whyNow,
      keyFactors,
      risks,
    };
  }

  private identifyPrimaryDriver(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'moderate-high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low-moderate';
    return 'minimal';
  }

  private buildCombinedRationale(
    businessValue: number,
    seoOpportunity: number,
    businessDriver: string,
    seoDriver: string
  ): string {
    if (businessValue > seoOpportunity) {
      return `Business value is the primary driver (${businessDriver}). SEO opportunity is ${seoDriver}. Focus on capitalizing on existing value.`;
    } else if (seoOpportunity > businessValue) {
      return `SEO opportunity is the primary driver (${seoDriver}). Business value is ${businessDriver}. Focus on unlocking hidden potential.`;
    } else {
      return `Business value and SEO opportunity are balanced drivers. Both need attention for maximum impact.`;
    }
  }

  private buildWhyThisPage(pageMetadata: any, driver: string): string {
    if (pageMetadata.isHomepage) {
      return 'Homepage is the entry point for all traffic and brand impression. Priority optimization multiplies across user journey.';
    }

    if (pageMetadata.conversions > 10) {
      return `Page generates ${pageMetadata.conversions} conversions. Even small improvements compound to significant revenue impact.`;
    }

    if (pageMetadata.monthlyVisitors > 1000) {
      return `Page receives ${pageMetadata.monthlyVisitors} monthly visitors. High volume makes incremental improvements valuable.`;
    }

    if (pageMetadata.conversionValue > 1000) {
      return `Page generates $${pageMetadata.conversionValue} monthly revenue. Impact scales with priority.`;
    }

    if (pageMetadata.currentRank > 5 && pageMetadata.currentRank < 20) {
      return `Page ranks #${pageMetadata.currentRank} but has ranking gap opportunity. Optimization can move it into top positions.`;
    }

    return 'Page has untapped potential across business value and SEO opportunity dimensions.';
  }

  private buildWhyNow(
    businessValue: number,
    seoOpportunity: number,
    pageMetadata: any
  ): string {
    const reasons: string[] = [];

    if (businessValue > 70) {
      reasons.push('high business value creation is happening now');
    }

    if (seoOpportunity > 70) {
      reasons.push('significant SEO opportunity exists');
    }

    if (pageMetadata.isIndexed === false) {
      reasons.push('indexation issue blocks value realization');
    }

    if (pageMetadata.hasNoindex) {
      reasons.push('noindex tag prevents traffic capture');
    }

    if (pageMetadata.currentRank === 0) {
      reasons.push('page has ranking potential but currently unranked');
    }

    if (reasons.length === 0) {
      reasons.push('page has accumulated optimization opportunity over time');
    }

    return 'Prioritize now because: ' + reasons.join(', ') + '.';
  }

  private identifyKeyFactors(
    pageMetadata: any,
    businessValue: number,
    seoOpportunity: number
  ): string[] {
    const factors: string[] = [];

    if (pageMetadata.isHomepage) factors.push('Homepage status');
    if (pageMetadata.monthlyVisitors > 500) {
      factors.push(`High traffic (${pageMetadata.monthlyVisitors}+ visitors)`);
    }
    if (pageMetadata.conversions > 5) {
      factors.push(`Active conversions (${pageMetadata.conversions})`);
    }
    if (pageMetadata.conversionValue > 500) {
      factors.push(`Revenue generation ($${pageMetadata.conversionValue})`);
    }
    if (businessValue > 70) factors.push('Strong business value');
    if (seoOpportunity > 70) factors.push('Major SEO opportunity');
    if (pageMetadata.currentRank > 0 && pageMetadata.currentRank <= 10) {
      factors.push(`Top 10 ranking (#${pageMetadata.currentRank})`);
    }
    if (pageMetadata.hasNoindex) factors.push('Noindex tag blocks crawlers');

    return factors;
  }

  private identifyRisks(pageMetadata: any, businessValue: number): string[] {
    const risks: string[] = [];

    if (pageMetadata.hasNoindex) {
      risks.push('Critical: Noindex tag blocks indexation');
    }

    if (pageMetadata.isIndexed === false) {
      risks.push('Medium: Page not indexed - crawl/robots.txt issue');
    }

    if (pageMetadata.monthlyVisitors < 10 && businessValue > 60) {
      risks.push('Medium: Low traffic despite high business value - visibility issue');
    }

    if (pageMetadata.currentRank > 50) {
      risks.push(
        'Medium: Very low ranking - significant competition or relevance gap'
      );
    }

    return risks;
  }

  private generateSummary(
    pageMetadata: any,
    businessValue: number,
    seoOpportunity: number,
    finalScore: number
  ): string {
    let summary = '';

    if (pageMetadata.isHomepage) {
      summary = 'Homepage —';
    }

    if (pageMetadata.monthlyVisitors > 0) {
      summary += `${pageMetadata.monthlyVisitors} visits`;
    }

    if (pageMetadata.conversions > 0) {
      summary += `, ${pageMetadata.conversions} conversions`;
    }

    if (pageMetadata.conversionValue > 0) {
      summary += `, $${pageMetadata.conversionValue}`;
    }

    if (businessValue > 70 || seoOpportunity > 70) {
      summary += ` — Priority: HIGH`;
    } else if (businessValue > 50 || seoOpportunity > 50) {
      summary += ` — Priority: MEDIUM`;
    } else {
      summary += ` — Priority: LOW`;
    }

    return summary;
  }

  async savePagePriority(
    organizationId: string,
    projectId: string,
    auditId: string,
    decision: PagePriorityDecision
  ) {
    const existing = await this.prisma.pagePriority.findUnique({
      where: { auditId_pageUrl: { auditId, pageUrl: decision.pageUrl } },
    });

    if (existing) {
      return this.prisma.pagePriority.update({
        where: { auditId_pageUrl: { auditId, pageUrl: decision.pageUrl } },
        data: {
          businessValueScore: decision.businessValueScore,
          seoOpportunityScore: decision.seoOpportunityScore,
          businessWeight: decision.businessWeight,
          seoWeight: decision.seoWeight,
          priorityScore: decision.finalPriorityScore,
          priorityRank: decision.priorityRank,
          percentile: decision.percentile,
          explainability: JSON.stringify(decision.explainability),
          summary: decision.summary,
        },
      });
    } else {
      return this.prisma.pagePriority.create({
        data: {
          pageUrl: decision.pageUrl,
          auditId,
          organizationId,
          projectId,
          businessValueScore: decision.businessValueScore,
          seoOpportunityScore: decision.seoOpportunityScore,
          businessWeight: decision.businessWeight,
          seoWeight: decision.seoWeight,
          priorityScore: decision.finalPriorityScore,
          priorityRank: decision.priorityRank,
          percentile: decision.percentile,
          explainability: JSON.stringify(decision.explainability),
          summary: decision.summary,
        },
      });
    }
  }
}
