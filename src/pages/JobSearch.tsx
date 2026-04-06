import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, ListFilter, RotateCcw, History, ScanText, FileBarChart2, Loader2 } from 'lucide-react'
import { useJobSearch } from '../hooks/useJobSearch'
import { useAuthStore } from '../stores/authStore'
import { useCvAnalysisStore } from '../stores/cvAnalysisStore'
import { SearchConfigForm } from '../components/job-search/SearchConfigForm'
import { SearchProgress } from '../components/job-search/SearchProgress'
import { JobCard } from '../components/job-search/JobCard'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { CvUpload } from '../components/cv/CvUpload'
import { CvPreview } from '../components/cv/CvPreview'
import { apiClient } from '../lib/api'

interface CvProfile {
  id: string
  filename: string
  fileType: string
  charCount: number
  createdAt: string
  extractedText?: string
  analysis?: Record<string, unknown> | null
  analysisExtractedAt?: string | null
}

interface PreviousRun {
  id: string
  status: string
  total_qualified: number
  sources_searched: string[]
  created_at: string
}

type SortKey = 'score' | 'company' | 'date'
type FilterStatus = 'all' | 'new' | 'saved' | 'applied'

export default function JobSearch() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const cvAnalysis = useCvAnalysisStore()
  const {
    status,
    agents,
    jobs,
    profile,
    marketInsights,
    totalQualified,
    error,
    startSearch,
    updateJobStatus,
    loadPreviousRun,
    reset,
  } = useJobSearch()

  const [cvProfile, setCvProfile] = useState<CvProfile | null>(null)
  const [cvText, setCvText] = useState<string | undefined>(undefined)
  const [previousRuns, setPreviousRuns] = useState<PreviousRun[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showRuns, setShowRuns] = useState(false)

  // Load CV profile for authenticated users — also restores saved analysis
  useEffect(() => {
    if (!session) return
    apiClient.get<{ profiles: CvProfile[] }>('/cv/list').then(({ profiles }) => {
      if (profiles.length > 0) {
        const cv = profiles[0]
        setCvProfile(cv)
        if (cv.extractedText) setCvText(cv.extractedText)
        // Restore saved analysis so the user doesn't have to re-analyse
        if (cv.analysis && cv.analysisExtractedAt) {
          cvAnalysis.setProfile(
            { ...cv.analysis, extractedAt: cv.analysisExtractedAt } as Parameters<typeof cvAnalysis.setProfile>[0]
          )
        }
      }
    }).catch(() => {})
  }, [session])

  // Load previous runs (authenticated only)
  useEffect(() => {
    if (!session || !showRuns) return
    apiClient.get<PreviousRun[]>('/job-search/runs').then(setPreviousRuns).catch(() => {})
  }, [session, showRuns])

  const handleCvUploaded = useCallback((result: CvProfile) => {
    setCvProfile(result)
    if (result.extractedText) setCvText(result.extractedText)
  }, [])

  const handleStartSearch = useCallback((cvProfileId: string, overrides?: Record<string, unknown>) => {
    startSearch(cvProfileId, overrides, cvText)
  }, [startSearch, cvText])

  const handleAnalyse = useCallback(async (force = false) => {
    if (!cvText && !cvProfile?.id) return
    cvAnalysis.setAnalysing()
    try {
      const profile = await apiClient.post<Record<string, unknown>>('/cv/analyse', {
        cvText: cvText ?? undefined,
        cvProfileId: cvProfile?.id ?? undefined,
        force: force || undefined,
      })
      cvAnalysis.setProfile(profile as Parameters<typeof cvAnalysis.setProfile>[0])
    } catch (err) {
      cvAnalysis.setError(err instanceof Error ? err.message : 'Analysis failed')
    }
  }, [cvText, cvProfile, cvAnalysis])

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score
    if (sortBy === 'company') return a.company.localeCompare(b.company)
    return 0
  })

  const filteredJobs = sortedJobs.filter((j) => {
    if (filterStatus === 'all') return j.status !== 'skipped'
    return j.status === filterStatus
  })

  const isSearching = status === 'searching' || status === 'extracting-profile'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Search size={24} className="text-accent" />
          Job Search
        </h1>
        <p className="text-text-secondary mt-1">
          AI agents search multiple job boards in parallel and score matches against your CV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: CV + Config */}
        <div className="space-y-4">
          {/* CV section */}
          {cvProfile ? (
            <div className="space-y-2">
              <CvPreview
                cv={cvProfile}
                onDelete={() => { setCvProfile(null); setCvText(undefined); cvAnalysis.reset() }}
              />

              {/* Analysis action area */}
              {cvAnalysis.status === 'complete' ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/cv-report')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent/15 border border-accent/30 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25 transition-colors"
                    >
                      <FileBarChart2 size={14} /> View Report
                    </button>
                    <button
                      onClick={() => handleAnalyse(true)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:border-accent/30 transition-colors"
                      title="Re-analyse CV"
                    >
                      <ScanText size={13} /> Re-analyse
                    </button>
                  </div>
                  <p className="text-xs text-success px-1">
                    ✓ Profile analysed — {cvAnalysis.profile?.profession}, {cvAnalysis.profile?.yearsExperience} yrs
                  </p>
                </div>
              ) : cvAnalysis.status === 'analysing' ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent opacity-70 cursor-not-allowed"
                >
                  <Loader2 size={14} className="animate-spin" /> Analysing…
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAnalyse(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    <ScanText size={14} /> Analyse CV
                  </button>
                  {cvAnalysis.status === 'error' && (
                    <p className="text-xs text-error px-1">{cvAnalysis.error}</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <Card>
              <h2 className="font-semibold text-text mb-3">Upload Your CV</h2>
              <p className="text-sm text-text-secondary mb-4">
                Upload your CV first. The AI will extract your profile and search for matching jobs.
              </p>
              <CvUpload onUploadComplete={handleCvUploaded} />
            </Card>
          )}

          {/* Search config */}
          <SearchConfigForm
            cvProfileId={cvProfile?.id ?? null}
            onStartSearch={handleStartSearch}
            isSearching={isSearching}
          />

          {/* Previous runs */}
          <div>
            <button
              onClick={() => setShowRuns(!showRuns)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors w-full"
            >
              <History size={14} />
              {showRuns ? 'Hide' : 'Show'} previous searches
            </button>
            {showRuns && (
              <div className="mt-2 space-y-2">
                {previousRuns.length === 0 ? (
                  <p className="text-xs text-text-muted">No previous searches yet.</p>
                ) : (
                  previousRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => loadPreviousRun(run.id)}
                      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-text">
                          {run.total_qualified} jobs
                        </span>
                        <span className={`text-xs ${run.status === 'completed' ? 'text-success' : 'text-text-muted'}`}>
                          {run.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Error */}
          {error && status === 'error' && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-4">
              <p className="text-error text-sm font-medium">Search failed</p>
              <p className="text-sm text-text-secondary mt-1">{error}</p>
              <Button onClick={reset} className="mt-3" variant="ghost">
                <RotateCcw size={14} className="mr-2" /> Try Again
              </Button>
            </div>
          )}

          {/* In-progress */}
          {isSearching && (
            <SearchProgress
              status={status}
              agents={agents}
              profile={profile}
              totalFound={jobs.length}
            />
          )}

          {/* Live results during search */}
          {status === 'searching' && jobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" />
                <span className="text-sm font-semibold text-text">
                  {jobs.length} jobs found so far...
                </span>
              </div>
              {jobs.slice(0, 5).map((job, i) => (
                <JobCard key={job.url ?? i} job={job} />
              ))}
            </div>
          )}

          {/* Complete results */}
          {status === 'complete' && (
            <>
              {/* Summary */}
              {marketInsights && (
                <Card>
                  <div className="flex items-start gap-3">
                    <TrendingUp size={18} className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-text mb-2">Market Intelligence</h3>
                      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {marketInsights}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-accent font-mono">{totalQualified || jobs.length}</p>
                  <p className="text-xs text-text-muted mt-1">Qualified Jobs</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-success font-mono">
                    {jobs.filter((j) => j.score >= 80).length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Strong Matches</p>
                </Card>
                <Card className="text-center py-4">
                  <p className="text-2xl font-bold text-text font-mono">
                    {jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + j.score, 0) / jobs.length) : 0}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Average Score</p>
                </Card>
              </div>

              {/* Filters + Sort */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <ListFilter size={14} className="text-text-muted" />
                  {(['all', 'new', 'saved', 'applied'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        filterStatus === s
                          ? 'bg-accent text-white'
                          : 'bg-surface text-text-secondary hover:text-text'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {s === 'all' && ` (${jobs.filter((j) => j.status !== 'skipped').length})`}
                      {s !== 'all' && ` (${jobs.filter((j) => j.status === s).length})`}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-text-muted">Sort:</span>
                  {(['score', 'company'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        sortBy === s ? 'text-accent' : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job list */}
              <div className="space-y-3">
                {filteredJobs.length === 0 ? (
                  <Card>
                    <p className="text-text-secondary text-sm text-center py-4">
                      No jobs match this filter.
                    </p>
                  </Card>
                ) : (
                  filteredJobs.map((job, i) => (
                    <JobCard
                      key={job.url ?? i}
                      job={job}
                      onStatusChange={job.id ? updateJobStatus : undefined}
                    />
                  ))
                )}
              </div>

              <div className="flex justify-center">
                <Button onClick={reset} variant="ghost">
                  <RotateCcw size={14} className="mr-2" /> New Search
                </Button>
              </div>
            </>
          )}

          {/* Empty state */}
          {status === 'idle' && (
            <Card className="py-16 text-center">
              <Search size={40} className="text-text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-text mb-2">Ready to Search</h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Upload your CV and configure your preferences, then click{' '}
                <strong>Start Job Search</strong> to find matching roles.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4 max-w-md mx-auto text-left">
                {[
                  { icon: '🔍', label: 'HN Hiring, RemoteOK, WWR, Arc.dev, Wellfound, Built In' },
                  { icon: '🤖', label: '6-dimension scoring: stack, experience, company, comp, remote, role type' },
                  { icon: '📄', label: 'Tailored CV + cover letter for every qualifying job' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-surface p-3">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <p className="text-xs text-text-secondary">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
