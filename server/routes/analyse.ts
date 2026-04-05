import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import crypto from 'node:crypto'
import { authMiddleware } from '../middleware/auth.js'
import { usageMiddleware } from '../middleware/usage.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { runAllAgents } from '../agents/runner.js'
import { AGENT_NAMES } from '../agents/types.js'
import type { AgentName } from '../agents/types.js'

const analyseBodySchema = z.object({
  cvProfileId: z.string().uuid(),
  jobDescription: z.string().min(1),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
})

export const analyseRouter = Router()

function sendSSE(res: Response, event: string, data: Record<string, unknown>) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

analyseRouter.post('/analyse', authMiddleware, usageMiddleware, async (req, res: Response) => {
  const userId = req.userId!

  // Validate request body
  const parsed = analyseBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  const { cvProfileId, jobDescription, jobTitle, companyName } = parsed.data

  try {
    // 1. Fetch CV text
    const { data: cvProfile, error: cvError } = await supabaseAdmin
      .from('cv_profiles')
      .select('id, extracted_text, user_id')
      .eq('id', cvProfileId)
      .single()

    if (cvError || !cvProfile) {
      res.status(404).json({ error: 'CV profile not found' })
      return
    }

    if (cvProfile.user_id !== userId) {
      res.status(403).json({ error: 'Not authorised to use this CV profile' })
      return
    }

    const cvText = cvProfile.extracted_text as string
    if (!cvText) {
      res.status(400).json({ error: 'CV profile has no extracted text' })
      return
    }

    // 2. Create job_analyses row
    const jobAnalysisId = crypto.randomUUID()
    const { error: analysisInsertError } = await supabaseAdmin
      .from('job_analyses')
      .insert({
        id: jobAnalysisId,
        user_id: userId,
        cv_profile_id: cvProfileId,
        job_description: jobDescription,
        job_title: jobTitle ?? null,
        company_name: companyName ?? null,
        status: 'analysing',
      })

    if (analysisInsertError) {
      console.error('Failed to create job_analyses row:', analysisInsertError)
      res.status(500).json({ error: 'Failed to create analysis' })
      return
    }

    // 3. Create analysis_results rows for each agent
    const resultRows = AGENT_NAMES.map((agentName) => ({
      id: crypto.randomUUID(),
      job_analysis_id: jobAnalysisId,
      agent_name: agentName,
      status: 'pending',
    }))

    const { error: resultsInsertError } = await supabaseAdmin
      .from('analysis_results')
      .insert(resultRows)

    if (resultsInsertError) {
      console.error('Failed to create analysis_results rows:', resultsInsertError)
      res.status(500).json({ error: 'Failed to create analysis result rows' })
      return
    }

    // 4. Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    res.flushHeaders()

    // Track whether client has disconnected
    const abortController = new AbortController()
    let clientDisconnected = false

    req.on('close', () => {
      clientDisconnected = true
      abortController.abort()
    })

    // 5. Run all agents with SSE callbacks
    await runAllAgents({
      cvText,
      jobDescription,
      company: companyName,
      signal: abortController.signal,

      onAgentStart: (name: AgentName) => {
        if (clientDisconnected) return

        sendSSE(res, 'agent-start', { agent: name })

        // Update DB row status to 'running' (fire and forget)
        supabaseAdmin
          .from('analysis_results')
          .update({ status: 'running' })
          .eq('job_analysis_id', jobAnalysisId)
          .eq('agent_name', name)
          .then()
      },

      onAgentComplete: (result) => {
        if (clientDisconnected) return

        sendSSE(res, 'agent-result', {
          agent: result.agentName,
          result: result.result,
        })

        // Update DB row with result
        supabaseAdmin
          .from('analysis_results')
          .update({
            status: 'complete',
            result: result.result as Record<string, unknown>,
            tokens_used: result.tokensUsed,
            duration_ms: result.durationMs,
          })
          .eq('job_analysis_id', jobAnalysisId)
          .eq('agent_name', result.agentName)
          .then()
      },

      onAgentError: (name: AgentName, error: string) => {
        if (clientDisconnected) return

        sendSSE(res, 'agent-error', { agent: name, error })

        // Update DB row with error
        supabaseAdmin
          .from('analysis_results')
          .update({
            status: 'error',
            error_message: error,
          })
          .eq('job_analysis_id', jobAnalysisId)
          .eq('agent_name', name)
          .then()
      },
    })

    // 6. All agents complete
    if (!clientDisconnected) {
      sendSSE(res, 'all-complete', { jobAnalysisId })
    }

    // 7. Update job_analyses status
    await supabaseAdmin
      .from('job_analyses')
      .update({ status: 'complete' })
      .eq('id', jobAnalysisId)

    // 8. Close response
    res.end()
  } catch (err) {
    console.error('Analysis endpoint error:', err)
    // If headers have already been sent (SSE streaming), just end
    if (res.headersSent) {
      res.end()
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})
