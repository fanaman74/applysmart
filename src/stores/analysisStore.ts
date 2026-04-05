import { create } from 'zustand'
import type { AgentName, AgentState, AgentStatus } from '../types/analysis'
import { AGENT_NAMES } from '../types/analysis'

function createInitialAgents(): Record<AgentName, AgentState> {
  const agents = {} as Record<AgentName, AgentState>
  for (const name of AGENT_NAMES) {
    agents[name] = { status: 'idle', result: null, error: null }
  }
  return agents
}

interface AnalysisState {
  agents: Record<AgentName, AgentState>
  jobAnalysisId: string | null
  isAnalysing: boolean
  jobTitle: string | null
  companyName: string | null

  startAnalysis: (jobTitle?: string, companyName?: string) => void
  setAgentStatus: (name: AgentName, status: AgentStatus) => void
  setAgentResult: (name: AgentName, result: unknown) => void
  setAgentError: (name: AgentName, error: string) => void
  completeAnalysis: (jobAnalysisId: string) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  agents: createInitialAgents(),
  jobAnalysisId: null,
  isAnalysing: false,
  jobTitle: null,
  companyName: null,

  startAnalysis: (jobTitle?: string, companyName?: string) =>
    set({
      agents: createInitialAgents(),
      jobAnalysisId: null,
      isAnalysing: true,
      jobTitle: jobTitle ?? null,
      companyName: companyName ?? null,
    }),

  setAgentStatus: (name, status) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [name]: { ...state.agents[name], status },
      },
    })),

  setAgentResult: (name, result) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [name]: { ...state.agents[name], status: 'complete' as const, result },
      },
    })),

  setAgentError: (name, error) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [name]: { ...state.agents[name], status: 'error' as const, error },
      },
    })),

  completeAnalysis: (jobAnalysisId) =>
    set({ isAnalysing: false, jobAnalysisId }),

  reset: () =>
    set({
      agents: createInitialAgents(),
      jobAnalysisId: null,
      isAnalysing: false,
      jobTitle: null,
      companyName: null,
    }),
}))
