import Anthropic from '@anthropic-ai/sdk'
import { anthropic, DEFAULT_MODEL } from '../lib/claude.js'
import type {
  CandidateProfile,
  SearchConfig,
  FoundJob,
  JobSearchSource,
  JobSearchAgentResult,
  JobSearchProgress,
  JobSearchSummary,
} from './job-search-types.js'

// ─── Source descriptions — what each platform is and how to search it ─────────

const SOURCE_DESCRIPTIONS: Record<string, string> = {
  'linkedin': `Search LinkedIn Jobs (https://www.linkedin.com/jobs/search/?keywords=TITLE&location=Brussels) for relevant roles. Try the candidate's top 3 target titles as separate searches. Filter by date posted (last 30 days). Click into individual listings to read the full JD.`,

  'indeed': `Search Indeed Belgium (https://be.indeed.com/jobs?q=TITLE&l=Brussels or https://www.indeed.com/jobs?q=TITLE&l=Brussels%2C+Belgium). Try each of the candidate's top target titles. Also try the international Indeed (indeed.com). Read full job descriptions for each match.`,

  'eurobrussels': `Search EuroBrussels (https://www.eurobrussels.com/job_search) — the premier Brussels job board for EU institutions, international organisations, NGOs, consultancies, and policy roles.

STEP-BY-STEP:
1. Go to https://www.eurobrussels.com/job_search and search using the candidate's profession/title
2. Also browse category pages:
   - https://www.eurobrussels.com/jobs/eu_institution (EU institution jobs)
   - https://www.eurobrussels.com/jobs/operations (IT/operations roles)
   - https://www.eurobrussels.com/jobs/policy (policy roles)
3. Alternatively use Google: search 'site:eurobrussels.com "IT project manager" OR "IT officer" OR "project manager"'
4. Click into each listing and read the full job description before scoring.`,

  'euractiv-jobs': `Search Euractiv Jobs (https://jobs.euractiv.com) — a specialist job board for EU policy, public affairs, international organisations, and Brussels institutions.

STEP-BY-STEP:
1. Go to https://jobs.euractiv.com and use the keyword search with the candidate's target titles
2. Filter by "Technology" or "Operations" category if available
3. Also try a Google search: 'site:jobs.euractiv.com "IT" OR "project manager" OR "digital"'
4. Euractiv lists roles from EU institutions, think tanks, NGOs, EU agencies, and consultancies. Read the full JD for each match.`,

  'weworkremotely': `Search We Work Remotely (https://weworkremotely.com) for remote roles matching the candidate's profile. Navigate to https://weworkremotely.com/remote-jobs/search?term=TITLE for each target title. Check all categories — not just technology. Also look at "Management & Finance" and "Operations" categories.`,

  'google-jobs': `Use web search to find jobs via Google Jobs and direct employer career pages.
Search strategies:
1. Use the candidate's Boolean combo queries directly as search terms
2. Search '"IT project manager" Brussels site:greenhouse.io OR site:lever.co OR site:ashby.com'
3. Search 'EU institutions "IT officer" OR "project manager" apply site:workday.com OR site:taleo.net'
4. Check results from EU agency career portals (EPSO, EMA, EIB, Frontex, Europol etc.)
Read each job listing fully before scoring.`,

  'glassdoor': `Search Glassdoor (https://www.glassdoor.com/Job/brussels-it-project-manager-jobs-SRCH_IL.0,8_IC2660204_KO9,27.htm or similar URL pattern) for jobs. Also try https://www.glassdoor.co.uk/Job/ with the candidate's titles and Brussels as location. Read full JDs including salary info where visible.`,
}

interface JobSearchAgent {
  source: JobSearchSource
  systemPrompt: string
  userPrompt: string
}

function buildAgentPrompt(
  source: JobSearchSource,
  profile: CandidateProfile,
  config: SearchConfig,
): JobSearchAgent {
  const avoidStr = config.avoidKeywords.length > 0
    ? `\nAvoid jobs mentioning: ${config.avoidKeywords.join(', ')}`
    : ''
  const avoidCompStr = config.avoidCompanies.length > 0
    ? `\nSkip these companies: ${config.avoidCompanies.join(', ')}`
    : ''
  const salaryStr = config.minSalary
    ? `\nMinimum salary: €${config.minSalary.toLocaleString()} or £${config.minSalary.toLocaleString()}`
    : ''
  const remoteStr = config.remoteOnly ? '\nRemote only — skip all onsite or hybrid roles.' : ''

  const systemPrompt = `You are a specialist job search agent. Search a specific job platform and find the best matching roles for this candidate.

CANDIDATE PROFILE:
- Name: ${profile.name}
- Profession: ${profile.profession}
- Level: ${profile.level} (${profile.yearsExperience} years experience)
- Location: ${profile.location}
- Primary Skills: ${profile.primaryStack.join(', ')}
- Secondary Skills: ${profile.secondaryStack.join(', ')}
- Target Roles: ${profile.targetTitles.join(', ')}
- Industries: ${profile.industries.join(', ')}
- Remote Preference: ${profile.remotePreference}

SEARCH QUERIES TO USE:
- Title searches: ${profile.searchQueries.titleQueries.slice(0, 5).join(' | ')}
- Keyword searches: ${profile.searchQueries.keywordQueries.slice(0, 3).join(' | ')}
- Boolean searches: ${profile.searchQueries.comboQueries.slice(0, 3).join(' | ')}

FILTERS:${remoteStr}${salaryStr}${avoidStr}${avoidCompStr}
- Max posting age: ${config.maxPostingAgeDays} days
- Include contract roles: ${config.includeContract ? 'yes' : 'no'}
- Include roles without salary: ${config.includeNoSalary ? 'yes' : 'no'}

SCORING RUBRIC (total 100 points):
- Skills Match (30pts): How well the job's required skills/tools match the candidate's primary and secondary stack
  Perfect match=30, Most skills=20, Partial=10, Few=3
- Experience Fit (20pts): Seniority level and years of experience alignment
  Exact level match=20, One level off=15, Stretch role=10, Significant mismatch=5
- Organisation Fit (15pts): How well the employer type/sector fits the candidate's background
  Same sector=15, Adjacent sector=10, Different but transferable=6, Unrelated=2
- Compensation (15pts): Salary/rate alignment with candidate's expected level
  Above market for level=15, At market=12, Slightly below=8, Way below=0, No salary info=${config.includeNoSalary ? '8' : '0'}
- Remote/Location (10pts): Location and working arrangement match
  Confirmed remote=10, Hybrid near candidate=7, Onsite in candidate city=5, Onsite elsewhere=0
- Role Type (10pts): How well the job title and responsibilities match target titles
  Primary target title=10, Adjacent title=7, Related but different=5, Unrelated=2

Return ONLY valid JSON with this structure:
{
  "jobs": [
    {
      "company": "Acme Corp",
      "role": "IT Programme Manager",
      "url": "https://...",
      "jobDescription": "Full job description text (copy the actual JD text, at least 200 words)...",
      "source": "${source}",
      "atsPlatform": "greenhouse|lever|ashby|workday|icims|taleo|direct|null",
      "location": "Brussels, Belgium or Remote",
      "remoteType": "remote|hybrid|onsite",
      "salaryRange": "€80k-€110k or null",
      "applicantCount": "47 applicants or null",
      "score": 82,
      "scoreBreakdown": {
        "skillsMatch": 25,
        "experienceFit": 18,
        "orgFit": 12,
        "compRange": 12,
        "remoteLocation": 7,
        "roleType": 10,
        "total": 84
      }
    }
  ]
}

Only include jobs with score >= ${config.scoreThreshold}. Find up to 8 qualifying jobs. Actually browse the site and read real job listings — do not fabricate jobs.`

  const euroFallback = (source === 'eurobrussels' || source === 'euractiv-jobs')
    ? `\nFALLBACK: If direct site navigation is blocked, use web_search with: site:${source === 'eurobrussels' ? 'eurobrussels.com' : 'jobs.euractiv.com'} ${profile.profession} ${profile.location}`
    : ''

  const userPrompt = `${SOURCE_DESCRIPTIONS[source] ?? `Search this platform for jobs matching the candidate profile.`}

Search for roles matching this candidate:
- Profession: ${profile.profession}, ${profile.yearsExperience} years experience, ${profile.level} level
- Location: ${profile.location}
- Target roles: ${profile.targetTitles.slice(0, 6).join(', ')}
- Key skills: ${profile.primaryStack.slice(0, 6).join(', ')}
${config.remoteOnly ? '- Remote only positions' : `- Prefer roles in or near ${profile.location}, or remote`}
${config.minSalary ? `- Minimum salary: €${config.minSalary.toLocaleString()}` : ''}

Search queries to use (try each one):
${profile.searchQueries.titleQueries.slice(0, 5).map((q) => `- "${q}"`).join('\n')}
${euroFallback}

IMPORTANT: You must actually use the web_search tool to find real job listings. Do not invent or fabricate job listings. Browse the actual pages, read the full job descriptions, score each against the rubric, and return the JSON response with all qualifying jobs found. If you find fewer than 3 jobs, try additional search queries.`

  return { source, systemPrompt, userPrompt }
}

async function runSearchAgent(agent: JobSearchAgent): Promise<JobSearchAgentResult> {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 8192,
      system: agent.systemPrompt,
      tools: [
        {
          type: 'web_search_20250305' as const,
          name: 'web_search',
          max_uses: 15,
        } as unknown as Anthropic.Tool,
      ],
      messages: [{ role: 'user', content: agent.userPrompt }],
    })

    // Extract the final text response (may come after tool use)
    const textBlocks = response.content.filter((b) => b.type === 'text')
    const lastText = textBlocks[textBlocks.length - 1]
    if (!lastText || lastText.type !== 'text') {
      return { source: agent.source, jobs: [], error: 'No text response from agent' }
    }

    const text = lastText.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { source: agent.source, jobs: [], error: 'No JSON found in response' }
    }

    const parsed = JSON.parse(jsonMatch[0]) as { jobs?: FoundJob[] }
    return { source: agent.source, jobs: parsed.jobs ?? [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { source: agent.source, jobs: [], error: message }
  }
}

async function generateFinalSummary(
  allJobs: FoundJob[],
  profile: CandidateProfile,
): Promise<string> {
  const topJobs = allJobs.slice(0, 10)
  const jobList = topJobs
    .map((j, i) => `${i + 1}. ${j.company} — ${j.role} (score: ${j.score}) — ${j.url}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write an executive market intelligence summary for this job search report.

Candidate: ${profile.name} — ${profile.profession} (${profile.level} level, ${profile.yearsExperience} years)
Location: ${profile.location}
Total qualifying roles found: ${allJobs.length}

Top matches:
${jobList || 'No qualifying matches found.'}

Write a concise summary (3-4 paragraphs) covering:
1. Overall market conditions and demand for this type of professional
2. Key themes among the top matches (organisation types, role requirements, compensation trends)
3. Specific actionable recommendations for this candidate's job search strategy
4. Any skills gaps or positioning improvements to consider

Be specific, data-driven, and actionable. UK English.`,
      },
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : 'Search completed successfully.'
}

async function tailorJobApplication(
  job: FoundJob,
  profile: CandidateProfile,
): Promise<{ tailoredResume: string; coverLetter: string }> {
  const [resumeResponse, coverResponse] = await Promise.all([
    anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Tailor this candidate's CV for the following job. Optimise for ATS by mirroring the job description's exact terminology. Preserve all facts, dates, and contact info — only reorder and reword to emphasise the most relevant experience.

JOB: ${job.role} at ${job.company}
JD: ${job.jobDescription?.slice(0, 3000) ?? 'Not available'}

CANDIDATE CV:
${profile.cvText.slice(0, 4000)}

Return the tailored CV as clean markdown. Start with the candidate's name as an H1.`,
        },
      ],
    }),
    anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Write a tailored cover letter for this job application. Be specific, concise, and mirror the job description language. No filler phrases or generic openings.

JOB: ${job.role} at ${job.company}
JD: ${job.jobDescription?.slice(0, 2000) ?? 'Not available'}

CANDIDATE:
- Profession: ${profile.profession}
- Level: ${profile.level}, ${profile.yearsExperience} years experience
- Primary skills: ${profile.primaryStack.join(', ')}
- Key achievements: ${profile.achievements.join('; ')}
- CV excerpt: ${profile.cvText.slice(0, 2000)}

Write 3-4 paragraphs, max 250 words. Start with a strong hook relevant to this specific role. UK English.`,
        },
      ],
    }),
  ])

  const resumeContent = resumeResponse.content[0]
  const coverContent = coverResponse.content[0]

  return {
    tailoredResume: resumeContent.type === 'text' ? resumeContent.text : '',
    coverLetter: coverContent.type === 'text' ? coverContent.text : '',
  }
}

export interface JobSearchRunnerOptions {
  profile: CandidateProfile
  config: SearchConfig
  onProgress: (event: JobSearchProgress) => void
}

export async function runJobSearch(options: JobSearchRunnerOptions): Promise<JobSearchSummary> {
  const { profile, config, onProgress } = options

  const validSources: JobSearchSource[] = [
    'linkedin', 'indeed', 'eurobrussels', 'euractiv-jobs',
    'weworkremotely', 'google-jobs', 'glassdoor',
  ]

  const sources = config.targetSources.filter(
    (s): s is JobSearchSource => validSources.includes(s as JobSearchSource),
  )

  // Build and fire all agents in parallel
  const agents = sources.map((source) => buildAgentPrompt(source, profile, config))

  const agentPromises = agents.map(async (agent) => {
    onProgress({ type: 'agent-start', source: agent.source })
    const result = await runSearchAgent(agent)
    if (result.error) {
      onProgress({ type: 'agent-error', source: agent.source, error: result.error })
    } else {
      onProgress({ type: 'agent-result', source: agent.source, totalFound: result.jobs.length })
    }
    return result
  })

  const results = await Promise.allSettled(agentPromises)

  // Collect all qualifying jobs, deduplicate by URL
  const jobMap = new Map<string, FoundJob>()
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const job of result.value.jobs) {
        if (!jobMap.has(job.url)) jobMap.set(job.url, job)
      }
    }
  }

  // Sort by score descending
  const allJobs = Array.from(jobMap.values()).sort((a, b) => b.score - a.score)

  // Tailor top 5 jobs in parallel
  const topJobsToTailor = allJobs.slice(0, 5)
  const tailoringResults = await Promise.allSettled(
    topJobsToTailor.map((job) => tailorJobApplication(job, profile)),
  )

  for (let i = 0; i < topJobsToTailor.length; i++) {
    const tailoring = tailoringResults[i]
    if (tailoring.status === 'fulfilled') {
      topJobsToTailor[i].tailoredResume = tailoring.value.tailoredResume
      topJobsToTailor[i].coverLetter = tailoring.value.coverLetter
    }
  }

  // Emit job-found events for all jobs
  for (const job of allJobs) {
    onProgress({ type: 'job-found', job })
  }

  // Generate market intelligence summary
  const marketInsights = await generateFinalSummary(allJobs, profile)

  const sourcesSearched = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<JobSearchAgentResult>).value.source)

  const summary: JobSearchSummary = {
    totalSearched: sources.length,
    totalQualified: allJobs.length,
    topMatches: allJobs.slice(0, 10),
    nearMisses: allJobs.slice(10, 20),
    sourcesSearched,
    marketInsights,
    recommendations: '',
  }

  onProgress({ type: 'search-complete', summary, totalQualified: allJobs.length })

  return summary
}
