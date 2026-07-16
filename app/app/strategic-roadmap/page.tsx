'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, CheckCircle2, AlertCircle, Clock, Target, Zap, TrendingUp } from 'lucide-react'

interface Mission {
  id: string
  initiativeTitle: string
  businessObjective: string
  expectedROI: number
  effort: { hours: number; phases: number; resources: string[] }
  priority: number
  confidence: number
  timeline: string
  successCriteria: string[]
  milestone30Days: string
  milestone90Days: string
  riskFactors: string[]
}

interface QuarterMissions {
  quarter: string
  year: number
  missions: Mission[]
  quarterlyObjective: string
  expectedROI: number
  successCriteria: string[]
}

export default function StrategicRoadmapPage() {
  const [missions, setMissions] = useState<QuarterMissions | null>(null)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuarter, setCurrentQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')

  useEffect(() => {
    const loadMissions = async () => {
      try {
        const response = await fetch(`/api/strategic/missions?quarter=${currentQuarter}`)
        const data = await response.json()
        setMissions(data)
        if (data.missions?.length > 0) {
          setSelectedMission(data.missions[0])
        }
      } catch (error) {
        console.error('Failed to load missions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMissions()
  }, [currentQuarter])

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-12 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!missions) {
    return <div className="p-6 text-center text-slate-500">No quarterly roadmap available</div>
  }

  const quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4'] as const

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Quarterly Strategic Roadmap</h1>
          <p className="text-lg text-slate-600">
            {missions.year} {missions.quarter} — {missions.quarterlyObjective}
          </p>
        </div>

        {/* Quarter Selector */}
        <div className="flex gap-2">
          {quarterOptions.map((q) => (
            <button
              key={q}
              onClick={() => setCurrentQuarter(q)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentQuarter === q
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Total Missions</div>
          <div className="text-3xl font-bold text-blue-900">{missions.missions.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium">Expected ROI</div>
          <div className="text-3xl font-bold text-green-900">+{missions.expectedROI}%</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 font-medium">Total Effort</div>
          <div className="text-3xl font-bold text-purple-900">
            {Math.round(missions.missions.reduce((sum, m) => sum + m.effort.hours, 0) / 40)} weeks
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-700 font-medium">Avg Priority</div>
          <div className="text-3xl font-bold text-orange-900">
            {(missions.missions.reduce((sum, m) => sum + m.priority, 0) / missions.missions.length).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mission List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Strategic Initiatives</h2>
          <div className="space-y-2">
            {missions.missions.map((mission) => (
              <button
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedMission?.id === mission.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{mission.initiativeTitle}</h3>
                    <p className="text-sm text-slate-600 mt-1">{mission.businessObjective}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        P{mission.priority}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        +{mission.expectedROI}% ROI
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {mission.effort.hours}h
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{Math.round(mission.confidence * 100)}%</div>
                    <div className="text-xs text-slate-500">confidence</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mission Details */}
        {selectedMission && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Mission Details
              </h3>

              {/* 30-Day Milestone */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-amber-700">30-Day Milestone</div>
                    <div className="text-sm text-slate-700 mt-1">{selectedMission.milestone30Days}</div>
                  </div>
                </div>
              </div>

              {/* 90-Day Milestone */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-green-700">90-Day Milestone</div>
                    <div className="text-sm text-slate-700 mt-1">{selectedMission.milestone90Days}</div>
                  </div>
                </div>
              </div>

              {/* Key Resources */}
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="text-xs font-medium text-slate-700 mb-2">Required Resources</div>
                <div className="flex flex-wrap gap-1">
                  {selectedMission.effort.resources.map((r, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {selectedMission.riskFactors.length > 0 && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-red-700">Risk Factors</div>
                      <ul className="text-xs text-red-700 mt-1 space-y-1">
                        {selectedMission.riskFactors.slice(0, 2).map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Criteria */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Quarterly Success Criteria
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {missions.successCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span className="text-slate-700">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Execution Timeline
        </h2>
        <div className="space-y-3">
          {missions.missions
            .sort((a, b) => a.priority - b.priority)
            .map((mission, i) => (
              <div key={mission.id} className="flex items-center gap-4">
                <div className="w-12 text-center">
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                    P{mission.priority}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{mission.initiativeTitle}</span>
                    <span className="text-xs text-slate-600">({mission.effort.hours}h)</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${Math.min(100, (mission.confidence * 100) / 2 + 50)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-16">
                  <span className="text-xs font-semibold text-blue-700">{Math.round(mission.confidence * 100)}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
