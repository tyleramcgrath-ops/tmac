'use client';

import { useState, useEffect } from 'react';
import { getDemoData, DEMO_PROJECTS, FEATURE_STATUS } from '@/lib/demo/demo-data-generator';
import Link from 'next/link';

type ProjectType = keyof typeof DEMO_PROJECTS;

const WALKTHROUGH_STEPS = [
  { id: 'dashboard', label: '📊 Dashboard', description: 'Real-time site metrics & recent activity' },
  { id: 'crawl', label: '🕷️ Crawl', description: 'Technical analysis & Core Web Vitals' },
  { id: 'knowledge-graph', label: '🔗 Knowledge Graph', description: 'Topic clusters & entity mapping' },
  { id: 'content-intel', label: '📝 Content Intelligence', description: 'Gap analysis & quality scoring' },
  { id: 'decision-engine', label: '🧠 Decision Engine', description: 'Multi-objective ranking' },
  { id: 'operator', label: '🤖 Operator', description: 'AI decision maker & shortlist' },
  { id: 'execution', label: '⚙️ Execution', description: 'Change deployment & tracking' },
  { id: 'verification', label: '✓ Verification', description: 'Automated safety checks' },
  { id: 'rollback', label: '↩️ Rollback', description: 'Snapshot & recovery system' },
  { id: 'learning', label: '📈 Learning', description: 'System improvements & preferences' },
  { id: 'review', label: '📋 Full Review', description: 'Executive platform overview' },
];

export default function DemoPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectType>('law_firm');
  const [demoData, setDemoData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    const data = getDemoData(selectedProject);
    setDemoData(data);
    setLoading(false);
  }, [selectedProject]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading RankForge Demo...</div>;
  }

  const statusBadge = (status: string) => {
    if (status === 'ready') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">✅ Production Ready</span>;
    if (status === 'beta') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">🟡 Functional / Beta</span>;
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">🔴 Not Yet Implemented</span>;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'crawl', label: 'Crawl', icon: '🕷️' },
    { id: 'knowledge-graph', label: 'Knowledge Graph', icon: '🔗' },
    { id: 'content-intel', label: 'Content Intelligence', icon: '📝' },
    { id: 'decision-engine', label: 'Decision Engine', icon: '🧠' },
    { id: 'operator', label: 'Operator', icon: '🤖' },
    { id: 'execution', label: 'Execution', icon: '⚙️' },
    { id: 'verification', label: 'Verification', icon: '✓' },
    { id: 'rollback', label: 'Rollback', icon: '↩️' },
    { id: 'learning', label: 'Learning', icon: '📈' },
    { id: 'review', label: 'Full Review', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">RankForge Demo</h1>
              <p className="text-slate-400 mt-1">Interactive Platform Demonstration</p>
            </div>
            <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition">
              ← Back to App
            </Link>
          </div>

          {/* Project Selector */}
          <div className="mb-4">
            <label className="text-sm text-slate-300 block mb-2">Select Demo Project:</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(DEMO_PROJECTS).map(([key, project]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProject(key as ProjectType)}
                  className={`px-4 py-2 rounded transition text-sm font-medium ${
                    selectedProject === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-700 -mx-6 px-6 overflow-x-auto">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 border-b-2 transition whitespace-nowrap text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">{demoData?.project?.name}</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Total Pages</div>
                  <div className="text-2xl font-bold text-white">{demoData?.crawl?.totalPages || 0}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Indexed Pages</div>
                  <div className="text-2xl font-bold text-green-400">{demoData?.crawl?.indexedPages || 0}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Keywords</div>
                  <div className="text-2xl font-bold text-blue-400">{demoData?.project?.keywords || 0}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Executions (Successful)</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {demoData?.executionHistory?.successful || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Executions */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent Executions</h3>
              <div className="space-y-2">
                {demoData?.executionHistory?.recent?.slice(0, 4)?.map((exec: any) => (
                  <div key={exec.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                    <div>
                      <div className="text-white font-medium">{exec.type}</div>
                      <div className="text-sm text-slate-400">{exec.page}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        exec.status === 'verified'
                          ? 'bg-green-900/30 text-green-400'
                          : exec.status === 'rolled_back'
                          ? 'bg-orange-900/30 text-orange-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}
                    >
                      {exec.status === 'verified' ? '✓ Verified' : exec.status === 'rolled_back' ? '↩ Rolled Back' : exec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Crawl Tab */}
        {activeTab === 'crawl' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Site Crawl Analysis</h2>
                {statusBadge(FEATURE_STATUS.crawl.status)}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Indexation Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {((demoData?.crawl?.indexedPages / demoData?.crawl?.totalPages) * 100)?.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Broken Links</div>
                  <div className="text-2xl font-bold text-orange-400">{demoData?.crawl?.brokenLinks}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Avg Load Time</div>
                  <div className="text-2xl font-bold text-blue-400">{demoData?.crawl?.avgLoadTime}s</div>
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Core Web Vitals</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700/30 p-3 rounded">
                    <div className="text-xs text-slate-400">LCP</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-semibold">{demoData?.crawl?.coreWebVitals?.lcp?.value}s</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          demoData?.crawl?.coreWebVitals?.lcp?.status === 'good'
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-orange-900/50 text-orange-300'
                        }`}
                      >
                        {demoData?.crawl?.coreWebVitals?.lcp?.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-700/30 p-3 rounded">
                    <div className="text-xs text-slate-400">FID</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-semibold">{demoData?.crawl?.coreWebVitals?.fid?.value}ms</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-900/50 text-green-300">
                        {demoData?.crawl?.coreWebVitals?.fid?.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-700/30 p-3 rounded">
                    <div className="text-xs text-slate-400">CLS</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-semibold">{demoData?.crawl?.coreWebVitals?.cls?.value}</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-900/50 text-green-300">
                        {demoData?.crawl?.coreWebVitals?.cls?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Pages */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Top Pages by Traffic</h3>
                <div className="space-y-2">
                  {demoData?.crawl?.topPages?.map((page: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{page.url}</div>
                        <div className="text-xs text-slate-400">{page.keywords} keywords</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{page.visits.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">visits/month</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Graph Tab */}
        {activeTab === 'knowledge-graph' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Knowledge Graph</h2>
                {statusBadge(FEATURE_STATUS.knowledgeGraph.status)}
              </div>

              {/* Topics */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Topics & Entities</h3>
                <div className="space-y-3">
                  {demoData?.knowledgeGraph?.topics?.map((topic: any) => (
                    <div key={topic.id} className="bg-slate-700/30 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-white">{topic.name}</div>
                        <div className="flex gap-4 text-xs">
                          <div className="text-slate-400">
                            Authority: <span className="text-blue-400 font-semibold">{(topic.authority * 100).toFixed(0)}%</span>
                          </div>
                          <div className="text-slate-400">
                            Coverage: <span className="text-green-400 font-semibold">{(topic.coverage * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {topic.entities?.map((entity: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-slate-600/50 text-slate-300 rounded text-xs">
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Money Pages */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Money Pages</h3>
                <div className="space-y-2">
                  {demoData?.knowledgeGraph?.moneyPages?.map((page: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{page.url}</div>
                        <div className="text-xs text-slate-400">Supports {page.supports} topics</div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold text-lg">{page.strength}</div>
                        <div className="text-xs text-slate-400">Strength</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decision Engine Tab */}
        {activeTab === 'decision-engine' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Decision Engine</h2>
                {statusBadge(FEATURE_STATUS.decisionEngine.status)}
              </div>

              {/* Objectives */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Business Objectives</h3>
                <div className="space-y-2">
                  {demoData?.decisionEngine?.objectives?.map((obj: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{obj.label}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-slate-600/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
                            style={{ width: `${obj.weight * 100}%` }}
                          />
                        </div>
                        <div className="text-blue-400 font-semibold text-sm w-12">{(obj.weight * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Top Recommendations</h3>
                <div className="space-y-3">
                  {demoData?.decisionEngine?.recommendations?.map((rec: any) => (
                    <div key={rec.id} className="bg-slate-700/30 p-4 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold">{rec.type}</div>
                          <div className="text-xs text-slate-400 mt-1">{rec.page}</div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">Pending Approval</span>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <div>
                          <div className="text-xs text-slate-400">Business Value</div>
                          <div className="text-white font-semibold">{rec.businessValue}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">SEO Opportunity</div>
                          <div className="text-white font-semibold">{rec.seoOpportunity}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Priority</div>
                          <div className="text-white font-semibold">#{rec.priority}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operator Tab */}
        {activeTab === 'operator' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Operator - AI Decision Maker</h2>
                {statusBadge(FEATURE_STATUS.operator.status)}
              </div>

              {/* Primary Mission */}
              <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded border border-purple-700/50">
                <h3 className="text-lg font-bold text-white mb-3">🎯 Primary Mission</h3>
                <div className="space-y-2 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Action:</span>
                    <span className="font-semibold">{demoData?.operator?.primaryMission?.action}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Expected Gain:</span>
                    <span className="font-semibold text-green-400">{demoData?.operator?.primaryMission?.expectedGain}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Timeframe:</span>
                    <span className="font-semibold">{demoData?.operator?.primaryMission?.timeframe}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Risk Level:</span>
                    <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm font-semibold">
                      {demoData?.operator?.primaryMission?.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shortlisted Candidates */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📋 Shortlisted Candidates</h3>
                <div className="space-y-3">
                  {demoData?.operator?.candidates?.map((cand: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/30 p-4 rounded border border-slate-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-white">{cand.type}</div>
                        <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 font-semibold">
                          Confidence: {(cand.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-3">{cand.page}</div>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Impact: </span>
                          <span className="text-white font-semibold capitalize">{cand.impact}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Effort: </span>
                          <span className="text-white font-semibold capitalize">{cand.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Tab */}
        {activeTab === 'execution' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Execution Engine</h2>
                {statusBadge(FEATURE_STATUS.executionEngine.status)}
              </div>

              {/* Execution Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Total Executions</div>
                  <div className="text-2xl font-bold text-white">{demoData?.executionHistory?.total}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Successful</div>
                  <div className="text-2xl font-bold text-green-400">{demoData?.executionHistory?.successful}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Failed</div>
                  <div className="text-2xl font-bold text-red-400">{demoData?.executionHistory?.failed}</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded">
                  <div className="text-slate-400 text-sm">Rolled Back</div>
                  <div className="text-2xl font-bold text-orange-400">{demoData?.executionHistory?.rollback}</div>
                </div>
              </div>

              {/* Recent Executions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Executions</h3>
                <div className="space-y-3">
                  {demoData?.executionHistory?.recent?.map((exec: any) => (
                    <div key={exec.id} className="bg-slate-700/30 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-white">{exec.type}</div>
                          <div className="text-xs text-slate-400">{exec.page}</div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            exec.status === 'verified'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-orange-900/30 text-orange-400'
                          }`}
                        >
                          {exec.status === 'verified' ? '✓ Verified' : '↩ Rolled Back'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>{exec.changedAt}</span>
                        {exec.verifiedAt && <span>Verified: {exec.verifiedAt}</span>}
                        {exec.issue && <span className="text-red-400">Issue: {exec.issue}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Verification Engine</h2>
                {statusBadge(FEATURE_STATUS.verification.status)}
              </div>

              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-6 rounded border border-green-700/50 mb-6">
                <h3 className="text-lg font-bold text-green-400 mb-3">✓ Automated Verification</h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    HTML Validity - All pages pass structure validation
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Schema Markup - JSON-LD validation completed
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Link Integrity - No broken links introduced
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    SEO Compliance - Meta tags properly formed
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    WordPress Health - No plugin conflicts detected
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 p-4 rounded">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Verification Pass Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-slate-600/50 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                  <div className="text-white font-bold text-lg">98%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rollback Tab */}
        {activeTab === 'rollback' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Rollback Engine</h2>
                {statusBadge(FEATURE_STATUS.rollback.status)}
              </div>

              <div className="bg-slate-700/30 p-4 rounded mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Snapshot System</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Every execution creates a complete snapshot of page state before and after changes. Instant rollback capability.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-slate-300">Full HTML snapshot captured</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-slate-300">Metadata change tracking</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-slate-300">Immutable audit log</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-slate-300">One-click revert to any version</span>
                  </div>
                </div>
              </div>

              {/* Recent Rollbacks */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Rollbacks</h3>
                <div className="space-y-3">
                  {demoData?.executionHistory?.recent
                    ?.filter((e: any) => e.status === 'rolled_back')
                    ?.map((exec: any) => (
                      <div key={exec.id} className="bg-orange-900/20 p-4 rounded border border-orange-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-white">{exec.type}</div>
                            <div className="text-xs text-slate-400">{exec.page}</div>
                          </div>
                          <span className="px-3 py-1 rounded text-sm font-semibold bg-orange-900/30 text-orange-400">
                            ↩ Rolled Back
                          </span>
                        </div>
                        <div className="text-xs text-orange-300">Reason: {exec.issue}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Learning Engine</h2>
                {statusBadge(FEATURE_STATUS.learning.status)}
              </div>

              {/* Learned Preferences */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📚 Learned Preferences</h3>
                <div className="space-y-3">
                  {demoData?.learning?.preferences?.map((pref: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/30 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium text-sm">{pref.factor}</div>
                        <span className="text-xs text-slate-400 px-2 py-1 bg-slate-600/50 rounded">
                          From {pref.source === 'execution-success' ? '✓ Success' : '✗ Failure'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
                            style={{ width: `${pref.weight * 100}%` }}
                          />
                        </div>
                        <div className="text-blue-400 font-semibold text-sm">{(pref.weight * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📈 System Improvements</h3>
                <div className="space-y-3">
                  {demoData?.learning?.improvements?.map((imp: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/30 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium text-sm">{imp.metric}</div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            imp.trend === 'up'
                              ? 'bg-green-900/30 text-green-400'
                              : imp.trend === 'down'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-slate-600/50 text-slate-300'
                          }`}
                        >
                          {imp.trend === 'up' ? '↑' : imp.trend === 'down' ? '↓' : '→'} {imp.change}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full"
                            style={{ width: `${imp.current * 100}%` }}
                          />
                        </div>
                        <div className="text-white font-semibold text-sm">{(imp.current * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Complete Platform Review</h2>

              <div className="space-y-4">
                {Object.entries(FEATURE_STATUS).map(([key, status]) => {
                  const title = key
                    .split(/(?=[A-Z])/)
                    .join(' ')
                    .replace(/^\w/, (c) => c.toUpperCase());

                  return (
                    <div key={key} className="bg-slate-700/30 p-4 rounded border border-slate-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-white">{title}</div>
                        <div className="flex items-center gap-3">
                          {statusBadge(status.status)}
                          <div className="text-sm text-slate-400 w-24 text-right">
                            {status.completion}% complete
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status.completion >= 90
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                              : status.completion >= 70
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                              : 'bg-gradient-to-r from-red-400 to-pink-400'
                          }`}
                          style={{ width: `${status.completion}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
