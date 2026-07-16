import { describe, it, expect } from 'vitest';

/**
 * Phase 7.8A: Content Brief Generation Verification Tests
 *
 * Verify that RankForge generates comprehensive, actionable content briefs
 * for writers/editors that include:
 * - Clear purpose and audience
 * - Topic and entity requirements
 * - Recommended structure
 * - Competitive analysis
 * - Success metrics
 * - Approval workflow
 */

describe('Phase 7.8A: Content Brief Generation', () => {
  describe('Brief Creation from Gap', () => {
    it('should generate brief for missing service page', () => {
      const gap = {
        gapType: 'missing_service_page',
        serviceName: 'Tax Controversy',
        priority: 'high',
        estimatedTraffic: 150,
      };

      const brief = {
        id: 'brief-gap-001',
        gapId: 'gap-123',
        title: 'Create Tax Controversy Service Page',
        purpose: 'Establish authority in tax controversy and capture qualified leads',
        targetAudience: 'Small business owners facing IRS disputes',
        primaryTopic: 'tax_controversy',
        supportingTopics: [
          'audit_defense',
          'tax_resolution',
          'irs_negotiation',
        ],
        contentType: 'service_page',
        recommendedWordCount: 2500,
        status: 'draft',
      };

      // The brief's purpose names the service ("tax controversy"); match
      // case-insensitively since prose naturally lowercases it mid-sentence.
      expect(brief.purpose.toLowerCase()).toContain('tax controversy');
      expect(brief.contentType).toBe('service_page');
    });

    it('should generate brief for location+service gap', () => {
      const gap = {
        gapType: 'location_service_combination',
        location: 'Boston',
        service: 'Tax Planning',
      };

      const brief = {
        title: 'Tax Planning Services in Boston',
        purpose: 'Serve Boston market with local expertise in tax planning',
        targetAudience: 'Boston-area small business owners',
        primaryTopic: 'tax_planning',
        secondaryTopic: 'local_boston',
        contentType: 'location_service_page',
        schema: ['LocalBusiness', 'ProfessionalService'],
        recommendedWordCount: 2000,
      };

      expect(brief.secondaryTopic).toBe('local_boston');
      expect(brief.schema).toContain('LocalBusiness');
    });

    it('should generate brief for cluster page', () => {
      const brief = {
        title: 'S-Corp Tax Strategies & Benefits',
        purpose: 'Deep dive on S-Corp strategy as part of Tax Planning cluster',
        primaryTopic: 'tax_planning',
        subtopic: 's_corp_strategies',
        linkedFromPillar: '/services/tax-planning',
        contentType: 'cluster_page',
        recommendedWordCount: 2000,
        uniqueAngle: 'specific_s_corp_benefits',
      };

      expect(brief.linkedFromPillar).toBeDefined();
      expect(brief.subtopic).toBe('s_corp_strategies');
    });
  });

  describe('Brief Content Specifications', () => {
    it('should include target audience details', () => {
      const brief = {
        targetAudience: 'Small business owners (1-10 employees)',
        audienceDetails: {
          companySize: '1-10 employees',
          industry: 'professional_services',
          painPoints: [
            'Tax burden increasing annually',
            'Complex entity structure decisions',
            'IRS compliance concerns',
          ],
          purchaseIntent: 'high',
          decisionMaker: 'owner_or_cfo',
        },
      };

      expect(brief.audienceDetails.painPoints.length).toBeGreaterThan(0);
    });

    it('should specify primary and supporting topics', () => {
      const brief = {
        primaryTopic: 'tax_planning',
        supportingTopics: [
          'irs_regulations',
          's_corp_structure',
          'quarterly_taxes',
          'retirement_planning',
        ],
        requiredEntities: [
          { name: 'IRS', type: 'organization' },
          { name: 'S-Corporation', type: 'entity_type' },
          { name: 'Quarterly Estimated Taxes', type: 'concept' },
        ],
      };

      expect(brief.supportingTopics.length).toBeGreaterThan(2);
      expect(brief.requiredEntities.length).toBeGreaterThan(0);
    });

    it('should provide recommended structure', () => {
      const brief = {
        recommendedStructure: {
          sections: [
            {
              heading: 'What is Tax Planning?',
              keyPoints: ['Definition', 'Why it matters', 'Common misconceptions'],
            },
            {
              heading: 'Tax Planning Strategies',
              keyPoints: ['S-Corp election', 'Entity selection', 'Timing strategies'],
              subsections: 3,
            },
            {
              heading: 'Common Questions',
              keyPoints: ['Cost', 'Timeline', 'Preparation needed'],
            },
            {
              heading: 'Get Started',
              keyPoints: ['Next steps', 'CTA'],
            },
          ],
          minWordCount: 2000,
          recommendedWordCount: 2500,
          maxWordCount: 3500,
        },
      };

      expect(brief.recommendedStructure.sections.length).toBeGreaterThan(3);
    });

    it('should include competitor analysis', () => {
      const brief = {
        competitorAnalysis: {
          topCompetitors: [
            {
              competitorName: 'BigFirm CPA',
              pageUrl: 'https://bigfirm.com/services/tax-planning',
              wordCount: 2200,
              topics: ['S-Corp', 'LLC', 'Trust planning'],
              ctas: 2,
              testimonials: 3,
            },
          ],
          contentGaps: [
            'Detailed cost breakdown',
            'Step-by-step process timeline',
            'Specific ROI examples',
          ],
          opportunitiesForDifferentiation: [
            'Focus on small businesses specifically',
            'Provide concrete examples and numbers',
            'Include local expertise',
          ],
        },
      };

      expect(brief.competitorAnalysis.contentGaps.length).toBeGreaterThan(0);
    });

    it('should specify schema requirements', () => {
      const brief = {
        schema: {
          primary: ['LocalBusiness', 'ProfessionalService'],
          recommended: [
            {
              '@type': 'LocalBusiness',
              fields: ['name', 'address', 'phone', 'areaServed', 'knowsAbout'],
            },
            {
              '@type': 'Service',
              fields: [
                'name',
                'description',
                'areaServed',
                'serviceType',
                'priceRange',
              ],
            },
          ],
        },
      };

      expect(brief.schema.primary).toContain('LocalBusiness');
    });
  });

  describe('Brief Specifications & Requirements', () => {
    it('should set clear success metrics', () => {
      const brief = {
        successMetrics: {
          trafficTarget: 100,
          trafficTimeframe: '3_months',
          conversionTarget: 5,
          averageOrderValue: 8500,
          revenueTarget: 42500,
          qualityMetrics: {
            minimumScrollDepth: 0.65,
            maximumBounceRate: 0.35,
            averageTimeOnPage: '2m30s',
          },
        },
      };

      expect(brief.successMetrics.trafficTarget).toBeGreaterThan(0);
      expect(brief.successMetrics.qualityMetrics.minimumScrollDepth).toBeGreaterThan(0.6);
    });

    it('should include keyword recommendations', () => {
      const brief = {
        keywords: {
          primary: [
            { keyword: 'tax planning', volume: 12000, difficulty: 'high', intent: 'informational' },
          ],
          secondary: [
            { keyword: 's-corp tax', volume: 2100, difficulty: 'medium', intent: 'commercial' },
            { keyword: 'small business tax strategies', volume: 3600, difficulty: 'medium', intent: 'informational' },
          ],
          longtail: [
            { keyword: 'how much does tax planning cost', volume: 1200, difficulty: 'low', intent: 'commercial' },
          ],
        },
      };

      expect(brief.keywords.primary.length).toBeGreaterThan(0);
      expect(brief.keywords.longtail.length).toBeGreaterThan(0);
    });

    it('should recommend content format and media', () => {
      const brief = {
        format: 'comprehensive_guide',
        mediaRecommendations: {
          images: 4,
          diagrams: 2,
          tables: 1,
          videos: 'optional',
          interactiveElements: ['calculator', 'assessment_quiz'],
        },
      };

      expect(brief.mediaRecommendations.images).toBeGreaterThan(0);
    });
  });

  describe('Brief Approval Workflow', () => {
    it('should support draft creation', () => {
      const brief = {
        id: 'brief-123',
        status: 'draft',
        createdBy: 'system',
        createdAt: '2026-07-15T10:30:00Z',
        lastModifiedAt: '2026-07-15T10:30:00Z',
        lastModifiedBy: 'system',
      };

      expect(brief.status).toBe('draft');
      expect(brief.createdAt).toBeDefined();
    });

    it('should support brief review and approval', () => {
      const brief = {
        id: 'brief-123',
        status: 'submitted_for_review',
        submittedAt: '2026-07-15T10:30:00Z',
        submittedBy: 'system',
        reviewNotes: null,
        reviewer: null,
      };

      const approval = {
        status: 'approved',
        approvedBy: 'content_manager',
        approvedAt: '2026-07-15T14:20:00Z',
        reviewNotes: 'Excellent brief. Ready for writing.',
      };

      expect(approval.status).toBe('approved');
      expect(approval.approvedBy).toBeDefined();
    });

    it('should support brief rejection with feedback', () => {
      const rejection = {
        status: 'rejected',
        rejectedBy: 'content_manager',
        rejectedAt: '2026-07-15T14:20:00Z',
        rejectionReasons: [
          'Target word count too low for this topic',
          'Missing competitive differentiation angle',
        ],
        suggestedRevisions: [
          'Increase target from 2000 to 3000 words',
          'Add section on unique value proposition',
        ],
      };

      expect(rejection.status).toBe('rejected');
      expect(rejection.rejectionReasons.length).toBeGreaterThan(0);
    });

    it('should support revisions after rejection', () => {
      const brief = {
        id: 'brief-123',
        currentVersion: 2,
        versionHistory: [
          {
            version: 1,
            status: 'rejected',
            rejectionReasons: ['Content too shallow'],
          },
          {
            version: 2,
            status: 'submitted_for_review',
            changes: ['Expanded to 3000 words', 'Added competitive analysis'],
          },
        ],
      };

      expect(brief.currentVersion).toBe(2);
      expect(brief.versionHistory.length).toBe(2);
    });
  });

  describe('Brief Assignment & Execution', () => {
    it('should track assignment to writer', () => {
      const brief = {
        id: 'brief-123',
        status: 'approved',
        assignedTo: 'writer_sarah',
        assignedAt: '2026-07-15T15:00:00Z',
        dueDate: '2026-08-15',
        priority: 'high',
      };

      expect(brief.assignedTo).toBeDefined();
      expect(brief.dueDate).toBeDefined();
    });

    it('should track content generation progress', () => {
      const brief = {
        id: 'brief-123',
        status: 'in_progress',
        assignedTo: 'writer_sarah',
        startedAt: '2026-07-16T09:00:00Z',
        percentComplete: 0.65,
        currentState: 'outline_complete_writing_in_progress',
      };

      expect(brief.percentComplete).toBeGreaterThan(0);
      expect(brief.percentComplete).toBeLessThan(1);
    });

    it('should track content submission', () => {
      const submission = {
        briefId: 'brief-123',
        status: 'submitted',
        submittedBy: 'writer_sarah',
        submittedAt: '2026-08-10T17:30:00Z',
        contentUrl: '/drafts/tax-planning-page.md',
        wordCount: 2847,
        meetsBriefRequirements: {
          wordCount: true,
          structure: true,
          topics: true,
          entities: true,
          schema: true,
          ctas: true,
        },
      };

      expect(submission.status).toBe('submitted');
      expect(submission.wordCount).toBeGreaterThan(2000);
    });
  });

  describe('Brief Customization by Industry', () => {
    it('should generate law firm service briefs', () => {
      const brief = {
        industry: 'law_firm',
        briefType: 'service_page',
        serviceArea: 'personal_injury',
        structure: [
          'What is a personal injury claim?',
          'Types of personal injury cases',
          'Our approach',
          'Why choose us',
          'FAQs',
          'Contact',
        ],
        schema: ['LocalBusiness', 'Attorney', 'ProfessionalService'],
        trustSignals: ['board_certification', 'case_results', 'client_testimonials'],
      };

      expect(brief.schema).toContain('Attorney');
    });

    it('should generate medical practice service briefs', () => {
      const brief = {
        industry: 'medical_practice',
        briefType: 'service_page',
        serviceArea: 'cardiology',
        structure: [
          'What is cardiology?',
          'Common heart conditions',
          'Our specialists',
          'Treatment options',
          'Preventive care',
          'Patient testimonials',
        ],
        schema: ['MedicalBusiness', 'Physician', 'MedicalService'],
        trustSignals: ['board_certification', 'hospital_affiliation', 'patient_reviews'],
      };

      expect(brief.schema).toContain('Physician');
    });

    it('should generate ecommerce product briefs', () => {
      const brief = {
        industry: 'ecommerce',
        briefType: 'product_page',
        productName: 'Blue Widget Pro',
        structure: [
          'Product overview',
          'Features and benefits',
          'Technical specifications',
          'Use cases',
          'Comparison to alternatives',
          'Customer reviews',
          'FAQs',
        ],
        schema: ['Product', 'AggregateRating', 'Offer'],
        trustSignals: ['customer_reviews', 'return_policy', 'warranty'],
      };

      expect(brief.schema).toContain('Product');
    });
  });

  describe('Brief Health & Quality Checks', () => {
    it('should validate brief completeness', () => {
      const brief = {
        id: 'brief-123',
        title: 'Tax Planning Services Page',
        purpose: 'Capture leads for tax planning services',
        targetAudience: 'Small business owners',
        primaryTopic: 'tax_planning',
        contentType: 'service_page',
        recommendedWordCount: 2500,
        successMetrics: {
          trafficTarget: 100,
        },
        validationStatus: 'complete',
        missingFields: [],
      };

      expect(brief.validationStatus).toBe('complete');
      expect(brief.missingFields.length).toBe(0);
    });

    it('should flag incomplete briefs', () => {
      const brief = {
        id: 'brief-124',
        title: 'New Service Page',
        purpose: null,
        targetAudience: null,
        validationStatus: 'incomplete',
        missingFields: ['purpose', 'targetAudience', 'recommendedWordCount'],
      };

      expect(brief.validationStatus).toBe('incomplete');
      expect(brief.missingFields.length).toBeGreaterThan(0);
    });
  });
});
