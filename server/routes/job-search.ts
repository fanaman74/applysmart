import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { extractCandidateProfile } from '../agents/extract-candidate-profile.js'
import { runJobSearch } from '../agents/job-search-runner.js'
import type { SearchConfig, JobSearchProgress } from '../agents/job-search-types.js'

export const jobSearchRouter = Router()

// ─── Search Config ────────────────────────────────────────────────────────────

const configSchema = z.object({
  cvProfileId: z.string().uuid().optional(),
  remoteOnly: z.boolean().default(true),
  minSalary: z.number().int().positive().nullable().default(null),
  companySizeMin: z.number().int().default(10),
  experienceLevel: z.string().default('mid'),
  roleTypes: z.array(z.string()).default([]),
  avoidKeywords: z.array(z.string()).default([]),
  avoidCompanies: z.array(z.string()).default([]),
  avoidIndustries: z.array(z.string()).default([]),
  prioritizeKeywords: z.array(z.string()).default([]),
  prioritizeIndustries: z.array(z.string()).default([]),
  targetSources: z
    .array(z.string())
    .default(['hn-hiring', 'weworkremotely', 'remoteok', 'arc', 'builtin', 'wellfound']),
  maxPostingAgeDays: z.number().int().default(30),
  includeNoSalary: z.boolean().default(false),
  includeContract: z.boolean().default(false),
  scoreThreshold: z.number().int().min(0).max(100).default(70),
})

// GET /job-search/config
jobSearchRouter.get('/job-search/config', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { data, error } = await supabaseAdmin
    .from('job_search_configs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    res.status(500).json({ error: 'Failed to fetch config' })
    return
  }

  res.json(data ?? null)
})

// PUT /job-search/config
jobSearchRouter.put('/job-search/config', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const parsed = configSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid config', details: parsed.error.flatten() })
    return
  }

  const d = parsed.data
  const { data, error } = await supabaseAdmin
    .from('job_search_configs')
    .upsert(
      {
        user_id: userId,
        cv_profile_id: d.cvProfileId ?? null,
        remote_only: d.remoteOnly,
        min_salary: d.minSalary,
        company_size_min: d.companySizeMin,
        experience_level: d.experienceLevel,
        role_types: d.roleTypes,
        avoid_keywords: d.avoidKeywords,
        avoid_companies: d.avoidCompanies,
        avoid_industries: d.avoidIndustries,
        prioritize_keywords: d.prioritizeKeywords,
        prioritize_industries: d.prioritizeIndustries,
        target_sources: d.targetSources,
        max_posting_age_days: d.maxPostingAgeDays,
        include_no_salary: d.includeNoSalary,
        include_contract: d.includeContract,
        score_threshold: d.scoreThreshold,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('Config save error:', error)
    res.status(500).json({ error: 'Failed to save config' })
    return
  }

  res.json(data)
})

// POST /job-search/generate-config — auto-generate config from CV
jobSearchRouter.post('/job-search/generate-config', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { cvProfileId } = req.body as { cvProfileId?: string }

  if (!cvProfileId) {
    res.status(400).json({ error: 'cvProfileId is required' })
    return
  }

  try {
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cv_profiles')
      .select('extracted_text')
      .eq('id', cvProfileId)
      .eq('user_id', userId)
      .single()

    if (cvError || !cv?.extracted_text) {
      res.status(404).json({ error: 'CV not found or has no extracted text' })
      return
    }

    const profile = await extractCandidateProfile(cv.extracted_text)

    // Build sensible defaults from the profile
    const suggestedConfig = {
      cvProfileId,
      remoteOnly: true,
      minSalary: null,
      companySizeMin: 20,
      experienceLevel: profile.level,
      roleTypes: profile.targetTitles,
      avoidKeywords: ['security clearance', 'polygraph', 'government only', 'fedramp'],
      avoidCompanies: [],
      avoidIndustries: [],
      prioritizeKeywords: profile.primaryStack,
      prioritizeIndustries: profile.industries,
      targetSources: ['hn-hiring', 'weworkremotely', 'remoteok', 'arc', 'builtin', 'wellfound'],
      maxPostingAgeDays: 30,
      includeNoSalary: false,
      includeContract: false,
      scoreThreshold: 65,
    }

    res.json({ config: suggestedConfig, profile })
  } catch (err) {
    console.error('Generate config error:', err)
    res.status(500).json({ error: 'Failed to generate config' })
  }
})

// ─── Search Runs ──────────────────────────────────────────────────────────────

// GET /job-search/runs
jobSearchRouter.get('/job-search/runs', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { data, error } = await supabaseAdmin
    .from('job_search_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    res.status(500).json({ error: 'Failed to fetch runs' })
    return
  }

  res.json(data ?? [])
})

// GET /job-search/runs/:id
jobSearchRouter.get('/job-search/runs/:id', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { id } = req.params

  const [runResult, jobsResult] = await Promise.all([
    supabaseAdmin.from('job_search_runs').select('*').eq('id', id).eq('user_id', userId).single(),
    supabaseAdmin
      .from('found_jobs')
      .select('*')
      .eq('run_id', id)
      .eq('user_id', userId)
      .order('score', { ascending: false }),
  ])

  if (runResult.error || !runResult.data) {
    res.status(404).json({ error: 'Run not found' })
    return
  }

  res.json({ run: runResult.data, jobs: jobsResult.data ?? [] })
})

// ─── Found Jobs ───────────────────────────────────────────────────────────────

// GET /job-search/jobs
jobSearchRouter.get('/job-search/jobs', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const status = req.query.status as string | undefined

  let query = supabaseAdmin
    .from('found_jobs')
    .select('id, company, role, url, source, score, score_breakdown, status, location, remote_type, salary_range, created_at, run_id')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(100)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' })
    return
  }

  res.json(data ?? [])
})

// GET /job-search/jobs/:id
jobSearchRouter.get('/job-search/jobs/:id', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('found_jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  res.json(data)
})

// PATCH /job-search/jobs/:id/status
jobSearchRouter.patch('/job-search/jobs/:id/status', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'
  const { id } = req.params
  const { status } = req.body as { status?: string }

  const validStatuses = ['new', 'saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'skipped']
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'applied') updateData.applied_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('found_jobs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, status, applied_at')
    .single()

  if (error || !data) {
    res.status(500).json({ error: 'Failed to update status' })
    return
  }

  res.json(data)
})

// ─── Main Search SSE Endpoint ─────────────────────────────────────────────────

const startSearchSchema = z.object({
  cvProfileId: z.string().uuid().optional(),
  cvText: z.string().optional(),
  configOverrides: configSchema.partial().optional(),
})

// POST /job-search/start — SSE streaming job search
jobSearchRouter.post('/job-search/start', async (req, res: Response) => {
  const userId = req.userId ?? '00000000-0000-0000-0000-000000000000'

  const parsed = startSearchSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
    return
  }

  const { cvProfileId, cvText: inlineCvText, configOverrides } = parsed.data

  if (!cvProfileId && !inlineCvText) {
    res.status(400).json({ error: 'Either cvProfileId or cvText is required' })
    return
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  function sendEvent(event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  let runId: string | null = null

  try {
    // Load CV — use inline text if provided (unauthenticated), otherwise load from DB
    let cvExtractedText = inlineCvText ?? ''
    if (cvProfileId && !inlineCvText) {
      const { data: cv, error: cvError } = await supabaseAdmin
        .from('cv_profiles')
        .select('extracted_text, filename')
        .eq('id', cvProfileId)
        .eq('user_id', userId)
        .single()

      if (cvError || !cv?.extracted_text) {
        sendEvent('error', { message: 'CV not found or has no extracted text' })
        res.end()
        return
      }
      cvExtractedText = cv.extracted_text
    }

    if (!cvExtractedText) {
      sendEvent('error', { message: 'CV has no extractable text' })
      res.end()
      return
    }

    // Load config
    const { data: dbConfig } = await supabaseAdmin
      .from('job_search_configs')
      .select('*')
      .eq('user_id', userId)
      .single()

    const config: SearchConfig = {
      remoteOnly: configOverrides?.remoteOnly ?? dbConfig?.remote_only ?? true,
      minSalary: configOverrides?.minSalary ?? dbConfig?.min_salary ?? null,
      companySizeMin: configOverrides?.companySizeMin ?? dbConfig?.company_size_min ?? 10,
      experienceLevel: configOverrides?.experienceLevel ?? dbConfig?.experience_level ?? 'mid',
      roleTypes: configOverrides?.roleTypes ?? dbConfig?.role_types ?? [],
      avoidKeywords: configOverrides?.avoidKeywords ?? dbConfig?.avoid_keywords ?? [],
      avoidCompanies: configOverrides?.avoidCompanies ?? dbConfig?.avoid_companies ?? [],
      avoidIndustries: configOverrides?.avoidIndustries ?? dbConfig?.avoid_industries ?? [],
      prioritizeKeywords: configOverrides?.prioritizeKeywords ?? dbConfig?.prioritize_keywords ?? [],
      prioritizeIndustries:
        configOverrides?.prioritizeIndustries ?? dbConfig?.prioritize_industries ?? [],
      targetSources: configOverrides?.targetSources ?? dbConfig?.target_sources ?? [
        'hn-hiring',
        'weworkremotely',
        'remoteok',
        'arc',
        'builtin',
        'wellfound',
      ],
      maxPostingAgeDays: configOverrides?.maxPostingAgeDays ?? dbConfig?.max_posting_age_days ?? 30,
      includeNoSalary: configOverrides?.includeNoSalary ?? dbConfig?.include_no_salary ?? false,
      includeContract: configOverrides?.includeContract ?? dbConfig?.include_contract ?? false,
      scoreThreshold: configOverrides?.scoreThreshold ?? dbConfig?.score_threshold ?? 65,
    }

    sendEvent('status', { message: 'Extracting candidate profile from CV...' })

    // Extract candidate profile
    const profile = await extractCandidateProfile(cvExtractedText)
    sendEvent('profile', { profile })

    // Create run record (skip DB for anonymous users)
    const isAnonymous = userId === '00000000-0000-0000-0000-000000000000'
    const { data: run, error: runError } = isAnonymous
      ? { data: { id: crypto.randomUUID() }, error: null }
      : await supabaseAdmin
          .from('job_search_runs')
          .insert({
            user_id: userId,
            config_id: dbConfig?.id ?? null,
            cv_profile_id: cvProfileId ?? null,
            status: 'running',
            sources_searched: config.targetSources,
          })
          .select('id')
          .single()

    if (runError || !run) {
      sendEvent('error', { message: 'Failed to create search run' })
      res.end()
      return
    }

    runId = run.id
    sendEvent('run-created', { runId })

    // Track all jobs found during the run
    const allFoundJobs: Array<{ job: ReturnType<typeof Object.assign>; saved: boolean }> = []

    // Run the search
    const summary = await runJobSearch({
      profile,
      config,
      onProgress: async (event: JobSearchProgress) => {
        sendEvent(event.type, event)

        // Persist each job to DB as it's found (skip for anonymous)
        if (event.type === 'job-found' && event.job && !isAnonymous) {
          const job = event.job
          try {
            const { data: savedJob } = await supabaseAdmin
              .from('found_jobs')
              .upsert(
                {
                  user_id: userId,
                  run_id: runId,
                  company: job.company,
                  role: job.role,
                  url: job.url,
                  job_description: job.jobDescription,
                  source: job.source,
                  ats_platform: job.atsPlatform,
                  location: job.location,
                  remote_type: job.remoteType,
                  salary_range: job.salaryRange,
                  applicant_count: job.applicantCount,
                  score: job.score,
                  score_breakdown: job.scoreBreakdown,
                  tailored_resume: job.tailoredResume,
                  cover_letter: job.coverLetter,
                  status: 'new',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,url', ignoreDuplicates: false },
              )
              .select('id')
              .single()

            if (savedJob) {
              allFoundJobs.push({ job, saved: true })
            }
          } catch (dbErr) {
            console.error('Failed to save job:', dbErr)
          }
        }
      },
    })

    // Update run to completed (skip for anonymous)
    if (!isAnonymous && runId) {
      await supabaseAdmin
        .from('job_search_runs')
        .update({
          status: 'completed',
          total_found: summary.totalQualified,
          total_qualified: summary.totalQualified,
          sources_searched: summary.sourcesSearched,
          run_summary: {
            marketInsights: summary.marketInsights,
            topMatchCount: summary.topMatches.length,
            nearMissCount: summary.nearMisses.length,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    sendEvent('complete', {
      runId,
      totalQualified: summary.totalQualified,
      marketInsights: summary.marketInsights,
    })
  } catch (err) {
    console.error('Job search error:', err)
    const message = err instanceof Error ? err.message : 'Search failed'

    if (runId) {
      await supabaseAdmin
        .from('job_search_runs')
        .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
        .eq('id', runId)
    }

    sendEvent('error', { message })
  } finally {
    res.end()
  }
})
