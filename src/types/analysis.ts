export const AGENT_NAMES = [
  'match-score',
  'cover-letter',
  'gap-analysis',
  'tailored-cv',
  'company-insights',
  'interview-prep',
  'networking-message',
] as const

export type AgentName = (typeof AGENT_NAMES)[number]

export type AgentStatus = 'idle' | 'running' | 'complete' | 'error'

export interface AgentState {
  status: AgentStatus
  result: unknown | null
  error: string | null
}

export interface MatchScoreResult {
  score: number
  matched_skills: string[]
  missing_skills: string[]
  keyword_gaps: string[]
  verdict: string
}

export interface CoverLetterResult {
  cover_letter: string
}

export interface GapAnalysisResult {
  critical: Array<{ skill: string; effort: string; suggestion: string }>
  important: Array<{ skill: string; effort: string; suggestion: string }>
  nice_to_have: Array<{ skill: string; effort: string; suggestion: string }>
  action_plan: string[]
}

export interface TailoredCvResult {
  summary: string
  skills_section: string
  experience_bullets: string[]
  key_changes: string[]
}

export interface CompanyInsightsResult {
  overview: string
  culture: string
  recent_news: string[]
  interview_tips: string[]
  red_flags: string[]
}

export interface InterviewPrepResult {
  questions: Array<{
    question: string
    suggested_answer: string
    type: 'behavioural' | 'technical' | 'situational' | 'role-specific'
    difficulty: 'standard' | 'tough'
  }>
}

export interface NetworkingMessageResult {
  linkedin_message: string
  follow_up_email: string
}

export const AGENT_LABELS: Record<AgentName, string> = {
  'match-score': 'Match Score',
  'cover-letter': 'Cover Letter',
  'gap-analysis': 'Gap Analysis',
  'tailored-cv': 'Tailored CV',
  'company-insights': 'Company Insights',
  'interview-prep': 'Interview Prep',
  'networking-message': 'Networking',
}
