import { useJobSearchStore } from '../stores/jobSearchStore'
import { useAuthStore } from '../stores/authStore'
import { parseSSEStream } from '../lib/sse'
import type { FoundJob } from '../stores/jobSearchStore'

export function useJobSearch() {
  const store = useJobSearchStore()
  const session = useAuthStore((s) => s.session)

  async function startSearch(cvProfileId: string, configOverrides?: Record<string, unknown>, cvText?: string) {
    store.reset()
    store.setStatus('extracting-profile')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    try {
      const response = await fetch('/api/job-search/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cvProfileId, cvText, configOverrides }),
      })

      if (!response.ok || !response.body) {
        const text = await response.text()
        store.setError(`Search failed: ${text}`)
        return
      }

      for await (const event of parseSSEStream(response)) {
        const data = JSON.parse(event.data)

        switch (event.event) {
          case 'status':
            // status message — handled by store.status
            break
          case 'profile':
            store.setProfile(data.profile)
            break
          case 'run-created':
            store.setRunId(data.runId)
            break
          case 'agent-start':
            store.startAgent(data.source)
            break
          case 'agent-result':
            store.finishAgent(data.source, data.totalFound ?? 0)
            break
          case 'agent-error':
            store.failAgent(data.source, data.error ?? 'Unknown error')
            break
          case 'job-found':
            if (data.job) store.addJob(data.job as FoundJob)
            break
          case 'complete':
            store.setComplete(data.runId, data.totalQualified, data.marketInsights ?? '')
            break
          case 'error':
            store.setError(data.message ?? 'Search failed')
            break
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      store.setError(message)
    }
  }

  async function updateJobStatus(jobId: string, status: string) {
    if (!session?.access_token) return

    const response = await fetch(`/api/job-search/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (response.ok) {
      store.updateJobStatus(jobId, status)
    }
  }

  async function loadPreviousRun(runId: string) {
    if (!session?.access_token) return

    const response = await fetch(`/api/job-search/runs/${runId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!response.ok) return

    const { run, jobs } = (await response.json()) as {
      run: { run_summary?: { marketInsights?: string }; total_qualified?: number }
      jobs: Array<{
        id: string
        company: string
        role: string
        url: string
        source: string
        ats_platform: string | null
        location: string | null
        remote_type: string | null
        salary_range: string | null
        score: number
        score_breakdown: FoundJob['scoreBreakdown']
        status: string
        tailored_resume: string | null
        cover_letter: string | null
        job_description: string | null
        created_at: string
      }>
    }

    store.reset()
    store.setRunId(runId)
    store.setStatus('complete')

    for (const job of jobs) {
      store.addJob({
        id: job.id,
        company: job.company,
        role: job.role,
        url: job.url,
        source: job.source,
        atsPlatform: job.ats_platform,
        location: job.location,
        remoteType: job.remote_type,
        salaryRange: job.salary_range,
        score: job.score,
        scoreBreakdown: job.score_breakdown,
        status: job.status,
        tailoredResume: job.tailored_resume,
        coverLetter: job.cover_letter,
        jobDescription: job.job_description,
        createdAt: job.created_at,
      })
    }

    if (run.run_summary?.marketInsights) {
      store.setComplete(runId, run.total_qualified ?? jobs.length, run.run_summary.marketInsights)
    }
  }

  return {
    ...store,
    startSearch,
    updateJobStatus,
    loadPreviousRun,
  }
}
