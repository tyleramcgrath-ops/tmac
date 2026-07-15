/**
 * Enhanced Decision Engine - Post-Wave 1 Improvements
 *
 * Adds business-model-aware scoring adjustments to better differentiate
 * page priorities based on site industry and business objectives.
 *
 * Tested with Wave 1 sites: law_firm, ecommerce, saas, local_service, agency, content_heavy
 */

type Industry = 'law_firm' | 'ecommerce' | 'saas' | 'local_service' | 'agency' | 'content_heavy';
type Objective = 'lead_generation' | 'authority' | 'conversion' | 'brand_awareness' | 'retention';

interface PageScore {
  url: string;
  pageType: string;
  score: number;
  components: {
    baseScore: number;
    businessValueScore: number;
    objectiveScore: number;
    industryScore: number;
  };
  reasoning: string;
}

/**
 * Industry-specific page value weights
 * Different industries prioritize different page types
 */
const industryWeights: Record<Industry, Record<string, number>> = {
  law_firm: {
    homepage: 0.8,
    service: 1.0, // Service pages are most valuable for law firms
    practice_area: 0.95,
    attorney_profile: 0.7,
    location: 0.85,
    blog: 0.6,
    news: 0.65,
  },
  ecommerce: {
    homepage: 0.9,
    product: 1.0, // Products drive revenue
    category: 0.95,
    buying_guide: 0.85,
    comparison: 0.8,
    review: 0.75,
  },
  saas: {
    homepage: 0.9,
    feature: 0.95,
    solution: 1.0, // Solution/use-case pages convert best
    pricing: 0.98, // Pricing pages directly impact conversion
    integration: 0.8,
    blog: 0.7,
  },
  local_service: {
    homepage: 0.85,
    service: 0.95,
    location: 1.0, // Location pages critical for local services
    emergency: 0.9, // Emergency pages drive immediate business
    contact: 0.95,
  },
  agency: {
    homepage: 0.85,
    service: 0.95,
    case_study: 1.0, // Case studies build credibility
    team: 0.8,
    process: 0.85,
    blog: 0.75,
  },
  content_heavy: {
    homepage: 0.8,
    article: 0.95,
    guide: 1.0, // Guides are primary content
    tutorial: 0.98,
    topic_hub: 0.95,
    discussion: 0.7,
  },
};

/**
 * Objective-specific scoring adjustments
 * How different objectives prioritize page types
 */
const objectiveAdjustments: Record<Objective, Record<string, number>> = {
  lead_generation: {
    service_page: 1.5, // Service pages drive leads
    contact_page: 1.4,
    pricing_page: 1.1,
    solution_page: 1.3,
    blog_post: 0.6, // Blogs have lower immediate lead value
  },
  authority: {
    blog_post: 1.5, // Content builds authority
    guide: 1.4,
    case_study: 1.3,
    research: 1.2,
    product_page: 0.6, // Products less relevant for authority
  },
  conversion: {
    pricing_page: 1.6, // Pricing is conversion-critical
    product_page: 1.5,
    feature_page: 1.3,
    solution_page: 1.2,
    blog_post: 0.5,
  },
  brand_awareness: {
    homepage: 1.4,
    about_page: 1.3,
    blog_post: 1.2,
    news: 1.1,
    technical_page: 0.6,
  },
  retention: {
    blog_post: 1.3, // Content engagement
    tutorial: 1.2,
    community_page: 1.1,
    product_page: 0.9,
  },
};

/**
 * Calculate business value score based on industry and page type
 */
function calculateBusinessValueScore(industry: Industry, pageType: string, wordCount: number): number {
  const weights = industryWeights[industry] || {};
  const weight = weights[pageType] || 0.5;

  // Longer content typically has more value (but with diminishing returns)
  const lengthScore = Math.min(100, (wordCount / 100) * 10);
  const baseScore = lengthScore * weight;

  return Math.min(100, baseScore);
}

/**
 * Calculate objective-specific score adjustment
 */
function calculateObjectiveAdjustment(objective: Objective, pageType: string): number {
  const adjustments = objectiveAdjustments[objective];
  return adjustments[pageType] || 1.0; // Default: no adjustment
}

/**
 * Calculate industry-specific score adjustment
 * Some industries have unique considerations
 */
function calculateIndustryAdjustment(industry: Industry, pageType: string, metadata: any): number {
  let adjustment = 1.0;

  // Local services: prioritize recent location pages
  if (industry === 'local_service' && pageType === 'location') {
    const ageWeeks = metadata.ageWeeks || 52;
    adjustment *= Math.max(0.5, 1.0 - ageWeeks / 104); // Newer is better
  }

  // E-commerce: prioritize in-stock products
  if (industry === 'ecommerce' && pageType === 'product') {
    if (metadata.inStock) adjustment *= 1.3;
    if (metadata.hasReviews) adjustment *= 1.15;
  }

  // SaaS: prioritize features with high adoption
  if (industry === 'saas' && pageType === 'feature') {
    const adoptionRate = metadata.adoptionRate || 0.5;
    adjustment *= 0.8 + adoptionRate * 0.4; // 0.8 to 1.2
  }

  // Law firm: prioritize services with recent case wins
  if (industry === 'law_firm' && pageType === 'service') {
    if (metadata.hasRecentCaseWins) adjustment *= 1.2;
    if (metadata.isCorePractice) adjustment *= 1.15;
  }

  // Agency: prioritize case studies with measurable results
  if (industry === 'agency' && pageType === 'case_study') {
    if (metadata.hasMetrics) adjustment *= 1.2;
    if (metadata.resultType === 'revenue') adjustment *= 1.25;
  }

  return adjustment;
}

/**
 * Score a single page based on multiple signals
 */
export function scorePageForObjective(
  page: {
    url: string;
    pageType: string;
    wordCount: number;
    industry: Industry;
    metadata?: any;
  },
  objective: Objective
): PageScore {
  const { industry, pageType, wordCount } = page;
  const metadata = page.metadata || {};

  // Component 1: Base business value
  const businessValueScore = calculateBusinessValueScore(industry, pageType, wordCount);

  // Component 2: Objective alignment
  const objectiveAdjustment = calculateObjectiveAdjustment(objective, pageType);

  // Component 3: Industry-specific factors
  const industryAdjustment = calculateIndustryAdjustment(industry, pageType, metadata);

  // Combine scores
  const objectiveScore = businessValueScore * objectiveAdjustment;
  const industryScore = objectiveScore * industryAdjustment;
  const finalScore = Math.min(100, industryScore);

  return {
    url: page.url,
    pageType,
    score: finalScore,
    components: {
      baseScore: businessValueScore,
      businessValueScore: businessValueScore,
      objectiveScore: objectiveScore,
      industryScore: industryScore,
    },
    reasoning: generateScoreReasoning(
      industry,
      pageType,
      objective,
      businessValueScore,
      objectiveAdjustment,
      industryAdjustment
    ),
  };
}

/**
 * Generate human-readable reasoning for score
 */
function generateScoreReasoning(
  industry: Industry,
  pageType: string,
  objective: Objective,
  baseScore: number,
  objectiveAdjustment: number,
  industryAdjustment: number
): string {
  const reasons: string[] = [];

  // Base reason
  if (baseScore > 70) {
    reasons.push(`Strong business value for ${industry} (${baseScore.toFixed(0)}/100)`);
  } else {
    reasons.push(`Moderate value for ${industry} (${baseScore.toFixed(0)}/100)`);
  }

  // Objective alignment
  if (objectiveAdjustment > 1.2) {
    reasons.push(`Highly aligned with ${objective} objective (+${((objectiveAdjustment - 1) * 100).toFixed(0)}%)`);
  } else if (objectiveAdjustment > 1.0) {
    reasons.push(`Aligned with ${objective} objective (+${((objectiveAdjustment - 1) * 100).toFixed(0)}%)`);
  } else if (objectiveAdjustment < 0.8) {
    reasons.push(
      `${objective} objective not primary for ${pageType} pages (${((objectiveAdjustment - 1) * 100).toFixed(0)}%)`
    );
  }

  // Industry considerations
  if (industryAdjustment > 1.1) {
    reasons.push(`Industry-specific factors boost value (+${((industryAdjustment - 1) * 100).toFixed(0)}%)`);
  } else if (industryAdjustment < 0.9) {
    reasons.push(`Industry-specific factors reduce priority (${((industryAdjustment - 1) * 100).toFixed(0)}%)`);
  }

  return reasons.join('; ');
}

/**
 * Rank pages for a specific objective
 */
export function rankPagesForObjective(
  pages: Array<{
    url: string;
    pageType: string;
    wordCount: number;
    industry: Industry;
    metadata?: any;
  }>,
  objective: Objective,
  topN: number = 10
): PageScore[] {
  const scores = pages.map((page) => scorePageForObjective(page, objective));

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((score, index) => ({
      ...score,
      url: `${index + 1}. ${score.url}`, // Add rank
    }));
}

/**
 * Compare ranking across different objectives
 * Shows how priorities shift based on business goal
 */
export function compareObjectiveRankings(
  pages: Array<{
    url: string;
    pageType: string;
    wordCount: number;
    industry: Industry;
    metadata?: any;
  }>,
  topN: number = 5
): Record<Objective, PageScore[]> {
  const objectives: Objective[] = [
    'lead_generation',
    'authority',
    'conversion',
    'brand_awareness',
    'retention',
  ];

  const rankings: Record<Objective, PageScore[]> = {} as Record<Objective, PageScore[]>;

  for (const objective of objectives) {
    rankings[objective] = rankPagesForObjective(pages, objective, topN);
  }

  return rankings;
}

export type { PageScore, Objective, Industry };
