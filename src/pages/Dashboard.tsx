import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import { apiClient } from '../lib/api'
import { useAnalysis } from '../hooks/useAnalysis'
import { useJobDescription } from '../hooks/useJobDescription'
import { AGENT_NAMES, AGENT_LABELS } from '../types/analysis'
import type { AgentStatus } from '../types/analysis'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Textarea } from '../components/common/Textarea'
import { Skeleton } from '../components/common/Skeleton'
import { CvUpload } from '../components/cv/CvUpload'
import { CvPreview } from '../components/cv/CvPreview'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CvProfile {
  id: string
  filename: string
  fileType: string
  charCount: number
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Agent status tile                                                  */
/* ------------------------------------------------------------------ */

const statusIcon: Record<AgentStatus, React.ReactNode> = {
  idle: <Clock size={16} className="text-text-muted" />,
  running: <Loader2 size={16} className="animate-spin text-accent" />,
  complete: <CheckCircle2 size={16} className="text-success" />,
  error: <XCircle size={16} className="text-error" />,
}

const statusLabel: Record<AgentStatus, string> = {
  idle: 'Waiting',
  running: 'Running',
  complete: 'Done',
  error: 'Failed',
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate()

  /* CV state */
  const [cv, setCv] = useState<CvProfile | null>(null)
  const [cvLoading, setCvLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)

  /* JD state */
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitleField, setJobTitleField] = useState('')
  const [companyNameField, setCompanyNameField] = useState('')

  /* Hooks */
  const { agents, isAnalysing, jobAnalysisId, startAnalysis } = useAnalysis()
  const { parseJobDescription, parsing } = useJobDescription()

  /* ---- Fetch most recent CV on mount ---- */
  useEffect(() => {
    let cancelled = false

    async function fetchCv() {
      try {
        const list = await apiClient.get<CvProfile[]>('/cv/list')
        if (!cancelled && list.length > 0) {
          setCv(list[0])
        }
      } catch {
        // No CV yet — that's fine
      } finally {
        if (!cancelled) setCvLoading(false)
      }
    }

    fetchCv()
    return () => {
      cancelled = true
    }
  }, [])

  /* ---- Navigate once analysis ID is available ---- */
  useEffect(() => {
    if (jobAnalysisId) {
      navigate(`/analysis/${jobAnalysisId}`)
    }
  }, [jobAnalysisId, navigate])

  /* ---- Handlers ---- */

  const handleUploadComplete = useCallback(
    (result: { id: string; filename: string; fileType: string; charCount: number; createdAt: string }) => {
      setCv(result)
      setShowUploader(false)
    },
    [],
  )

  const handleReplace = useCallback(() => {
    setShowUploader(true)
  }, [])

  const handleSmartExtract = useCallback(async () => {
    if (!jobDescription.trim()) return
    const parsed = await parseJobDescription(jobDescription)
    if (parsed) {
      setJobTitleField(parsed.jobTitle)
      setCompanyNameField(parsed.companyName)
      setJobDescription(parsed.cleanedDescription || jobDescription)
    }
  }, [jobDescription, parseJobDescription])

  const handleAnalyse = useCallback(async () => {
    if (!cv || !jobDescription.trim()) return
    await startAnalysis({
      cvProfileId: cv.id,
      jobDescription,
      jobTitle: jobTitleField || undefined,
      companyName: companyNameField || undefined,
    })
  }, [cv, jobDescription, jobTitleField, companyNameField, startAnalysis])

  const canAnalyse = !!cv && jobDescription.trim().length > 0 && !isAnalysing

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ============ Left panel — CV Manager ============ */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text">Your CV</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Upload your CV once and use it across all analyses.
            </p>
          </div>

          {cvLoading ? (
            <Card>
              <Skeleton lines={3} />
            </Card>
          ) : !cv || showUploader ? (
            <CvUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <CvPreview cv={cv} onReplace={handleReplace} />
          )}
        </div>

        {/* ============ Right panel — New Analysis ============ */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text">Analyse a Job</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Paste a job description and let the AI agents do the rest.
            </p>
          </div>

          <Card className="space-y-5">
            {/* Job title + company fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Job title"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitleField}
                onChange={(e) => setJobTitleField(e.target.value)}
              />
              <Input
                label="Company name"
                placeholder="e.g. Acme Corp"
                value={companyNameField}
                onChange={(e) => setCompanyNameField(e.target.value)}
              />
            </div>

            {/* Job description textarea + smart extract */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  Job description
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Zap}
                  loading={parsing}
                  disabled={!jobDescription.trim()}
                  onClick={handleSmartExtract}
                >
                  Smart Extract
                </Button>
              </div>
              <Textarea
                rows={10}
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Analyse button */}
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              className="w-full"
              disabled={!canAnalyse}
              loading={isAnalysing}
              onClick={handleAnalyse}
            >
              {isAnalysing ? 'Analysing...' : 'Analyse'}
            </Button>
          </Card>
        </div>
      </div>

      {/* ============ Agent progress grid ============ */}
      {isAnalysing && (
        <div className="mt-10 space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary">
            Agent Progress
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {AGENT_NAMES.map((name) => {
              const agent = agents[name]
              return (
                <Card
                  key={name}
                  className="flex items-center gap-3 p-4"
                >
                  {statusIcon[agent.status]}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {AGENT_LABELS[name]}
                    </p>
                    <p className="text-xs text-text-muted">
                      {statusLabel[agent.status]}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
