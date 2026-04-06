import { anthropic, DEFAULT_MODEL } from '../lib/claude.js'
import type { CandidateProfile } from './job-search-types.js'

export async function extractCandidateProfile(cvText: string): Promise<CandidateProfile> {
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyse this CV and return ONLY a valid JSON object (no markdown, no code blocks).

CRITICAL EXTRACTION RULES — read carefully before extracting:

1. "summary": Copy the candidate's own professional summary/profile statement VERBATIM from the CV. Do NOT paraphrase, rewrite, or generate a new summary. If the CV has a "Professional Summary", "Profile", or "About" section at the top, copy that text exactly as written. If none exists, use an empty string "".

2. "profession": Use their actual full job title/headline EXACTLY as it appears at the top of the CV or in their summary — e.g. "Senior IT Programme Manager and Local Cybersecurity Officer". Do NOT simplify to a generic category like "Programme Manager".

3. "level": junior = <2yr, mid = 2–5yr, senior = 5–10yr, staff = 10–20yr, principal = 20yr+

4. "achievements": Extract 4–6 metric-backed bullets directly from the CV text. Quote real numbers and outcomes — do not invent metrics.

5. "targetTitles": 6–10 realistic job titles the candidate should search for, matching their actual field and seniority.

6. "searchQueries": Reflect their real location and profession in all queries.

Return this exact JSON structure:
{
  "name": "string",
  "slug": "lowercase-hyphenated",
  "location": "City, Country",
  "yearsExperience": number,
  "level": "junior|mid|senior|staff|principal",
  "profession": "Full title exactly as on CV",
  "primaryStack": ["8-12 core skills/tools/certs from the CV"],
  "secondaryStack": ["additional skills"],
  "jobTitles": ["all titles held, from the CV"],
  "targetTitles": ["6-10 titles to search for"],
  "industries": ["sectors and org types"],
  "achievements": ["4-6 metric-backed bullets copied from the CV"],
  "education": [{"school": "", "degree": "", "status": ""}],
  "certifications": ["list from CV"],
  "languages": {"native": [], "working": []},
  "summary": "VERBATIM text from CV professional summary section",
  "remotePreference": "remote|hybrid|onsite|flexible",
  "searchQueries": {
    "titleQueries": ["6 location-aware title searches"],
    "keywordQueries": ["4 skill combination searches"],
    "comboQueries": ["4 Boolean strings with quotes and OR operators"]
  }
}

CV TEXT:
${cvText}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in profile extraction response')

  const profile = JSON.parse(jsonMatch[0]) as CandidateProfile
  profile.cvText = cvText

  // Defaults for any missing fields
  if (!profile.searchQueries) {
    profile.searchQueries = {
      titleQueries: profile.targetTitles.slice(0, 5),
      keywordQueries: profile.primaryStack.slice(0, 3),
      comboQueries: [],
    }
  }
  if (!profile.jobTitles) profile.jobTitles = []
  if (!profile.profession) profile.profession = profile.targetTitles[0] ?? 'Professional'
  if (!profile.summary) profile.summary = ''
  if (!profile.remotePreference) profile.remotePreference = 'open'
  if (!profile.education) profile.education = []
  if (!profile.certifications) profile.certifications = []
  if (!profile.languages) profile.languages = { native: [], working: [] }

  return profile
}
