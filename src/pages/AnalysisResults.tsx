import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAnalysisStore } from '../stores/analysisStore'
import { Badge } from '../components/common/Badge'
import { AnalysisDashboard } from '../components/analysis/AnalysisDashboard'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(isAnalysing: boolean, hasErrors: boolean) {
  if (isAnalysing) {
    return <Badge variant="accent">Analysing</Badge>
  }
  if (hasErrors) {
    return <Badge variant="warning">Completed with errors</Badge>
  }
  return <Badge variant="success">Complete</Badge>
}

/* ------------------------------------------------------------------ */
/*  AnalysisResults page                                               */
/* ------------------------------------------------------------------ */

export default function AnalysisResults() {
  const { id } = useParams<{ id: string }>()
  const { isAnalysing, jobTitle, companyName, agents } = useAnalysisStore()

  const hasErrors = Object.values(agents).some((a) => a.status === 'error')
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Status bar */}
      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-semibold text-text">
          {jobTitle || 'Job Analysis'}
        </h1>
        {companyName && (
          <span className="text-lg text-text-secondary">{companyName}</span>
        )}
        <div className="flex items-center gap-3">
          {statusBadge(isAnalysing, hasErrors)}
          <span className="text-xs text-text-muted">{today}</span>
        </div>
        {id && (
          <span className="ml-auto hidden font-mono text-xs text-text-muted sm:inline">
            {id}
          </span>
        )}
      </div>

      {/* Analysis tabs */}
      <AnalysisDashboard />
    </div>
  )
}
