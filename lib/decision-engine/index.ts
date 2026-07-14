import { PrismaClient } from '@prisma/client';
import { PageClassificationEngine } from './classification';
import { BusinessValueEngine } from './business-value';
import type { BusinessValueWeights } from './business-value';
import { SEOOpportunityEngine } from './seo-opportunity';
import type { SEOOpportunityWeights } from './seo-opportunity';
import { DecisionEngine } from './decision';
import { DailyMissionGenerator } from './daily-mission';
import { RiskAssessmentEngine } from './risk';
import { TimeToWinEngine } from './time-to-win';
import { ExpectedBusinessReturnEngine } from './expected-return';

export class CompleteDecisionEngine {
  private prisma: PrismaClient;
  private classificationEngine: PageClassificationEngine;
  private businessValueEngine: BusinessValueEngine;
  private seoOpportunityEngine: SEOOpportunityEngine;
  private decisionEngine: DecisionEngine;
  private dailyMissionGenerator: DailyMissionGenerator;
  private riskAssessmentEngine: RiskAssessmentEngine;
  private timeToWinEngine: TimeToWinEngine;
  private expectedReturnEngine: ExpectedBusinessReturnEngine;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.classificationEngine = new PageClassificationEngine(prisma);
    this.businessValueEngine = new BusinessValueEngine(prisma);
    this.seoOpportunityEngine = new SEOOpportunityEngine(prisma);
    this.decisionEngine = new DecisionEngine(prisma);
    this.dailyMissionGenerator = new DailyMissionGenerator(prisma);
    this.riskAssessmentEngine = new RiskAssessmentEngine(prisma);
    this.timeToWinEngine = new TimeToWinEngine(prisma);
    this.expectedReturnEngine = new ExpectedBusinessReturnEngine(prisma);
  }

  getClassificationEngine(): PageClassificationEngine {
    return this.classificationEngine;
  }

  getBusinessValueEngine(): BusinessValueEngine {
    return this.businessValueEngine;
  }

  getSEOOpportunityEngine(): SEOOpportunityEngine {
    return this.seoOpportunityEngine;
  }

  getDecisionEngine(): DecisionEngine {
    return this.decisionEngine;
  }

  getDailyMissionGenerator(): DailyMissionGenerator {
    return this.dailyMissionGenerator;
  }

  getRiskAssessmentEngine(): RiskAssessmentEngine {
    return this.riskAssessmentEngine;
  }

  getTimeToWinEngine(): TimeToWinEngine {
    return this.timeToWinEngine;
  }

  getExpectedReturnEngine(): ExpectedBusinessReturnEngine {
    return this.expectedReturnEngine;
  }

  async processAuditDecisions(
    organizationId: string,
    projectId: string,
    auditId: string
  ) {
    // Main orchestration flow for processing all decisions in an audit
    // 1. Get all pages from audit
    // 2. Classify each page
    // 3. Calculate business value for each page
    // 4. Calculate SEO opportunity for each page
    // 5. Make priority decisions
    // 6. Generate daily mission
    // 7. Assess risks
    // 8. Estimate time to win and expected return

    const pages = await this.prisma.page.findMany({
      where: { auditId },
    });

    const decisions = [];

    for (const page of pages) {
      try {
        // 1. Classify page
        const classification = await this.classificationEngine.classifyPage(
          page.id,
          page.url,
          page.title,
          page.schemaTypes,
          page.contentLength,
          page.internalLinks,
          page.inboundCount,
          0, // forms count not in schema yet
          0  // cta buttons count not in schema yet
        );

        await this.classificationEngine.saveClassification(
          organizationId,
          projectId,
          page.url,
          classification
        );

        // 2. Get page signals (would come from GA4, GSC integration)
        const signals = await this.getPageSignals(page.id, auditId);

        // 3. Calculate business value
        const businessValueResult = await this.businessValueEngine.calculateBusinessValue(
          page.id,
          {
            monthlyVisitors: signals.monthlyVisitors,
            conversions: signals.conversions,
            conversionRate: signals.conversionRate,
            conversionValue: signals.conversionValue,
            thirtyDayTrend: signals.thirtyDayTrend,
            strategicImportance: signals.strategicImportance,
            manualPriority: signals.manualPriority,
            navigationLevel: (page.url.match(/\//g) || []).length - 1,
            inboundCount: page.inboundCount,
            internalLinkCount: page.internalLinks,
            isHomepage: page.url.split('/').length <= 3,
            primaryPageType: classification.primaryType,
          }
        );

        await this.businessValueEngine.saveBusinessValueScore(
          organizationId,
          projectId,
          page.url,
          businessValueResult
        );

        // 4. Calculate SEO opportunity
        const seoOpportunityResult = await this.seoOpportunityEngine.calculateSEOOpportunity(
          page.id,
          {
            currentRank: signals.currentRank,
            targetRank: signals.targetRank,
            currentCTR: signals.currentCTR,
            industryCTR: signals.industryCTR,
            impressions: signals.impressions,
            schemaTypes: page.schemaTypes ? [page.schemaTypes] : [],
            schemaCompleteness: signals.schemaCompleteness,
            internalLinkCount: page.internalLinks,
            isIndexed: page.status === 200,
            hasNoindex: signals.hasNoindex,
            pageSpeedScore: page.pageSpeedScore || 0,
            coreWebVitalsStatus: signals.coreWebVitalsStatus,
            contentAgeInDays: signals.contentAgeInDays,
            inboundLinks: page.inboundCount,
            hasDuplicateContent: signals.hasDuplicateContent,
          }
        );

        await this.seoOpportunityEngine.saveSEOOpportunityScore(
          organizationId,
          projectId,
          page.url,
          seoOpportunityResult
        );

        // 5. Make priority decision
        const priorityDecision = await this.decisionEngine.decidePagePriority(
          page.url,
          businessValueResult.totalScore,
          seoOpportunityResult.totalScore,
          businessValueResult.explanation,
          seoOpportunityResult.explanation,
          {
            isHomepage: page.url.split('/').length <= 3,
            primaryPageType: classification.primaryType,
            currentRank: signals.currentRank,
            monthlyVisitors: signals.monthlyVisitors,
            conversions: signals.conversions,
            conversionValue: signals.conversionValue,
            isIndexed: page.status === 200,
            hasNoindex: signals.hasNoindex,
          }
        );

        decisions.push(priorityDecision);

        await this.decisionEngine.savePagePriority(
          organizationId,
          projectId,
          auditId,
          priorityDecision
        );
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }

    // Sort and assign ranks
    const rankedDecisions = await this.decisionEngine.rankAllPages(
      projectId,
      auditId,
      decisions
    );

    // Update ranks in database
    for (const decision of rankedDecisions) {
      await this.prisma.pagePriority.update({
        where: {
          auditId_pageUrl: {
            auditId,
            pageUrl: decision.pageUrl,
          },
        },
        data: {
          priorityRank: decision.priorityRank,
          percentile: decision.percentile,
        },
      });
    }

    return rankedDecisions;
  }

  private async getPageSignals(pageId: string, auditId: string) {
    // This would fetch from PageSignals table
    // For now, return defaults
    return {
      monthlyVisitors: 0,
      conversions: 0,
      conversionRate: 0,
      conversionValue: 0,
      thirtyDayTrend: 0,
      strategicImportance: 0,
      manualPriority: 0,
      currentRank: 0,
      targetRank: 0,
      currentCTR: 0,
      industryCTR: 0,
      impressions: 0,
      schemaCompleteness: 0,
      hasNoindex: false,
      coreWebVitalsStatus: 'good',
      contentAgeInDays: 0,
      hasDuplicateContent: false,
    };
  }
}

// Export all components
export {
  PageClassificationEngine,
  BusinessValueEngine,
  SEOOpportunityEngine,
  DecisionEngine,
  DailyMissionGenerator,
  RiskAssessmentEngine,
  TimeToWinEngine,
  ExpectedBusinessReturnEngine,
};
export type { BusinessValueWeights, SEOOpportunityWeights };
