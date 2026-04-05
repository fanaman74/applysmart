import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { AgentStatus, CandidateProfile } from '../../stores/jobSearchStore'

interface SearchProgressProps {
  status: string
  agents: AgentStatus[]
  profile: CandidateProfile | null
  totalFound: number
}

const SOURCE_LABELS: Record<string, string> = {
  'hn-hiring': 'HN Who\'s Hiring',
  weworkremotely: 'We Work Remotely',
  remoteok: 'RemoteOK',
  arc: 'Arc.dev',
  builtin: 'Built In',
  wellfound: 'Wellfound',
  'google-jobs': 'Google Jobs',
}

const SOURCES_ORDER = ['hn-hiring', 'weworkremotely', 'remoteok', 'arc', 'builtin', 'wellfound', 'google-jobs']

export function SearchProgress({ status, agents, profile, totalFound }: SearchProgressProps) {
  const agentMap = new Map(agents.map((a) => [a.source, a]))

  return (
    <div className="space-y-4">
      {profile && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-text mb-2">Candidate Profile Extracted</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-text-muted">Name: </span>
              <span className="text-text">{profile.name}</span>
            </div>
            <div>
              <span className="text-text-muted">Level: </span>
              <span className="text-text capitalize">{profile.level}</span>
            </div>
            <div>
              <span className="text-text-muted">Experience: </span>
              <span className="text-text">{profile.yearsExperience} years</span>
            </div>
            <div>
              <span className="text-text-muted">Location: </span>
              <span className="text-text">{profile.location}</span>
            </div>
            <div className="col-span-2">
              <span className="text-text-muted">Stack: </span>
              <span className="text-text">{profile.primaryStack.join(', ')}</span>
            </div>
            <div className="col-span-2">
              <span className="text-text-muted">Targeting: </span>
              <span className="text-text">{profile.targetTitles.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Search Agents</h3>
          {totalFound > 0 && (
            <span className="text-sm text-accent font-semibold">{totalFound} jobs found</span>
          )}
        </div>
        <div className="space-y-2">
          {SOURCES_ORDER.map((source) => {
            const agent = agentMap.get(source)
            const isRunning = agent?.status === 'running'
            const isDone = agent?.status === 'done'
            const isError = agent?.status === 'error'
            const isPending = !agent

            return (
              <div
                key={source}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  isPending && 'opacity-40',
                  isRunning && 'bg-accent/5 border border-accent/20',
                  isDone && 'bg-success/5',
                  isError && 'bg-error/5',
                )}
              >
                <div className="flex items-center gap-2">
                  {isPending && <Clock size={14} className="text-text-muted" />}
                  {isRunning && <Loader2 size={14} className="animate-spin text-accent" />}
                  {isDone && <CheckCircle2 size={14} className="text-success" />}
                  {isError && <XCircle size={14} className="text-error" />}
                  <span className={cn(
                    isPending ? 'text-text-muted' : 'text-text'
                  )}>
                    {SOURCE_LABELS[source] ?? source}
                  </span>
                </div>
                <div className="text-xs">
                  {isRunning && <span className="text-accent">Searching...</span>}
                  {isDone && (
                    <span className="text-text-secondary">
                      {agent.jobsFound} qualifying job{agent.jobsFound !== 1 ? 's' : ''}
                    </span>
                  )}
                  {isError && <span className="text-error text-xs">{agent.error}</span>}
                  {isPending && <span className="text-text-muted">Waiting</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {status === 'searching' && (
        <div className="text-center text-sm text-text-muted animate-pulse">
          Agents are searching job boards in parallel...
        </div>
      )}
    </div>
  )
}
