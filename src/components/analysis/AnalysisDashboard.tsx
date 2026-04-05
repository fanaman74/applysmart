import { useState, useMemo } from 'react'
import {
  Target,
  FileText,
  AlertTriangle,
  FileEdit,
  Building2,
  MessageSquare,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAnalysisStore } from '../../stores/analysisStore'
import {
  AGENT_NAMES,
  AGENT_LABELS,
} from '../../types/analysis'
import type {
  AgentName,
  AgentStatus,
  MatchScoreResult,
  CoverLetterResult,
  GapAnalysisResult,
  TailoredCvResult,
  CompanyInsightsResult,
  InterviewPrepResult,
  NetworkingMessageResult,
} from '../../types/analysis'
import { Tabs } from '../common/Tabs'
import { Skeleton } from '../common/Skeleton'
import { MatchScore } from './tabs/MatchScore'
import { CoverLetter } from './tabs/CoverLetter'
import { GapAnalysis } from './tabs/GapAnalysis'
import { TailoredCv } from './tabs/TailoredCv'
import { CompanyInsights } from './tabs/CompanyInsights'
import { InterviewPrep } from './tabs/InterviewPrep'
import { NetworkingMessage } from './tabs/NetworkingMessage'

/* ------------------------------------------------------------------ */
/*  Icon and component mapping                                         */
/* ------------------------------------------------------------------ */

const AGENT_ICONS: Record<AgentName, LucideIcon> = {
  'match-score': Target,
  'cover-letter': FileText,
  'gap-analysis': AlertTriangle,
  'tailored-cv': FileEdit,
  'company-insights': Building2,
  'interview-prep': MessageSquare,
  'networking-message': Users,
}

const statusDot: Record<AgentStatus, string> = {
  idle: 'bg-text-muted',
  running: 'bg-accent animate-pulse',
  complete: 'bg-success',
  error: 'bg-error',
}

/* ------------------------------------------------------------------ */
/*  Tab content renderer                                               */
/* ------------------------------------------------------------------ */

function AgentTabContent({ agent }: { agent: AgentName }) {
  const agentState = useAnalysisStore((s) => s.agents[agent])

  if (agentState.status === 'idle' || agentState.status === 'running') {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton lines={4} />
        <Skeleton lines={3} />
      </div>
    )
  }

  if (agentState.status === 'error') {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-6">
        <p className="text-sm font-medium text-error">Agent failed</p>
        <p className="mt-1 text-sm text-error/80">
          {agentState.error ?? 'An unexpected error occurred.'}
        </p>
      </div>
    )
  }

  /* status === 'complete' */
  switch (agent) {
    case 'match-score':
      return <MatchScore result={agentState.result as MatchScoreResult} />
    case 'cover-letter':
      return <CoverLetter result={agentState.result as CoverLetterResult} />
    case 'gap-analysis':
      return <GapAnalysis result={agentState.result as GapAnalysisResult} />
    case 'tailored-cv':
      return <TailoredCv result={agentState.result as TailoredCvResult} />
    case 'company-insights':
      return <CompanyInsights result={agentState.result as CompanyInsightsResult} />
    case 'interview-prep':
      return <InterviewPrep result={agentState.result as InterviewPrepResult} />
    case 'networking-message':
      return <NetworkingMessage result={agentState.result as NetworkingMessageResult} />
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/*  AnalysisDashboard                                                  */
/* ------------------------------------------------------------------ */

export function AnalysisDashboard() {
  const agents = useAnalysisStore((s) => s.agents)
  const [activeTab, setActiveTab] = useState<string>(AGENT_NAMES[0])

  const tabs = useMemo(
    () =>
      AGENT_NAMES.map((name) => ({
        id: name,
        label: AGENT_LABELS[name],
        icon: AGENT_ICONS[name],
      })),
    [],
  )

  return (
    <div className="space-y-6">
      {/* Tab bar with status dots */}
      <div className="relative">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Overlay status dots onto tab bar */}
        <div
          className="pointer-events-none absolute inset-0 flex"
          aria-hidden
        >
          {AGENT_NAMES.map((name) => (
            <div key={name} className="flex items-start justify-end px-4 pt-1.5" style={{ flex: '1 1 0%' }}>
              <span
                className={`inline-block h-2 w-2 rounded-full ${statusDot[agents[name].status]}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Active tab content */}
      <div className="min-h-[200px]">
        <AgentTabContent agent={activeTab as AgentName} />
      </div>
    </div>
  )
}
