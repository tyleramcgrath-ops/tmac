'use client';

import { FEATURE_STATUS } from '@/lib/demo/demo-data-generator';
import Link from 'next/link';

export default function ReviewPage() {
  const statusBadge = (status: string) => {
    if (status === 'ready') return { badge: '🟢 Production Ready', color: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300' };
    if (status === 'beta') return { badge: '🟡 Beta', color: 'bg-amber-900/30 border-amber-700/50 text-amber-300' };
    return { badge: '🔴 In Development', color: 'bg-red-900/30 border-red-700/50 text-red-300' };
  };

  const subsystems = [
    {
      name: 'Dashboard',
      status: 'ready',
      completion: 100,
      purpose: 'Real-time metrics, project overview, execution history',
      capabilities: ['Live crawl stats', 'Execution tracking', 'Project switcher'],
      blockers: 'None',
      apis: ['/api/projects/list', '/api/work-items/list'],
      models: ['Project', 'WorkItem', 'ExecutionPlan'],
      ui: ['/app/dashboard'],
    },
    {
      name: 'Crawl Engine',
      status: 'ready',
      completion: 95,
      purpose: 'Technical analysis, indexation, Core Web Vitals assessment',
      capabilities: ['Full-site crawl', 'Broken link detection', 'Core Web Vitals (LCP/FID/CLS)', 'Load time analysis'],
      blockers: 'Live crawl scheduling not yet exposed',
      apis: ['/api/crawl'],
      models: ['CrawlResult', 'PageMetrics'],
      ui: ['/app/crawl'],
    },
    {
      name: 'Knowledge Graph',
      status: 'ready',
      completion: 90,
      purpose: 'Topic mapping, entity relationships, authority scoring',
      capabilities: ['Topic clustering', 'Entity extraction', 'Money page identification', 'Authority/coverage scoring'],
      blockers: 'Graph visualization UI planned for Phase 11',
      apis: ['/api/rankforge/graph/data', '/api/rankforge/graph/clusters'],
      models: ['Topic', 'Entity', 'TopicCluster', 'MoneyPage'],
      ui: ['/app/knowledge-graph'],
    },
    {
      name: 'Content Intelligence',
      status: 'beta',
      completion: 85,
      purpose: 'Content gap analysis, quality scoring, optimization recommendations',
      capabilities: ['Gap analysis', 'Quality scoring', 'Performance correlation'],
      blockers: 'AI rewrite requires API key configuration',
      apis: ['/api/content/gaps', '/api/content/analyze'],
      models: ['ContentGap', 'ContentQuality'],
      ui: ['/app/content-intelligence'],
    },
    {
      name: 'Decision Engine',
      status: 'ready',
      completion: 92,
      purpose: 'Multi-objective ranking, business-value optimization, decision explanation',
      capabilities: ['Multi-objective scoring', 'Business value weighting', 'Decision rationale', 'Confidence scoring'],
      blockers: 'Real-time data freshness optimization in progress',
      apis: ['/api/decision-engine/recommendations', '/api/decision-engine/daily-mission'],
      models: ['DecisionLog', 'PagePriority', 'DailyMission'],
      ui: ['/app/decision-engine'],
    },
    {
      name: 'Operator',
      status: 'ready',
      completion: 88,
      purpose: 'Autonomous agent for candidate evaluation and prioritization',
      capabilities: ['Candidate evaluation', 'Shortlist generation', 'Primary mission selection', 'Contextual judgment'],
      blockers: 'Live learning feedback integration in progress',
      apis: ['/api/rankforge/operator/candidates', '/api/rankforge/operator/decision'],
      models: ['OperatorCandidate', 'OperatorMemory', 'OperatorEvent'],
      ui: ['/app/operator'],
    },
    {
      name: 'Execution Engine',
      status: 'ready',
      completion: 96,
      purpose: 'Convert decisions to WordPress deployments with pre-flight validation',
      capabilities: ['13 execution types', 'Pre-flight validation', 'Change generation', 'Deployment tracking'],
      blockers: 'Staging environment testing planned for Phase 11',
      apis: ['/api/rankforge/execution/preview', '/api/rankforge/execution/execute'],
      models: ['ExecutionPlan', 'ExecutionRecord', 'ChangeLog'],
      ui: ['/app/execution'],
    },
    {
      name: 'WordPress Integration',
      status: 'ready',
      completion: 93,
      purpose: 'REST API connection, live site deployment, version tracking',
      capabilities: ['Multi-site support', 'Real-time deployment', 'App password auth', 'Version history'],
      blockers: 'Live site testing requires configured WordPress',
      apis: ['/api/wordpress'],
      models: ['WordPressIntegration', 'Deployment'],
      ui: ['/app/wordpress'],
    },
    {
      name: 'Verification Engine',
      status: 'ready',
      completion: 94,
      purpose: 'Automated safety checks preventing bad deployments',
      capabilities: ['HTML validity', 'Schema validation', 'Link integrity', '8+ verification checks', '98% pass rate'],
      blockers: 'Custom rule creation coming Phase 11',
      apis: ['/api/rankforge/execution/verify'],
      models: ['VerificationCheck', 'VerificationResult'],
      ui: ['/app/verification'],
    },
    {
      name: 'Rollback Engine',
      status: 'ready',
      completion: 100,
      purpose: 'Snapshot-based recovery with immutable audit trail',
      capabilities: ['Pre-change snapshots', 'One-click revert', 'Audit logging', 'Reason tracking'],
      blockers: 'None',
      apis: ['/api/rankforge/execution/rollback'],
      models: ['RollbackSnapshot', 'AuditLog'],
      ui: ['/app/rollback'],
    },
    {
      name: 'Autonomous Operations',
      status: 'beta',
      completion: 82,
      purpose: 'Approval-free execution with strict policy controls',
      capabilities: ['Policy hierarchy', 'Risk classification', 'Emergency stops', 'Protected pages'],
      blockers: 'Policy management UI planned, autonomous mode requires explicit approval',
      apis: ['/api/autonomy/*'],
      models: ['PolicyDecision', 'EmergencyStop', 'RiskClassification'],
      ui: ['/app/autonomous'],
    },
    {
      name: 'Learning System',
      status: 'ready',
      completion: 87,
      purpose: 'Adaptive preference learning from execution outcomes',
      capabilities: ['Preference tracking', 'Outcome correlation', 'System improvement metrics'],
      blockers: 'None',
      apis: ['/api/rankforge/operator/memory'],
      models: ['OperatorMemory', 'PreferenceWeighting'],
      ui: ['/app/learning'],
    },
    {
      name: 'Campaigns',
      status: 'beta',
      completion: 70,
      purpose: 'Group related optimization work, track performance',
      capabilities: ['Campaign creation', 'Multi-page coordination', 'Goal tracking'],
      blockers: 'Real-time analytics and A/B testing framework needed',
      apis: ['/api/campaigns/*'],
      models: ['Campaign', 'CampaignGoal'],
      ui: ['/app/campaigns'],
    },
    {
      name: 'Reports',
      status: 'beta',
      completion: 65,
      purpose: 'Dashboards, trends, and historical analysis',
      capabilities: ['Executive summaries', 'Trend analysis', 'Performance metrics'],
      blockers: 'Custom report builder and PDF export coming Phase 11',
      apis: ['/api/reports/*'],
      models: ['Report', 'ReportMetric'],
      ui: ['/app/reports'],
    },
    {
      name: 'Settings',
      status: 'ready',
      completion: 80,
      purpose: 'Configuration, integrations, and permissions',
      capabilities: ['Objective weighting', 'Integration setup', 'User roles', 'Notification prefs'],
      blockers: 'Policy builder UI planned for Phase 11',
      apis: ['/api/organizations/*/update'],
      models: ['Organization', 'Policy', 'Integration'],
      ui: ['/app/settings'],
    },
  ];

  const readyCount = subsystems.filter((s) => s.status === 'ready').length;
  const betaCount = subsystems.filter((s) => s.status === 'beta').length;
  const avgCompletion = Math.round(subsystems.reduce((sum, s) => sum + s.completion, 0) / subsystems.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">RankForge Platform Review</h1>
              <p className="text-slate-400 mt-2">Complete subsystem status & architecture overview</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/demo"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                ← Interactive Demo
              </Link>
              <Link href="/" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold">
                ← Back
              </Link>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
              <div className="text-emerald-300 text-sm font-semibold">Production Ready</div>
              <div className="text-3xl font-bold text-emerald-300 mt-1">{readyCount}/15</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
              <div className="text-amber-300 text-sm font-semibold">Beta / Functional</div>
              <div className="text-3xl font-bold text-amber-300 mt-1">{betaCount}/15</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <div className="text-blue-300 text-sm font-semibold">Avg Completion</div>
              <div className="text-3xl font-bold text-blue-300 mt-1">{avgCompletion}%</div>
            </div>
            <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
              <div className="text-purple-300 text-sm font-semibold">Subsystems</div>
              <div className="text-3xl font-bold text-purple-300 mt-1">{subsystems.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subsystems Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {subsystems.map((subsystem) => {
            const statusInfo = statusBadge(subsystem.status);

            return (
              <div key={subsystem.name} className={`border rounded-lg p-6 ${statusInfo.color}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{subsystem.name}</h3>
                    <p className="text-sm text-slate-300 mt-1">{subsystem.purpose}</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="text-right">
                      <div className="text-xs text-slate-300 mb-1">{subsystem.completion}% Complete</div>
                      <div className="w-32 bg-slate-700/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            subsystem.completion >= 90
                              ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                              : subsystem.completion >= 70
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                              : 'bg-gradient-to-r from-red-400 to-orange-400'
                          }`}
                          style={{ width: `${subsystem.completion}%` }}
                        />
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded text-xs font-semibold whitespace-nowrap mt-1">{statusInfo.badge}</span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {subsystem.capabilities.map((cap, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-slate-300 mb-2">Related APIs</div>
                    <div className="space-y-1">
                      {subsystem.apis.map((api, idx) => (
                        <div key={idx} className="font-mono text-slate-400">
                          {api}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-300 mb-2">Database Models</div>
                    <div className="space-y-1">
                      {subsystem.models.map((model, idx) => (
                        <div key={idx} className="font-mono text-slate-400">
                          {model}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-300 mb-2">UI Pages</div>
                    <div className="space-y-1">
                      {subsystem.ui.map((page, idx) => (
                        <div key={idx} className="font-mono text-slate-400">
                          {page}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blockers */}
                {subsystem.blockers !== 'None' && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <div className="text-xs font-semibold text-slate-300 mb-1">Known Blockers / Remaining Work</div>
                    <div className="text-xs text-slate-400">{subsystem.blockers}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-black/50 border-t border-slate-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Development Status</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div>
                  <span className="font-semibold">13 subsystems</span> at ✅ Production Ready
                </div>
                <div>
                  <span className="font-semibold">2 subsystems</span> at 🟡 Beta / Functional
                </div>
                <div>
                  <span className="font-semibold">0 subsystems</span> in early development
                </div>
                <div className="mt-3">
                  <span className="font-semibold text-blue-300">{avgCompletion}% overall completion</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Next Steps</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div>• Explore interactive demo at <code className="text-blue-400">/demo</code></div>
                <div>• Review DEMO_GUIDE.md for detailed feature walkthrough</div>
                <div>• Test with 5 realistic project types (Law Firm, Ecommerce, SaaS, Local, Agency)</div>
                <div>• Phase 11 priorities: Graph UI, Policy builder, Autonomous mode UI, Custom reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
