import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const trackerRouter = Router()

// GET /tracker — List all job analyses for the authenticated user
trackerRouter.get('/tracker', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!

  try {
    const { data, error } = await supabaseAdmin
      .from('job_analyses')
      .select(`
        id,
        job_title,
        company_name,
        status,
        tracker_status,
        match_score:analysis_results!inner(result),
        location,
        remote_type,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      // If the inner join fails (no match-score results), fall back to a simpler query
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('job_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('Tracker list error:', fallbackError)
        res.status(500).json({ error: 'Failed to fetch applications' })
        return
      }

      // Fetch match scores separately
      const ids = (fallbackData ?? []).map((r: Record<string, unknown>) => r.id as string)
      const { data: scores } = ids.length > 0
        ? await supabaseAdmin
            .from('analysis_results')
            .select('job_analysis_id, result')
            .in('job_analysis_id', ids)
            .eq('agent_name', 'match-score')
        : { data: [] }

      const scoreMap = new Map<string, number>()
      for (const s of scores ?? []) {
        const result = s.result as Record<string, unknown> | null
        if (result && typeof result.score === 'number') {
          scoreMap.set(s.job_analysis_id as string, result.score)
        }
      }

      const applications = (fallbackData ?? []).map((row: Record<string, unknown>) => ({
        id: row.id,
        jobTitle: row.job_title,
        companyName: row.company_name,
        status: row.status,
        trackerStatus: row.tracker_status ?? 'saved',
        matchScore: scoreMap.get(row.id as string) ?? null,
        location: row.location,
        remoteType: row.remote_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      res.json(applications)
      return
    }

    // Build score map from joined results
    const scoreMap = new Map<string, number>()
    for (const row of data ?? []) {
      const results = row.match_score as unknown as Array<{ result: Record<string, unknown> }> | null
      if (results && results.length > 0) {
        const result = results[0].result
        if (result && typeof result.score === 'number') {
          scoreMap.set(row.id as string, result.score)
        }
      }
    }

    const applications = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      jobTitle: row.job_title,
      companyName: row.company_name,
      status: row.status,
      trackerStatus: (row as Record<string, unknown>).tracker_status ?? 'saved',
      matchScore: scoreMap.get(row.id as string) ?? null,
      location: row.location,
      remoteType: row.remote_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    res.json(applications)
  } catch (err) {
    console.error('Tracker list error:', err)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

// GET /tracker/:id — Get single job analysis with all analysis results
trackerRouter.get('/tracker/:id', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { id } = req.params

  try {
    const { data: job, error: jobError } = await supabaseAdmin
      .from('job_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (jobError || !job) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    const { data: results, error: resultsError } = await supabaseAdmin
      .from('analysis_results')
      .select('*')
      .eq('job_analysis_id', id)
      .order('created_at', { ascending: true })

    if (resultsError) {
      console.error('Tracker detail results error:', resultsError)
    }

    res.json({
      id: job.id,
      jobTitle: job.job_title,
      companyName: job.company_name,
      jobDescription: job.job_description,
      status: job.status,
      trackerStatus: job.tracker_status ?? 'saved',
      trackerPosition: job.tracker_position,
      appliedAt: job.applied_at,
      salaryRange: job.salary_range,
      location: job.location,
      remoteType: job.remote_type,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      analysisResults: (results ?? []).map((r: Record<string, unknown>) => ({
        id: r.id,
        agentName: r.agent_name,
        status: r.status,
        result: r.result,
        createdAt: r.created_at,
      })),
    })
  } catch (err) {
    console.error('Tracker detail error:', err)
    res.status(500).json({ error: 'Failed to fetch application details' })
  }
})

const updateStatusSchema = z.object({
  trackerStatus: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn']),
})

// PATCH /tracker/:id/status — Update tracker status
trackerRouter.patch('/tracker/:id/status', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { id } = req.params

  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  const { trackerStatus } = parsed.data

  try {
    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('job_analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    const updateData: Record<string, unknown> = {
      tracker_status: trackerStatus,
      updated_at: new Date().toISOString(),
    }

    // Set applied_at when moving to 'applied' status
    if (trackerStatus === 'applied') {
      updateData.applied_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('job_analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Tracker status update error:', error)
      res.status(500).json({ error: 'Failed to update status' })
      return
    }

    res.json({
      id: data.id,
      trackerStatus: data.tracker_status,
      appliedAt: data.applied_at,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    console.error('Tracker status update error:', err)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// DELETE /tracker/:id — Delete a job analysis (cascade deletes analysis_results)
trackerRouter.delete('/tracker/:id', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { id } = req.params

  try {
    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('job_analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    // Delete analysis results first (in case no cascade)
    await supabaseAdmin
      .from('analysis_results')
      .delete()
      .eq('job_analysis_id', id)

    const { error } = await supabaseAdmin
      .from('job_analyses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Tracker delete error:', error)
      res.status(500).json({ error: 'Failed to delete application' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Tracker delete error:', err)
    res.status(500).json({ error: 'Failed to delete application' })
  }
})
