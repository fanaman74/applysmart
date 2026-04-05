import { create } from 'zustand'

export interface ScoreBreakdown {
  skillsMatch: number
  experienceFit: number
  orgFit: number
  compRange: number
  remoteLocation: number
  roleType: number
  total: number
  // legacy aliases kept for DB-loaded runs
  stackMatch?: number
  companyStability?: number
}

export interface FoundJob {
  id?: string
  company: string
  role: string
  url: string
  source: string
  atsPlatform: string | null
  location: string | null
  remoteType: string | null
  salaryRange: string | null
  score: number
  scoreBreakdown: ScoreBreakdown
  status: string
  tailoredResume: string | null
  coverLetter: string | null
  jobDescription: string | null
  createdAt?: string
}

export interface CandidateProfile {
  name: string
  location: string
  yearsExperience: number
  level: string
  primaryStack: string[]
  secondaryStack: string[]
  targetTitles: string[]
  industries: string[]
  achievements: string[]
}

export type SearchStatus =
  | 'idle'
  | 'extracting-profile'
  | 'searching'
  | 'complete'
  | 'error'

export interface AgentStatus {
  source: string
  status: 'pending' | 'running' | 'done' | 'error'
  jobsFound: number
  error?: string
}

interface JobSearchState {
  status: SearchStatus
  runId: string | null
  profile: CandidateProfile | null
  agents: AgentStatus[]
  jobs: FoundJob[]
  marketInsights: string | null
  error: string | null
  totalQualified: number

  setStatus: (status: SearchStatus) => void
  setRunId: (id: string) => void
  setProfile: (profile: CandidateProfile) => void
  startAgent: (source: string) => void
  finishAgent: (source: string, jobsFound: number) => void
  failAgent: (source: string, error: string) => void
  addJob: (job: FoundJob) => void
  setComplete: (runId: string, totalQualified: number, marketInsights: string) => void
  setError: (error: string) => void
  reset: () => void
  updateJobStatus: (jobId: string, status: string) => void
}

export const useJobSearchStore = create<JobSearchState>((set) => ({
  status: 'idle',
  runId: null,
  profile: null,
  agents: [],
  jobs: [],
  marketInsights: null,
  error: null,
  totalQualified: 0,

  setStatus: (status) => set({ status }),
  setRunId: (runId) => set({ runId }),
  setProfile: (profile) => set({ profile, status: 'searching' }),

  startAgent: (source) =>
    set((state) => {
      const existing = state.agents.find((a) => a.source === source)
      if (existing) {
        return {
          agents: state.agents.map((a) =>
            a.source === source ? { ...a, status: 'running' } : a,
          ),
        }
      }
      return {
        agents: [
          ...state.agents,
          { source, status: 'running', jobsFound: 0 },
        ],
      }
    }),

  finishAgent: (source, jobsFound) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.source === source ? { ...a, status: 'done', jobsFound } : a,
      ),
    })),

  failAgent: (source, error) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.source === source ? { ...a, status: 'error', error } : a,
      ),
    })),

  addJob: (job) =>
    set((state) => {
      if (state.jobs.some((j) => j.url === job.url)) return state
      return { jobs: [...state.jobs, job] }
    }),

  setComplete: (runId, totalQualified, marketInsights) =>
    set({ status: 'complete', runId, totalQualified, marketInsights }),

  setError: (error) => set({ status: 'error', error }),

  reset: () =>
    set({
      status: 'idle',
      runId: null,
      profile: null,
      agents: [],
      jobs: [],
      marketInsights: null,
      error: null,
      totalQualified: 0,
    }),

  updateJobStatus: (jobId, status) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
    })),
}))
