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

export interface AgentPromptConfig {
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
}

export interface AgentResult {
  agentName: AgentName
  status: 'complete' | 'error'
  result?: unknown
  error?: string
  tokensUsed: number
  durationMs: number
}
