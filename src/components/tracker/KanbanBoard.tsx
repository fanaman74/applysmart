import { type DragEvent, useState } from 'react'
import { cn } from '../../lib/cn'
import { Badge } from '../common/Badge'
import { ApplicationCard } from './ApplicationCard'
import type { Application } from '../../hooks/useApplications'

const COLUMNS = [
  { key: 'saved', label: 'Saved', variant: 'default' as const },
  { key: 'applied', label: 'Applied', variant: 'accent' as const },
  { key: 'interviewing', label: 'Interviewing', variant: 'warning' as const },
  { key: 'offer', label: 'Offer', variant: 'success' as const },
  { key: 'rejected', label: 'Rejected', variant: 'error' as const },
  { key: 'withdrawn', label: 'Withdrawn', variant: 'default' as const },
]

interface KanbanBoardProps {
  applications: Application[]
  onStatusChange: (id: string, trackerStatus: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export function KanbanBoard({ applications, onStatusChange, onDelete, onOpen }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  function handleDragOver(e: DragEvent<HTMLDivElement>, columnKey: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnKey)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, columnKey: string) {
    e.preventDefault()
    setDragOverColumn(null)
    const applicationId = e.dataTransfer.getData('application/x-tracker-id')
    if (applicationId) {
      onStatusChange(applicationId, columnKey)
    }
  }

  const grouped = new Map<string, Application[]>()
  for (const col of COLUMNS) {
    grouped.set(col.key, [])
  }
  for (const app of applications) {
    const bucket = grouped.get(app.trackerStatus)
    if (bucket) {
      bucket.push(app)
    } else {
      // Fallback: put in saved
      grouped.get('saved')?.push(app)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.key) ?? []
        const isOver = dragOverColumn === col.key

        return (
          <div
            key={col.key}
            className={cn(
              'flex min-h-[200px] w-[280px] min-w-[280px] flex-col rounded-xl border border-border bg-card/50 p-3 transition-colors',
              isOver && 'border-accent/60 bg-accent/5',
            )}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">{col.label}</h3>
              <Badge variant={col.variant} mono>
                {items.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {items.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onOpen={onOpen}
                  draggable
                />
              ))}

              {items.length === 0 && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-xs text-text-muted">No applications</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
