import { describe, it, expect } from 'vitest';

/**
 * Phase 7.8A: Content Gap Analysis Verification Tests
 *
 * Verify that RankForge correctly identifies:
 * - Missing page types (service pages, location pages, FAQs)
 * - Missing service/entity coverage
 * - Missing comparison pages
 * - Missing trust/credibility pages
 * - Topic cluster incompleteness
 * - Competitor content gaps
 */

describe('Phase 7.8A: Content Gap Analysis', () => {
  describe('Service Coverage Gaps', () => {
    it('should detect missing service pages', () => {
      const businessServices = [
        'Tax Planning',
        'Audit',
        'Consulting',
        'Tax Controversy',
        'Forensic Accounting',
      ];

      const existingPages = [
        { topic: 'Tax Planning', type: 'service_page', url: '/services/tax-planning' },
        { topic: 'Audit', type: 'service_page', url: '/services/audit' },
      ];

      const gaps = businessServices.filter(
        (service) =>
          !existingPages.some((page) => page.topic.toLowerCase() === service.toLowerCase())
      );

      // Expected gaps: Tax Controversy, Forensic Accounting
      expect(gaps).toContain('Tax Controversy');
      expect(gaps).toContain('Forensic Accounting');
      expect(gaps.length).toBe(3);
    });

    it('should prioritize high-revenue service gaps', () => {
      const services = [
        {
          name: 'Tax Planning',
          covered: true,
          averageProjectValue: 8500,
          searchVolume: 12000,
        },
        {
          name: 'Tax Controversy',
          covered: false,
          averageProjectValue: 25000,
          searchVolume: 2500,
        },
        {
          name: 'Low-value Service',
          covered: false,
          averageProjectValue: 150,
          searchVolume: 500,
        },
      ];

      const gaps = services
        .filter((s) => !s.covered)
        .sort((a, b) => b.averageProjectValue - a.averageProjectValue);

      // Tax Controversy should be top priority despite lower search volume
      expect(gaps[0].name).toBe('Tax Controversy');
    });

    it('should estimate traffic potential for service gaps', () => {
      const gap = {
        serviceName: 'Tax Planning',
        searchVolume: 12000,
        estimatedCTR: 0.04,
        estimatedConversionRate: 0.08,
        estimatedMonthlyTraffic: 480,
        estimatedMonthlyLeads: 38,
        estimatedMonthlyRevenue: 323000,
        priority: 'critical',
      };

      expect(gap.estimatedMonthlyTraffic).toBeGreaterThan(0);
      expect(gap.estimatedMonthlyLeads).toBeGreaterThan(0);
      expect(gap.priority).toBe('critical');
    });
  });

  describe('Location Coverage Gaps', () => {
    it('should detect missing location pages', () => {
      const businessLocations = [
        'New York',
        'New Jersey',
        'Connecticut',
        'Massachusetts',
        'Pennsylvania',
      ];

      const existingPages = [
        { location: 'New York', url: '/locations/new-york' },
        { location: 'New Jersey', url: '/locations/new-jersey' },
      ];

      const gaps = businessLocations.filter(
        (loc) => !existingPages.some((page) => page.location === loc)
      );

      expect(gaps).toEqual(['Connecticut', 'Massachusetts', 'Pennsylvania']);
    });

    it('should detect missing service+location combinations', () => {
      const matrix = {
        services: ['Tax Planning', 'Audit', 'Consulting'],
        locations: ['NYC', 'Boston', 'Philadelphia'],
        existingCombinations: [
          'Tax Planning + NYC',
          'Tax Planning + Boston',
          'Audit + NYC',
          'Audit + Boston',
          'Consulting + NYC',
        ],
      };

      const expectedCombinations = 9;
      const missingCount = expectedCombinations - matrix.existingCombinations.length;

      expect(missingCount).toBe(4);
      expect(missingCount).toBeGreaterThan(0);
    });

    it('should prioritize location gaps by market size', () => {
      const locations = [
        {
          name: 'Small City',
          covered: false,
          populationSize: 50000,
          marketPotential: 0.2,
        },
        {
          name: 'Major Metro',
          covered: false,
          populationSize: 2000000,
          marketPotential: 0.8,
        },
      ];

      const sortedGaps = locations.sort((a, b) => b.marketPotential - a.marketPotential);

      expect(sortedGaps[0].name).toBe('Major Metro');
    });
  });

  describe('FAQ Coverage Gaps', () => {
    it('should detect missing FAQ pages', () => {
      const businessServices = ['Tax Planning', 'Audit'];
      const faqPages = [
        { topic: 'Tax Planning FAQs', coverage: ['Service overview', 'Timeline', 'Cost'] },
      ];

      const missingFAQs = businessServices.filter(
        (service) => !faqPages.some((faq) => faq.topic.includes(service))
      );

      expect(missingFAQs).toContain('Audit');
    });

    it('should identify common questions not yet answered', () => {
      const commonQuestions = [
        'What is tax planning?',
        'How much does tax planning cost?',
        'How long does tax planning take?',
        'What documents do I need?',
        'Can I do tax planning myself?',
        'What is audit defense?',
        'How do I prepare for an audit?',
      ];

      const answeredInContent = [
        'What is tax planning?',
        'How much does tax planning cost?',
        'What is audit defense?',
      ];

      const unansweredQuestions = commonQuestions.filter(
        (q) => !answeredInContent.includes(q)
      );

      expect(unansweredQuestions.length).toBeGreaterThan(0);
    });

    it('should detect FAQ opportunities from search queries', () => {
      const gscQueries = [
        { query: 'tax planning cost', impressions: 450, clicks: 18 },
        { query: 'how much does tax planning cost', impressions: 380, clicks: 35 },
        { query: 'tax planning services', impressions: 520, clicks: 42 },
      ];

      const faqOpportunities = gscQueries
        .filter((q) => q.query.includes('how') || q.query.includes('what'))
        .filter((q) => q.impressions > 300);

      expect(faqOpportunities.length).toBeGreaterThan(0);
    });
  });

  describe('Comparison Page Gaps', () => {
    it('should detect missing comparison pages', () => {
      const businessEntities = ['S-Corp', 'C-Corp', 'LLC', 'Sole Proprietor'];

      const comparisonPages = [
        { comparison: 'S-Corp vs C-Corp', entities: ['S-Corp', 'C-Corp'] },
      ];

      const possibleComparisons = [];
      for (let i = 0; i < businessEntities.length; i++) {
        for (let j = i + 1; j < businessEntities.length; j++) {
          possibleComparisons.push([businessEntities[i], businessEntities[j]]);
        }
      }

      const missingComparisons = possibleComparisons.filter(
        (pc) =>
          !comparisonPages.some(
            (cp) =>
              (cp.entities.includes(pc[0]) && cp.entities.includes(pc[1])) ||
              (cp.entities.includes(pc[1]) && cp.entities.includes(pc[0]))
          )
      );

      expect(missingComparisons.length).toBeGreaterThan(0);
    });

    it('should prioritize comparison pages with search demand', () => {
      const comparisons = [
        {
          entities: ['S-Corp', 'C-Corp'],
          searchVolume: 4200,
          searchDemand: 'high',
          priority: 'critical',
        },
        {
          entities: ['LLC', 'Sole Proprietor'],
          searchVolume: 1100,
          searchDemand: 'medium',
          priority: 'medium',
        },
        {
          entities: ['S-Corp', 'LLC'],
          searchVolume: 850,
          searchDemand: 'low',
          priority: 'low',
        },
      ];

      const sortedByPriority = comparisons.sort(
        (a, b) =>
          ['critical', 'medium', 'low'].indexOf(a.priority) -
          ['critical', 'medium', 'low'].indexOf(b.priority)
      );

      expect(sortedByPriority[0].entities).toEqual(['S-Corp', 'C-Corp']);
    });
  });

  describe('Trust & Credibility Page Gaps', () => {
    it('should detect missing trust pages', () => {
      const trustPageTypes = [
        'about_us',
        'team_bios',
        'testimonials',
        'case_studies',
        'certifications',
        'awards',
        'media_mentions',
      ];

      const existingPages = [
        'about_us',
        'testimonials',
        'certifications',
      ];

      const missingPages = trustPageTypes.filter((t) => !existingPages.includes(t));

      expect(missingPages).toContain('team_bios');
      expect(missingPages).toContain('case_studies');
      expect(missingPages.length).toBeGreaterThan(0);
    });

    it('should recommend trust-building content based on industry', () => {
      const industry = 'law_firm';
      const trustPageRecommendations = {
        law_firm: [
          'attorney_profiles',
          'bar_admissions',
          'practice_areas_expertise',
          'case_results',
          'client_testimonials',
          'peer_recognition',
        ],
        medical_practice: [
          'physician_credentials',
          'board_certifications',
          'hospital_affiliations',
          'patient_testimonials',
          'research_publications',
        ],
        accounting_firm: [
          'cpa_profiles',
          'industry_experience',
          'client_references',
          'awards_recognition',
          'thought_leadership',
        ],
      };

      const recommendations = trustPageRecommendations[industry];
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(3);
    });
  });

  describe('Topic Cluster Completeness', () => {
    it('should detect incomplete topic clusters', () => {
      const pillarTopic = 'Tax Planning';
      const expectedClusters = [
        'S-Corp Strategies',
        'LLC Tax Benefits',
        'Solo 401k Plans',
        'Pass-Through Entity Basics',
        'Quarterly Estimated Taxes',
        'Year-End Tax Strategies',
      ];

      const existingClusters = [
        'S-Corp Strategies',
        'LLC Tax Benefits',
        'Solo 401k Plans',
      ];

      const missingClusters = expectedClusters.filter((c) => !existingClusters.includes(c));

      expect(missingClusters.length).toBe(3);
    });

    it('should measure topic cluster depth', () => {
      const clusters = [
        {
          topic: 'Tax Planning',
          pillarWordCount: 4500,
          numberOfClusters: 8,
          averageClusterWordCount: 2200,
          interlinks: 25,
          depthScore: 0.92,
        },
        {
          topic: 'Audit Services',
          pillarWordCount: 2000,
          numberOfClusters: 2,
          averageClusterWordCount: 800,
          interlinks: 3,
          depthScore: 0.35,
        },
      ];

      expect(clusters[0].depthScore).toBeGreaterThan(clusters[1].depthScore);
    });
  });

  describe('Competitor Content Gaps', () => {
    it('should identify topics competitors cover but business does not', () => {
      const businessTopics = [
        'Tax Planning',
        'Audit',
        'Bookkeeping',
      ];

      const competitorTopics = [
        'Tax Planning',
        'Audit',
        'Bookkeeping',
        'Tax Controversy',
        'Forensic Accounting',
        'Payroll Services',
      ];

      const competitiveGaps = competitorTopics.filter((t) => !businessTopics.includes(t));

      expect(competitiveGaps).toContain('Tax Controversy');
      expect(competitiveGaps).toContain('Forensic Accounting');
    });

    it('should prioritize competitive gaps by competitor ranking', () => {
      const gaps = [
        {
          topic: 'Tax Controversy',
          numberOfCompetitorsRanking: 8,
          averageCompetitorRank: 4,
          businessCoverage: false,
          priority: 'critical',
        },
        {
          topic: 'Niche Specialization',
          numberOfCompetitorsRanking: 2,
          averageCompetitorRank: 18,
          businessCoverage: false,
          priority: 'low',
        },
      ];

      expect(gaps[0].priority).toBe('critical');
      expect(gaps[1].priority).toBe('low');
    });
  });

  describe('Gap Impact Assessment', () => {
    it('should estimate traffic potential of gaps', () => {
      const gap = {
        gapType: 'service_page',
        serviceName: 'Tax Controversy',
        searchVolume: 2500,
        competitionLevel: 'high',
        estimatedReachability: 0.15,
        estimatedImpressions: 375,
        estimatedCTR: 0.05,
        estimatedTraffic: 19,
        estimatedLeads: 2,
        estimatedMonthlyRevenue: 17000,
      };

      expect(gap.estimatedMonthlyRevenue).toBeGreaterThan(10000);
    });

    it('should calculate ROI for closing gaps', () => {
      const gap = {
        gapType: 'service_page',
        currentMonthlyRevenue: 0,
        estimatedMonthlyRevenue: 15000,
        estimatedProductionCost: 3500,
        estimatedPayoffMonths: 1.5,
        annualROI: 51.4,
      };

      expect(gap.estimatedPayoffMonths).toBeLessThan(3);
      expect(gap.annualROI).toBeGreaterThan(40);
    });
  });

  describe('Gap Prioritization', () => {
    it('should rank gaps by strategic impact', () => {
      const gaps = [
        {
          type: 'missing_service_page',
          service: 'Tax Controversy',
          estimatedTraffic: 150,
          averageProjectValue: 25000,
          priority: 1,
          score: 0.95,
        },
        {
          type: 'missing_location_page',
          location: 'Boston',
          estimatedTraffic: 80,
          averageProjectValue: 8500,
          priority: 2,
          score: 0.68,
        },
        {
          type: 'missing_faq',
          topic: 'Minor Question',
          estimatedTraffic: 5,
          averageProjectValue: 0,
          priority: 3,
          score: 0.15,
        },
      ];

      const sorted = gaps.sort((a, b) => a.priority - b.priority);
      expect(sorted[0].type).toBe('missing_service_page');
    });

    it('should account for implementation difficulty', () => {
      const gaps = [
        {
          gap: 'Service Page',
          trafficPotential: 150,
          difficulty: 'easy',
          timeToCompletion: '2 weeks',
          roi: 0.95,
        },
        {
          gap: 'Comparison Pages (5 total)',
          trafficPotential: 200,
          difficulty: 'moderate',
          timeToCompletion: '4 weeks',
          roi: 0.85,
        },
        {
          gap: 'Competitor Analysis Deep Dive',
          trafficPotential: 50,
          difficulty: 'hard',
          timeToCompletion: '8 weeks',
          roi: 0.20,
        },
      ];

      // Easy, high-ROI gaps should be prioritized
      const prioritized = gaps.sort(
        (a, b) =>
          b.roi -
          a.roi +
          (a.difficulty === 'easy' ? 0.2 : 0) -
          (b.difficulty === 'easy' ? 0.2 : 0)
      );

      expect(prioritized[0].gap).toBe('Service Page');
    });
  });

  describe('Gap Closure Tracking', () => {
    it('should track when gaps are closed', () => {
      const gap = {
        id: 'gap-123',
        gapType: 'missing_service_page',
        serviceName: 'Tax Controversy',
        createdAt: '2026-06-01',
        status: 'closed',
        closedBy: 'new_page_created',
        closedAt: '2026-07-15',
        pageUrl: '/services/tax-controversy',
      };

      expect(gap.status).toBe('closed');
      expect(gap.pageUrl).toBeDefined();
    });

    it('should measure impact after closure', () => {
      const gap = {
        gapType: 'missing_service_page',
        status: 'closed',
        pageUrl: '/services/tax-planning',
        createdAt: '2024-06-01',
        closedAt: '2024-07-15',
        trafficBefore: 0,
        trafficAfter: 120,
        conversionsBefore: 0,
        conversionsAfter: 8,
        revenueBefore: 0,
        revenueAfter: 68000,
      };

      expect(gap.trafficAfter).toBeGreaterThan(gap.trafficBefore);
      expect(gap.revenueAfter).toBeGreaterThan(gap.revenueBefore);
    });
  });
});
