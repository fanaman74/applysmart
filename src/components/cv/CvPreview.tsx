import { FileText, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

interface CvProfile {
  id: string
  filename: string
  fileType: string
  charCount: number
  createdAt: string
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

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface">
        <FileText size={24} className="text-text-secondary" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium text-text">{cv.filename}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{cv.fileType.toUpperCase()}</Badge>
          <Badge mono>{cv.charCount.toLocaleString()} chars</Badge>
          <span className="text-xs text-text-muted">Uploaded {uploadDate}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onReplace && (
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={onReplace}
          >
            Replace
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete(cv.id)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
