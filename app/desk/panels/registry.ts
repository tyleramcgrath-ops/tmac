// Panel registry for the always-on-view briefing/opportunities/approvals
// group. These three are eagerly imported since they're part of the default
// summoned view (no benefit to code-splitting something shown immediately).
// Later, on-demand panels (agent roster, mission queue, search, knowledge
// base — Phase 2 sub-milestones b–f) should use `React.lazy` here instead,
// per the performance guardrails in the Phase 2 plan.

export type PanelId = 'briefing' | 'opportunities' | 'approvals'

export const HOME_PANELS: readonly PanelId[] = ['briefing', 'opportunities', 'approvals']
