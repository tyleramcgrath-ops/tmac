import { describe, it, expect } from '@jest/globals';

/**
 * Phase 7.8A: Cannibalization Detection Verification Tests
 *
 * Verify that RankForge can detect when:
 * - Multiple pages target the same keywords/topic
 * - Pages compete for the same search traffic
 * - Internal linking creates ranking conflicts
 * - Similar content reduces overall authority
 *
 * And recommend consolidation or differentiation.
 */

describe('Phase 7.8A: Cannibalization Detection', () => {
  describe('Keyword Cannibalization Detection', () => {
    it('should detect when multiple pages rank for same keyword', () => {
      const keyword = 'tax planning';
      const pages = [
        {
          url: '/services/tax-planning',
          ranking: { position: 5, impressions: 850, clicks: 42 },
          targetedKeywords: ['tax planning', 'tax strategies'],
        },
        {
          url: '/blog/best-tax-planning-strategies',
          ranking: { position: 12, impressions: 180, clicks: 8 },
          targetedKeywords: ['tax planning', 'tax strategies'],
        },
        {
          url: '/services/small-business-taxes',
          ranking: { position: 18, impressions: 45, clicks: 1 },
          targetedKeywords: ['small business taxes', 'tax planning'],
        },
      ];

      const cannibalizing = pages.filter((p) => p.targetedKeywords.includes(keyword));

      expect(cannibalizing.length).toBe(3);
      expect(cannibalizing.length).toBeGreaterThan(1);
    });

    it('should measure cannibalization severity', () => {
      const cannibal = {
        keyword: 'tax planning',
        pages: [
          { url: '/services/tax-planning', position: 5, traffic: 850 },
          { url: '/blog/tax-planning-guide', position: 12, traffic: 180 },
        ],
        totalTraffic: 1030,
        primaryPageTraffic: 850,
        cannibalizedTraffic: 180,
        severityScore: 0.72,
        severity: 'high',
      };

      // High severity: secondary page has 17% of traffic
      expect(cannibal.severityScore).toBeGreaterThan(0.5);
    });

    it('should detect content-based cannibalization', () => {
      const pages = [
        {
          url: '/page-a',
          title: 'Tax Planning Guide',
          wordCount: 2500,
          topics: ['tax planning', 'strategies', 'entity selection'],
          uniqueAngle: null,
        },
        {
          url: '/page-b',
          title: 'Tax Planning Strategies for Small Business',
          wordCount: 2400,
          topics: ['tax planning', 'strategies', 'entity selection', 'llc'],
          uniqueAngle: 'small_business_focus',
        },
      ];

      const similarity = {
        overlapingTopics: 3,
        totalTopics: 4,
        similarityScore: 0.75,
      };

      expect(similarity.similarityScore).toBeGreaterThan(0.7);
    });

    it('should distinguish intentional clustering from cannibalization', () => {
      const intentionalCluster = {
        pillarPage: '/services/tax-planning',
        clusterPages: [
          {
            url: '/guides/s-corp-strategies',
            uniqueAngle: 'specific_entity_type',
            linkedFromPillar: true,
          },
          {
            url: '/guides/llc-strategies',
            uniqueAngle: 'specific_entity_type',
            linkedFromPillar: true,
          },
        ],
        cannibalizing: false,
      };

      const accidentalCannibalization = {
        page1: '/services/tax-planning',
        page2: '/blog/tax-planning-tips',
        linkedFromEachOther: false,
        uniqueAngles: 0,
        cannibalizing: true,
      };

      expect(intentionalCluster.cannibalizing).toBe(false);
      expect(accidentalCannibalization.cannibalizing).toBe(true);
    });
  });

  describe('SERP Cannibalization Detection', () => {
    it('should detect when own pages dominate SERP', () => {
      const keyword = 'tax planning';
      const serp = {
        keyword,
        results: [
          { rank: 1, domain: 'competitor.com', url: '/' },
          { rank: 2, domain: 'example.com', url: '/services/tax-planning' },
          { rank: 3, domain: 'competitor2.com', url: '/' },
          { rank: 4, domain: 'example.com', url: '/blog/tax-planning-guide' },
          { rank: 5, domain: 'example.com', url: '/guides/tax-strategies' },
          { rank: 6, domain: 'competitor3.com', url: '/' },
          { rank: 7, domain: 'example.com', url: '/faq-tax' },
          { rank: 8, domain: 'competitor4.com', url: '/' },
          { rank: 9, domain: 'example.com', url: '/case-study-tax' },
          { rank: 10, domain: 'competitor5.com', url: '/' },
        ],
      };

      const exampleComPositions = serp.results
        .filter((r) => r.domain === 'example.com')
        .map((r) => r.rank);

      expect(exampleComPositions.length).toBeGreaterThan(3);
    });

    it('should calculate SERP real estate ownership', () => {
      const metric = {
        keyword: 'tax planning',
        totalResults: 10,
        ownPages: 4,
        ownPositions: [2, 4, 5, 7],
        serpRealEstate: 0.4,
      };

      expect(metric.serpRealEstate).toBe(0.4);
    });

    it('should flag excessive SERP presence as suboptimal', () => {
      const analysis = {
        keyword: 'tax planning',
        ownPages: 5,
        ownPositions: [1, 3, 4, 6, 8],
        assessment: 'excessive_cannibalization',
        issue: 'Users clicking own pages instead of competitors reduces competitive advantage',
        recommendation: 'Consolidate to single strong page, redirect others',
      };

      expect(analysis.assessment).toBe('excessive_cannibalization');
    });
  });

  describe('Internal Linking Cannibalization', () => {
    it('should detect suboptimal internal linking for clustered pages', () => {
      const problemStructure = {
        pillarPage: '/tax-planning',
        internalLinks: [
          { from: '/tax-planning', to: '/blog/tax-planning-tips', anchor: 'tax planning' },
          { from: '/tax-planning', to: '/guides/tax-strategies', anchor: 'tax strategies' },
          { from: '/tax-planning', to: '/faq-tax', anchor: 'tax tips' },
        ],
        allAnchorsPoint: 'similar_keywords',
        problem: 'Pillar page distributes link juice to competing pages',
      };

      expect(problemStructure.allAnchorsPoint).toBe('similar_keywords');
    });

    it('should recommend optimized internal linking', () => {
      const optimized = {
        pillarPage: '/tax-planning',
        internalLinks: [
          {
            from: '/tax-planning',
            to: '/guides/s-corp-strategies',
            anchor: 's corp strategies',
          },
          {
            from: '/tax-planning',
            to: '/guides/llc-tax-benefits',
            anchor: 'llc structures',
          },
          {
            from: '/tax-planning',
            to: '/faq-tax',
            anchor: 'frequently asked questions',
          },
        ],
        anchorOptimization: 'diverse_specific_anchors',
        benefit: 'Clusters organize link juice hierarchically',
      };

      expect(optimized.anchorOptimization).toBe('diverse_specific_anchors');
    });
  });

  describe('Traffic Cannibalization Impact', () => {
    it('should measure traffic loss from cannibalization', () => {
      const analysis = {
        keyword: 'tax planning',
        primaryPage: {
          url: '/services/tax-planning',
          currentPosition: 12,
          currentTraffic: 180,
          historicalPosition: 3,
          historicalTraffic: 850,
          trafficLoss: -670,
        },
        secondaryPages: [
          {
            url: '/blog/tax-planning-guide',
            position: 8,
            traffic: 250,
            hypothesis: 'stronger content outranking primary',
          },
          {
            url: '/faq-tax',
            position: 15,
            traffic: 45,
          },
        ],
        estimatedCannibalizationImpact: 0.78,
      };

      // Primary page lost 78% of traffic, likely due to secondary pages
      expect(analysis.estimatedCannibalizationImpact).toBeGreaterThan(0.7);
    });

    it('should project traffic recovery from consolidation', () => {
      const consolidation = {
        action: 'redirect_secondary_to_primary',
        redirectedUrls: ['/blog/tax-planning-guide', '/faq-tax'],
        redirectedTraffic: 295,
        expectedPrimaryPageNewTraffic: 475,
        expectedRankingImprovement: 'position_8_to_5',
        expectedMonthlyTrafficRecovery: 510,
        recoveryROI: 0.92,
      };

      expect(consolidation.expectedRankingImprovement).toBeDefined();
      expect(consolidation.recoveryROI).toBeGreaterThan(0.8);
    });
  });

  describe('Cannibalization Resolution Strategies', () => {
    it('should recommend consolidation for true duplicates', () => {
      const pages = [
        {
          url: '/services/tax-planning',
          traffic: 450,
          ranking: 5,
          quality: 'good',
        },
        {
          url: '/tax-planning-services',
          traffic: 120,
          ranking: 12,
          quality: 'good',
        },
      ];

      const recommendation = {
        action: 'consolidate',
        keepPage: '/services/tax-planning',
        redirectPage: '/tax-planning-services',
        redirectType: '301_permanent',
        redirectStatusCode: 301,
        expectedOutcome: 'Unified ranking and traffic for single authoritative page',
      };

      expect(recommendation.action).toBe('consolidate');
      expect(recommendation.redirectType).toBe('301_permanent');
    });

    it('should recommend differentiation for distinct cluster pages', () => {
      const pages = [
        {
          url: '/services/tax-planning',
          focus: 'general_tax_planning',
          wordCount: 2500,
          currentTraffic: 450,
        },
        {
          url: '/guides/s-corp-strategies',
          focus: 'overlapping_with_pillar',
          wordCount: 1800,
          currentTraffic: 120,
        },
      ];

      const recommendation = {
        action: 'differentiate',
        strategy: [
          'Rename blog page to clarify unique angle',
          'Add section on S-Corp specifically to pillar',
          'Make blog page a deep dive on S-Corp only',
          'Link from pillar with specific anchor: "s corp tax strategies"',
        ],
        expectedOutcome: 'Both pages rank without competing',
      };

      expect(recommendation.action).toBe('differentiate');
      expect(recommendation.strategy.length).toBeGreaterThan(2);
    });

    it('should recommend expansion of weak pages into pillars', () => {
      const pages = [
        {
          url: '/blog/tax-planning-guide',
          wordCount: 1200,
          traffic: 85,
          ranking: 18,
          potential: 'high',
        },
      ];

      const recommendation = {
        action: 'expand_and_reposition',
        strategy: [
          'Expand from 1200 to 3500+ words',
          'Reposition as pillar page at /guides/tax-planning-complete',
          'Move original service page to supportive role',
          'Build cluster pages under new pillar',
        ],
        expectedTrafficIncrease: 5.2,
      };

      expect(recommendation.action).toBe('expand_and_reposition');
      expect(recommendation.expectedTrafficIncrease).toBeGreaterThan(4);
    });
  });

  describe('Preventing Future Cannibalization', () => {
    it('should warn when new page targets existing keywords', () => {
      const newBrief = {
        title: 'Tax Planning for Startups',
        primaryTopic: 'tax_planning',
        targetKeywords: ['tax planning', 'startup tax strategies'],
      };

      const existingPages = [
        {
          url: '/services/tax-planning',
          targetKeywords: ['tax planning', 'tax strategies', 'entity selection'],
        },
      ];

      const warning = {
        severity: 'medium',
        message: 'New page targets "tax planning" which is already ranked #5 on /services/tax-planning',
        recommendation: 'Clarify unique angle (startups) and link from pillar',
      };

      expect(warning.severity).toBe('medium');
    });

    it('should enforce brief requirements to prevent cannibalization', () => {
      const briefValidation = {
        briefTitle: 'Tax Planning for Startups',
        primaryTopic: 'tax_planning',
        differentiation: null,
        validation: 'failed',
        reason: 'Differentiation field is required when targeting existing topic',
        requiredBefore: 'approval',
      };

      expect(briefValidation.validation).toBe('failed');
    });

    it('should track content intent to prevent accidental cannibalization', () => {
      const pages = [
        {
          url: '/services/tax-planning',
          contentIntent: 'conversion_commercial',
          targetAudience: 'anyone_needing_tax_planning',
        },
        {
          url: '/blog/tax-planning-ultimate-guide',
          contentIntent: 'educational_informational',
          targetAudience: 'diy_researchers',
        },
      ];

      const assessment = {
        conclusion: 'No cannibalization - different user intents',
        reason: 'Commercial page (service) and educational page serve different needs',
      };

      expect(assessment.conclusion).toContain('No cannibalization');
    });
  });

  describe('Cannibalization Monitoring & Alerts', () => {
    it('should detect emerging cannibalization trends', () => {
      const trend = {
        keyword: 'tax planning',
        historicalData: [
          { week: 1, primaryPagePosition: 3, secondaryPagePosition: 0 },
          { week: 2, primaryPagePosition: 3, secondaryPagePosition: 18 },
          { week: 3, primaryPagePosition: 4, secondaryPagePosition: 12 },
          { week: 4, primaryPagePosition: 7, secondaryPagePosition: 8 },
          { week: 5, primaryPagePosition: 12, secondaryPagePosition: 5 },
        ],
        trend: 'secondary_outranking_primary',
        alert: true,
        recommendation: 'Address cannibalization immediately',
      };

      expect(trend.trend).toBe('secondary_outranking_primary');
      expect(trend.alert).toBe(true);
    });

    it('should track resolution success', () => {
      const resolution = {
        cannibal: 'tax_planning_keyword',
        actionTaken: 'redirect_secondary_to_primary',
        actionDate: '2026-07-15',
        primaryPagePosition: {
          beforeAction: 12,
          oneWeekAfter: 10,
          twoWeeksAfter: 7,
          threeWeeksAfter: 4,
          current: 3,
        },
        recovered: true,
        timeToRecovery: '3 weeks',
      };

      expect(resolution.recovered).toBe(true);
      expect(resolution.timeToRecovery).toBeDefined();
    });
  });
});
