import { PrismaClient } from '@prisma/client';
import { getPlaybookForIndustry } from '@/lib/industry-playbooks';

export interface GapAnalysisInput {
  industry: string;
  businessServices: string[];
  businessLocations: string[];
  primaryConversionGoal: string;
  targetKeywords: string[];
  currentPageTypes: string[]; // Types of pages already created
  competitorPageTypes: string[]; // Page types competitors have
  moneyPages: string[];
}

export interface ContentGap {
  gapType: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  recommendedPageType: string;
  suggestedTopic: string;
  suggestedTitle: string;
  relatedKeywords: string[];
  relatedServices: string[];
  relatedLocations: string[];
  competitorExamples: string[];
  rationale: string;
  estimatedTrafficPotential: number;
}

export class GapAnalysisEngine {
  constructor(private prisma: PrismaClient) {}

  async analyzeGaps(input: GapAnalysisInput): Promise<ContentGap[]> {
    const gaps: ContentGap[] = [];

    // Get industry playbook
    const playbook = getPlaybookForIndustry(input.industry);
    if (!playbook) return gaps;

    // Check for missing page types from playbook
    gaps.push(...this.findMissingPageTypes(input, playbook));

    // Check for missing service pages
    gaps.push(...this.findMissingServices(input, playbook));

    // Check for missing location pages (if applicable)
    gaps.push(...this.findMissingLocations(input, playbook));

    // Check for missing FAQ/support pages
    gaps.push(...this.findMissingSupport(input, playbook));

    // Check for missing comparison pages
    gaps.push(...this.findMissingComparisons(input, playbook));

    // Check for missing trust/credibility pages
    gaps.push(...this.findMissingTrust(input, playbook));

    // Check for missing topic clusters
    gaps.push(...this.findMissingClusters(input, playbook));

    // Sort by priority and impact
    gaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.estimatedTrafficPotential - a.estimatedTrafficPotential
      );
    });

    return gaps;
  }

  private findMissingPageTypes(
    input: GapAnalysisInput,
    playbook: any
  ): ContentGap[] {
    const gaps: ContentGap[] = [];
    const importantTypes = playbook.importantPageTypes || [];

    for (const pageType of importantTypes) {
      if (!input.currentPageTypes.includes(pageType)) {
        // Check if competitor has it
        const competitorHasIt = input.competitorPageTypes.includes(pageType);

        gaps.push({
          gapType: 'missing_page_type',
          description: `Missing ${pageType} - important for ${playbook.displayName} industry`,
          priority: competitorHasIt ? 'high' : 'medium',
          expectedImpact: this.estimatePageTypeImpact(pageType, playbook),
          recommendedPageType: pageType,
          suggestedTopic: this.suggestTopicForPageType(pageType, input),
          suggestedTitle: this.suggestTitleForPageType(pageType, input),
          relatedKeywords: this.getKeywordsForPageType(pageType, input),
          relatedServices: input.businessServices,
          relatedLocations: input.businessLocations,
          competitorExamples: competitorHasIt ? ['[Competitor examples to analyze]'] : [],
          rationale: `${pageType} pages are critical for ${playbook.displayName} businesses. They address user intent and improve topical authority.`,
          estimatedTrafficPotential: this.estimateTrafficPotential(pageType, playbook),
        });
      }
    }

    return gaps;
  }

  private findMissingServices(
    input: GapAnalysisInput,
    playbook: any
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Check if we have service pages for each service
    for (const service of input.businessServices) {
      const hasServicePage = input.currentPageTypes.includes('service_page');
      if (!hasServicePage) continue;

      // For now, assume if we have any service page, we're covering services
      // In a real implementation, we'd check which specific services are covered
    }

    // If no service pages at all, that's a gap
    if (!input.currentPageTypes.includes('service_page') && input.businessServices.length > 0) {
      gaps.push({
        gapType: 'missing_service',
        description: `No dedicated service pages - missing ${input.businessServices.length} services`,
        priority: 'high',
        expectedImpact: 'high',
        recommendedPageType: 'service_page',
        suggestedTopic: `${input.businessServices[0]} services`,
        suggestedTitle: `${input.businessServices[0]} Services`,
        relatedKeywords: this.generateServiceKeywords(input.businessServices[0]),
        relatedServices: input.businessServices,
        relatedLocations: input.businessLocations,
        competitorExamples: ['[Competitor service pages to benchmark]'],
        rationale: `Service pages are money pages for ${playbook.displayName}. They target high-intent keywords and directly support conversions.`,
        estimatedTrafficPotential: input.businessServices.length * 50,
      });
    }

    return gaps;
  }

  private findMissingLocations(
    input: GapAnalysisInput,
    playbook: any
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    if (input.businessLocations.length === 0) return gaps;

    if (
      !input.currentPageTypes.includes('location_page') &&
      playbook.importantPageTypes?.includes('location_page')
    ) {
      gaps.push({
        gapType: 'missing_location',
        description: `No location pages - serving ${input.businessLocations.length} locations`,
        priority: 'high',
        expectedImpact: 'high',
        recommendedPageType: 'location_page',
        suggestedTopic: `${input.businessLocations[0]} office`,
        suggestedTitle: `${input.businessLocations[0]} Location`,
        relatedKeywords: this.generateLocationKeywords(input.businessLocations[0]),
        relatedServices: input.businessServices,
        relatedLocations: input.businessLocations,
        competitorExamples: ['[Competitor location pages]'],
        rationale: `Location pages capture local search intent and are critical for local SEO. Each location should have a dedicated page.`,
        estimatedTrafficPotential: input.businessLocations.length * 75,
      });
    }

    return gaps;
  }

  private findMissingSupport(_input: GapAnalysisInput, playbook: any): ContentGap[] {
    const gaps: ContentGap[] = [];

    gaps.push({
      gapType: 'missing_faq',
      description: 'No FAQ page - common customer questions unanswered',
      priority: 'medium',
      expectedImpact: 'medium',
      recommendedPageType: 'faq_page',
      suggestedTopic: 'Frequently asked questions',
      suggestedTitle: 'FAQ',
      relatedKeywords: ['frequently asked questions', 'how to', 'what is'],
      relatedServices: [],
      relatedLocations: [],
      competitorExamples: [],
      rationale: 'FAQ pages provide valuable content for users and Google, improving visibility for long-tail queries and supporting conversion.',
      estimatedTrafficPotential: 20,
    });

    return gaps;
  }

  private findMissingComparisons(_input: GapAnalysisInput, _playbook: any): ContentGap[] {
    // Comparison pages help users make decisions
    return [
      {
        gapType: 'missing_comparison',
        description: 'No comparison pages - competitors are capturing this intent',
        priority: 'medium',
        expectedImpact: 'medium',
        recommendedPageType: 'comparison_page',
        suggestedTopic: 'Solution comparisons',
        suggestedTitle: '[Solution] vs alternatives',
        relatedKeywords: ['vs', 'comparison', 'alternative'],
        relatedServices: [],
        relatedLocations: [],
        competitorExamples: [],
        rationale: 'Comparison pages capture high-intent commercial keywords where users are evaluating options.',
        estimatedTrafficPotential: 30,
      },
    ];
  }

  private findMissingTrust(_input: GapAnalysisInput, playbook: any): ContentGap[] {
    // Trust pages support conversion (about, testimonials, case studies, certifications)
    const gaps: ContentGap[] = [];

    if (playbook.trustSignalImportance > 80) {
      gaps.push({
        gapType: 'missing_trust',
        description: 'No dedicated trust/credibility pages (About, Case Studies, Testimonials)',
        priority: 'high',
        expectedImpact: 'high',
        recommendedPageType: 'trust_page',
        suggestedTopic: 'Company expertise and social proof',
        suggestedTitle: 'About Us / Case Studies',
        relatedKeywords: ['about', 'case study', 'testimonial', 'client success'],
        relatedServices: [],
        relatedLocations: [],
        competitorExamples: [],
        rationale: `For ${playbook.displayName}, trust signals are critical (${playbook.trustSignalImportance}% importance). Build social proof pages.`,
        estimatedTrafficPotential: 10,
      });
    }

    return gaps;
  }

  private findMissingClusters(_input: GapAnalysisInput, _playbook: any): ContentGap[] {
    // Topic clusters improve topical authority
    return [
      {
        gapType: 'missing_cluster',
        description: 'No topic cluster structure - opportunity for topical authority improvement',
        priority: 'low',
        expectedImpact: 'medium',
        recommendedPageType: 'hub_page',
        suggestedTopic: 'Topic hub/pillar page',
        suggestedTitle: 'Comprehensive guide to [topic]',
        relatedKeywords: ['guide', 'overview', 'complete'],
        relatedServices: [],
        relatedLocations: [],
        competitorExamples: [],
        rationale: 'Topic clusters improve internal linking structure and establish topical authority for related keywords.',
        estimatedTrafficPotential: 40,
      },
    ];
  }

  private estimatePageTypeImpact(pageType: string, playbook: any): string {
    // Based on industry and page type importance
    if (playbook.importantPageTypes?.includes(pageType)) {
      return 'high';
    }
    return 'medium';
  }

  private suggestTopicForPageType(pageType: string, input: GapAnalysisInput): string {
    const service = input.businessServices[0] || 'our';
    const location = input.businessLocations[0] || '';

    switch (pageType) {
      case 'service_page':
        return `${service} services`;
      case 'location_page':
        return `${location} ${input.businessServices[0] || 'business'}`;
      case 'faq_page':
        return 'Frequently asked questions';
      case 'comparison_page':
        return `${service} alternatives`;
      default:
        return `${pageType.replace('_', ' ')}`;
    }
  }

  private suggestTitleForPageType(pageType: string, input: GapAnalysisInput): string {
    const service = input.businessServices[0] || 'Our';
    const location = input.businessLocations[0] || '';

    switch (pageType) {
      case 'service_page':
        return `${service} Services`;
      case 'location_page':
        return `${location} Location`;
      case 'faq_page':
        return 'Frequently Asked Questions';
      case 'comparison_page':
        return `${service} Alternatives`;
      default:
        return pageType.replace('_', ' ');
    }
  }

  private getKeywordsForPageType(pageType: string, input: GapAnalysisInput): string[] {
    const baseKeywords: { [key: string]: string[] } = {
      service_page: ['service', 'solutions', 'how to'],
      location_page: ['near me', 'local', 'location'],
      faq_page: ['frequently asked', 'how to', 'what is'],
      blog_page: ['guide', 'tutorial', 'tips'],
      comparison_page: ['vs', 'comparison', 'alternative'],
    };

    return baseKeywords[pageType] || [];
  }

  private generateServiceKeywords(service: string): string[] {
    return [
      `${service} services`,
      `professional ${service}`,
      `${service} company`,
      `hire ${service}`,
      `${service} near me`,
    ];
  }

  private generateLocationKeywords(location: string): string[] {
    return [
      `${location} services`,
      `${location} office`,
      `${location} location`,
      `services in ${location}`,
      `${location} business`,
    ];
  }

  private estimateTrafficPotential(pageType: string, playbook: any): number {
    // Base traffic potential by page type
    const potentials: { [key: string]: number } = {
      service_page: 100,
      location_page: 75,
      product_page: 80,
      blog_page: 30,
      faq_page: 25,
      comparison_page: 40,
      resource_page: 35,
    };

    return potentials[pageType] || 20;
  }
}
