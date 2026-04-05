import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../stores/authStore'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  id: string
  filename: string
  fileType: string
  charCount: number
  createdAt: string
  extractedText?: string
}

interface CvUploadProps {
  onUploadComplete?: (result: UploadResult) => void
}

const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export function CvUpload({ onUploadComplete }: CvUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const session = useAuthStore((s) => s.session)

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setState('error')
        setErrorMessage('Only PDF and DOCX files are accepted.')
        return
      }

      setState('uploading')
      setErrorMessage('')

      try {
        const formData = new FormData()
        formData.append('file', file)

        const uploadHeaders: HeadersInit = {}
        if (session?.access_token) {
          uploadHeaders['Authorization'] = `Bearer ${session.access_token}`
        }

        const res = await fetch('/api/cv/upload', {
          method: 'POST',
          headers: uploadHeaders,
          body: formData,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? 'Upload failed')
        }

        const data: UploadResult = await res.json()
        setResult(data)
        setState('success')
        onUploadComplete?.(data)
      } catch (err) {
        setState('error')
        setErrorMessage(err instanceof Error ? err.message : 'Upload failed')
      }
    },
    [session, onUploadComplete],
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors',
        'border-border bg-surface',
        dragOver && 'border-accent bg-accent/5',
        state === 'idle' && 'hover:border-accent',
        state === 'uploading' && 'pointer-events-none opacity-60',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        className="hidden"
      />

      {state === 'idle' && (
        <>
          <FileText size={40} className="text-text-secondary" />
          <p className="text-base font-medium text-text">Drop your CV here</p>
          <p className="text-sm text-text-secondary">or click to browse</p>
          <p className="text-xs text-text-muted">PDF or DOCX, up to 10 MB</p>
        </>
      )}

      {state === 'uploading' && (
        <>
          <Upload size={40} className="animate-pulse text-accent" />
          <p className="text-base font-medium text-text">Uploading&hellip;</p>
        </>
      )}

      {state === 'success' && result && (
        <>
          <CheckCircle size={40} className="text-success" />
          <p className="text-base font-medium text-text">{result.filename}</p>
          <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 font-mono text-xs text-success">
            {result.charCount.toLocaleString()} characters extracted
          </span>
        </>
      )}

      {state === 'error' && (
        <>
          <AlertCircle size={40} className="text-error" />
          <p className="text-sm text-error">{errorMessage}</p>
          <p className="text-xs text-text-secondary">Click to try again</p>
        </>
      )}
    </div>
  )
}
