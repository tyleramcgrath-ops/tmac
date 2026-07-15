/**
 * Phase 10.1: Emergency Stop
 *
 * Prevents new evaluations, blocks queued jobs, and pauses campaigns.
 * Works at global, organization, and project levels.
 * Fail-closed: any active stop blocks execution.
 */

export interface EmergencyStopStatus {
  globalStopActive: boolean
  organizationStopActive: boolean
  projectStopActive: boolean
  anyStopActive: boolean
  activeStops: Array<{
    level: 'global' | 'organization' | 'project'
    reason: string
    activatedAt: Date
    activatedByUserId: string
  }>
}

/**
 * Check if any emergency stop is active
 */
export function isEmergencyStopActive(status: EmergencyStopStatus): boolean {
  return status.anyStopActive
}

/**
 * Get detailed explanation of which stops are active
 */
export function getEmergencyStopExplanation(status: EmergencyStopStatus): string {
  if (!status.anyStopActive) {
    return 'No emergency stops active'
  }

  const stops: string[] = []

  if (status.globalStopActive) {
    const globalStop = status.activeStops.find((s) => s.level === 'global')
    stops.push(`Global stop: ${globalStop?.reason || 'unknown reason'}`)
  }

  if (status.organizationStopActive) {
    const orgStop = status.activeStops.find((s) => s.level === 'organization')
    stops.push(`Organization stop: ${orgStop?.reason || 'unknown reason'}`)
  }

  if (status.projectStopActive) {
    const projectStop = status.activeStops.find((s) => s.level === 'project')
    stops.push(`Project stop: ${projectStop?.reason || 'unknown reason'}`)
  }

  return stops.join('; ')
}

/**
 * Actions prevented by emergency stop
 */
export const EMERGENCY_STOP_PREVENTS = {
  newEvaluations: true,
  newQueueEntries: true,
  pendingExecutions: true,
  retries: true,
  campaignContinuation: true,
  automationEnablement: true,
  simulationMode: false, // Simulation is allowed to show what would happen
}

/**
 * Required authorization to remove emergency stop
 */
export const STOP_REMOVAL_REQUIRES = 'owner_or_admin'

/**
 * Actions that must complete safely or rollback during stop
 */
export interface StopShutdownActions {
  cancelQueuedJobs: boolean
  pauseCampaigns: boolean
  pauseEvaluations: boolean
  completeRunningJobs: boolean // Allow in-flight jobs to finish
  rollbackIncompleteExecutions: boolean
}

export const DEFAULT_SHUTDOWN_ACTIONS: StopShutdownActions = {
  cancelQueuedJobs: true,
  pauseCampaigns: true,
  pauseEvaluations: true,
  completeRunningJobs: true,
  rollbackIncompleteExecutions: true,
}
