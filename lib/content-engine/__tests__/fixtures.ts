/**
 * Phase 7.8A: Test Fixtures for Real-World Verification
 *
 * Comprehensive test data simulating real websites across multiple industries:
 * - Law firm (professional services with trust-critical content)
 * - Local service business (geographically focused)
 * - SaaS (product-focused with comparison pages)
 * - Ecommerce (product catalog)
 * - Marketing agency (expertise showcase)
 * - Content-heavy site (500+ pages)
 */

export const lawFirmFixture = {
  industry: 'law_firm',
  businessProfile: {
    businessName: 'Smith & Associates, LLC',
    industry: 'law_firm',
    primaryServices: [
      'Personal Injury',
      'Medical Malpractice',
      'Product Liability',
      'Wrongful Death',
    ],
    primaryLocations: ['New York', 'New Jersey'],
    conversationGoal: 'qualified_legal_consultation',
  },
  inventory: [
    {
      pageUrl: 'https://example.com/',
      contentType: 'homepage',
      wordCount: 1200,
      ga4Sessions: 4500,
      gscImpressions: 12000,
      primaryTopic: 'personal_injury_law',
    },
    {
      pageUrl: 'https://example.com/about',
      contentType: 'trust_page',
      wordCount: 1500,
      ga4Sessions: 800,
      gscImpressions: 2000,
      primaryTopic: 'about_firm',
    },
    {
      pageUrl: 'https://example.com/services/personal-injury',
      contentType: 'service_page',
      wordCount: 3200,
      ga4Sessions: 1250,
      gscImpressions: 8500,
      primaryTopic: 'personal_injury',
      expectedRank: 5,
      expectedConversions: 12,
    },
    {
      pageUrl: 'https://example.com/services/medical-malpractice',
      contentType: 'service_page',
      wordCount: 2800,
      ga4Sessions: 420,
      gscImpressions: 3200,
      primaryTopic: 'medical_malpractice',
      expectedRank: 8,
      expectedConversions: 4,
    },
    {
      pageUrl: 'https://example.com/services/wrongful-death',
      contentType: 'service_page',
      wordCount: 2500,
      ga4Sessions: 180,
      gscImpressions: 1800,
      primaryTopic: 'wrongful_death',
      gap: true, // Weak presence in market
    },
    {
      pageUrl: 'https://example.com/blog/how-to-file-personal-injury-claim',
      contentType: 'blog_post',
      wordCount: 2200,
      ga4Sessions: 650,
      gscImpressions: 5200,
      primaryTopic: 'personal_injury',
    },
    {
      pageUrl: 'https://example.com/testimonials',
      contentType: 'trust_page',
      wordCount: 1800,
      ga4Sessions: 340,
      gscImpressions: 900,
      primaryTopic: 'testimonials',
      testimonialCount: 15,
    },
    {
      pageUrl: 'https://example.com/attorney-bios',
      contentType: 'trust_page',
      wordCount: 2100,
      ga4Sessions: 220,
      gscImpressions: 1100,
      primaryTopic: 'attorney_profiles',
      attorneyCount: 5,
    },
  ],
  gaps: [
    {
      gapType: 'missing_service_page',
      serviceName: 'Product Liability',
      priority: 'high',
      estimatedTraffic: 200,
    },
  ],
};

export const localServiceFixture = {
  industry: 'local_service',
  businessProfile: {
    businessName: 'Premium Plumbing Co.',
    industry: 'plumbing',
    primaryServices: ['Emergency Repair', 'Installation', 'Maintenance'],
    primaryLocations: ['Boston', 'Cambridge', 'Brookline', 'Newton'],
    conversationGoal: 'appointment_booking',
  },
  inventory: [
    {
      pageUrl: 'https://example.com/',
      contentType: 'homepage',
      wordCount: 800,
      ga4Sessions: 2200,
      gscImpressions: 6500,
      schema: ['LocalBusiness'],
    },
    {
      pageUrl: 'https://example.com/locations/boston',
      contentType: 'location_page',
      wordCount: 1200,
      ga4Sessions: 850,
      gscImpressions: 3200,
      location: 'Boston',
      expectedRank: 3,
    },
    {
      pageUrl: 'https://example.com/locations/cambridge',
      contentType: 'location_page',
      wordCount: 1100,
      ga4Sessions: 420,
      gscImpressions: 1800,
      location: 'Cambridge',
      expectedRank: 6,
    },
    {
      pageUrl: 'https://example.com/locations/brookline',
      contentType: 'location_page',
      wordCount: 950,
      ga4Sessions: 220,
      gscImpressions: 800,
      location: 'Brookline',
      expectedRank: 12,
      gap: true,
    },
    {
      pageUrl: 'https://example.com/services/emergency-repair',
      contentType: 'service_page',
      wordCount: 1500,
      ga4Sessions: 1800,
      gscImpressions: 7200,
      primaryTopic: 'emergency_plumbing',
      expectedRank: 4,
      expectedConversions: 45,
    },
    {
      pageUrl: 'https://example.com/services/installation',
      contentType: 'service_page',
      wordCount: 1200,
      ga4Sessions: 580,
      gscImpressions: 3100,
      primaryTopic: 'plumbing_installation',
      expectedRank: 7,
      expectedConversions: 18,
    },
  ],
  gaps: [
    {
      gapType: 'location_service_combination',
      location: 'Newton',
      service: 'Emergency Repair',
      priority: 'high',
    },
  ],
};

export const saasFixture = {
  industry: 'saas',
  businessProfile: {
    businessName: 'TaskFlow Pro',
    industry: 'project_management_saas',
    primaryServices: [
      'Project Management',
      'Team Collaboration',
      'Time Tracking',
    ],
    conversationGoal: 'free_trial_signup',
  },
  inventory: [
    {
      pageUrl: 'https://example.com/',
      contentType: 'homepage',
      wordCount: 2000,
      ga4Sessions: 15000,
      gscImpressions: 45000,
      primaryTopic: 'project_management',
    },
    {
      pageUrl: 'https://example.com/features',
      contentType: 'product_page',
      wordCount: 3500,
      ga4Sessions: 8200,
      gscImpressions: 18000,
      primaryTopic: 'taskflow_features',
    },
    {
      pageUrl: 'https://example.com/features/project-management',
      contentType: 'feature_page',
      wordCount: 2200,
      ga4Sessions: 3200,
      gscImpressions: 6800,
      primaryTopic: 'project_management_feature',
      linkedFromPillar: true,
    },
    {
      pageUrl: 'https://example.com/features/team-collaboration',
      contentType: 'feature_page',
      wordCount: 2100,
      ga4Sessions: 2800,
      gscImpressions: 5200,
      primaryTopic: 'collaboration_feature',
      linkedFromPillar: true,
    },
    {
      pageUrl: 'https://example.com/pricing',
      contentType: 'pricing_page',
      wordCount: 1500,
      ga4Sessions: 12000,
      gscImpressions: 8000,
      primaryTopic: 'pricing',
      expectedConversions: 280,
    },
    {
      pageUrl: 'https://example.com/blog/project-management-best-practices',
      contentType: 'blog_post',
      wordCount: 2800,
      ga4Sessions: 1200,
      gscImpressions: 4500,
      primaryTopic: 'project_management_education',
    },
    {
      pageUrl: 'https://example.com/vs-monday-com',
      contentType: 'comparison_page',
      wordCount: 3200,
      ga4Sessions: 4500,
      gscImpressions: 12000,
      primaryTopic: 'product_comparison',
      compares: ['monday.com'],
    },
    {
      pageUrl: 'https://example.com/vs-asana',
      contentType: 'comparison_page',
      wordCount: 3100,
      ga4Sessions: 3800,
      gscImpressions: 9200,
      primaryTopic: 'product_comparison',
      compares: ['asana'],
    },
  ],
};

export const ecommerceFixture = {
  industry: 'ecommerce',
  businessProfile: {
    businessName: 'TechGadget Store',
    industry: 'ecommerce',
    productCategories: ['Electronics', 'Accessories', 'Smart Home'],
    conversationGoal: 'purchase',
  },
  inventory: [
    {
      pageUrl: 'https://example.com/',
      contentType: 'homepage',
      wordCount: 1200,
      ga4Sessions: 25000,
      ga4Conversions: 850,
      gscImpressions: 60000,
    },
    {
      pageUrl: 'https://example.com/category/electronics',
      contentType: 'category_page',
      wordCount: 1500,
      ga4Sessions: 8200,
      ga4Conversions: 180,
      gscImpressions: 15000,
    },
    {
      pageUrl: 'https://example.com/products/wireless-earbuds-pro',
      contentType: 'product_page',
      wordCount: 800,
      ga4Sessions: 1200,
      ga4Conversions: 85,
      gscImpressions: 3200,
      price: 129.99,
      reviews: 245,
      averageRating: 4.7,
    },
    {
      pageUrl: 'https://example.com/products/smart-home-hub',
      contentType: 'product_page',
      wordCount: 900,
      ga4Sessions: 950,
      ga4Conversions: 65,
      gscImpressions: 2800,
      price: 249.99,
      reviews: 180,
      averageRating: 4.6,
    },
    {
      pageUrl: 'https://example.com/blog/best-wireless-earbuds-2025',
      contentType: 'buying_guide',
      wordCount: 3500,
      ga4Sessions: 2200,
      ga4Conversions: 120,
      gscImpressions: 8500,
    },
  ],
};

export const marketingAgencyFixture = {
  industry: 'agency',
  businessProfile: {
    businessName: 'Digital Growth Agency',
    industry: 'marketing_agency',
    services: ['SEO', 'PPC', 'Social Media', 'Content Marketing'],
    conversationGoal: 'qualified_consultation',
  },
  inventory: [
    {
      pageUrl: 'https://example.com/',
      contentType: 'homepage',
      wordCount: 1800,
      ga4Sessions: 5200,
      gscImpressions: 14000,
    },
    {
      pageUrl: 'https://example.com/services/seo',
      contentType: 'service_page',
      wordCount: 3200,
      ga4Sessions: 2100,
      gscImpressions: 7800,
      expectedConversions: 18,
    },
    {
      pageUrl: 'https://example.com/work',
      contentType: 'portfolio_page',
      wordCount: 2500,
      ga4Sessions: 1800,
      gscImpressions: 4200,
      caseStudies: 8,
    },
    {
      pageUrl: 'https://example.com/blog/seo-trends-2025',
      contentType: 'blog_post',
      wordCount: 3500,
      ga4Sessions: 4200,
      gscImpressions: 12000,
      primaryTopic: 'seo_education',
    },
  ],
};

export const contentHeavyFixture = {
  industry: 'content',
  businessProfile: {
    businessName: 'Tech News Network',
    industry: 'content_publisher',
    conversationGoal: 'ad_impressions_and_subscriptions',
  },
  inventory: Array.from({ length: 527 }, (_, i) => ({
    pageUrl: `https://example.com/article/${i + 1}`,
    contentType: 'blog_post',
    wordCount: 1500 + Math.random() * 2000,
    ga4Sessions: 50 + Math.random() * 500,
    gscImpressions: 100 + Math.random() * 2000,
    lastUpdated: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
  })),
};

export type TestFixture =
  | typeof lawFirmFixture
  | typeof localServiceFixture
  | typeof saasFixture
  | typeof ecommerceFixture
  | typeof marketingAgencyFixture
  | typeof contentHeavyFixture;

export const allFixtures = [
  lawFirmFixture,
  localServiceFixture,
  saasFixture,
  ecommerceFixture,
  marketingAgencyFixture,
  contentHeavyFixture,
];
