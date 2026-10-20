// Shapes for the editorial content that ships with the site. Everything here
// is written by us, reviewed, and rendered on the server so search engines
// and answer engines read the full text without running JavaScript.

export type Faq = { q: string; a: string }

export type PracticeArea = {
  slug: string
  name: string
  /** Plural noun for headings, e.g. "Personal Injury Lawyers". */
  lawyerTitle: string
  /** One sentence, under 160 characters: used for cards and meta descriptions. */
  short: string
  /** Grouping used on the practice-area index. */
  group: 'Injury & Accidents' | 'Criminal' | 'Family & Personal' | 'Money & Property' | 'Work & Business' | 'Government & Rights' | 'Specialty'
  /** Present for the areas with a full guide. */
  guide?: {
    /** Two to four paragraphs, plain text. The first one answers "what is X law" directly. */
    overview: string[]
    /** Situations where people typically hire this kind of lawyer. */
    commonCases: string[]
    /** Signs it is time to call a lawyer. */
    whenToHire: string[]
    /** How lawyers in this area usually charge, in general terms. */
    fees: string
    /** Questions to ask at a first consultation. */
    questionsToAsk: string[]
    faqs: Faq[]
  }
}

export type GuideSection = { heading: string; paragraphs: string[]; bullets?: string[] }

export type Guide = {
  slug: string
  title: string
  /** Meta description, under 160 characters. */
  description: string
  category: 'Hiring a Lawyer' | 'Costs & Fees' | 'Your Rights' | 'After an Accident' | 'Courts & Process'
  /** Two-to-three sentence direct answer shown at the top (the "answer box"). */
  answer: string
  readMinutes: number
  sections: GuideSection[]
  faqs: Faq[]
  /** Practice area slugs this guide relates to. */
  related: string[]
}

export type GlossaryTerm = { term: string; slug: string; definition: string }

export type QuestionGroup = { topic: string; practice?: string; items: Faq[] }
