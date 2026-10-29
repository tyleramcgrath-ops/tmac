// Shared loader for operator routes: the latest usable scan's pages and the
// project's automation policy.

import type { FoundationStore } from '../store'
import type { AutomationPolicy } from './policy'
import { DEFAULT_POLICY } from './policy'
import type { Project } from '../types'

export async function latestScanPages(store: FoundationStore, projectId: string): Promise<Record<string, unknown>[]> {
  const scans = await store.listScans(projectId, 10)
  const usable = scans.find((s) => s.status === 'completed' || s.status === 'partial')
  if (!usable) return []
  const full = await store.getScan(usable.id)
  return (full?.pages as Record<string, unknown>[]) ?? []
}

export function policyOf(project: Project): AutomationPolicy {
  return (project.operatorPolicy as AutomationPolicy) ?? DEFAULT_POLICY
}
