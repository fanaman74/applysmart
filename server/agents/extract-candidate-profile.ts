import { anthropic, DEFAULT_MODEL } from '../lib/claude.js'
import type { CandidateProfile } from './job-search-types.js'

export async function extractCandidateProfile(cvText: string): Promise<CandidateProfile> {
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyse this CV and return ONLY a valid JSON object (no markdown, no code blocks) with these fields:

name, slug (lowercase-hyphenated), location, yearsExperience (number), level (junior/mid/senior/staff/principal), profession (their actual job category — not "software engineer" unless they are one), primaryStack (array of 8-12 core skills/tools/certs), secondaryStack (array), jobTitles (all titles held), targetTitles (6-10 titles they should search for), industries (sectors/org types), achievements (4-6 metric-backed bullets from the CV), education (array of {school, degree, status}), certifications (array), languages ({native:[], working:[]}), summary (their own summary verbatim), remotePreference (remote/hybrid/onsite/flexible), searchQueries ({titleQueries: 6 location-aware title searches, keywordQueries: 4 skill combos, comboQueries: 4 Boolean search strings with quotes and OR}).

Rules: level = junior<2yr, mid 2-5yr, senior 5-10yr, staff 10-20yr, principal 20yr+. targetTitles must match their actual field. searchQueries must reflect their real location and profession.

CV:
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
