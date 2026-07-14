import { PrismaClient } from '@prisma/client';

export type TimeToWinCategory =
  | 'Immediate'
  | 'Short Term'
  | 'Medium Term'
  | 'Long Term';

export interface TimeToWinEstimate {
  category: TimeToWinCategory;
  minDays: number;
  maxDays: number;
  expectedDays: number;
  factors: string[];
  reasoning: string;
}

export class TimeToWinEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  estimateTimeToWin(
    recommendation: {
      type: string;
      currentRank: number;
      currentTraffic: number;
      targetTraffic: number;
      implementationDifficulty: number;
      pageAgeInDays: number;
      hasExistingLinks: boolean;
      competitorDensity: number;
    }
  ): TimeToWinEstimate {
    let minDays = 1;
    let maxDays = 7;
    const factors: string[] = [];

    // Recommendation type determines base time window
    const baseEstimate = this.getBaseTimeEstimate(recommendation.type);
    minDays = baseEstimate.minDays;
    maxDays = baseEstimate.maxDays;
    factors.push(...baseEstimate.factors);

    // Adjust for implementation difficulty
    if (recommendation.implementationDifficulty > 7) {
      minDays += 2;
      maxDays += 5;
      factors.push('Complex implementation adds time');
    } else if (recommendation.implementationDifficulty < 3) {
      minDays = Math.max(1, minDays - 1);
      factors.push('Simple implementation speeds results');
    }

    // Adjust for page age (older pages take longer to see movement)
    if (recommendation.pageAgeInDays < 30) {
      minDays = Math.max(1, minDays - 1);
      factors.push('New page can show results faster');
    } else if (recommendation.pageAgeInDays > 365) {
      maxDays += 7;
      factors.push('Established page may need more time to see change');
    }

    // Adjust for current ranking position
    if (recommendation.currentRank === 0 || recommendation.currentRank > 30) {
      maxDays += 14;
      factors.push('Unranked or low-ranking page needs time to index and rank');
    } else if (recommendation.currentRank <= 3) {
      minDays = Math.max(1, minDays - 1);
      factors.push('High-ranking page shows results faster');
    }

    // Adjust for competitor density
    if (recommendation.competitorDensity > 7) {
      maxDays += 7;
      factors.push('High competition slows result timeline');
    }

    // Adjust for existing link profile
    if (!recommendation.hasExistingLinks && recommendation.type === 'build-links') {
      maxDays += 7;
      factors.push('Building from zero backlinks takes longer');
    }

    const category = this.mapDaysToCategory(minDays, maxDays);
    const expectedDays = Math.round((minDays + maxDays) / 2);

    const reasoning = this.buildReasoning(
      recommendation,
      category,
      expectedDays,
      factors
    );

    return {
      category,
      minDays,
      maxDays,
      expectedDays,
      factors,
      reasoning,
    };
  }

  private getBaseTimeEstimate(
    type: string
  ): { minDays: number; maxDays: number; factors: string[] } {
    switch (type) {
      // Immediate results (on-page changes)
      case 'fix-title-tag':
      case 'fix-meta-description':
      case 'add-schema-markup':
      case 'fix-core-web-vitals':
      case 'fix-h1':
        return {
          minDays: 1,
          maxDays: 7,
          factors: [
            'On-page changes can show results within days if indexed',
          ],
        };

      // Short term (content changes, internal links)
      case 'update-content':
      case 'refresh-content':
      case 'improve-internal-linking':
      case 'add-ctas':
      case 'add-schema':
        return {
          minDays: 3,
          maxDays: 21,
          factors: [
            'Content changes take 1-3 weeks for crawler to detect and evaluate',
          ],
        };

      // Medium term (technical fixes, basic link building)
      case 'fix-site-speed':
      case 'improve-mobile-usability':
      case 'build-internal-links':
      case 'basic-link-building':
      case 'fix-indexation':
        return {
          minDays: 7,
          maxDays: 56,
          factors: [
            'Technical changes and link building show impact over 2-8 weeks',
          ],
        };

      // Long term (aggressive link building, domain authority)
      case 'comprehensive-seo':
      case 'domain-authority-building':
      case 'aggressive-link-building':
      case 'competitor-research':
      case 'market-expansion':
        return {
          minDays: 30,
          maxDays: 180,
          factors: [
            'Domain-level changes can take months to show full impact',
          ],
        };

      default:
        return {
          minDays: 7,
          maxDays: 30,
          factors: ['Standard recommendation timeline: 1-4 weeks'],
        };
    }
  }

  private mapDaysToCategory(
    minDays: number,
    maxDays: number
  ): TimeToWinCategory {
    const avgDays = (minDays + maxDays) / 2;

    if (avgDays <= 3) return 'Immediate';
    if (avgDays <= 21) return 'Short Term';
    if (avgDays <= 56) return 'Medium Term';
    return 'Long Term';
  }

  private buildReasoning(
    recommendation: any,
    category: TimeToWinCategory,
    expectedDays: number,
    factors: string[]
  ): string {
    const parts: string[] = [];

    parts.push(
      `Estimated time to win: ${category.toLowerCase()} (${expectedDays} days).`
    );

    // Add specific reasoning based on recommendation type and category
    if (category === 'Immediate') {
      parts.push(
        'On-page changes like title tags and schema can be indexed within days.'
      );
    } else if (category === 'Short Term') {
      parts.push(
        'Content updates and internal linking show impact within 1-3 weeks as Google crawls and evaluates changes.'
      );
    } else if (category === 'Medium Term') {
      parts.push(
        'Technical improvements and basic link building take 2-8 weeks to show measurable impact in rankings.'
      );
    } else {
      parts.push(
        'Domain-level changes and aggressive strategies require several months to show full potential.'
      );
    }

    // Add factor-specific notes
    if (factors.length > 0) {
      const topFactors = factors.slice(0, 2);
      parts.push(`Key factors: ${topFactors.join(', ')}`);
    }

    if (recommendation.currentRank > 0 && recommendation.currentRank <= 3) {
      parts.push(
        `Important: High-ranking pages require careful monitoring as changes can negatively impact rankings.`
      );
    }

    return parts.join(' ');
  }

  validateTimelineRealistic(
    expectedDays: number,
    targetGain: number
  ): { realistic: boolean; reason: string } {
    // Cross-validate timeline against expected gain
    // Very high expected gain in very short timeline may not be realistic

    if (expectedDays <= 3 && targetGain > 10000) {
      return {
        realistic: false,
        reason: 'Timeline too aggressive for expected traffic gain',
      };
    }

    if (expectedDays <= 7 && targetGain > 5000) {
      return {
        realistic: false,
        reason: 'Large gains typically require more than a week',
      };
    }

    if (expectedDays <= 30 && targetGain > 20000) {
      return {
        realistic: false,
        reason: 'Very large gains require 2+ months typically',
      };
    }

    return {
      realistic: true,
      reason: 'Timeline and expected gain are well-aligned',
    };
  }
}
