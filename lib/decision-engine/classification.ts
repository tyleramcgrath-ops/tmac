import { PrismaClient } from '@prisma/client';

interface ClassificationSignals {
  urlPattern: string[];
  schemaTypes: string[];
  formCount: number;
  ctaButtonCount: number;
  navigationLevel: number;
  internalLinkCount: number;
  inboundCount: number;
  isHomepage: boolean;
  isCategoryPage: boolean;
  isProductPage: boolean;
  isServicePage: boolean;
  isBlogPost: boolean;
  isContactPage: boolean;
  isAboutPage: boolean;
  hasEcommerceMeta: boolean;
  hasLocalBusinessMeta: boolean;
  hasProfessionalServicesMeta: boolean;
}

export interface PageClassificationResult {
  pageId: string;
  primaryType: string;
  secondaryTypes: string[];
  confidence: number;
  signals: ClassificationSignals;
  manualOverride?: string;
}

export class PageClassificationEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async classifyPage(
    pageId: string,
    url: string,
    title: string | null,
    schema: string | null,
    contentLength: number,
    internalLinks: number,
    inboundCount: number,
    forms?: number,
    ctaButtons?: number
  ): Promise<PageClassificationResult> {
    // Extract URL patterns
    const urlPattern = this.extractUrlPatterns(url);

    // Analyze schema types
    const schemaTypes = this.extractSchemaTypes(schema);

    // Determine page type signals
    const signals = this.analyzeSignals(
      url,
      title,
      urlPattern,
      schemaTypes,
      contentLength,
      internalLinks,
      inboundCount,
      forms || 0,
      ctaButtons || 0
    );

    // Classify primary and secondary types
    const { primaryType, secondaryTypes, confidence } =
      this.determinePageTypes(signals, url);

    return {
      pageId,
      primaryType,
      secondaryTypes,
      confidence,
      signals,
    };
  }

  private extractUrlPatterns(url: string): string[] {
    const patterns: string[] = [];
    const pathname = new URL(url, 'https://example.com').pathname.toLowerCase();

    // Common patterns
    if (pathname === '/' || pathname === '') patterns.push('homepage');
    if (pathname.includes('blog')) patterns.push('blog');
    if (pathname.includes('product')) patterns.push('product');
    if (pathname.includes('service')) patterns.push('service');
    if (pathname.includes('category')) patterns.push('category');
    if (pathname.includes('tag')) patterns.push('tag');
    if (pathname.includes('author')) patterns.push('author');
    if (pathname.includes('contact')) patterns.push('contact');
    if (pathname.includes('about')) patterns.push('about');
    if (pathname.includes('pricing')) patterns.push('pricing');
    if (pathname.includes('resources')) patterns.push('resources');
    if (pathname.includes('guide')) patterns.push('guide');
    if (pathname.includes('case-study')) patterns.push('case-study');
    if (pathname.includes('testimonial')) patterns.push('testimonial');
    if (pathname.includes('faq')) patterns.push('faq');
    if (pathname.includes('tutorial')) patterns.push('tutorial');
    if (pathname.includes('course')) patterns.push('course');

    return patterns;
  }

  private extractSchemaTypes(schema: string | null): string[] {
    if (!schema) return [];

    try {
      const types: string[] = [];
      const schemaArray = Array.isArray(schema) ? schema : [schema];

      for (const item of schemaArray) {
        if (typeof item === 'string') {
          if (item.includes('Product')) types.push('Product');
          if (item.includes('Article')) types.push('Article');
          if (item.includes('BlogPosting')) types.push('BlogPosting');
          if (item.includes('LocalBusiness')) types.push('LocalBusiness');
          if (item.includes('Organization')) types.push('Organization');
          if (item.includes('Person')) types.push('Person');
          if (item.includes('Event')) types.push('Event');
          if (item.includes('NewsArticle')) types.push('NewsArticle');
          if (item.includes('Recipe')) types.push('Recipe');
          if (item.includes('SoftwareApplication')) types.push('SoftwareApplication');
          if (item.includes('Service')) types.push('Service');
          if (item.includes('ProfessionalService'))
            types.push('ProfessionalService');
          if (item.includes('BreadcrumbList')) types.push('BreadcrumbList');
          if (item.includes('FAQPage')) types.push('FAQPage');
        }
      }

      return [...new Set(types)];
    } catch {
      return [];
    }
  }

  private analyzeSignals(
    url: string,
    title: string | null,
    urlPattern: string[],
    schemaTypes: string[],
    contentLength: number,
    internalLinks: number,
    inboundCount: number,
    formCount: number,
    ctaButtonCount: number
  ): ClassificationSignals {
    const pathname = new URL(url, 'https://example.com').pathname.toLowerCase();
    const navigationLevel = (pathname.match(/\//g) || []).length - 1;

    return {
      urlPattern,
      schemaTypes,
      formCount,
      ctaButtonCount,
      navigationLevel,
      internalLinkCount: internalLinks,
      inboundCount,
      isHomepage: pathname === '/' || pathname === '',
      isCategoryPage: urlPattern.includes('category') || urlPattern.includes('tag'),
      isProductPage:
        urlPattern.includes('product') || schemaTypes.includes('Product'),
      isServicePage:
        urlPattern.includes('service') ||
        schemaTypes.includes('Service') ||
        schemaTypes.includes('ProfessionalService'),
      isBlogPost:
        urlPattern.includes('blog') ||
        schemaTypes.includes('BlogPosting') ||
        schemaTypes.includes('Article'),
      isContactPage: urlPattern.includes('contact') || formCount > 0,
      isAboutPage: urlPattern.includes('about'),
      hasEcommerceMeta:
        schemaTypes.includes('Product') ||
        contentLength > 500 ||
        formCount > 0,
      hasLocalBusinessMeta: schemaTypes.includes('LocalBusiness'),
      hasProfessionalServicesMeta:
        schemaTypes.includes('ProfessionalService') ||
        schemaTypes.includes('Service'),
    };
  }

  private determinePageTypes(
    signals: ClassificationSignals,
    url: string
  ): { primaryType: string; secondaryTypes: string[]; confidence: number } {
    let primaryType = 'general';
    let confidence = 0.5;
    const secondaryTypes: string[] = [];

    // Homepage is always highest priority
    if (signals.isHomepage) {
      primaryType = 'homepage';
      confidence = 0.95;
      return { primaryType, secondaryTypes, confidence };
    }

    // Strong schema-based signals
    if (signals.schemaTypes.includes('Product')) {
      primaryType = 'product';
      confidence = 0.9;
      if (signals.schemaTypes.includes('LocalBusiness'))
        secondaryTypes.push('local-business');
    } else if (signals.schemaTypes.includes('BlogPosting')) {
      primaryType = 'blog-post';
      confidence = 0.9;
    } else if (signals.schemaTypes.includes('LocalBusiness')) {
      primaryType = 'local-business';
      confidence = 0.85;
    } else if (signals.isBlogPost) {
      primaryType = 'blog-post';
      confidence = 0.8;
      if (signals.isCategoryPage) secondaryTypes.push('category');
    } else if (signals.isProductPage) {
      primaryType = 'product';
      confidence = 0.85;
      if (signals.isCategoryPage) secondaryTypes.push('category');
    } else if (signals.isServicePage) {
      primaryType = 'service';
      confidence = 0.85;
      if (signals.isCategoryPage) secondaryTypes.push('category');
    } else if (signals.isContactPage) {
      primaryType = 'contact';
      confidence = 0.9;
    } else if (signals.isAboutPage) {
      primaryType = 'about';
      confidence = 0.9;
    } else if (signals.isCategoryPage) {
      primaryType = 'category';
      confidence = 0.8;
    } else if (signals.formCount > 0) {
      primaryType = 'lead-capture';
      confidence = 0.75;
    }

    // Boost confidence based on supporting signals
    if (signals.ctaButtonCount > 0) confidence += 0.05;
    if (signals.inboundCount > 5) confidence += 0.05;
    if (signals.internalLinkCount > 10) confidence += 0.03;

    // Cap at 0.99
    confidence = Math.min(0.99, confidence);

    return { primaryType, secondaryTypes, confidence };
  }

  async saveClassification(
    organizationId: string,
    projectId: string,
    pageId: string,
    classification: PageClassificationResult,
    auditId: string
  ) {
    const existing = await this.prisma.pageClassification.findUnique({
      where: { pageId_auditId: { pageId, auditId } },
    });

    if (existing) {
      return this.prisma.pageClassification.update({
        where: { pageId_auditId: { pageId, auditId } },
        data: {
          primaryType: classification.primaryType,
          secondaryTypes: classification.secondaryTypes,
          confidence: classification.confidence,
          classificationSignals: JSON.stringify(classification.signals),
        },
      });
    } else {
      return this.prisma.pageClassification.create({
        data: {
          pageId,
          auditId,
          organizationId,
          projectId,
          primaryType: classification.primaryType,
          secondaryTypes: classification.secondaryTypes,
          confidence: classification.confidence,
          classificationSignals: JSON.stringify(classification.signals),
        },
      });
    }
  }
}
