import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const notesRouter = Router()

// GET /notes/:jobAnalysisId — List notes for a job analysis
notesRouter.get('/notes/:jobAnalysisId', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { jobAnalysisId } = req.params

  try {
    // Verify ownership of the job analysis
    const { data: job } = await supabaseAdmin
      .from('job_analyses')
      .select('id')
      .eq('id', jobAnalysisId)
      .eq('user_id', userId)
      .single()

    if (!job) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('job_analysis_id', jobAnalysisId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notes list error:', error)
      res.status(500).json({ error: 'Failed to fetch notes' })
      return
    }

    const notes = (data ?? []).map((n: Record<string, unknown>) => ({
      id: n.id,
      jobAnalysisId: n.job_analysis_id,
      content: n.content,
      createdAt: n.created_at,
    }))

    res.json(notes)
  } catch (err) {
    console.error('Notes list error:', err)
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

const createNoteSchema = z.object({
  jobAnalysisId: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

// POST /notes — Create a note
notesRouter.post('/notes', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!

  const parsed = createNoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  const { jobAnalysisId, content } = parsed.data

  try {
    // Verify ownership of the job analysis
    const { data: job } = await supabaseAdmin
      .from('job_analyses')
      .select('id')
      .eq('id', jobAnalysisId)
      .eq('user_id', userId)
      .single()

    if (!job) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        job_analysis_id: jobAnalysisId,
        user_id: userId,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('Note create error:', error)
      res.status(500).json({ error: 'Failed to create note' })
      return
    }

    res.status(201).json({
      id: data.id,
      jobAnalysisId: data.job_analysis_id,
      content: data.content,
      createdAt: data.created_at,
    })
  } catch (err) {
    console.error('Note create error:', err)
    res.status(500).json({ error: 'Failed to create note' })
  }
})

// DELETE /notes/:id — Delete a note (verify ownership)
notesRouter.delete('/notes/:id', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { id } = req.params

  try {
    // Verify ownership via the note's user_id
    const { data: note } = await supabaseAdmin
      .from('notes')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    if (note.user_id !== userId) {
      res.status(403).json({ error: 'Not authorised to delete this note' })
      return
    }

    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Note delete error:', error)
      res.status(500).json({ error: 'Failed to delete note' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Note delete error:', err)
    res.status(500).json({ error: 'Failed to delete note' })
  }
})
