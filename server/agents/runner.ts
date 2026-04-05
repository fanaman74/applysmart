import { anthropic, DEFAULT_MODEL } from '../lib/claude.js'
import { AGENT_NAMES } from './types.js'
import type { AgentName, AgentResult } from './types.js'

import getMatchScorePrompt from './prompts/match-score.js'
import getCoverLetterPrompt from './prompts/cover-letter.js'
import getGapAnalysisPrompt from './prompts/gap-analysis.js'
import getTailoredCvPrompt from './prompts/tailored-cv.js'
import getCompanyInsightsPrompt from './prompts/company-insights.js'
import getInterviewPrepPrompt from './prompts/interview-prep.js'
import getNetworkingMessagePrompt from './prompts/networking-message.js'

import type { AgentPromptConfig } from './types.js'

const promptFunctions: Record<AgentName, (cvText: string, jobDescription: string, company?: string) => AgentPromptConfig> = {
  'match-score': getMatchScorePrompt,
  'cover-letter': getCoverLetterPrompt,
  'gap-analysis': getGapAnalysisPrompt,
  'tailored-cv': getTailoredCvPrompt,
  'company-insights': getCompanyInsightsPrompt,
  'interview-prep': getInterviewPrepPrompt,
  'networking-message': getNetworkingMessagePrompt,
}

export interface RunAllAgentsParams {
  cvText: string
  jobDescription: string
  company?: string
  onAgentStart: (name: AgentName) => void
  onAgentComplete: (result: AgentResult) => void
  onAgentError: (name: AgentName, error: string) => void
  signal?: AbortSignal
}

async function runSingleAgent(
  agentName: AgentName,
  params: RunAllAgentsParams,
): Promise<AgentResult> {
  const { cvText, jobDescription, company, onAgentStart, onAgentComplete, onAgentError, signal } = params

  onAgentStart(agentName)

  const startMs = Date.now()

  try {
    const promptConfig = promptFunctions[agentName](cvText, jobDescription, company)

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: promptConfig.maxTokens,
      temperature: promptConfig.temperature,
      system: promptConfig.systemPrompt,
      messages: [{ role: 'user', content: promptConfig.userPrompt }],
    }, { signal })

    const durationMs = Date.now() - startMs

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    // Extract text from the response
    const textBlock = response.content.find((block) => block.type === 'text')
    const rawText = textBlock?.text ?? ''

    // Try to parse as JSON
    let parsed: unknown = rawText
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Not JSON — keep as raw string
    }

    const agentResult: AgentResult = {
      agentName,
      status: 'complete',
      result: parsed,
      tokensUsed,
      durationMs,
    }

    onAgentComplete(agentResult)
    return agentResult
  } catch (err) {
    const durationMs = Date.now() - startMs
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    onAgentError(agentName, errorMessage)

    return {
      agentName,
      status: 'error',
      error: errorMessage,
      tokensUsed: 0,
      durationMs,
    }
  }
}

export async function runAllAgents(params: RunAllAgentsParams): Promise<AgentResult[]> {
  const promises = AGENT_NAMES.map((agentName) => runSingleAgent(agentName, params))

  const settled = await Promise.allSettled(promises)

  return settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value
    }
    // Should not happen since runSingleAgent catches internally, but handle anyway
    return {
      agentName: AGENT_NAMES[i],
      status: 'error' as const,
      error: outcome.reason instanceof Error ? outcome.reason.message : 'Unknown error',
      tokensUsed: 0,
      durationMs: 0,
    }
  })
}
