import { PrismaClient } from '@prisma/client';

export type RiskLevel = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';

export interface RiskFactors {
  indexationRisk: number;
  canonicalRisk: number;
  technicalRisk: number;
  contentRisk: number;
  backendRisk: number;
  downgradeRisk: number;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number;
  factors: RiskFactors;
  explanation: string;
  mitigations: string[];
  requiresManualApproval: boolean;
}

export class RiskAssessmentEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async assessRisk(
    pageId: string,
    recommendation: {
      type: string;
      pageUrl: string;
      currentRank: number;
      currentTraffic: number;
      hasIndexationIssues: boolean;
      hasCanonicalIssues: boolean;
      hasNoindex: boolean;
      coreWebVitalsStatus: string;
      isNoindexed: boolean;
    }
  ): Promise<RiskAssessment> {
    const factors = this.calculateRiskFactors(recommendation);
    const riskScore = this.calculateOverallRisk(factors);
    const riskLevel = this.mapScoreToLevel(riskScore);
    const explanation = this.generateExplanation(factors, riskScore, recommendation);
    const mitigations = this.identifyMitigations(factors, recommendation);
    const requiresManualApproval = riskScore > 60;

    return {
      riskLevel,
      riskScore,
      factors,
      explanation,
      mitigations,
      requiresManualApproval,
    };
  }

  private calculateRiskFactors(recommendation: any): RiskFactors {
    const factors: RiskFactors = {
      indexationRisk: 0,
      canonicalRisk: 0,
      technicalRisk: 0,
      contentRisk: 0,
      backendRisk: 0,
      downgradeRisk: 0,
    };

    // Indexation Risk
    if (recommendation.hasIndexationIssues) factors.indexationRisk = 80;
    if (recommendation.hasNoindex) factors.indexationRisk = 95;
    if (recommendation.isNoindexed) factors.indexationRisk = 90;

    // Canonical Risk
    if (recommendation.hasCanonicalIssues) factors.canonicalRisk = 70;

    // Technical Risk (based on Core Web Vitals)
    if (recommendation.coreWebVitalsStatus === 'failed') {
      factors.technicalRisk = 60;
    } else if (recommendation.coreWebVitalsStatus === 'needs-improvement') {
      factors.technicalRisk = 40;
    } else if (recommendation.coreWebVitalsStatus === 'good') {
      factors.technicalRisk = 10;
    }

    // Content Risk (based on recommendation type)
    switch (recommendation.type) {
      case 'delete-page':
        factors.contentRisk = recommendation.currentTraffic > 100 ? 80 : 40;
        break;
      case 'merge-pages':
        factors.contentRisk = 50;
        break;
      case 'change-url':
        factors.contentRisk = 60;
        break;
      case 'rewrite':
        factors.contentRisk = 30;
        break;
      default:
        factors.contentRisk = 10;
    }

    // Backend Risk (based on recommendation complexity)
    switch (recommendation.type) {
      case 'database-optimization':
        factors.backendRisk = 50;
        break;
      case 'cache-configuration':
        factors.backendRisk = 40;
        break;
      case 'redirect-setup':
        factors.backendRisk = 20;
        break;
      default:
        factors.backendRisk = 5;
    }

    // Downgrade Risk (based on high ranking pages)
    if (recommendation.currentRank > 0 && recommendation.currentRank <= 3) {
      factors.downgradeRisk = recommendation.currentTraffic > 1000 ? 70 : 40;
    } else if (recommendation.currentRank <= 10) {
      factors.downgradeRisk = recommendation.currentTraffic > 500 ? 50 : 20;
    } else {
      factors.downgradeRisk = 5;
    }

    return factors;
  }

  private calculateOverallRisk(factors: RiskFactors): number {
    // Weight risks based on criticality
    const weights = {
      indexationRisk: 0.25,
      canonicalRisk: 0.2,
      technicalRisk: 0.15,
      contentRisk: 0.2,
      backendRisk: 0.1,
      downgradeRisk: 0.1,
    };

    const overall =
      factors.indexationRisk * weights.indexationRisk +
      factors.canonicalRisk * weights.canonicalRisk +
      factors.technicalRisk * weights.technicalRisk +
      factors.contentRisk * weights.contentRisk +
      factors.backendRisk * weights.backendRisk +
      factors.downgradeRisk * weights.downgradeRisk;

    return Math.min(100, overall);
  }

  private mapScoreToLevel(score: number): RiskLevel {
    if (score <= 15) return 'Very Low';
    if (score <= 35) return 'Low';
    if (score <= 55) return 'Medium';
    if (score <= 75) return 'High';
    return 'Very High';
  }

  private generateExplanation(
    factors: RiskFactors,
    riskScore: number,
    recommendation: any
  ): string {
    const criticalFactors: string[] = [];

    if (factors.indexationRisk > 50) {
      criticalFactors.push('Indexation risk identified');
    }
    if (factors.canonicalRisk > 50) {
      criticalFactors.push('Canonical tag issues detected');
    }
    if (factors.contentRisk > 60) {
      criticalFactors.push('Content modification risk is high');
    }
    if (factors.downgradeRisk > 50) {
      criticalFactors.push('Risk of ranking downgrade exists');
    }

    if (criticalFactors.length === 0) {
      return 'Recommendation has minimal risk. Implementation can proceed with standard testing.';
    }

    const explanation =
      'Risk factors identified: ' + criticalFactors.join(', ') + '. ';

    if (riskScore > 75) {
      return (
        explanation +
        'Recommend manual review and careful testing before deployment.'
      );
    } else if (riskScore > 55) {
      return explanation + 'Consider testing on staging environment first.';
    } else {
      return explanation + 'Monitor results closely after deployment.';
    }
  }

  private identifyMitigations(factors: RiskFactors, recommendation: any): string[] {
    const mitigations: string[] = [];

    // Indexation mitigations
    if (factors.indexationRisk > 30) {
      mitigations.push('Verify robots.txt and sitemap configuration');
      mitigations.push('Submit updated sitemap to Search Console');
      mitigations.push('Check for noindex tags after changes');
    }

    // Canonical mitigations
    if (factors.canonicalRisk > 30) {
      mitigations.push('Audit canonical tag placement');
      mitigations.push('Verify self-referencing canonicals');
      mitigations.push('Test with canonical tag validator');
    }

    // Content change mitigations
    if (factors.contentRisk > 40) {
      mitigations.push('Create backup of original content');
      mitigations.push('Test changes on staging first');
      mitigations.push('Monitor rankings for 2-4 weeks after change');
      mitigations.push('Prepare rollback plan');
    }

    // Downgrade mitigations
    if (factors.downgradeRisk > 40) {
      mitigations.push('Monitor SERP positions daily for 30 days');
      mitigations.push('Set up Google Search Console alerts');
      mitigations.push('Prepare ranking recovery action plan');
    }

    // Technical mitigations
    if (factors.technicalRisk > 30) {
      mitigations.push('Test Core Web Vitals before and after');
      mitigations.push('Monitor server performance metrics');
      mitigations.push('Set up uptime monitoring');
    }

    // Backend mitigations
    if (factors.backendRisk > 30) {
      mitigations.push('Deploy changes during low-traffic hours');
      mitigations.push('Have rollback procedure ready');
      mitigations.push('Test on production clone first');
    }

    return [...new Set(mitigations)]; // Remove duplicates
  }

  async assessRecommendationRisk(
    organizationId: string,
    projectId: string,
    pageId: string,
    recommendation: {
      type: string;
      pageUrl: string;
      currentRank: number;
      currentTraffic: number;
      hasIndexationIssues: boolean;
      hasCanonicalIssues: boolean;
      hasNoindex: boolean;
      coreWebVitalsStatus: string;
      isNoindexed: boolean;
    }
  ): Promise<RiskAssessment> {
    return this.assessRisk(pageId, recommendation);
  }
}
