import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutGrid, Table } from 'lucide-react'
import { cn } from '../lib/cn'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { KanbanBoard } from '../components/tracker/KanbanBoard'
import { TableView } from '../components/tracker/TableView'
import { useApplications } from '../hooks/useApplications'

type ViewMode = 'kanban' | 'table'

export default function Tracker() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const { applications, loading, error, updateStatus, deleteApplication } = useApplications()
  const navigate = useNavigate()

  function handleOpen(id: string) {
    navigate(`/analysis/${id}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-error">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text">Applications</h1>
          <Badge variant="default" mono>
            {applications.length}
          </Badge>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'kanban'
                ? 'bg-surface text-text'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <LayoutGrid size={14} />
            Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-surface text-text'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <Table size={14} />
            Table
          </button>
        </div>
      </div>

      {/* Empty state */}
      {applications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card/50 p-12">
          <p className="text-lg font-medium text-text">No applications yet</p>
          <p className="text-sm text-text-secondary">
            Analyse a job to get started.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" size="md">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          applications={applications}
          onStatusChange={updateStatus}
          onDelete={deleteApplication}
          onOpen={handleOpen}
        />
      ) : (
        <TableView
          applications={applications}
          onStatusChange={updateStatus}
          onDelete={deleteApplication}
          onOpen={handleOpen}
        />
      )}
    </div>
  )
}
