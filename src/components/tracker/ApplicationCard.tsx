import { type DragEvent } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../common/Badge'
import type { Application } from '../../hooks/useApplications'

const STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'] as const

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
  })
}

interface ApplicationCardProps {
  application: Application
  onStatusChange: (id: string, trackerStatus: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
  draggable?: boolean
}

export function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
  onOpen,
  draggable = false,
}: ApplicationCardProps) {
  const { id, jobTitle, companyName, matchScore, trackerStatus, createdAt } = application

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('application/x-tracker-id', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      className={cn(
        'group rounded-lg border border-border bg-surface p-3 transition-colors',
        draggable && 'cursor-grab active:cursor-grabbing',
        'hover:border-accent/50',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{jobTitle}</p>
          <p className="truncate text-xs text-text-secondary">{companyName}</p>
        </div>
        {matchScore !== null && (
          <Badge variant={scoreVariant(matchScore)} mono className="shrink-0">
            {matchScore}%
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-muted">{formatDate(createdAt)}</span>

        <div className="flex items-center gap-1">
          {/* Quick status selector — compact dropdown */}
          <select
            value={trackerStatus}
            onChange={(e) => onStatusChange(id, e.target.value)}
            className="h-6 rounded border border-border bg-card px-1 text-xs text-text-secondary outline-none transition-colors hover:border-accent focus:border-accent"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={(e) => { e.stopPropagation(); onOpen(id) }}
            className="rounded p-1 text-text-muted opacity-0 transition-all hover:bg-card hover:text-accent group-hover:opacity-100"
            title="Open analysis"
          >
            <ExternalLink size={14} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id) }}
            className="rounded p-1 text-text-muted opacity-0 transition-all hover:bg-card hover:text-error group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
