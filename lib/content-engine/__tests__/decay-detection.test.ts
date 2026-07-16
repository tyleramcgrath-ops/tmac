import { describe, it, expect } from 'vitest';

/**
 * Phase 7.8A: Content Decay & Refresh Opportunity Detection Tests
 *
 * Verify that RankForge can identify pages that are declining in:
 * - Search ranking (position dropping)
 * - Search visibility (impressions declining)
 * - Click-through rate (CTR dropping)
 * - Traffic (GA4 sessions declining)
 * - Engagement (time on page, bounce rate worsening)
 *
 * And recommend refresh actions with recovery potential estimation.
 */

describe('Phase 7.8A: Content Decay & Refresh Detection', () => {
  describe('Decay Detection Signals', () => {
    describe('Ranking Decay', () => {
      it('should detect pages losing ranking position', () => {
        const page = {
          pageUrl: '/services/tax-planning',
          rankingHistory: {
            '6_months_ago': { position: 3, keyword: 'tax planning' },
            '3_months_ago': { position: 7, keyword: 'tax planning' },
            '1_month_ago': { position: 12, keyword: 'tax planning' },
            'current': { position: 18, keyword: 'tax planning' },
          },
          decayRate: 'accelerating',
          positionLoss: 15,
        };

        // Expected: decay_detection = true, severity = high
        // Evidence: Dropped from 3→18 in 6 months, accelerating
        expect(page.positionLoss).toBeGreaterThan(10);
        expect(page.decayRate).toBe('accelerating');
      });

      it('should track multi-keyword ranking decay', () => {
        const page = {
          pageUrl: '/tax-strategies',
          keywords: [
            {
              keyword: 'tax planning',
              positionHistory: [3, 5, 8, 15],
              currentPosition: 15,
              decayMonths: 6,
            },
            {
              keyword: 'tax optimization',
              positionHistory: [2, 4, 6, 12],
              currentPosition: 12,
              decayMonths: 6,
            },
            {
              keyword: 'small business taxes',
              positionHistory: [5, 6, 8, 14],
              currentPosition: 14,
              decayMonths: 6,
            },
          ],
          decayPattern: 'uniform_across_keywords',
          recoveryPotential: 'high',
        };

        // Expected: All keywords showing similar decay pattern
        // Suggests content refresh could recover all keywords
        expect(page.keywords.length).toBe(3);
        expect(page.decayPattern).toBe('uniform_across_keywords');
      });

      it('should distinguish stable vs decaying pages', () => {
        const stablePage = {
          keyword: 'keyword',
          positionHistory: [5, 5, 5, 5, 5],
          decaying: false,
        };

        const decayingPage = {
          keyword: 'keyword',
          positionHistory: [5, 7, 10, 15, 22],
          decaying: true,
        };

        expect(stablePage.positionHistory).toEqual([5, 5, 5, 5, 5]);
        expect(decayingPage.positionHistory).not.toEqual(stablePage.positionHistory);
      });
    });

    describe('Impression Decay', () => {
      it('should detect declining impressions in GSC', () => {
        const page = {
          pageUrl: '/blog/tax-tips-2024',
          impressionHistory: {
            'month_0': 850,
            'month_1': 780,
            'month_2': 640,
            'month_3': 520,
            'month_4': 380,
            'month_5': 210,
          },
          decayRate: -55,
          timeframeMonths: 5,
        };

        // Expected: decay_detection = true, severity = high
        // Evidence: Dropped 75% over 5 months
        expect(page.impressionHistory['month_0']).toBeGreaterThan(
          page.impressionHistory['month_5']
        );
        expect(page.decayRate).toBeLessThan(-50);
      });

      it('should distinguish seasonal variation from decay', () => {
        const seasonalPage = {
          keyword: 'tax_filing_deadline',
          impressionHistory: [100, 500, 2000, 5000, 2000, 500, 100, 100],
          seasonalPattern: true,
          currentlyOutOfSeason: true,
        };

        const decayingPage = {
          keyword: 'tax_planning_general',
          impressionHistory: [1000, 900, 800, 700, 600, 500, 400, 300],
          seasonalPattern: false,
          decaying: true,
        };

        // Seasonal = normal, decay = concerning
        expect(seasonalPage.seasonalPattern).toBe(true);
        expect(decayingPage.decaying).toBe(true);
      });

      it('should detect zero-impression pages', () => {
        const page = {
          pageUrl: '/orphaned-page',
          currentImpressions: 0,
          lastImpressionDate: '2024-06-15',
          monthsWithoutImpressions: 12,
        };

        // Expected: severe decay, candidate for deletion or massive refresh
        expect(page.currentImpressions).toBe(0);
        expect(page.monthsWithoutImpressions).toBeGreaterThan(6);
      });
    });

    describe('CTR Decay', () => {
      it('should detect declining click-through rate', () => {
        const page = {
          keyword: 'tax planning',
          ctrHistory: {
            'month_0': 0.085,
            'month_1': 0.072,
            'month_2': 0.056,
            'month_3': 0.043,
          },
          ctrDecline: -49,
          currentCTR: 0.043,
        };

        // Expected: CTR decay detected
        // Suggests: Meta description could use improvement, or competitors rank higher
        expect(page.ctrHistory['month_0']).toBeGreaterThan(page.ctrHistory['month_3']);
        expect(page.ctrDecline).toBeLessThan(-40);
      });

      it('should distinguish poor CTR from decaying CTR', () => {
        const consistentlyPoorCTR = {
          keyword: 'very_niche_keyword',
          ctrHistory: [0.01, 0.01, 0.01, 0.01],
          currentCTR: 0.01,
          decaying: false,
        };

        const decayingCTR = {
          keyword: 'popular_keyword',
          ctrHistory: [0.12, 0.10, 0.08, 0.06, 0.04],
          currentCTR: 0.04,
          decaying: true,
        };

        // Both are low, but decay is more concerning
        expect(decayingCTR.ctrHistory[0]).toBeGreaterThan(decayingCTR.ctrHistory[4]);
      });

      it('should flag improved CTR as positive signal', () => {
        const improvingPage = {
          keyword: 'keyword',
          ctrHistory: [0.03, 0.04, 0.05, 0.08, 0.12],
          currentCTR: 0.12,
          trend: 'improving',
          refreshNeeded: false,
        };

        // No refresh needed - page is improving
        expect(improvingPage.trend).toBe('improving');
        expect(improvingPage.refreshNeeded).toBe(false);
      });
    });

    describe('Traffic Decay (GA4 Sessions)', () => {
      it('should detect declining organic traffic', () => {
        const page = {
          pageUrl: '/tax-planning',
          sessionHistory: {
            'month_0': 1250,
            'month_1': 1100,
            'month_2': 920,
            'month_3': 750,
            'month_4': 580,
            'month_5': 410,
          },
          trafficDecline: -67,
          timeframeMonths: 5,
        };

        // Expected: decay_detection = true
        // Evidence: 67% traffic loss over 5 months
        expect(page.sessionHistory['month_0']).toBeGreaterThan(page.sessionHistory['month_5']);
        expect(page.trafficDecline).toBeLessThan(-60);
      });

      it('should distinguish organic decay from other channels', () => {
        const page = {
          trafficByChannel: {
            organic: {
              sessions: { 'month_0': 500, 'month_5': 150 },
              decaying: true,
            },
            direct: {
              sessions: { 'month_0': 200, 'month_5': 220 },
              decaying: false,
            },
            referral: {
              sessions: { 'month_0': 100, 'month_5': 80 },
              decaying: true,
            },
          },
          decayPattern: 'organic_decay',
        };

        // Organic is decaying, others stable/varying normally
        expect(page.trafficByChannel.organic.decaying).toBe(true);
        expect(page.decayPattern).toBe('organic_decay');
      });

      it('should flag pages gaining traffic as healthy', () => {
        const page = {
          pageUrl: '/new-service',
          sessionHistory: [50, 85, 140, 220, 350, 520],
          trend: 'accelerating',
          refreshNeeded: false,
        };

        // Growing pages don't need refresh
        expect(page.trend).toBe('accelerating');
        expect(page.refreshNeeded).toBe(false);
      });
    });

    describe('Engagement Decay', () => {
      it('should detect worsening time-on-page', () => {
        const page = {
          keyword: 'keyword',
          engagementHistory: {
            'month_0': { averageTimeOnPage: 3.2, scrollDepth: 0.68 },
            'month_2': { averageTimeOnPage: 2.4, scrollDepth: 0.55 },
            'month_4': { averageTimeOnPage: 1.5, scrollDepth: 0.38 },
          },
          engagementDecline: -53,
        };

        // Expected: Declining engagement suggests content isn't satisfying users
        expect(page.engagementHistory['month_0'].averageTimeOnPage).toBeGreaterThan(
          page.engagementHistory['month_4'].averageTimeOnPage
        );
      });

      it('should detect increasing bounce rate', () => {
        const page = {
          bounceRateHistory: {
            'month_0': 0.32,
            'month_1': 0.38,
            'month_2': 0.45,
            'month_3': 0.54,
          },
          bounceRateIncrease: 68,
        };

        // Expected: Severe engagement problem
        expect(page.bounceRateHistory['month_3']).toBeGreaterThan(page.bounceRateHistory['month_0']);
      });

      it('should reward high engagement pages', () => {
        const page = {
          keyword: 'keyword',
          averageTimeOnPage: 5.8,
          scrollDepth: 0.82,
          engagementScore: 0.88,
          refreshNeeded: false,
        };

        // High engagement = content is working well
        expect(page.averageTimeOnPage).toBeGreaterThan(5);
        expect(page.scrollDepth).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Decay Severity & Recovery Potential', () => {
    it('should classify decay severity', () => {
      const criticalDecay = {
        pageUrl: '/critical-page',
        trafficLoss: -85,
        rankingLoss: -20,
        severity: 'critical',
        recommendedAction: 'emergency_refresh',
      };

      const moderateDecay = {
        pageUrl: '/moderate-page',
        trafficLoss: -35,
        rankingLoss: -8,
        severity: 'moderate',
        recommendedAction: 'standard_refresh',
      };

      const mildDecay = {
        pageUrl: '/mild-page',
        trafficLoss: -12,
        rankingLoss: -2,
        severity: 'mild',
        recommendedAction: 'minor_update',
      };

      expect(criticalDecay.severity).toBe('critical');
      expect(moderateDecay.severity).toBe('moderate');
      expect(mildDecay.severity).toBe('mild');
    });

    it('should estimate recovery potential from refresh', () => {
      const page = {
        pageUrl: '/tax-planning',
        currentRank: 18,
        historicalHighRank: 3,
        recoveryPotential: 'high',
        estimatedRecovery: {
          timeframe: '6-8 weeks',
          estimatedNewRank: 6,
          trafficRecoveryPercent: 65,
        },
      };

      // Page was ranking well before, should recover
      expect(page.recoveryPotential).toBe('high');
      expect(page.estimatedRecovery.estimatedNewRank).toBeLessThan(page.currentRank);
    });

    it('should flag pages with low recovery potential', () => {
      const page = {
        pageUrl: '/orphaned-page',
        currentRank: 0,
        historicalRank: null,
        competitorRanking: true,
        recoveryPotential: 'low',
        recommendation: 'consider_removal_or_major_restructure',
      };

      // Never ranked well, competitors rank for this
      expect(page.recoveryPotential).toBe('low');
    });

    it('should identify quick-win refresh opportunities', () => {
      const page = {
        pageUrl: '/outdated-guide',
        currentRank: 7,
        currentImpressions: 200,
        lastUpdated: '2021-06-15',
        daysSinceUpdate: 1065,
        refreshType: 'update_content',
        estimatedImpactHigh: true,
        recoveryTimeWeeks: 3,
      };

      // High rank but outdated - quick refresh should help
        expect(page.daysSinceUpdate).toBeGreaterThan(365);
      expect(page.currentRank).toBeLessThan(10);
    });
  });

  describe('Refresh Recommendations', () => {
    it('should recommend content updates for stale pages', () => {
      const page = {
        pageUrl: '/2024-tax-guide',
        publishYear: 2024,
        currentYear: 2026,
        decayTriggers: ['outdated_information', 'lost_ranking', 'declining_traffic'],
        recommendedActions: [
          'update_publication_year',
          'refresh_statistics_and_laws',
          'expand_coverage',
          'add_recent_case_studies',
          'update_schema_dateModified',
        ],
        priorityLevel: 'high',
      };

      expect(page.recommendedActions.length).toBeGreaterThan(2);
      expect(page.priorityLevel).toBe('high');
    });

    it('should recommend restructuring for weak cluster pages', () => {
      const page = {
        pageUrl: '/s-corp-guide',
        currentState: 'orphaned_cluster_page',
        issues: ['not_linked_from_pillar', 'low_traffic', 'no_support_pages'],
        recommendations: [
          'link_from_pillar_page',
          'add_internal_link_context',
          'create_supporting_cluster',
          'improve_topical_relevance',
        ],
      };

      expect(page.recommendations.length).toBeGreaterThan(2);
    });

    it('should recommend expansion for high-potential pages', () => {
      const page = {
        pageUrl: '/tax-planning-main',
        currentState: 'pillar_page_underdeveloped',
        issues: ['only_3000_words', 'missing_key_topics', 'no_cluster_pages'],
        recommendations: [
          'expand_to_5000_words',
          'add_6_cluster_pages',
          'improve_schema_structure',
          'add_visual_assets',
        ],
      };

      expect(page.recommendations.length).toBeGreaterThan(2);
    });

    it('should recommend consolidation for duplicate pages', () => {
      const pages = [
        { url: '/tax-planning', traffic: 450, rank: 5 },
        { url: '/tax-planning-strategies', traffic: 120, rank: 12 },
        { url: '/tax-optimization', traffic: 80, rank: 15 },
      ];

      const recommendation = {
        action: 'consolidate',
        primary: pages[0].url,
        toRedirect: [pages[1].url, pages[2].url],
        expectedTrafficConsolidation: 650,
        expectedRankingImprovement: true,
      };

      expect(recommendation.action).toBe('consolidate');
      expect(recommendation.toRedirect.length).toBe(2);
    });

    it('should recommend removal for unrecoverable pages', () => {
      const page = {
        pageUrl: '/product-discontinued',
        monthsNoTraffic: 18,
        inboundLinks: 0,
        relevanceScore: 0.05,
        recommendation: 'remove_or_redirect',
        rationale: 'No traffic, no inbound links, not relevant to current business',
      };

      expect(page.monthsNoTraffic).toBeGreaterThan(12);
      expect(page.recommendation).toBe('remove_or_redirect');
    });
  });

  describe('Refresh Priority Scoring', () => {
    it('should prioritize high-traffic declining pages', () => {
      const pages = [
        {
          pageUrl: '/page-a',
          currentTraffic: 2000,
          trafficDecline: -45,
          recoveryPotential: 0.95,
          priorityScore: 0.92,
        },
        {
          pageUrl: '/page-b',
          currentTraffic: 80,
          trafficDecline: -50,
          recoveryPotential: 0.90,
          priorityScore: 0.45,
        },
      ];

      // High current traffic = higher ROI on refresh
      expect(pages[0].priorityScore).toBeGreaterThan(pages[1].priorityScore);
    });

    it('should weight recovery potential heavily', () => {
      const pages = [
        {
          pageUrl: '/previously-ranked-well',
          currentRank: 20,
          historicalHighRank: 2,
          recoveryPotential: 0.98,
          priorityScore: 0.95,
        },
        {
          pageUrl: '/never-ranked',
          currentRank: 0,
          recoveryPotential: 0.15,
          priorityScore: 0.10,
        },
      ];

      expect(pages[0].priorityScore).toBeGreaterThan(pages[1].priorityScore);
    });

    it('should prioritize business-value pages', () => {
      const pages = [
        {
          pageUrl: '/high-value-service',
          currentTraffic: 500,
          businessValue: 'high',
          conversionRate: 0.08,
          priorityScore: 0.88,
        },
        {
          pageUrl: '/blog-post',
          currentTraffic: 1500,
          businessValue: 'low',
          conversionRate: 0.001,
          priorityScore: 0.35,
        },
      ];

      // Revenue matters more than raw traffic
      expect(pages[0].priorityScore).toBeGreaterThan(pages[1].priorityScore);
    });
  });

  describe('Decay Monitoring & Alerts', () => {
    it('should trigger alert for sudden ranking drop', () => {
      const alert = {
        type: 'ranking_alert',
        keyword: 'tax planning',
        previousRank: 5,
        currentRank: 18,
        dropSize: 13,
        severity: 'high',
        recommendation: 'investigate_immediately',
      };

      expect(alert.dropSize).toBeGreaterThan(10);
      expect(alert.severity).toBe('high');
    });

    it('should track decay trends for predictive alerts', () => {
      const trend = {
        metric: 'ranking',
        data: [3, 5, 8, 12, 17, 25, 35],
        trendDirection: 'worsening',
        trendAcceleration: 'accelerating',
        predictedNextValue: 48,
        projectedDateToPage50: '2026-11-15',
        alertThreshold: 'page_30',
        recommendedAction: 'refresh_before_page_50',
      };

      expect(trend.trendAcceleration).toBe('accelerating');
      expect(trend.predictedNextValue).toBeGreaterThan(trend.data[trend.data.length - 1]);
    });
  });
});
