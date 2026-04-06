import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, XCircle, Loader2, Search, Sparkles,
  MapPin, Briefcase, Clock, Users, ChevronRight, Wifi,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import type { AgentStatus, CandidateProfile } from '../../stores/jobSearchStore'

/* ------------------------------------------------------------------ */
/*  Source metadata                                                    */
/* ------------------------------------------------------------------ */

const SOURCE_META: Record<string, { label: string; flag: string; colour: string }> = {
  linkedin:          { label: 'LinkedIn Jobs',      flag: '💼', colour: 'bg-sky-500/15 border-sky-500/30 text-sky-400' },
  indeed:            { label: 'Indeed',             flag: '🔍', colour: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
  eurobrussels:      { label: 'EuroBrussels',       flag: '🇧🇪', colour: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  'euractiv-jobs':   { label: 'Euractiv Jobs',      flag: '📰', colour: 'bg-purple-500/15 border-purple-500/30 text-purple-400' },
  'eu-careers':      { label: 'EU Careers (EPSO)',  flag: '🇪🇺', colour: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' },
  'eu-institutions': { label: 'EU Agencies & NATO', flag: '🏛️', colour: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' },
  impactpool:        { label: 'ImpactPool (UN/IO)', flag: '🌐', colour: 'bg-teal-500/15 border-teal-500/30 text-teal-400' },
  weworkremotely:    { label: 'We Work Remotely',   flag: '🏠', colour: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  'google-jobs':     { label: 'Google Jobs',        flag: '🔎', colour: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
  glassdoor:         { label: 'Glassdoor',          flag: '🚪', colour: 'bg-green-500/15 border-green-500/30 text-green-400' },
  // legacy
  'hn-hiring':       { label: 'HN Who\'s Hiring',  flag: '🟠', colour: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
  remoteok:          { label: 'RemoteOK',           flag: '📡', colour: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
  arc:               { label: 'Arc.dev',            flag: '⚡', colour: 'bg-violet-500/15 border-violet-500/30 text-violet-400' },
}

function sourceMeta(source: string) {
  return SOURCE_META[source] ?? { label: source, flag: '🔗', colour: 'bg-surface border-border text-text-muted' }
}

/* ------------------------------------------------------------------ */
/*  Log entry type                                                     */
/* ------------------------------------------------------------------ */

interface LogEntry {
  id: number
  time: string
  type: 'info' | 'success' | 'error' | 'job'
  message: string
}

function nowTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (value === prev.current) return
    const start = prev.current
    const end = value
    const diff = end - start
    const duration = Math.min(600, Math.abs(diff) * 50)
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(start + diff * progress))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = end
    }
    requestAnimationFrame(tick)
  }, [value])

  return <>{display}</>
}

/* ------------------------------------------------------------------ */
/*  Agent row                                                          */
/* ------------------------------------------------------------------ */

function AgentRow({ source, agent }: { source: string; agent?: AgentStatus }) {
  const meta = sourceMeta(source)
  const status = agent?.status ?? 'pending'

  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: status === 'pending' ? 0.4 : 1 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all',
        status === 'pending'  && 'border-border bg-card',
        status === 'running'  && 'border-accent/40 bg-accent/5 shadow-sm shadow-accent/10',
        status === 'done'     && 'border-success/30 bg-success/5',
        status === 'error'    && 'border-error/30 bg-error/5',
      )}
    >
      {/* Source badge */}
      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0', meta.colour)}>
        <span>{meta.flag}</span>
        <span className="hidden sm:inline">{meta.label}</span>
      </span>

      {/* Status icon */}
      <div className="ml-auto flex items-center gap-1.5 text-xs">
        {status === 'pending' && (
          <><Clock size={12} className="text-text-muted" /><span className="text-text-muted">Waiting</span></>
        )}
        {status === 'running' && (
          <><Loader2 size={12} className="animate-spin text-accent" /><span className="text-accent font-medium">Searching…</span></>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 size={12} className="text-success" />
            <span className="text-success font-medium">
              {agent!.jobsFound} job{agent!.jobsFound !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {status === 'error' && (
          <><XCircle size={12} className="text-error" /><span className="text-error">Failed</span></>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SearchModalProps {
  open: boolean
  onClose: () => void
  searchStatus: string
  agents: AgentStatus[]
  profile: CandidateProfile | null
  totalFound: number
  sources: string[]
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

export function SearchModal({
  open,
  onClose,
  searchStatus,
  agents,
  profile,
  totalFound,
  sources,
}: SearchModalProps) {
  const [log, setLog] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const logCounter = useRef(0)
  const prevAgents = useRef<AgentStatus[]>([])
  const prevJobs = useRef(0)

  function addLog(type: LogEntry['type'], message: string) {
    logCounter.current += 1
    setLog((l) => [
      ...l.slice(-49), // keep last 50
      { id: logCounter.current, time: nowTime(), type, message },
    ])
  }

  /* Auto-scroll log */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  /* Bootstrap log on open */
  useEffect(() => {
    if (!open) return
    setLog([])
    prevAgents.current = []
    prevJobs.current = 0
    addLog('info', 'Search initiated — extracting candidate profile…')
  }, [open])

  /* Log profile extraction */
  useEffect(() => {
    if (!open || !profile) return
    addLog('success', `Profile extracted: ${profile.name} — ${profile.profession ?? profile.level} (${profile.yearsExperience} yrs, ${profile.location})`)
    addLog('info', `Targeting: ${profile.targetTitles.slice(0, 3).join(', ')}…`)
    addLog('info', `Launching ${sources.length} search agent${sources.length !== 1 ? 's' : ''} in parallel…`)
  }, [open, profile])

  /* Log agent state changes */
  useEffect(() => {
    if (!open) return
    for (const agent of agents) {
      const prev = prevAgents.current.find((a) => a.source === agent.source)
      const meta = sourceMeta(agent.source)

      if (!prev && agent.status === 'running') {
        addLog('info', `${meta.flag} ${meta.label} agent started`)
      } else if (prev?.status === 'running' && agent.status === 'done') {
        addLog('success', `${meta.flag} ${meta.label} found ${agent.jobsFound} qualifying job${agent.jobsFound !== 1 ? 's' : ''}`)
      } else if (prev?.status === 'running' && agent.status === 'error') {
        addLog('error', `${meta.flag} ${meta.label} failed: ${agent.error ?? 'unknown error'}`)
      }
    }
    prevAgents.current = agents
  }, [open, agents])

  /* Log new jobs found */
  useEffect(() => {
    if (!open) return
    const diff = totalFound - prevJobs.current
    if (diff > 0 && prevJobs.current > 0) {
      addLog('job', `+${diff} new match${diff !== 1 ? 'es' : ''} added (${totalFound} total)`)
    }
    prevJobs.current = totalFound
  }, [open, totalFound])

  /* Log completion */
  useEffect(() => {
    if (!open || searchStatus !== 'complete') return
    addLog('success', `✓ Search complete — ${totalFound} qualified jobs found across ${agents.filter(a => a.status === 'done').length} sources`)
  }, [open, searchStatus])

  const agentMap = new Map(agents.map((a) => [a.source, a]))
  const doneCount = agents.filter((a) => a.status === 'done').length
  const totalSources = sources.length || agents.length || 5
  const progressPct = totalSources > 0 ? Math.round((doneCount / totalSources) * 100) : 0
  const isComplete = searchStatus === 'complete'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={isComplete ? onClose : undefined}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-50 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-base shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/30">
                {isComplete
                  ? <CheckCircle2 size={18} className="text-success" />
                  : <Search size={18} className="text-accent animate-pulse" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-text">
                  {isComplete ? 'Search Complete' : 'Searching for Jobs…'}
                </h2>
                <p className="text-xs text-text-muted truncate">
                  {isComplete
                    ? `Found ${totalFound} qualifying jobs across ${doneCount} source${doneCount !== 1 ? 's' : ''}`
                    : searchStatus === 'extracting-profile'
                      ? 'Extracting candidate profile from CV…'
                      : `${doneCount} of ${totalSources} agents complete · ${totalFound} jobs found so far`
                  }
                </p>
              </div>
              {isComplete && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Progress bar */}
            {!isComplete && (
              <div className="h-1 bg-surface shrink-0">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: searchStatus === 'extracting-profile' ? '8%' : `${Math.max(8, progressPct)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
            {isComplete && (
              <div className="h-1 bg-success shrink-0" />
            )}

            {/* Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

              {/* Left — agents */}
              <div className="flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-2 shrink-0">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Wifi size={12} className="text-accent" /> Search Agents
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {/* Profile card */}
                  {profile && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-3 mb-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                          {profile.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{profile.name}</p>
                          <p className="text-xs text-accent capitalize">{profile.profession ?? profile.level}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-muted">
                            <span className="flex items-center gap-1"><Briefcase size={10} /> {profile.yearsExperience} yrs</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {profile.location}</span>
                            <span className="flex items-center gap-1"><Users size={10} /> {profile.targetTitles.length} target titles</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Agent rows — all sources */}
                  {(sources.length > 0 ? sources : Object.keys(SOURCE_META).slice(0, 7)).map((source) => (
                    <AgentRow key={source} source={source} agent={agentMap.get(source)} />
                  ))}
                </div>

                {/* Bottom stats */}
                <div className="border-t border-border px-4 py-3 shrink-0 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-text font-mono">
                      <Counter value={totalFound} />
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Jobs Found</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success font-mono">
                      <Counter value={doneCount} />
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Done</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-accent font-mono">
                      <Counter value={agents.filter(a => a.status === 'running').length} />
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Running</p>
                  </div>
                </div>
              </div>

              {/* Right — activity log */}
              <div className="flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-2 shrink-0">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-accent" /> Live Activity
                  </p>
                </div>
                <div
                  ref={logRef}
                  className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 font-mono text-xs"
                >
                  <AnimatePresence initial={false}>
                    {log.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2 items-start"
                      >
                        <span className="shrink-0 text-text-muted tabular-nums">{entry.time}</span>
                        <ChevronRight size={10} className={cn(
                          'mt-0.5 shrink-0',
                          entry.type === 'success' && 'text-success',
                          entry.type === 'error' && 'text-error',
                          entry.type === 'job' && 'text-accent',
                          entry.type === 'info' && 'text-text-muted',
                        )} />
                        <span className={cn(
                          'leading-relaxed break-all',
                          entry.type === 'success' && 'text-success',
                          entry.type === 'error' && 'text-error',
                          entry.type === 'job' && 'text-accent font-semibold',
                          entry.type === 'info' && 'text-text-secondary',
                        )}>
                          {entry.message}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Blinking cursor while active */}
                  {!isComplete && (
                    <div className="flex items-center gap-1 text-text-muted">
                      <span className="text-text-muted">›</span>
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-2 h-3 bg-accent rounded-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3 shrink-0 flex items-center justify-between">
              {isComplete ? (
                <>
                  <p className="text-sm text-text-secondary">
                    <span className="text-success font-semibold">{totalFound} jobs</span> ready to review
                  </p>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-xl bg-accent hover:bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    View Results <ChevronRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-text-muted">
                    AI agents are searching in parallel — this takes 1–3 minutes
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Loader2 size={12} className="animate-spin text-accent" />
                    <span>{progressPct}%</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
