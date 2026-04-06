import { Router, type Response } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { extractPdfText } from '../lib/pdf-extract.js'
import { extractDocxText } from '../lib/docx-extract.js'
import { extractCandidateProfile } from '../agents/extract-candidate-profile.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const BUCKET = 'cv-uploads'

export const cvRouter = Router()

// POST /cv/upload — Upload a CV, extract text, store file and profile
cvRouter.post(
  '/cv/upload',
  upload.single('file'),
  async (req, res: Response) => {
    const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
    const file = req.file

    if (!file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    if (!ALLOWED_MIMES.has(file.mimetype)) {
      res.status(400).json({ error: 'Only PDF and DOCX files are accepted' })
      return
    }

    try {
      // Extract text based on file type
      const isPdf = file.mimetype === 'application/pdf'
      const extractedText = isPdf
        ? await extractPdfText(file.buffer)
        : await extractDocxText(file.buffer)

      const ext = isPdf ? 'pdf' : 'docx'

      // If no authenticated user, skip storage/DB and return an ephemeral profile
      if (!req.userId) {
        res.status(201).json({
          id: crypto.randomUUID(),
          filename: file.originalname,
          fileType: ext,
          charCount: extractedText.length,
          createdAt: new Date().toISOString(),
          extractedText,
        })
        return
      }

      // Upload original file to Supabase Storage
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`

      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        })

      if (storageError) {
        res.status(500).json({ error: 'Failed to upload file to storage' })
        return
      }

      // Insert CV profile row
      const { data, error: dbError } = await supabaseAdmin
        .from('cv_profiles')
        .insert({
          user_id: userId,
          filename: file.originalname,
          file_type: ext,
          file_url: storagePath,
          extracted_text: extractedText,
        })
        .select('id, filename, file_type, created_at, extracted_text')
        .single()

      if (dbError) {
        // Clean up stored file on DB failure
        await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
        res.status(500).json({ error: 'Failed to save CV profile' })
        return
      }

      res.status(201).json({
        id: data.id,
        filename: data.filename,
        fileType: data.file_type,
        charCount: data.extracted_text?.length ?? 0,
        createdAt: data.created_at,
        extractedText: data.extracted_text ?? '',
      })
    } catch (err) {
      console.error('CV upload error:', err)
      res.status(500).json({ error: 'Failed to process CV' })
    }
  },
)

// GET /cv/list — List current user's CV profiles (includes saved analysis if available)
cvRouter.get('/cv/list', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabaseAdmin
    .from('cv_profiles')
    .select('id, filename, file_type, extracted_text, analysis, analysis_extracted_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'Failed to fetch CV profiles' })
    return
  }

  const profiles = data.map((row) => ({
    id: row.id,
    filename: row.filename,
    fileType: row.file_type,
    charCount: row.extracted_text?.length ?? 0,
    createdAt: row.created_at,
    extractedText: row.extracted_text ?? '',
    analysis: row.analysis ?? null,
    analysisExtractedAt: row.analysis_extracted_at ?? null,
  }))

  res.json({ profiles })
})

// DELETE /cv/:id — Delete a CV profile and its storage file
cvRouter.delete('/cv/:id', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!
  const { id } = req.params

  // Fetch the profile to get storage path and verify ownership
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('cv_profiles')
    .select('id, file_url, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    res.status(404).json({ error: 'CV profile not found' })
    return
  }

  if (profile.user_id !== userId) {
    res.status(403).json({ error: 'Not authorised to delete this CV' })
    return
  }

  // Remove from storage
  await supabaseAdmin.storage.from(BUCKET).remove([profile.file_url])

  // Remove from database
  const { error: deleteError } = await supabaseAdmin
    .from('cv_profiles')
    .delete()
    .eq('id', id)

  if (deleteError) {
    res.status(500).json({ error: 'Failed to delete CV profile' })
    return
  }

  res.json({ success: true })
})

// POST /cv/analyse — Deep AI analysis of a CV, producing a structured candidate profile
// If cvProfileId is provided and a saved analysis exists, returns the cached version unless force=true.
cvRouter.post('/cv/analyse', async (req, res: Response) => {
  const { cvText, cvProfileId, force } = req.body as { cvText?: string; cvProfileId?: string; force?: boolean }
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'

  let textToAnalyse = cvText ?? ''
  let profileRowId: string | null = cvProfileId ?? null

  // If a cvProfileId is given, load from DB (and return cached analysis if available)
  if (cvProfileId) {
    const { data: cv, error } = await supabaseAdmin
      .from('cv_profiles')
      .select('extracted_text, analysis, analysis_extracted_at')
      .eq('id', cvProfileId)
      .eq('user_id', userId)
      .single()

    if (error || !cv) {
      res.status(404).json({ error: 'CV not found' })
      return
    }

    // Return cached analysis if available and not forcing re-analysis
    if (cv.analysis && !force) {
      res.json({ ...cv.analysis, extractedAt: cv.analysis_extracted_at, cached: true })
      return
    }

    if (!textToAnalyse && cv.extracted_text) {
      textToAnalyse = cv.extracted_text
    }
  }

  if (!textToAnalyse) {
    res.status(400).json({ error: 'Either cvText or cvProfileId with extracted text is required' })
    return
  }

  try {
    const profile = await extractCandidateProfile(textToAnalyse)
    const { cvText: _cvText, ...profileWithoutText } = profile
    const extractedAt = new Date().toISOString()
    const payload = { ...profileWithoutText, extractedAt }

    // Persist analysis to the cv_profiles row (authenticated users with a real profile ID)
    if (profileRowId && userId !== '00000000-0000-0000-0000-000000000000') {
      await supabaseAdmin
        .from('cv_profiles')
        .update({ analysis: profileWithoutText, analysis_extracted_at: extractedAt })
        .eq('id', profileRowId)
        .eq('user_id', userId)
    }

    res.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('CV analyse error:', message)
    res.status(500).json({ error: 'Failed to analyse CV', detail: message })
  }
})

// GET /cv/:id/analysis — Return the saved analysis for a CV profile
cvRouter.get('/cv/:id/analysis', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('cv_profiles')
    .select('analysis, analysis_extracted_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    res.status(404).json({ error: 'CV profile not found' })
    return
  }

  if (!data.analysis) {
    res.status(404).json({ error: 'No analysis saved for this CV yet' })
    return
  }

  res.json({ ...data.analysis, extractedAt: data.analysis_extracted_at, cached: true })
})
