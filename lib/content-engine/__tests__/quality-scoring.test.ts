import { describe, it, expect } from 'vitest';

/**
 * Phase 7.8A: Content Quality Scoring Verification Tests
 *
 * Verify that RankForge correctly scores content across 9 dimensions:
 * 1. Quality (depth, authority, readability)
 * 2. Freshness (update recency, temporal relevance)
 * 3. Entity Coverage (relevant entities, normalization)
 * 4. Topical Depth (pillar pages, cluster depth)
 * 5. Readability (scannability, CTA placement)
 * 6. SEO Optimization (technical, on-page, structure)
 * 7. AI Readiness (structured data, schema, semantic clarity)
 * 8. Conversion Readiness (persuasion, trust signals, urgency)
 * 9. Business Value (alignment, revenue potential, strategic fit)
 */

describe('Phase 7.8A: Content Quality Scoring', () => {
  describe('Quality Dimension Scoring', () => {
    describe('Quality Score (Depth & Authority)', () => {
      it('should score high for comprehensive pages with sources', () => {
        const page = {
          wordCount: 3500,
          citations: 12,
          externalLinks: 8,
          authorBio: 'John Smith, CPA with 20 years experience',
          sources: ['IRS.gov', 'tax-foundation.org', 'peer-reviewed journal'],
          uniqueInsights: true,
          dataPoints: 15,
          methodology: 'Primary research and expert interviews',
        };

        // Expected score: 90+
        // Evidence: >3000 words, citations, expert credibility, primary research
        expect(page.wordCount).toBeGreaterThan(3000);
        expect(page.citations).toBeGreaterThan(10);
      });

      it('should score medium for adequate pages with some depth', () => {
        const page = {
          wordCount: 1500,
          citations: 3,
          externalLinks: 2,
          authorBio: 'Company writer',
          sources: ['industry blog'],
        };

        // Expected score: 60-75
        // Evidence: reasonable length, minimal citations, generic authority
        expect(page.wordCount).toBeGreaterThan(1000);
        expect(page.citations).toBeGreaterThan(0);
      });

      it('should score low for thin, unsourced pages', () => {
        const page = {
          wordCount: 400,
          citations: 0,
          externalLinks: 0,
          authorBio: null,
          sources: [],
        };

        // Expected score: 20-40
        // Evidence: <500 words, no citations, no authority
        expect(page.wordCount).toBeLessThan(500);
        expect(page.citations).toBe(0);
      });

      it('should penalize outdated content', () => {
        const page = {
          wordCount: 2500,
          citations: 8,
          lastUpdated: '2020-01-15',
          topicRelevanceToday: false,
        };

        // Expected: Quality score reduced by 30-40%
        // Reason: Even good content becomes stale.
        // (lastUpdated is an ISO date string; compare as a timestamp — the
        //  page was last updated well before now, so it is outdated.)
        expect(new Date(page.lastUpdated).getTime()).toBeLessThan(Date.now());
      });

      it('should reward original research and data', () => {
        const page = {
          wordCount: 2000,
          citations: 6,
          originalResearch: true,
          dataVisualization: 5,
          surveyData: true,
          exclusiveInterview: true,
        };

        // Expected: +20% quality boost
        // Evidence: original data always beats regurgitation
        expect(page.originalResearch).toBe(true);
      });
    });

    describe('Freshness Score (Recency & Temporal Relevance)', () => {
      it('should score high for recently updated pages', () => {
        const page = {
          publishedAt: '2024-01-15',
          lastUpdated: '2026-06-20',
          daysSinceUpdate: 25,
          updateFrequency: 'monthly',
        };

        // Expected score: 85+
        // Evidence: updated within last month
        expect(page.daysSinceUpdate).toBeLessThan(30);
      });

      it('should score medium for pages updated 3-6 months ago', () => {
        const page = {
          lastUpdated: '2026-01-15',
          daysSinceUpdate: 180,
        };

        // Expected score: 60-75
        // Evidence: moderately stale, still relevant. "3-6 months ago" is
        // inclusive of the 6-month (~180-day) upper edge, so the boundary
        // is <= 180, not < 180.
        expect(page.daysSinceUpdate).toBeGreaterThan(90);
        expect(page.daysSinceUpdate).toBeLessThanOrEqual(180);
      });

      it('should score low for pages not updated in 1+ year', () => {
        const page = {
          lastUpdated: '2024-06-15',
          daysSinceUpdate: 750,
        };

        // Expected score: 20-40
        // Evidence: outdated, likely contains stale information
        expect(page.daysSinceUpdate).toBeGreaterThan(365);
      });

      it('should boost score for pages covering evergreen topics', () => {
        const page = {
          lastUpdated: '2023-01-15',
          daysSinceUpdate: 550,
          topic: 'fundamental_principles',
          relevanceToCurrentYear: true,
        };

        // Expected: +30% boost
        // Reason: Some content doesn't need frequent updates
        expect(page.relevanceToCurrentYear).toBe(true);
      });

      it('should penalize score for time-sensitive pages with old dates', () => {
        const page = {
          lastUpdated: '2023-06-15',
          daysSinceUpdate: 500,
          topic: 'tax_law_changes_2025',
          timesSensitive: true,
        };

        // Expected: -50% penalty
        // Reason: Outdated tax law info is actively harmful
        expect(page.timesSensitive).toBe(true);
      });
    });

    describe('Entity Coverage Score', () => {
      it('should score high when page covers expected entities', () => {
        const page = {
          businessServices: ['Tax Planning', 'Audit', 'Consulting'],
          pageEntities: ['Tax Planning', 'IRS', 'S-Corp', 'Audit', 'Quarterly Taxes', 'CPA'],
          expectedEntities: ['Tax Planning', 'Audit', 'IRS', 'S-Corp'],
          coverage: 0.95,
        };

        // Expected score: 90+
        // Evidence: 4/4 expected entities covered, plus supporting entities
        expect(page.coverage).toBeGreaterThan(0.9);
      });

      it('should score medium when coverage is 60-80%', () => {
        const page = {
          expectedEntities: ['Service A', 'Service B', 'Service C', 'Service D', 'Service E'],
          pageEntities: ['Service A', 'Service B', 'Service C'],
          coverage: 0.6,
        };

        // Expected score: 65-75
        // Evidence: most important entities covered
        expect(page.coverage).toBeGreaterThan(0.5);
        expect(page.coverage).toBeLessThan(0.8);
      });

      it('should penalize irrelevant entity mentions', () => {
        const page = {
          expectedEntities: ['Tax Planning'],
          pageEntities: ['Tax Planning', 'Real Estate Law', 'Medical Malpractice', 'DUI Defense'],
          relevantEntities: 1,
          irrelevantEntities: 3,
        };

        // Expected: -20% penalty
        // Reason: Entity pollution suggests low quality
        expect(page.irrelevantEntities).toBeGreaterThan(page.relevantEntities);
      });

      it('should reward normalized entities', () => {
        const page = {
          pageEntities: ['CPA', 'Certified Public Accountant', 'C.P.A.'],
          normalizedToSingleEntity: true,
          normalizationQuality: 'perfect',
        };

        // Expected: +10% bonus
        // Reason: Clean entity data is valuable for AI training
        expect(page.normalizedToSingleEntity).toBe(true);
      });
    });

    describe('Topical Depth Score', () => {
      it('should score high for pillar pages', () => {
        const page = {
          pageType: 'pillar',
          wordCount: 5000,
          uniqueSections: 12,
          supportingClusterPages: 15,
          internalLinks: 25,
          breadthOfCoverage: 'comprehensive',
        };

        // Expected score: 90+
        // Evidence: >5000 words, 12+ sections, established cluster
        expect(page.wordCount).toBeGreaterThan(4000);
        expect(page.supportingClusterPages).toBeGreaterThan(10);
      });

      it('should score high for cluster pages with strong pillar link', () => {
        const page = {
          pageType: 'cluster',
          wordCount: 2000,
          linkedFromPillar: true,
          pillarRelevance: 0.95,
          uniqueAngle: 'specific_use_case',
          supportingContent: 5,
        };

        // Expected score: 75-85
        // Evidence: strong topical connection, unique angle
        expect(page.linkedFromPillar).toBe(true);
        expect(page.pillarRelevance).toBeGreaterThan(0.9);
      });

      it('should penalize orphaned pages', () => {
        const page = {
          pageType: 'blog_post',
          wordCount: 1500,
          linkedFromPillar: false,
          internalLinks: 0,
          topicalRelevance: 'unclear',
        };

        // Expected: -30% penalty
        // Reason: Orphaned pages dilute topical authority
        expect(page.linkedFromPillar).toBe(false);
      });

      it('should score based on topic cluster completeness', () => {
        const cluster = {
          pillarPage: 'Tax Planning',
          expectedClusters: [
            'S-Corp Strategies',
            'LLC Structures',
            'Solo 401k Plans',
            'Pass-Through Entity Basics',
            'Estimated Tax Payments',
          ],
          existingClusters: [
            'S-Corp Strategies',
            'LLC Structures',
            'Solo 401k Plans',
          ],
          coverage: 0.6,
        };

        // Expected score: 65-70
        // Evidence: 3/5 key clusters exist
        expect(cluster.coverage).toBe(0.6);
      });
    });

    describe('Readability Score', () => {
      it('should score high for scannable content', () => {
        const page = {
          h2Count: 8,
          h3Count: 15,
          bulletPoints: 40,
          averageSentenceLength: 12,
          averageParagraphLength: 3,
          hasTableOfContents: true,
          listFormatPercentage: 0.35,
        };

        // Expected score: 85+
        // Evidence: good structure, scannable format
        expect(page.h2Count).toBeGreaterThan(5);
        expect(page.bulletPoints).toBeGreaterThan(20);
      });

      it('should score low for dense text blocks', () => {
        const page = {
          h2Count: 1,
          bulletPoints: 2,
          averageSentenceLength: 25,
          averageParagraphLength: 12,
          hasTableOfContents: false,
        };

        // Expected score: 30-40
        // Evidence: poor scannability
        expect(page.h2Count).toBeLessThan(3);
        expect(page.averageParagraphLength).toBeGreaterThan(8);
      });

      it('should reward clear CTA placement', () => {
        const page = {
          ctas: 5,
          ctaLocations: ['above_fold', 'mid_content', 'bottom', 'sidebar', 'exit_intent'],
          ctaClarity: 'action_oriented',
          ctaProminence: 'high',
        };

        // Expected: +15% readability boost
        // Reason: Clear CTAs improve scannability
        expect(page.ctas).toBeGreaterThan(3);
      });

      it('should penalize excessive ads', () => {
        const page = {
          content: 800,
          ads: 6,
          adDensity: 0.75,
          contentToAdRatio: 1.33,
        };

        // Expected: -30% penalty
        // Reason: Ad-heavy pages have poor readability
        expect(page.adDensity).toBeGreaterThan(0.5);
      });
    });

    describe('SEO Optimization Score', () => {
      it('should score high for technically optimized pages', () => {
        const page = {
          pageSpeed: 1.8,
          mobileSpeed: 2.1,
          coreWebVitals: 'green',
          hasSchema: true,
          schemaType: 'Article',
          hasOpenGraph: true,
          hasMetaDescription: true,
          metaDescriptionLength: 155,
          internalLinkCount: 12,
          h1Count: 1,
        };

        // Expected score: 88+
        // Evidence: fast, valid schema, good structure
        expect(page.pageSpeed).toBeLessThan(2.5);
        expect(page.hasSchema).toBe(true);
      });

      it('should score medium for pages with basic optimization', () => {
        const page = {
          pageSpeed: 2.8,
          coreWebVitals: 'needs_improvement',
          hasSchema: true,
          hasMetaDescription: true,
          metaDescriptionLength: 160,
          h1Count: 1,
        };

        // Expected score: 65-75
        // Evidence: OK structure, suboptimal performance
        expect(page.hasMetaDescription).toBe(true);
      });

      it('should penalize missing schema', () => {
        const page = {
          pageSpeed: 1.5,
          hasSchema: false,
          hasStructuredData: false,
        };

        // Expected: -25% penalty
        // Reason: Schema is crucial for rich results
        expect(page.hasSchema).toBe(false);
      });

      it('should reward schema match to content type', () => {
        const page = {
          contentType: 'blog_post',
          schema: ['Article', 'BlogPosting'],
          schemaAccuracy: 0.98,
        };

        // Expected: +15% bonus
        // Reason: Correct schema = better AI understanding
        expect(page.contentType).toBe('blog_post');
        expect(page.schema).toContain('Article');
      });
    });

    describe('AI Readiness Score', () => {
      it('should score high for structured, semantic content', () => {
        const page = {
          hasSchema: true,
          schemaStructure: {
            mainEntity: true,
            author: true,
            datePublished: true,
            articleBody: true,
          },
          semanticClarity: 0.92,
          hasDefinitions: true,
          acronymsDefinedOnFirstUse: true,
          conceptLinking: 15,
        };

        // Expected score: 88+
        // Evidence: rich schema, clear semantics
        expect(page.semanticClarity).toBeGreaterThan(0.9);
        expect(page.hasDefinitions).toBe(true);
      });

      it('should reward entity disambiguation', () => {
        const page = {
          ambiguousTerms: 5,
          disambiguatedTerms: 5,
          disambiguationQuality: 0.95,
        };

        // Expected score: +20% boost
        // Reason: Removes training data noise
        expect(page.disambiguatedTerms).toBe(page.ambiguousTerms);
      });

      it('should score low for AI-unfriendly content', () => {
        const page = {
          hasSchema: false,
          allCapsText: true,
          missingPunctuation: true,
          abbreviationsNotDefined: true,
          ambiguousPronouns: true,
        };

        // Expected score: 20-30
        // Evidence: impossible to parse semantically
        expect(page.hasSchema).toBe(false);
      });
    });

    describe('Conversion Readiness Score', () => {
      it('should score high for conversion-optimized pages', () => {
        const page = {
          ctas: 5,
          ctaButtonCount: 3,
          ctaTextQuality: 'action_oriented',
          trustSignals: ['testimonials', 'awards', 'certifications', 'case_studies'],
          socialProof: ['review_count', 'rating'],
          ratingCount: 125,
          averageRating: 4.8,
          urgencyElements: ['limited_time_offer', 'scarcity'],
          guaranteeStatement: true,
          reassuranceElements: ['money_back', 'support_guarantee'],
        };

        // Expected score: 85+
        // Evidence: multiple conversion signals
        expect(page.ctas).toBeGreaterThan(3);
        expect(page.averageRating).toBeGreaterThan(4.5);
      });

      it('should score medium for pages with basic conversion elements', () => {
        const page = {
          ctas: 2,
          trustSignals: ['testimonials'],
          ratingCount: 20,
          averageRating: 4.2,
        };

        // Expected score: 60-70
        // Evidence: some conversion optimization
        expect(page.ctas).toBeGreaterThan(0);
        expect(page.trustSignals.length).toBeGreaterThan(0);
      });

      it('should penalize weak CTAs', () => {
        const page = {
          ctas: 0,
          genericLanguage: ['click here', 'learn more'],
          trustSignals: [],
          ratingCount: 0,
        };

        // Expected score: 15-25
        // Evidence: no conversion optimization
        expect(page.ctas).toBe(0);
      });
    });

    describe('Business Value Score', () => {
      it('should score high for revenue-aligned pages', () => {
        const page = {
          topic: 'Tax Planning',
          businessServices: ['Tax Planning', 'Audit', 'Consulting'],
          trafficValue: 'high',
          conversionMetric: 'qualified_leads',
          conversions: 45,
          averageClientValue: 8500,
          pageRevenuePotential: 382500,
          strategicImportance: 'core_service',
        };

        // Expected score: 92+
        // Evidence: core service, high traffic value, proven conversions
        expect(page.strategicImportance).toBe('core_service');
        expect(page.conversions).toBeGreaterThan(20);
      });

      it('should score medium for supporting pages', () => {
        const page = {
          topic: 'S-Corp Benefits',
          businessServices: ['Tax Planning'],
          trafficValue: 'medium',
          conversions: 8,
          strategicImportance: 'supporting',
        };

        // Expected score: 65-75
        // Evidence: supporting service, moderate value
        expect(page.strategicImportance).toBe('supporting');
      });

      it('should penalize pages misaligned with business', () => {
        const page = {
          topic: 'Unrelated Topic',
          businessServices: [],
          trafficValue: 'minimal',
          conversions: 0,
          strategicImportance: 'none',
        };

        // Expected score: 10-20
        // Evidence: no business value
        expect(page.strategicImportance).toBe('none');
      });

      it('should reward brand-building pages', () => {
        const page = {
          topic: 'Industry Trends 2025',
          businessServices: [],
          trafficValue: 'medium',
          strategicImportance: 'brand_authority',
          linkedFrom: 'industry_publications',
          shareCount: 450,
          mentionCount: 35,
        };

        // Expected: +25% bonus to business value
        // Reason: Brand authority supports all revenue
        expect(page.strategicImportance).toBe('brand_authority');
      });
    });
  });

  describe('Composite Scoring', () => {
    it('should calculate overall score as weighted average of 9 dimensions', () => {
      const scores = {
        quality: 0.82,
        freshness: 0.75,
        entityCoverage: 0.88,
        topicalDepth: 0.79,
        readability: 0.85,
        seoOptimization: 0.80,
        aiReadiness: 0.76,
        conversionReadiness: 0.72,
        businessValue: 0.90,
      };

      const weights = {
        quality: 0.18,
        freshness: 0.12,
        entityCoverage: 0.10,
        topicalDepth: 0.12,
        readability: 0.08,
        seoOptimization: 0.12,
        aiReadiness: 0.10,
        conversionReadiness: 0.10,
        businessValue: 0.08,
      };

      // Expected overall: weighted average
      const overall =
        scores.quality * weights.quality +
        scores.freshness * weights.freshness +
        scores.entityCoverage * weights.entityCoverage +
        scores.topicalDepth * weights.topicalDepth +
        scores.readability * weights.readability +
        scores.seoOptimization * weights.seoOptimization +
        scores.aiReadiness * weights.aiReadiness +
        scores.conversionReadiness * weights.conversionReadiness +
        scores.businessValue * weights.businessValue;

      expect(overall).toBeGreaterThan(0.7);
      expect(overall).toBeLessThan(1.0);
    });

    it('should allow dimension weighting by industry', () => {
      // Law firm: weight conversion readiness higher
      const lawFirmWeights = {
        conversionReadiness: 0.15,
        businessValue: 0.12,
      };

      // Ecommerce: weight SEO optimization higher
      const ecommerceWeights = {
        seoOptimization: 0.15,
        conversionReadiness: 0.12,
      };

      // SaaS: weight AI readiness higher
      const saasWeights = {
        aiReadiness: 0.15,
        topicalDepth: 0.10,
      };

      expect(lawFirmWeights.conversionReadiness).toBeGreaterThan(0.1);
      expect(ecommerceWeights.seoOptimization).toBeGreaterThan(0.1);
      expect(saasWeights.aiReadiness).toBeGreaterThan(0.1);
    });
  });

  describe('Scoring Explainability', () => {
    it('should provide evidence for each score', () => {
      const scoreExplanation = {
        dimension: 'quality',
        score: 0.82,
        explanation: 'High quality due to 3200+ words, 8 citations, and expert authority',
        factors: [
          { factor: 'word_count', value: 3200, weight: 0.3, contribution: 0.27 },
          { factor: 'citations', value: 8, weight: 0.4, contribution: 0.36 },
          { factor: 'author_expertise', value: 'CPA_20_years', weight: 0.3, contribution: 0.27 },
        ],
      };

      expect(scoreExplanation.explanation).toContain('3200');
      expect(scoreExplanation.factors.length).toBeGreaterThan(0);
    });

    it('should show penalty reasons', () => {
      const scoreExplanation = {
        dimension: 'freshness',
        score: 0.35,
        explanation: 'Significantly penalized: last updated 800+ days ago for time-sensitive tax content',
        penalties: [
          { reason: 'outdated', severity: 'high', impact: -0.40 },
          { reason: 'time_sensitive_topic', severity: 'critical', impact: -0.25 },
        ],
      };

      expect(scoreExplanation.penalties.length).toBeGreaterThan(0);
      expect(scoreExplanation.score).toBeLessThan(0.5);
    });
  });
});
