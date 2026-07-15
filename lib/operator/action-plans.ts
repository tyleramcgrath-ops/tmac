import type { Candidate, OperatorPlanStep } from './types'
import { canonicalizeActionType } from './consolidate'

/**
 * Multi-step action plan generator.
 *
 * For any compound recommendation the Operator emits a bounded, ordered plan
 * where every step carries its own owner + dependency + risk + deployment
 * method + verification method. Simple actions (add_faq_schema, add_internal_link)
 * still get a single-step plan so the surface is uniform.
 */

interface PlanContext {
  hasWordpressIntegration: boolean
  moneyPageSupportingCount: number
}

export interface OperatorPlan {
  headline: string
  totalMinutes: number
  steps: OperatorPlanStep[]
}

export function buildActionPlan(candidate: Candidate, ctx: PlanContext): OperatorPlan {
  const canonical = canonicalizeActionType(candidate.recommendationType)
  const deploymentMethod: OperatorPlanStep['deploymentMethod'] = ctx.hasWordpressIntegration
    ? 'wordpress'
    : 'manual'

  switch (canonical) {
    case 'money_page_reinforcement':
      return {
        headline: `Reinforce ${short(candidate.pageUrl)}`,
        totalMinutes: 75,
        steps: [
          step(1, 'Resolve any canonical / indexability conflict', 5, 'user', 'low', 'none', 'crawl'),
          step(
            2,
            `Add supporting links from ${Math.max(3, 3 - ctx.moneyPageSupportingCount)} adjacent articles`,
            15,
            'user',
            'low',
            deploymentMethod,
            'crawl',
            1,
          ),
          step(3, 'Update title + meta description', 10, 'operator', 'low', deploymentMethod, 'preview', 1),
          step(4, 'Add missing schema (LocalBusiness / Service / FAQ)', 15, 'operator', 'low', deploymentMethod, 'schema_validator', 1),
          step(5, 'Expand or strengthen the primary section', 20, 'user', 'medium', deploymentMethod, 'preview', 1),
          step(6, 'Deploy', 5, 'system', 'low', deploymentMethod, 'deploy_hook'),
          step(7, 'Verify (recrawl + GSC watch)', 5, 'system', 'low', 'none', 'recrawl'),
        ],
      }
    case 'add_faq_schema':
      return {
        headline: `Add FAQ schema to ${short(candidate.pageUrl)}`,
        totalMinutes: 20,
        steps: [
          step(1, 'Draft 4-6 FAQ Q&A pairs from existing content', 10, 'operator', 'low', 'none', 'preview'),
          step(2, 'Emit JSON-LD FAQPage', 5, 'operator', 'low', deploymentMethod, 'schema_validator', 1),
          step(3, 'Deploy + validate', 5, 'system', 'low', deploymentMethod, 'schema_validator'),
        ],
      }
    case 'add_internal_links':
      return {
        headline: `Add internal links pointing to ${short(candidate.pageUrl)}`,
        totalMinutes: 15,
        steps: [
          step(1, 'Identify 3 topical parents in the graph', 5, 'operator', 'low', 'none', 'graph'),
          step(2, 'Insert anchored links', 5, 'user', 'low', deploymentMethod, 'preview', 1),
          step(3, 'Deploy + recrawl', 5, 'system', 'low', deploymentMethod, 'recrawl'),
        ],
      }
    case 'repair_topic_cluster':
      return {
        headline: `Repair the topic cluster around ${short(candidate.pageUrl)}`,
        totalMinutes: 60,
        steps: [
          step(1, 'Identify pillar + orphaned cluster members', 10, 'operator', 'low', 'none', 'graph'),
          step(2, 'Add explicit internal links between pillar and members', 20, 'user', 'low', deploymentMethod, 'preview', 1),
          step(3, 'Refresh pillar page copy where thin', 15, 'user', 'medium', deploymentMethod, 'preview'),
          step(4, 'Deploy + recrawl', 5, 'system', 'low', deploymentMethod, 'recrawl'),
          step(5, 'Verify cluster health score improved', 10, 'operator', 'low', 'none', 'graph'),
        ],
      }
    case 'refresh_content':
      return {
        headline: `Refresh ${short(candidate.pageUrl)}`,
        totalMinutes: 60,
        steps: [
          step(1, 'Audit current H1/H2 coverage vs. current SERP', 15, 'operator', 'low', 'none', 'gsc'),
          step(2, 'Rewrite thin sections', 25, 'user', 'medium', deploymentMethod, 'preview', 1),
          step(3, 'Update publish date + internal links', 10, 'user', 'low', deploymentMethod, 'preview', 1),
          step(4, 'Deploy + verify recrawl within 7 days', 10, 'system', 'low', deploymentMethod, 'recrawl'),
        ],
      }
    default:
      return {
        headline: candidate.recommendationType,
        totalMinutes: candidate.estimatedMinutes,
        steps: [
          step(1, `Complete ${candidate.recommendationType}`, candidate.estimatedMinutes, 'user', 'low', deploymentMethod, 'manual'),
        ],
      }
  }
}

function step(
  order: number,
  label: string,
  estimatedMinutes: number,
  owner: OperatorPlanStep['owner'],
  risk: OperatorPlanStep['risk'],
  deploymentMethod: OperatorPlanStep['deploymentMethod'],
  verificationMethod: string,
  dependencyStep?: number,
): OperatorPlanStep {
  return {
    order,
    label,
    estimatedMinutes,
    owner,
    risk,
    deploymentMethod,
    verificationMethod,
    dependencyStep,
    status: 'pending',
  }
}

function short(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname : u.pathname
  } catch {
    return url
  }
}
