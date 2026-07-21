/* =====================================================================
   TruePoint Systems — Cybersecurity Readiness Assessment
   ---------------------------------------------------------------------
   ⚠️  PLACEHOLDER CONTENT — swap this out for the real questionnaire.
   Everything the flow renders comes from the objects below, so you can
   replace copy, questions, and options here without touching any of the
   component / styling code in ./components/questionnaire.tsx.

   Question `kind`:
     - 'single'  → pick one option (auto-advances)
     - 'multi'   → pick many options
     - 'scale'   → 1..N rating
     - 'short'   → single-line text
     - 'long'    → multi-line text
     - 'email'   → validated email input
   ===================================================================== */

export interface Option {
  value: string
  label: string
  description?: string
}

export type Question =
  | {
      id: string
      kind: 'single'
      section?: string
      title: string
      help?: string
      required?: boolean
      options: Option[]
    }
  | {
      id: string
      kind: 'multi'
      section?: string
      title: string
      help?: string
      required?: boolean
      options: Option[]
    }
  | {
      id: string
      kind: 'scale'
      section?: string
      title: string
      help?: string
      required?: boolean
      min: number
      max: number
      minLabel?: string
      maxLabel?: string
    }
  | {
      id: string
      kind: 'short' | 'long' | 'email'
      section?: string
      title: string
      help?: string
      required?: boolean
      placeholder?: string
    }

export const intro = {
  eyebrow: 'TruePoint Systems — Enterprise IT & Cybersecurity',
  titleLead: 'Check your',
  titleGold: 'Cybersecurity Readiness',
  subtitle:
    'A rapid, no-nonsense assessment of where your organization stands — from access controls to incident response. Takes about 3 minutes and maps directly to the frameworks that matter.',
  cta: 'Start the assessment',
  meta: '10 questions · ~3 min',
  trust: ['Microsoft Partner', 'SonicWall', '24/7 Monitoring', 'SOC 2 Compliant'],
}

export const outro = {
  eyebrow: 'Assessment complete',
  title: 'Your readiness snapshot is ready.',
  subtitle:
    'We’ll benchmark your answers against enterprise security standards and prepare a prioritized action plan. A TruePoint strategist will follow up with your results.',
  cta: 'Get my readiness report',
  doneTitle: 'Report on the way.',
  doneSubtitle:
    'Your responses are locked in. Watch your inbox — your personalized cybersecurity readiness report and next steps are being prepared.',
}

/* Rough readiness score (0–100) derived from the security answers. Swappable
   alongside the questions — if ids change, unmatched answers simply don't
   contribute. Returns { score, band }. */
export function computeReadiness(answers: Record<string, unknown>): {
  score: number
  band: string
} {
  let score = 0

  const conf = answers['confidence']
  if (typeof conf === 'number') score += (conf / 10) * 30 // up to 30

  const controls = answers['controls']
  if (Array.isArray(controls)) {
    const good = controls.filter((c) => c !== 'none').length
    score += Math.min(good, 5) * 7 // up to 35
  }

  const ir = answers['incident_response']
  const irMap: Record<string, number> = { tested: 20, written: 12, informal: 5, no: 0 }
  if (typeof ir === 'string' && ir in irMap) score += irMap[ir] // up to 20

  const li = answers['last_incident']
  const liMap: Record<string, number> = { never: 15, old: 10, recent: 4, unsure: 0 }
  if (typeof li === 'string' && li in liMap) score += liMap[li] // up to 15

  score = Math.max(0, Math.min(100, Math.round(score)))
  const band = score >= 75 ? 'Strong posture' : score >= 45 ? 'Developing' : 'High exposure'
  return { score, band }
}

export const questions: Question[] = [
  {
    id: 'org_size',
    kind: 'single',
    section: 'Your organization',
    title: 'How large is your organization?',
    help: 'Headcount across all locations.',
    required: true,
    options: [
      { value: 'smb', label: '1–50 employees', description: 'Small business' },
      { value: 'mid', label: '51–250 employees', description: 'Mid-market' },
      { value: 'large', label: '251–1,000 employees', description: 'Enterprise' },
      { value: 'xl', label: '1,000+ employees', description: 'Large enterprise' },
    ],
  },
  {
    id: 'it_model',
    kind: 'single',
    section: 'Your organization',
    title: 'How is your IT function structured today?',
    required: true,
    options: [
      { value: 'internal', label: 'Fully in-house IT team' },
      { value: 'hybrid', label: 'In-house team + outside help' },
      { value: 'msp', label: 'Fully outsourced to an MSP' },
      { value: 'none', label: 'No dedicated IT function yet' },
    ],
  },
  {
    id: 'confidence',
    kind: 'scale',
    section: 'Security posture',
    title: 'How confident are you that you could stop a breach today?',
    help: '1 = not confident at all · 10 = fully confident',
    required: true,
    min: 1,
    max: 10,
    minLabel: 'Not confident',
    maxLabel: 'Fully confident',
  },
  {
    id: 'controls',
    kind: 'multi',
    section: 'Security posture',
    title: 'Which of these controls do you have in place?',
    help: 'Choose all that apply.',
    options: [
      { value: 'mfa', label: 'Multi-factor authentication (MFA)' },
      { value: 'edr', label: 'Endpoint detection & response (EDR)' },
      { value: 'backup', label: 'Tested, offsite backups' },
      { value: 'training', label: 'Security awareness training' },
      { value: 'siem', label: '24/7 monitoring / SIEM' },
      { value: 'none', label: 'None of these yet' },
    ],
  },
  {
    id: 'incident_response',
    kind: 'single',
    section: 'Security posture',
    title: 'Do you have a written incident response plan?',
    required: true,
    options: [
      { value: 'tested', label: 'Yes — and we test it regularly' },
      { value: 'written', label: 'Yes — but it’s never been tested' },
      { value: 'informal', label: 'Only informally / in someone’s head' },
      { value: 'no', label: 'No plan at all' },
    ],
  },
  {
    id: 'last_incident',
    kind: 'single',
    section: 'Security posture',
    title: 'When did you last experience a security incident?',
    required: true,
    options: [
      { value: 'recent', label: 'Within the last 12 months' },
      { value: 'old', label: 'More than a year ago' },
      { value: 'never', label: 'Never (that we know of)' },
      { value: 'unsure', label: 'Not sure how we’d even know' },
    ],
  },
  {
    id: 'compliance',
    kind: 'multi',
    section: 'Compliance',
    title: 'Which frameworks or regulations apply to you?',
    help: 'Choose all that apply.',
    options: [
      { value: 'soc2', label: 'SOC 2' },
      { value: 'hipaa', label: 'HIPAA' },
      { value: 'pci', label: 'PCI DSS' },
      { value: 'cmmc', label: 'CMMC / NIST' },
      { value: 'gdpr', label: 'GDPR / CCPA' },
      { value: 'none', label: 'None / not sure' },
    ],
  },
  {
    id: 'priority',
    kind: 'long',
    section: 'Your priorities',
    title: 'What keeps you up at night about your IT & security?',
    help: 'Be specific — this is what we’ll focus on first.',
    placeholder: 'e.g. We rely on one person for everything, and we’ve never tested our backups…',
  },
  {
    id: 'name',
    kind: 'short',
    section: 'Get your report',
    title: 'First, what should we call you?',
    required: true,
    placeholder: 'Your name',
  },
  {
    id: 'email',
    kind: 'email',
    section: 'Get your report',
    title: 'Where should we send your readiness report?',
    help: 'Your work email. No spam — just your results.',
    required: true,
    placeholder: 'you@company.com',
  },
]
