import { useState, useMemo } from 'react'
import { ArrowUpDown, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../common/Badge'
import type { Application } from '../../hooks/useApplications'

type SortKey = 'jobTitle' | 'companyName' | 'matchScore' | 'trackerStatus' | 'createdAt'
type SortDir = 'asc' | 'desc'

function scoreVariant(score: number | null): 'success' | 'warning' | 'error' | 'default' {
  if (score === null) return 'default'
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface TableViewProps {
  applications: Application[]
  onStatusChange: (id: string, trackerStatus: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

const STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'] as const

export function TableView({ applications, onStatusChange, onDelete, onOpen }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...applications]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'jobTitle':
          cmp = a.jobTitle.localeCompare(b.jobTitle)
          break
        case 'companyName':
          cmp = a.companyName.localeCompare(b.companyName)
          break
        case 'matchScore':
          cmp = (a.matchScore ?? -1) - (b.matchScore ?? -1)
          break
        case 'trackerStatus':
          cmp = a.trackerStatus.localeCompare(b.trackerStatus)
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [applications, sortKey, sortDir])

  function SortHeader({ label, column }: { label: string; column: SortKey }) {
    const active = sortKey === column
    return (
      <button
        onClick={() => toggleSort(column)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors',
          active ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
        )}
      >
        {label}
        <ArrowUpDown size={12} className={active ? 'text-accent' : 'opacity-40'} />
      </button>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-card/50">
            <th className="px-4 py-3 text-left">
              <SortHeader label="Job Title" column="jobTitle" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Company" column="companyName" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Score" column="matchScore" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Status" column="trackerStatus" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Date" column="createdAt" />
            </th>
            <th className="px-4 py-3 text-right">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Actions
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => (
            <tr
              key={app.id}
              className="border-b border-border/50 transition-colors hover:bg-surface/50"
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-text">{app.jobTitle}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-text-secondary">{app.companyName}</p>
              </td>
              <td className="px-4 py-3">
                {app.matchScore !== null ? (
                  <Badge variant={scoreVariant(app.matchScore)} mono>
                    {app.matchScore}%
                  </Badge>
                ) : (
                  <span className="text-xs text-text-muted">&mdash;</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={app.trackerStatus}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                  className="h-7 rounded border border-border bg-card px-2 text-xs text-text-secondary outline-none transition-colors hover:border-accent focus:border-accent"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-text-muted">{formatDate(app.createdAt)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => onOpen(app.id)}
                    className="rounded p-1.5 text-text-muted transition-colors hover:bg-card hover:text-accent"
                    title="Open analysis"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(app.id)}
                    className="rounded p-1.5 text-text-muted transition-colors hover:bg-card hover:text-error"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                No applications to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
