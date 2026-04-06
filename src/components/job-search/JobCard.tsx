import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Copy, Check, BookmarkPlus, Send, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ScoreGauge } from './ScoreGauge'
import type { FoundJob } from '../../stores/jobSearchStore'

interface JobCardProps {
  job: FoundJob
  onStatusChange?: (jobId: string, status: string) => void
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  eurobrussels: 'EuroBrussels',
  'euractiv-jobs': 'Euractiv',
  weworkremotely: 'WWR',
  'google-jobs': 'Google Jobs',
  glassdoor: 'Glassdoor',
  // legacy
  'hn-hiring': 'HN Hiring',
  remoteok: 'RemoteOK',
  arc: 'Arc.dev',
  builtin: 'Built In',
  wellfound: 'Wellfound',
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-surface text-text-secondary',
  saved: 'bg-accent/20 text-accent',
  applied: 'bg-blue-500/20 text-blue-400',
  interviewing: 'bg-purple-500/20 text-purple-400',
  offer: 'bg-success/20 text-success',
  rejected: 'bg-error/20 text-error',
  withdrawn: 'bg-surface text-text-muted',
  skipped: 'bg-surface text-text-muted',
}

const SCORE_DIMS = [
  { key: 'skillsMatch', label: 'Skills Match', max: 30 },
  { key: 'experienceFit', label: 'Experience', max: 20 },
  { key: 'orgFit', label: 'Org Fit', max: 15 },
  { key: 'compRange', label: 'Comp', max: 15 },
  { key: 'remoteLocation', label: 'Remote', max: 10 },
  { key: 'roleType', label: 'Role Type', max: 10 },
] as const

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text transition-colors"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'cover-letter'>('overview')

  return (
    <div className={cn(
      'rounded-xl border bg-card transition-colors',
      job.status === 'skipped' || job.status === 'rejected' || job.status === 'withdrawn'
        ? 'border-border opacity-60'
        : 'border-border hover:border-accent/50',
    )}>
      {/* Header */}
      <div className="flex items-start gap-4 p-4">
        <ScoreGauge score={job.score} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text leading-tight">{job.role}</h3>
              <p className="text-text-secondary text-sm mt-0.5">{job.company}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[job.status] ?? STATUS_STYLES.new)}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
            {job.salaryRange && (
              <span className="text-success font-medium">{job.salaryRange}</span>
            )}
            {job.location && <span>{job.location}</span>}
            {job.remoteType && (
              <span className={cn('rounded px-1.5 py-0.5', job.remoteType === 'remote' ? 'bg-success/10 text-success' : 'bg-surface text-text-secondary')}>
                {job.remoteType}
              </span>
            )}
            <span className="bg-surface rounded px-1.5 py-0.5 text-text-secondary">
              {SOURCE_LABELS[job.source] ?? job.source}
            </span>
            {job.atsPlatform && job.atsPlatform !== 'null' && (
              <span className="text-text-muted">via {job.atsPlatform}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text transition-colors"
            title="Open job listing"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Score breakdown bar */}
      <div className="px-4 pb-3">
        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
          {SCORE_DIMS.map((dim) => {
            const val = job.scoreBreakdown?.[dim.key] ?? 0
            const pct = (val / dim.max) * 100
            return (
              <div key={dim.key} className="flex-1 bg-surface rounded overflow-hidden" title={`${dim.label}: ${val}/${dim.max}`}>
                <div
                  className="h-full rounded"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 80 ? '#22c55e' : pct >= 50 ? '#d97706' : '#ef4444',
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {SCORE_DIMS.map((dim) => {
            const val = job.scoreBreakdown?.[dim.key] ?? 0
            return (
              <div key={dim.key} className="flex-1 text-center text-[9px] text-text-muted">
                {val}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status actions */}
      {onStatusChange && job.id && (
        <div className="px-4 pb-3 flex gap-2">
          {job.status === 'new' && (
            <>
              <button
                onClick={() => onStatusChange(job.id!, 'saved')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <BookmarkPlus size={12} /> Save
              </button>
              <button
                onClick={() => onStatusChange(job.id!, 'applied')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Send size={12} /> Mark Applied
              </button>
              <button
                onClick={() => onStatusChange(job.id!, 'skipped')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-surface text-text-muted hover:text-text transition-colors"
              >
                <X size={12} /> Skip
              </button>
            </>
          )}
          {job.status === 'saved' && (
            <button
              onClick={() => onStatusChange(job.id!, 'applied')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <Send size={12} /> Mark Applied
            </button>
          )}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          <div className="flex border-b border-border">
            {(['overview', 'resume', 'cover-letter'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                {tab === 'overview' ? 'Overview' : tab === 'resume' ? 'Tailored CV' : 'Cover Letter'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Score breakdown table */}
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Score Breakdown</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SCORE_DIMS.map((dim) => {
                      const val = job.scoreBreakdown?.[dim.key] ?? 0
                      return (
                        <div key={dim.key} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                          <span className="text-xs text-text-secondary">{dim.label}</span>
                          <span className="text-xs font-mono font-semibold">
                            <span className={val >= dim.max * 0.8 ? 'text-success' : val >= dim.max * 0.5 ? 'text-accent' : 'text-error'}>
                              {val}
                            </span>
                            <span className="text-text-muted">/{dim.max}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Job description excerpt */}
                {job.jobDescription && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Job Description</h4>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-10">
                      {job.jobDescription.slice(0, 1500)}
                      {job.jobDescription.length > 1500 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resume' && (
              <div>
                {job.tailoredResume ? (
                  <>
                    <div className="flex justify-end mb-2">
                      <CopyButton text={job.tailoredResume} label="Copy CV" />
                    </div>
                    <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed bg-surface rounded-lg p-4 max-h-96 overflow-y-auto">
                      {job.tailoredResume}
                    </pre>
                  </>
                ) : (
                  <p className="text-text-muted text-sm">Tailored CV not available for this job.</p>
                )}
              </div>
            )}

            {activeTab === 'cover-letter' && (
              <div>
                {job.coverLetter ? (
                  <>
                    <div className="flex justify-end mb-2">
                      <CopyButton text={job.coverLetter} label="Copy Letter" />
                    </div>
                    <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap bg-surface rounded-lg p-4 max-h-96 overflow-y-auto">
                      {job.coverLetter}
                    </div>
                  </>
                ) : (
                  <p className="text-text-muted text-sm">Cover letter not available for this job.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
