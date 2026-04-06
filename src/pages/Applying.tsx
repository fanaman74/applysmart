import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, Search, ExternalLink, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { apiClient } from '../lib/api'
import { cn } from '../lib/cn'

interface FoundJob {
  id: string
  company: string
  role: string
  url: string
  source: string
  score: number
  status: string
  location: string | null
  remote_type: string | null
  salary_range: string | null
  created_at: string
  applied_at?: string | null
}

const STATUS_OPTIONS = [
  { value: 'new',          label: 'New',          colour: 'bg-surface text-text-secondary border-border' },
  { value: 'saved',        label: 'Saved',         colour: 'bg-accent/15 text-accent border-accent/30' },
  { value: 'applied',      label: 'Applied',       colour: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'interviewing', label: 'Interviewing',  colour: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'offer',        label: 'Offer',         colour: 'bg-success/15 text-success border-success/30' },
  { value: 'rejected',     label: 'Rejected',      colour: 'bg-error/15 text-error border-error/30' },
  { value: 'withdrawn',    label: 'Withdrawn',     colour: 'bg-surface text-text-muted border-border' },
  { value: 'skipped',      label: 'Skipped',       colour: 'bg-surface text-text-muted border-border' },
]

const FILTER_OPTIONS = [
  { value: 'all',          label: 'All' },
  { value: 'saved',        label: 'Saved' },
  { value: 'applied',      label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',        label: 'Offer' },
  { value: 'rejected',     label: 'Rejected' },
]

function statusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

function ScoreBadge({ score }: { score: number }) {
  const colour = score >= 80 ? 'text-success' : score >= 60 ? 'text-accent' : 'text-error'
  return (
    <span className={cn('font-mono text-xs font-bold', colour)}>{score}</span>
  )
}

function StatusDropdown({
  jobId,
  current,
  onChange,
}: {
  jobId: string
  current: string
  onChange: (jobId: string, status: string) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = statusMeta(current)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          meta.colour,
        )}
      >
        {meta.label}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-36 rounded-lg border border-border bg-surface shadow-xl overflow-hidden">
            {STATUS_OPTIONS.filter((s) => s.value !== 'skipped').map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(jobId, opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-card',
                  current === opt.value ? 'text-accent' : 'text-text-secondary',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full border', opt.colour)} />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function JobRow({
  job,
  onStatusChange,
}: {
  job: FoundJob
  onStatusChange: (id: string, status: string) => void
}) {
  const meta = statusMeta(job.status)
  const appliedLabel = job.applied_at
    ? `Applied ${timeAgo(job.applied_at)}`
    : `Found ${timeAgo(job.created_at)}`

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-surface/40 transition-colors group">
      {/* Score */}
      <div className="w-8 text-center shrink-0">
        <ScoreBadge score={job.score} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text text-sm">{job.role}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.colour)}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted flex-wrap">
          <span className="text-text-secondary font-medium">{job.company}</span>
          {job.location && <><span>·</span><span>{job.location}</span></>}
          {job.remote_type && (
            <span className={cn(
              'rounded px-1.5 py-0.5',
              job.remote_type === 'remote' ? 'text-success' : 'text-text-muted'
            )}>
              {job.remote_type}
            </span>
          )}
          <span>·</span>
          <span>{appliedLabel}</span>
          {job.salary_range && (
            <><span>·</span><span className="text-success font-medium">{job.salary_range}</span></>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors opacity-0 group-hover:opacity-100"
          title="Open job listing"
        >
          <ExternalLink size={13} />
        </a>
        <StatusDropdown jobId={job.id} current={job.status} onChange={onStatusChange} />
      </div>
    </div>
  )
}

export default function Applying() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [jobs, setJobs] = useState<FoundJob[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const firstName = user?.email?.split('@')[0] ?? 'User'

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get<FoundJob[]>('/job-search/jobs')
      setJobs(data)
    } catch {
      // silent — user may not have any jobs yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStatusChange = useCallback(async (jobId: string, status: string) => {
    // Optimistic update
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j))
    try {
      await apiClient.patch(`/job-search/jobs/${jobId}/status`, { status })
    } catch {
      // Revert on failure
      load()
    }
  }, [load])

  const handleExport = useCallback(() => {
    const headers = ['Role', 'Company', 'Score', 'Status', 'Location', 'Salary', 'URL', 'Found']
    const rows = jobs.map((j) => [
      j.role, j.company, j.score, j.status,
      j.location ?? '', j.salary_range ?? '', j.url,
      new Date(j.created_at).toLocaleDateString('en-GB'),
    ])
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [jobs])

  // Filter + search
  const visible = jobs.filter((j) => {
    if (filterStatus !== 'all' && j.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location ?? '').toLowerCase().includes(q)
    }
    return true
  })

  // Sort: active statuses first, then by score
  const statusOrder: Record<string, number> = {
    interviewing: 0, offer: 1, applied: 2, saved: 3, new: 4, rejected: 5, withdrawn: 6, skipped: 7,
  }
  const sorted = [...visible].sort((a, b) => {
    const so = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
    return so !== 0 ? so : b.score - a.score
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Welcome back, {firstName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={jobs.length === 0}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:border-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} className="inline mr-1.5 -mt-0.5" />
            Export
          </button>
          <button
            onClick={() => navigate('/job-search')}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            <Plus size={14} />
            New Search
          </button>
        </div>
      </div>

      {/* Applications panel */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-text">Your Applications</h2>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="font-semibold text-text">{jobs.length}</span>
              <span>total</span>
              <span className="text-border">|</span>
              <span className="font-semibold text-text">{sorted.length}</span>
              <span>shown</span>
            </div>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface/30">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
                <div className="w-8 h-4 rounded bg-surface animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-surface animate-pulse" />
                  <div className="h-3 w-32 rounded bg-surface animate-pulse" />
                </div>
                <div className="h-7 w-24 rounded-full bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-text-secondary font-medium">
              {jobs.length === 0 ? 'No applications yet' : 'No results match your filter'}
            </p>
            <p className="text-text-muted text-sm">
              {jobs.length === 0
                ? 'Run a job search to find matching roles'
                : 'Try clearing the search or changing the filter'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => navigate('/job-search')}
                className="mt-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Start Job Search
              </button>
            )}
          </div>
        ) : (
          <div>
            {sorted.map((job) => (
              <JobRow key={job.id} job={job} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      {jobs.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Saved',        status: 'saved',        colour: 'text-accent' },
            { label: 'Applied',      status: 'applied',      colour: 'text-blue-400' },
            { label: 'Interviewing', status: 'interviewing', colour: 'text-amber-400' },
            { label: 'Offers',       status: 'offer',        colour: 'text-success' },
          ].map(({ label, status, colour }) => {
            const count = jobs.filter((j) => j.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={cn(
                  'rounded-xl border bg-card p-4 text-center transition-colors hover:border-accent/30',
                  filterStatus === status ? 'border-accent/40 bg-accent/5' : 'border-border',
                )}
              >
                <p className={cn('text-2xl font-bold', colour)}>{count}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
