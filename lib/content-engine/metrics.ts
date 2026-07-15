import { PrismaClient } from '@prisma/client';

export interface ContentMetricsInput {
  wordCount: number;
  lastModified: Date | null;
  hasSchema: boolean;
  schemaTypes: string[];
  entityCount: number;
  imageCount: number;
  internalLinkCount: number;
  ga4Sessions: number;
  ga4Conversions: number;
  gscClicks: number;
  gscImpressions: number;
  gscAverageCtr: number;
  indexStatus: string;
  readabilityGradeLevel: number; // Flesch-Kincaid grade
  entitiesRecognized: number;
  topicsIdentified: number;
  lastModifiedDays: number;
  trafficTrend30d: number; // % change
  rankingTrend30d: number; // position change
}

export interface ContentMetricsResult {
  qualityScore: number;
  qualityExplanation: string;

  freshnessScore: number;
  freshnessExplanation: string;

  entityCoverageScore: number;
  entityExplanation: string;

  topicalDepthScore: number;
  topicalExplanation: string;

  readabilityScore: number;
  readabilityExplanation: string;

  seoOptimizationScore: number;
  seoExplanation: string;

  aiReadinessScore: number;
  aiReadinessExplanation: string;

  conversionReadinessScore: number;
  conversionExplanation: string;

  businessValueScore: number;
  businessExplanation: string;

  opportunityScore: number;
  overallScore: number;
}

export class ContentMetricsEngine {
  constructor(private prisma: PrismaClient) {}

  async calculateMetrics(input: ContentMetricsInput): Promise<ContentMetricsResult> {
    const qualityScore = this.scoreQuality(input);
    const freshnessScore = this.scoreFreshness(input);
    const entityCoverageScore = this.scoreEntityCoverage(input);
    const topicalDepthScore = this.scoreTopicalDepth(input);
    const readabilityScore = this.scoreReadability(input);
    const seoOptimizationScore = this.scoreSeoOptimization(input);
    const aiReadinessScore = this.scoreAiReadiness(input);
    const conversionReadinessScore = this.scoreConversionReadiness(input);
    const businessValueScore = this.scoreBusinessValue(input);

    const opportunityScore = Math.round(
      (qualityScore + freshnessScore + entityCoverageScore + topicalDepthScore) / 4
    );

    const overallScore = Math.round(
      (qualityScore * 0.2 +
        freshnessScore * 0.15 +
        entityCoverageScore * 0.15 +
        topicalDepthScore * 0.15 +
        readabilityScore * 0.1 +
        seoOptimizationScore * 0.15 +
        aiReadinessScore * 0.05 +
        conversionReadinessScore * 0.05) /
        1.0
    );

    return {
      qualityScore,
      qualityExplanation: this.explainQuality(input, qualityScore),

      freshnessScore,
      freshnessExplanation: this.explainFreshness(input, freshnessScore),

      entityCoverageScore,
      entityExplanation: this.explainEntityCoverage(input, entityCoverageScore),

      topicalDepthScore,
      topicalExplanation: this.explainTopicalDepth(input, topicalDepthScore),

      readabilityScore,
      readabilityExplanation: this.explainReadability(input, readabilityScore),

      seoOptimizationScore,
      seoExplanation: this.explainSeoOptimization(input, seoOptimizationScore),

      aiReadinessScore,
      aiReadinessExplanation: this.explainAiReadiness(input, aiReadinessScore),

      conversionReadinessScore,
      conversionExplanation: this.explainConversionReadiness(input, conversionReadinessScore),

      businessValueScore,
      businessExplanation: this.explainBusinessValue(input, businessValueScore),

      opportunityScore,
      overallScore: Math.round(overallScore),
    };
  }

  private scoreQuality(input: ContentMetricsInput): number {
    let score = 0;

    // Word count: 300-2000 words is ideal
    if (input.wordCount < 300) score += 20;
    else if (input.wordCount < 600) score += 50;
    else if (input.wordCount <= 2000) score += 90;
    else if (input.wordCount <= 3500) score += 85;
    else score += 70; // Very long content loses points for readability

    // Schema presence: +20 points if has proper schema
    if (input.hasSchema && input.schemaTypes.length > 0) score += 20;

    // Structure: Images improve quality
    if (input.imageCount > 0) score += 15;
    if (input.imageCount >= 5) score += 10;

    // Internal linking structure
    if (input.internalLinkCount >= 3) score += 15;

    return Math.min(100, score);
  }

  private scoreFreshness(input: ContentMetricsInput): number {
    // Days since last modified (if null, assume very old)
    const daysSinceUpdate = input.lastModifiedDays || 730; // 2 years if unknown

    if (daysSinceUpdate <= 30) return 95;
    if (daysSinceUpdate <= 90) return 80;
    if (daysSinceUpdate <= 180) return 60;
    if (daysSinceUpdate <= 365) return 40;
    if (daysSinceUpdate <= 730) return 20;
    return 5; // Severely outdated
  }

  private scoreEntityCoverage(input: ContentMetricsInput): number {
    // Entities recognized vs. potential
    let score = 0;

    if (input.entityCount === 0) return 10; // No entities found

    score = Math.min(80, (input.entitiesRecognized / Math.max(input.entityCount, 1)) * 100);

    // Bonus for having multiple entity types
    if (input.entityCount >= 5) score = Math.min(100, score + 20);

    return Math.round(score);
  }

  private scoreTopicalDepth(input: ContentMetricsInput): number {
    let score = 0;

    // Topics identified
    if (input.topicsIdentified === 0) return 20;
    if (input.topicsIdentified === 1) score = 40;
    else if (input.topicsIdentified <= 3) score = 60;
    else if (input.topicsIdentified <= 5) score = 80;
    else score = 95;

    // Bonus for comprehensive word count
    if (input.wordCount >= 1500) score = Math.min(100, score + 10);

    return score;
  }

  private scoreReadability(input: ContentMetricsInput): number {
    // Flesch-Kincaid Grade Level
    const grade = input.readabilityGradeLevel;

    if (grade <= 8) return 90; // Easy to read
    if (grade <= 12) return 75; // Moderately easy
    if (grade <= 16) return 50; // College level
    return 25; // Too complex
  }

  private scoreSeoOptimization(input: ContentMetricsInput): number {
    let score = 50; // Base score

    // Schema
    if (input.hasSchema) score += 25;

    // Internal linking
    if (input.internalLinkCount >= 5) score += 15;
    else if (input.internalLinkCount >= 3) score += 10;

    // Indexation
    if (input.indexStatus === 'indexed') score += 10;
    else if (input.indexStatus !== 'indexed') score -= 15;

    return Math.min(100, score);
  }

  private scoreAiReadiness(input: ContentMetricsInput): number {
    // How ready is this for AI improvement?
    let score = 50;

    // Thin content = high AI readiness
    if (input.wordCount < 300) score += 30;
    else if (input.wordCount < 600) score += 15;

    // Outdated content = high AI readiness
    if (input.lastModifiedDays && input.lastModifiedDays > 180) score += 20;

    // Low entity coverage = high AI readiness
    if (input.entityCount - input.entitiesRecognized > 5) score += 15;

    // Not indexed = opportunity
    if (input.indexStatus === 'crawled_not_indexed') score += 10;

    return Math.min(100, score);
  }

  private scoreConversionReadiness(input: ContentMetricsInput): number {
    let score = 0;

    // Actual conversions happening
    if (input.ga4Conversions > 0) score += 40;

    // Sufficient traffic
    if (input.ga4Sessions > 100) score += 25;
    else if (input.ga4Sessions > 10) score += 15;

    // CTR indicates relevance
    if (input.gscAverageCtr > 0.05) score += 20;
    else if (input.gscAverageCtr > 0.02) score += 10;

    // Freshness helps
    if (input.lastModifiedDays && input.lastModifiedDays < 90) score += 15;

    return Math.min(100, score);
  }

  private scoreBusinessValue(input: ContentMetricsInput): number {
    let score = 0;

    // Conversions are the primary signal
    if (input.ga4Conversions > 0) score = Math.min(100, input.ga4Conversions * 5);

    // Session volume
    if (input.ga4Sessions > 1000) score = Math.max(score, 80);
    else if (input.ga4Sessions > 100) score = Math.max(score, 50);

    // Impressions
    if (input.gscImpressions > 1000) score = Math.max(score, 60);

    return score;
  }

  private explainQuality(input: ContentMetricsInput, score: number): string {
    const issues: string[] = [];

    if (input.wordCount < 300) issues.push('Content is thin (under 300 words)');
    if (input.wordCount > 3500) issues.push('Content is very long - consider breaking into sections');
    if (!input.hasSchema) issues.push('No structured data (Schema.org) found');
    if (input.imageCount === 0) issues.push('No images - visual content improves engagement');
    if (input.internalLinkCount < 3) issues.push('Few internal links - improve topic clustering');

    if (issues.length === 0) return 'Content quality is excellent - comprehensive structure, good length, and proper markup.';

    return `Quality concerns: ${issues.join('; ')}.`;
  }

  private explainFreshness(_input: ContentMetricsInput, score: number): string {
    if (score >= 80) return 'Content is recently updated.';
    if (score >= 50) return 'Content is moderately fresh - consider refresh within 3 months.';
    if (score >= 30) return 'Content is stale - recommend refresh soon.';
    return 'Content is very outdated - high priority for refresh.';
  }

  private explainEntityCoverage(input: ContentMetricsInput, score: number): string {
    if (score >= 80) return `Strong entity coverage - ${input.entitiesRecognized} entities mentioned.`;
    if (score >= 50) return `Moderate entity coverage - ${input.entitiesRecognized}/${input.entityCount} potential entities covered.`;
    return `Limited entity coverage - ${input.entityCount - input.entitiesRecognized} entities missing.`;
  }

  private explainTopicalDepth(input: ContentMetricsInput, score: number): string {
    if (score >= 80) return `Comprehensive topic coverage - ${input.topicsIdentified} related topics identified.`;
    if (score >= 50) return `Moderate topic depth - ${input.topicsIdentified} related topics.`;
    return 'Topic coverage is limited - content lacks depth.';
  }

  private explainReadability(_input: ContentMetricsInput, score: number): string {
    if (score >= 80) return 'Content is easy to read (8th grade level).';
    if (score >= 60) return 'Readability is good.';
    return 'Readability is poor - consider simplifying language.';
  }

  private explainSeoOptimization(input: ContentMetricsInput, score: number): string {
    const issues: string[] = [];
    if (!input.hasSchema) issues.push('missing schema');
    if (input.internalLinkCount < 3) issues.push('few internal links');
    if (input.indexStatus !== 'indexed') issues.push('not indexed');

    if (issues.length === 0) return 'SEO optimization is solid.';
    return `SEO gaps: ${issues.join(', ')}.`;
  }

  private explainAiReadiness(input: ContentMetricsInput, score: number): string {
    const opportunities: string[] = [];
    if (input.wordCount < 300) opportunities.push('expand content');
    if (input.lastModifiedDays && input.lastModifiedDays > 180) opportunities.push('refresh outdated sections');
    if (input.entityCount - input.entitiesRecognized > 5) opportunities.push('add missing entities');

    if (opportunities.length === 0) return 'Content is well-optimized already.';
    return `AI can help with: ${opportunities.join(', ')}.`;
  }

  private explainConversionReadiness(input: ContentMetricsInput, score: number): string {
    const signals: string[] = [];
    if (input.ga4Conversions > 0) signals.push(`${input.ga4Conversions} conversions`);
    if (input.ga4Sessions > 100) signals.push(`${input.ga4Sessions} sessions`);
    if (input.gscAverageCtr > 0.05) signals.push('strong CTR');

    if (signals.length === 0) return 'No conversion signals yet - monitor and optimize.';
    return `Page is converting: ${signals.join(', ')}.`;
  }

  private explainBusinessValue(input: ContentMetricsInput, score: number): string {
    if (input.ga4Conversions > 0) return `Direct business value: ${input.ga4Conversions} conversions.`;
    if (input.ga4Sessions > 1000) return `High traffic potential: ${input.ga4Sessions} sessions.`;
    if (input.gscImpressions > 1000) return `Good visibility: ${input.gscImpressions} impressions.`;
    return 'Monitor for business impact development.';
  }
}
