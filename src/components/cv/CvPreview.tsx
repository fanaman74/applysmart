import { FileText, RefreshCw, Trash2, CheckCircle2, Brain } from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

interface CvProfile {
  id: string
  filename: string
  fileType: string
  charCount: number
  createdAt: string
  candidateProfile?: Record<string, unknown> | null
  candidateProfileExtractedAt?: string | null
}

interface CvPreviewProps {
  cv: CvProfile
  onReplace?: () => void
  onDelete?: (id: string) => void
}

export function CvPreview({ cv, onReplace, onDelete }: CvPreviewProps) {
  const uploadDate = new Date(cv.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const hasProfile = Boolean(cv.candidateProfile)
  const profileName = cv.candidateProfile?.name as string | undefined
  const profession = cv.candidateProfile?.profession as string | undefined

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
          <FileText size={20} className="text-text-secondary" />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-text">{cv.filename}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="accent">{cv.fileType.toUpperCase()}</Badge>
            <Badge mono>{cv.charCount.toLocaleString()} chars</Badge>
            <span className="text-xs text-text-muted">Uploaded {uploadDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onReplace && (
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onReplace}>
              Replace
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onDelete(cv.id)} />
          )}
        </div>
      </div>

      {/* Candidate profile status strip */}
      {hasProfile ? (
        <div className="flex items-center gap-2 border-t border-success/20 bg-success/5 px-4 py-2">
          <CheckCircle2 size={13} className="text-success shrink-0" />
          <p className="text-xs text-success font-medium truncate">
            Profile saved — {profileName}{profession ? `, ${profession}` : ''}
          </p>
          <span className="ml-auto text-[10px] text-text-muted shrink-0">Search ready</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-border bg-surface/40 px-4 py-2">
          <Brain size={13} className="text-text-muted shrink-0" />
          <p className="text-xs text-text-muted">
            Profile will be extracted on first search
          </p>
        </div>
      )}
    </div>
  )
}
