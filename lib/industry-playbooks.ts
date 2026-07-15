export interface IndustryPlaybookConfig {
  industry: string;
  displayName: string;
  description: string;
  importantPageTypes: string[];
  importantConversionTypes: string[];
  typicalMoneyPages: string[];
  recommendedSchema: string[];
  criticalTechnicalIssues: string[];
  contentOpportunities: string[];
  localSeoImportance: number;
  trustSignalImportance: number;
  schemaImportance: number;
  businessValueWeight: number;
  seoOpportunityWeight: number;
}

export const INDUSTRY_PLAYBOOKS: Record<string, IndustryPlaybookConfig> = {
  law_firm: {
    industry: 'law_firm',
    displayName: 'Law Firm',
    description: 'Legal practice with service areas and practice areas',
    importantPageTypes: ['service_page', 'location_page', 'attorney_page', 'practice_area_page'],
    importantConversionTypes: ['consultation', 'call', 'form'],
    typicalMoneyPages: ['service_pages', 'location_pages', 'attorney_pages', 'contact_page'],
    recommendedSchema: ['LocalBusiness', 'ProfessionalService', 'Person'],
    criticalTechnicalIssues: ['canonical_issues', 'indexation', 'site_speed', 'mobile_usability'],
    contentOpportunities: ['practice_area_authority', 'location_pages', 'attorney_bios', 'case_results'],
    localSeoImportance: 75,
    trustSignalImportance: 90,
    schemaImportance: 80,
    businessValueWeight: 0.70,
    seoOpportunityWeight: 0.30,
  },
  medical_practice: {
    industry: 'medical_practice',
    displayName: 'Medical Practice',
    description: 'Medical clinic or hospital with multiple locations and specialties',
    importantPageTypes: ['service_page', 'location_page', 'provider_page', 'appointment_page'],
    importantConversionTypes: ['appointment', 'call', 'form'],
    typicalMoneyPages: ['service_pages', 'location_pages', 'specialty_pages', 'appointment_page'],
    recommendedSchema: ['MedicalBusiness', 'LocalBusiness', 'Doctor', 'Person'],
    criticalTechnicalIssues: ['indexation', 'site_speed', 'mobile_usability', 'https'],
    contentOpportunities: ['specialty_authority', 'location_pages', 'provider_bios', 'health_information'],
    localSeoImportance: 80,
    trustSignalImportance: 95,
    schemaImportance: 85,
    businessValueWeight: 0.70,
    seoOpportunityWeight: 0.30,
  },
  dental_practice: {
    industry: 'dental_practice',
    displayName: 'Dental Practice',
    description: 'Dental clinic with multiple locations and services',
    importantPageTypes: ['service_page', 'location_page', 'dentist_page', 'appointment_page'],
    importantConversionTypes: ['appointment', 'call', 'form'],
    typicalMoneyPages: ['service_pages', 'location_pages', 'appointment_page', 'insurance_page'],
    recommendedSchema: ['LocalBusiness', 'Dentist', 'ProfessionalService'],
    criticalTechnicalIssues: ['indexation', 'site_speed', 'mobile_usability', 'local_signals'],
    contentOpportunities: ['service_pages', 'location_pages', 'dentist_bios', 'patient_education'],
    localSeoImportance: 85,
    trustSignalImportance: 85,
    schemaImportance: 80,
    businessValueWeight: 0.70,
    seoOpportunityWeight: 0.30,
  },
  home_services: {
    industry: 'home_services',
    displayName: 'Home Services',
    description: 'HVAC, plumbing, roofing, electrical, cleaning, etc',
    importantPageTypes: ['service_page', 'location_page', 'service_area_page'],
    importantConversionTypes: ['call', 'form', 'quote'],
    typicalMoneyPages: ['service_pages', 'location_pages', 'service_area_pages'],
    recommendedSchema: ['LocalBusiness', 'Service', 'ProfessionalService'],
    criticalTechnicalIssues: ['local_citations', 'phone_tracking', 'mobile_ctr', 'indexation'],
    contentOpportunities: ['service_area_pages', 'how_to_guides', 'seasonal_content', 'location_pages'],
    localSeoImportance: 95,
    trustSignalImportance: 75,
    schemaImportance: 70,
    businessValueWeight: 0.75,
    seoOpportunityWeight: 0.25,
  },
  hvac: {
    industry: 'hvac',
    displayName: 'HVAC',
    description: 'Heating, ventilation, and air conditioning',
    importantPageTypes: ['service_page', 'location_page', 'seasonal_page'],
    importantConversionTypes: ['call', 'form', 'quote'],
    typicalMoneyPages: ['ac_repair_page', 'heating_page', 'maintenance_page', 'location_pages'],
    recommendedSchema: ['LocalBusiness', 'ProfessionalService'],
    criticalTechnicalIssues: ['local_citations', 'phone_number_consistency', 'mobile_ctr', 'indexation'],
    contentOpportunities: ['seasonal_content', 'service_area_pages', 'maintenance_guides', 'location_pages'],
    localSeoImportance: 95,
    trustSignalImportance: 80,
    schemaImportance: 75,
    businessValueWeight: 0.75,
    seoOpportunityWeight: 0.25,
  },
  real_estate: {
    industry: 'real_estate',
    displayName: 'Real Estate',
    description: 'Real estate agent or brokerage with listings',
    importantPageTypes: ['listing_page', 'agent_page', 'neighborhood_page', 'location_page'],
    importantConversionTypes: ['inquiry', 'call', 'showing'],
    typicalMoneyPages: ['listing_pages', 'agent_pages', 'neighborhood_pages'],
    recommendedSchema: ['RealEstateAgent', 'House', 'LocalBusiness'],
    criticalTechnicalIssues: ['indexation', 'duplicate_content', 'site_speed', 'structured_data'],
    contentOpportunities: ['neighborhood_guides', 'listing_optimization', 'market_reports', 'agent_authority'],
    localSeoImportance: 85,
    trustSignalImportance: 80,
    schemaImportance: 90,
    businessValueWeight: 0.70,
    seoOpportunityWeight: 0.30,
  },
  saas: {
    industry: 'saas',
    displayName: 'SaaS',
    description: 'Software-as-a-Service platform',
    importantPageTypes: ['pricing_page', 'signup_page', 'demo_page', 'feature_page', 'integration_page'],
    importantConversionTypes: ['signup', 'demo', 'trial'],
    typicalMoneyPages: ['pricing_page', 'feature_pages', 'comparison_pages', 'integration_pages'],
    recommendedSchema: ['SoftwareApplication', 'Organization', 'Product'],
    criticalTechnicalIssues: ['site_speed', 'mobile_conversion', 'bot_accessibility', 'indexation'],
    contentOpportunities: ['comparison_content', 'feature_documentation', 'integration_guides', 'use_case_pages'],
    localSeoImportance: 10,
    trustSignalImportance: 70,
    schemaImportance: 75,
    businessValueWeight: 0.65,
    seoOpportunityWeight: 0.35,
  },
  ecommerce: {
    industry: 'ecommerce',
    displayName: 'Ecommerce',
    description: 'Online retail store',
    importantPageTypes: ['product_page', 'category_page', 'collection_page', 'checkout_page'],
    importantConversionTypes: ['purchase', 'add_to_cart'],
    typicalMoneyPages: ['product_pages', 'category_pages', 'collection_pages'],
    recommendedSchema: ['Product', 'BreadcrumbList', 'Organization'],
    criticalTechnicalIssues: ['canonical_issues', 'pagination', 'mobile_ctr', 'site_speed', 'structured_data'],
    contentOpportunities: ['product_optimization', 'category_expansion', 'user_reviews', 'buying_guides'],
    localSeoImportance: 5,
    trustSignalImportance: 65,
    schemaImportance: 95,
    businessValueWeight: 0.60,
    seoOpportunityWeight: 0.40,
  },
  local_business: {
    industry: 'local_business',
    displayName: 'Local Business',
    description: 'Single or multi-location local business',
    importantPageTypes: ['location_page', 'service_page', 'homepage'],
    importantConversionTypes: ['call', 'form', 'visit'],
    typicalMoneyPages: ['location_pages', 'service_pages', 'homepage'],
    recommendedSchema: ['LocalBusiness', 'Service', 'Organization'],
    criticalTechnicalIssues: ['local_citations', 'nap_consistency', 'reviews', 'mobile_usability'],
    contentOpportunities: ['location_pages', 'service_pages', 'reviews_management', 'local_schema'],
    localSeoImportance: 100,
    trustSignalImportance: 80,
    schemaImportance: 85,
    businessValueWeight: 0.75,
    seoOpportunityWeight: 0.25,
  },
  publisher: {
    industry: 'publisher',
    displayName: 'Publisher / Blog',
    description: 'News, magazine, or blog publisher',
    importantPageTypes: ['article_page', 'topic_page', 'author_page', 'category_page'],
    importantConversionTypes: ['subscription', 'newsletter', 'pageview'],
    typicalMoneyPages: ['evergreen_articles', 'topic_hub_pages', 'category_pages'],
    recommendedSchema: ['Article', 'BlogPosting', 'NewsArticle', 'Organization'],
    criticalTechnicalIssues: ['site_speed', 'mobile_ctr', 'duplicate_content', 'indexation'],
    contentOpportunities: ['topic_authority', 'evergreen_content', 'internal_linking', 'freshness'],
    localSeoImportance: 10,
    trustSignalImportance: 85,
    schemaImportance: 80,
    businessValueWeight: 0.55,
    seoOpportunityWeight: 0.45,
  },
};

export function getPlaybookForIndustry(industry: string): IndustryPlaybookConfig | null {
  return INDUSTRY_PLAYBOOKS[industry] || null;
}

export function getAllIndustries(): string[] {
  return Object.keys(INDUSTRY_PLAYBOOKS);
}

export function isMoneyPageType(industry: string, pageType: string): boolean {
  const playbook = getPlaybookForIndustry(industry);
  if (!playbook) return false;
  return playbook.typicalMoneyPages.includes(pageType);
}

export function getDecisionEngineWeights(industry: string): {
  businessValueWeight: number;
  seoOpportunityWeight: number;
} | null {
  const playbook = getPlaybookForIndustry(industry);
  if (!playbook) return null;
  return {
    businessValueWeight: playbook.businessValueWeight,
    seoOpportunityWeight: playbook.seoOpportunityWeight,
  };
}
