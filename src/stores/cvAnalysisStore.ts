import { create } from 'zustand'

export interface CvAnalysisProfile {
  name: string
  slug?: string
  location: string
  yearsExperience: number
  level: string
  profession: string
  primaryStack: string[]
  secondaryStack: string[]
  jobTitles: string[]
  targetTitles: string[]
  industries: string[]
  achievements: string[]
  education: Array<{ school: string; degree: string; status: string }>
  certifications: string[]
  languages: { native: string[]; working: string[] }
  summary: string
  remotePreference: string
  searchQueries: {
    titleQueries: string[]
    keywordQueries: string[]
    comboQueries: string[]
  }
  extractedAt: string
}

type AnalysisStatus = 'idle' | 'analysing' | 'complete' | 'error'

interface CvAnalysisState {
  status: AnalysisStatus
  profile: CvAnalysisProfile | null
  error: string | null
  setAnalysing: () => void
  setProfile: (profile: CvAnalysisProfile) => void
  setError: (error: string) => void
  reset: () => void
}

export const useCvAnalysisStore = create<CvAnalysisState>((set) => ({
  status: 'idle',
  profile: null,
  error: null,
  setAnalysing: () => set({ status: 'analysing', error: null }),
  setProfile: (profile) => set({ status: 'complete', profile, error: null }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', profile: null, error: null }),
}))
