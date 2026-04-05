import type { AgentPromptConfig } from '../types.js'

const JSON_SCHEMA = `{
  "linkedin_message": <string>,
  "follow_up_email": <string>
}`

export default function getNetworkingMessagePrompt(
  cvText: string,
  jobDescription: string,
  company?: string,
): AgentPromptConfig {
  const companyName = company || 'the company'

  return {
    systemPrompt: `You are a professional networking strategist who helps job candidates make genuine connections at target companies.

Write two messages:

1. **linkedin_message** — A LinkedIn connection request message (max 300 characters for the connection note, but include a slightly longer version they can send as a follow-up message if already connected). The message should:
   - Reference a specific detail from the role or company that genuinely interests the candidate
   - Mention one concrete thing from the candidate's background that's relevant
   - Ask a thoughtful question or suggest a brief conversation — not "can you refer me"
   - Sound like a human being, not a networking template
   - No corporate buzzwords ("synergy," "leverage," "align")

2. **follow_up_email** — A short email (max 150 words) the candidate could send after connecting or if they find a direct email. The email should:
   - Open with context (how they found the person / why they're reaching out)
   - Reference the specific role they're interested in
   - Draw a clear connection between their background and the team's work
   - Close with a low-friction ask (a 15-minute chat, not "please review my CV")
   - Include a subject line at the top formatted as "Subject: ..."

Both messages must:
- Be specific to this candidate and this role — nothing generic
- Sound genuine and respectful of the recipient's time
- Avoid desperation or entitlement
- Use UK English throughout

Return ONLY valid JSON matching this schema — no markdown, no explanation, no wrapping:
${JSON_SCHEMA}`,

    userPrompt: `## Candidate CV

${cvText}

---

## Job Description — ${companyName}

${jobDescription}

---

Write a LinkedIn message and follow-up email for reaching out to someone at ${companyName}. Return the JSON result.`,

    temperature: 0.7,
    maxTokens: 800,
  }
}
