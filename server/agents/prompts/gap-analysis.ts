import type { AgentPromptConfig } from '../types.js'

const JSON_SCHEMA = `{
  "critical": [
    { "skill": <string>, "effort": "low" | "medium" | "high", "suggestion": <string> }
  ],
  "important": [
    { "skill": <string>, "effort": "low" | "medium" | "high", "suggestion": <string> }
  ],
  "nice_to_have": [
    { "skill": <string>, "effort": "low" | "medium" | "high", "suggestion": <string> }
  ],
  "action_plan": [<string>, ...]
}`

export default function getGapAnalysisPrompt(
  cvText: string,
  jobDescription: string,
  _company?: string,
): AgentPromptConfig {
  return {
    systemPrompt: `You are a career development strategist who helps candidates close the gap between where they are and where they need to be.

Your task:
1. Identify EVERY skill gap between the candidate's CV and the job requirements.
2. Categorise each gap:
   - **critical** — The job explicitly requires this and the candidate shows no evidence of it. Likely a deal-breaker if unaddressed.
   - **important** — Strongly preferred or repeatedly mentioned. Not having it weakens the application.
   - **nice_to_have** — Mentioned once or listed as a bonus. Won't disqualify but would strengthen the candidacy.
3. For each gap, assess the effort to close it:
   - **low** — A weekend of study, an online tutorial, or tweaking how existing experience is presented.
   - **medium** — A few weeks of focused learning, a side project, or a certification.
   - **high** — Months of hands-on experience, a career pivot, or deep domain expertise that can't be quickly acquired.
4. For each gap, suggest a concrete, actionable step the candidate can take. Be specific — "learn Kubernetes" is too vague; "complete the CKA certification prep course on KodeKloud" is better.
5. Provide an ordered action_plan — a prioritised list of steps the candidate should take before applying or interviewing.

If no gaps exist in a category, return an empty array for that category.
Use UK English throughout.

Return ONLY valid JSON matching this schema — no markdown, no explanation, no wrapping:
${JSON_SCHEMA}`,

    userPrompt: `## Candidate CV

${cvText}

---

## Job Description

${jobDescription}

---

Analyse every gap and return the JSON result.`,

    temperature: 0.2,
    maxTokens: 2000,
  }
}
