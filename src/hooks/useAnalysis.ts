import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { parseSSEStream } from '../lib/sse'
import { useAnalysisStore } from '../stores/analysisStore'
import { AGENT_NAMES } from '../types/analysis'
import type { AgentName } from '../types/analysis'

interface StartAnalysisParams {
  cvProfileId: string
  jobDescription: string
  jobTitle?: string
  companyName?: string
}

export function useAnalysis() {
  const {
    agents,
    isAnalysing,
    jobAnalysisId,
    jobTitle,
    companyName,
    startAnalysis: storeStartAnalysis,
    setAgentStatus,
    setAgentResult,
    setAgentError,
    completeAnalysis,
    reset,
  } = useAnalysisStore()

  const startAnalysis = useCallback(
    async ({ cvProfileId, jobDescription, jobTitle, companyName }: StartAnalysisParams) => {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Reset store and mark as analysing
      storeStartAnalysis(jobTitle, companyName)

      try {
        const response = await fetch('/api/analyse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cvProfileId, jobDescription, jobTitle, companyName }),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Analysis request failed' }))
          throw new Error(errorBody.message ?? errorBody.error ?? `Request failed with status ${response.status}`)
        }

        for await (const event of parseSSEStream(response)) {
          const data = JSON.parse(event.data)

          switch (event.event) {
            case 'agent-start':
              setAgentStatus(data.agent as AgentName, 'running')
              break

            case 'agent-result':
              setAgentResult(data.agent as AgentName, data.result)
              break

            case 'agent-error':
              setAgentError(data.agent as AgentName, data.error)
              break

            case 'all-complete':
              completeAnalysis(data.jobAnalysisId)
              break
          }
        }
      } catch (error) {
        // Set all still-pending agents to error state
        const currentAgents = useAnalysisStore.getState().agents
        for (const name of AGENT_NAMES) {
          if (currentAgents[name].status === 'idle' || currentAgents[name].status === 'running') {
            setAgentError(
              name,
              error instanceof Error ? error.message : 'Analysis failed unexpectedly'
            )
          }
        }

        // Ensure isAnalysing is set to false
        completeAnalysis('')
      }
    },
    [storeStartAnalysis, setAgentStatus, setAgentResult, setAgentError, completeAnalysis]
  )

  return {
    agents,
    isAnalysing,
    jobAnalysisId,
    jobTitle,
    companyName,
    startAnalysis,
    reset,
  }
}
