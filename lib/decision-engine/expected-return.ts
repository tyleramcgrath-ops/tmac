import { PrismaClient } from '@prisma/client';

export interface ExpectedBusinessReturn {
  trafficGainMin: number;
  trafficGainMax: number;
  trafficGainExpected: number;
  conversionGainMin: number;
  conversionGainMax: number;
  conversionGainExpected: number;
  revenueGainMin: number;
  revenueGainMax: number;
  revenueGainExpected: number;
  roiPercentage: number;
  confidence: number;
  factors: string[];
  reasoning: string;
}

export class ExpectedBusinessReturnEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  calculateExpectedReturn(
    recommendation: {
      type: string;
      currentRank: number;
      targetRank: number;
      currentTraffic: number;
      currentConversions: number;
      conversionRate: number;
      revenuePerConversion: number;
      competitorDensity: number;
      implementationCost: number;
    }
  ): ExpectedBusinessReturn {
    const trafficGain = this.estimateTrafficGain(recommendation);
    const conversionGain = this.estimateConversionGain(
      trafficGain,
      recommendation
    );
    const revenueGain = this.estimateRevenueGain(
      conversionGain,
      recommendation
    );

    const confidence = this.calculateConfidence(recommendation);
    const factors = this.identifyFactors(recommendation, trafficGain);

    const roiPercentage = this.calculateROI(
      revenueGain.expected,
      recommendation.implementationCost
    );

    const reasoning = this.buildReasoning(
      recommendation,
      trafficGain,
      conversionGain,
      revenueGain,
      confidence
    );

    return {
      trafficGainMin: trafficGain.min,
      trafficGainMax: trafficGain.max,
      trafficGainExpected: trafficGain.expected,
      conversionGainMin: conversionGain.min,
      conversionGainMax: conversionGain.max,
      conversionGainExpected: conversionGain.expected,
      revenueGainMin: revenueGain.min,
      revenueGainMax: revenueGain.max,
      revenueGainExpected: revenueGain.expected,
      roiPercentage,
      confidence,
      factors,
      reasoning,
    };
  }

  private estimateTrafficGain(recommendation: any): {
    min: number;
    max: number;
    expected: number;
  } {
    let min = 0;
    let max = 0;

    // Base traffic gain depends on recommendation type
    switch (recommendation.type) {
      case 'fix-title-tag':
      case 'fix-meta-description':
        min = Math.round(recommendation.currentTraffic * 0.05);
        max = Math.round(recommendation.currentTraffic * 0.15);
        break;

      case 'improve-internal-linking':
      case 'add-ctas':
        min = Math.round(recommendation.currentTraffic * 0.08);
        max = Math.round(recommendation.currentTraffic * 0.25);
        break;

      case 'refresh-content':
      case 'update-content':
        min = Math.round(recommendation.currentTraffic * 0.1);
        max = Math.round(recommendation.currentTraffic * 0.4);
        break;

      case 'fix-site-speed':
      case 'improve-core-web-vitals':
        min = Math.round(recommendation.currentTraffic * 0.05);
        max = Math.round(recommendation.currentTraffic * 0.2);
        break;

      case 'add-schema-markup':
      case 'add-rich-snippets':
        min = Math.round(recommendation.currentTraffic * 0.05);
        max = Math.round(recommendation.currentTraffic * 0.3);
        break;

      case 'build-internal-links':
        min = Math.round(recommendation.currentTraffic * 0.15);
        max = Math.round(recommendation.currentTraffic * 0.5);
        break;

      case 'improve-mobile-usability':
        min = Math.round(recommendation.currentTraffic * 0.1);
        max = Math.round(recommendation.currentTraffic * 0.35);
        break;

      default:
        min = Math.round(recommendation.currentTraffic * 0.05);
        max = Math.round(recommendation.currentTraffic * 0.2);
    }

    // Adjust for current ranking position
    if (recommendation.currentRank === 0 || recommendation.currentRank > 20) {
      // Unranked pages have higher potential upside
      max = Math.round(max * 1.5);
    } else if (recommendation.currentRank > 10) {
      // Lower rankings have more room for improvement
      max = Math.round(max * 1.2);
    } else if (recommendation.currentRank <= 3) {
      // Top 3 already get most traffic, gains are smaller
      min = Math.round(min * 0.3);
      max = Math.round(max * 0.6);
    }

    // Adjust for competition
    if (recommendation.competitorDensity > 8) {
      // Highly competitive keyword space - lower gains
      min = Math.round(min * 0.5);
      max = Math.round(max * 0.7);
    }

    const expected = Math.round((min + max) / 2);

    return { min, max, expected };
  }

  private estimateConversionGain(
    trafficGain: any,
    recommendation: any
  ): { min: number; max: number; expected: number } {
    // Conversion gain is based on traffic gain and conversion rate
    // Plus potential conversion rate improvements from the recommendation

    const trafficDrivenMin = Math.round(
      trafficGain.min * recommendation.conversionRate
    );
    const trafficDrivenMax = Math.round(
      trafficGain.max * recommendation.conversionRate
    );

    // Some recommendations improve conversion rate directly
    let crImproveMin = 0;
    let crImproveMax = 0;

    if (
      ['improve-internal-linking', 'add-ctas', 'refresh-content', 'improve-mobile-usability'].includes(
        recommendation.type
      )
    ) {
      // These can improve CR by 5-20%
      const crIncrease = recommendation.conversionRate * 0.05;
      crImproveMin = Math.round(recommendation.currentConversions * 0.05);
      crImproveMax = Math.round(recommendation.currentConversions * 0.2);
    }

    const min = trafficDrivenMin + crImproveMin;
    const max = trafficDrivenMax + crImproveMax;
    const expected = Math.round((min + max) / 2);

    return { min, max, expected };
  }

  private estimateRevenueGain(
    conversionGain: any,
    recommendation: any
  ): { min: number; max: number; expected: number } {
    const min = Math.round(conversionGain.min * recommendation.revenuePerConversion);
    const max = Math.round(conversionGain.max * recommendation.revenuePerConversion);
    const expected = Math.round((min + max) / 2);

    return { min, max, expected };
  }

  private calculateConfidence(recommendation: any): number {
    let confidence = 0.7; // Base 70% confidence

    // Increase confidence for well-understood recommendations
    if (
      [
        'fix-title-tag',
        'fix-meta-description',
        'add-schema-markup',
        'improve-mobile-usability',
      ].includes(recommendation.type)
    ) {
      confidence = 0.85;
    }

    // Decrease confidence for speculative recommendations
    if (
      [
        'build-internal-links',
        'aggressive-link-building',
        'market-expansion',
      ].includes(recommendation.type)
    ) {
      confidence = 0.55;
    }

    // Adjust based on current rank
    if (recommendation.currentRank > 0 && recommendation.currentRank <= 3) {
      // Already ranking well, changes are more predictable
      confidence += 0.1;
    } else if (recommendation.currentRank === 0) {
      // Unranked pages have more uncertainty
      confidence -= 0.15;
    }

    // Adjust based on competition
    if (recommendation.competitorDensity > 8) {
      confidence -= 0.1;
    }

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private identifyFactors(recommendation: any, trafficGain: any): string[] {
    const factors: string[] = [];

    if (trafficGain.expected > recommendation.currentTraffic * 0.2) {
      factors.push('High traffic upside potential');
    }

    if (recommendation.currentRank === 0 || recommendation.currentRank > 20) {
      factors.push('Unranked page - significant ranking opportunity');
    } else if (recommendation.currentRank <= 3) {
      factors.push('Already high-ranking - incremental improvements');
    } else if (recommendation.currentRank <= 10) {
      factors.push('Top 10 ranking - proven keyword relevance');
    }

    if (recommendation.conversionRate > 0.02) {
      factors.push('High conversion rate multiplies traffic gains');
    }

    if (recommendation.revenuePerConversion > 100) {
      factors.push('High revenue per conversion - strong ROI potential');
    }

    if (recommendation.competitorDensity > 8) {
      factors.push('High competition - lower gains likely');
    }

    return factors;
  }

  private calculateROI(revenueGain: number, implementationCost: number): number {
    if (implementationCost === 0) {
      return revenueGain > 0 ? 999 : 0;
    }

    const annualizedGain = revenueGain * 12;
    return Math.round((annualizedGain / implementationCost) * 100);
  }

  private buildReasoning(
    recommendation: any,
    trafficGain: any,
    conversionGain: any,
    revenueGain: any,
    confidence: number
  ): string {
    const parts: string[] = [];

    parts.push(
      `Expected ${trafficGain.expected} additional monthly visitors (${((trafficGain.expected / recommendation.currentTraffic) * 100).toFixed(0)}% increase).`
    );

    if (conversionGain.expected > 0) {
      parts.push(
        `Projected ${conversionGain.expected} additional monthly conversions.`
      );
    }

    if (revenueGain.expected > 0) {
      parts.push(
        `Estimated monthly revenue increase: $${revenueGain.expected.toLocaleString()}.`
      );
    }

    parts.push(
      `Confidence level: ${(confidence * 100).toFixed(0)}% - based on recommendation type and current rankings.`
    );

    if (revenueGain.expected > 5000) {
      parts.push('High-value recommendation with significant ROI potential.');
    } else if (revenueGain.expected > 1000) {
      parts.push('Moderate-value recommendation with solid ROI.');
    } else if (revenueGain.expected > 0) {
      parts.push('Lower-value but still worthwhile recommendation.');
    } else {
      parts.push('Limited direct revenue impact but supports broader strategy.');
    }

    return parts.join(' ');
  }
}
