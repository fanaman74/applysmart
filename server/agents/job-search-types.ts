export interface SearchConfig {
  remoteOnly: boolean
  minSalary: number | null
  companySizeMin: number
  experienceLevel: string
  roleTypes: string[]
  avoidKeywords: string[]
  avoidCompanies: string[]
  avoidIndustries: string[]
  prioritizeKeywords: string[]
  prioritizeIndustries: string[]
  targetSources: string[]
  maxPostingAgeDays: number
  includeNoSalary: boolean
  includeContract: boolean
  scoreThreshold: number
}

export interface CandidateProfile {
  name: string
  slug?: string
  location: string
  yearsExperience: number
  level: string
  profession: string          // e.g. "IT Project Manager", "Software Engineer"
  primaryStack: string[]      // Core skills/tools/technologies/certifications
  secondaryStack: string[]    // Additional skills
  targetTitles: string[]      // Job titles to search for
  jobTitles: string[]         // Titles actually held
  industries: string[]        // Sectors / organisation types worked in
  achievements: string[]
  education?: Array<{ school: string; degree: string; status: string }>
  certifications?: string[]
  languages?: { native: string[]; working: string[] }
  summary: string
  remotePreference: string    // "remote" | "hybrid" | "onsite" | "flexible" | "open"
  searchQueries: {
    titleQueries: string[]    // 5-8 title-based search strings
    keywordQueries: string[]  // 3-5 skill/keyword search strings
    comboQueries: string[]    // 3-5 combined title+keyword strings
  }
  cvText: string
}

export interface ScoreBreakdown {
  skillsMatch: number       // 0-30: Core skills/tools match
  experienceFit: number     // 0-20: Level and years fit
  orgFit: number            // 0-15: Organisation type / sector fit
  compRange: number         // 0-15: Compensation match
  remoteLocation: number    // 0-10: Remote/location match
  roleType: number          // 0-10: Role type alignment
  total: number             // 0-100
}

export interface FoundJob {
  company: string
  role: string
  url: string
  jobDescription: string
  source: string
  atsPlatform: string | null
  location: string | null
  remoteType: string | null
  salaryRange: string | null
  applicantCount: string | null
  score: number
  scoreBreakdown: ScoreBreakdown
  tailoredResume: string | null
  coverLetter: string | null
}

export type JobSearchSource =
  | 'linkedin'
  | 'indeed'
  | 'eurobrussels'
  | 'euractiv-jobs'
  | 'eu-careers'
  | 'eu-institutions'
  | 'impactpool'
  | 'weworkremotely'
  | 'google-jobs'
  | 'glassdoor'

export interface JobSearchAgentResult {
  source: JobSearchSource
  jobs: FoundJob[]
  error?: string
}

export interface JobSearchProgress {
  type: 'agent-start' | 'agent-result' | 'agent-error' | 'job-found' | 'search-complete'
  source?: JobSearchSource
  job?: FoundJob
  totalFound?: number
  totalQualified?: number
  summary?: JobSearchSummary
  error?: string
}

export interface JobSearchSummary {
  totalSearched: number
  totalQualified: number
  topMatches: FoundJob[]
  nearMisses: FoundJob[]
  sourcesSearched: string[]
  marketInsights: string
  recommendations: string
}
