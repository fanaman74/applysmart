import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { anthropic, DEFAULT_MODEL } from '../lib/claude.js'

const parseBodySchema = z.object({
  text: z.string().min(1),
})

export const jdRouter = Router()

jdRouter.post('/jd/parse', authMiddleware, async (req, res: Response) => {
  const parsed = parseBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  const { text } = parsed.data

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 500,
      temperature: 0.1,
      system: 'You are a job description parser. Extract the job title, company name, and a cleaned version of the job description from the raw text provided. Respond with ONLY valid JSON, no markdown fences or extra text.',
      messages: [
        {
          role: 'user',
          content: `Extract the following fields from this job description text. Return JSON with exactly these keys: "jobTitle" (string), "companyName" (string), "cleanedDescription" (string — the full job description with formatting noise removed).

If you cannot determine the company name, use an empty string.
If you cannot determine the job title, use an empty string.

Raw job description text:

${text}`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const rawText = textBlock?.text ?? ''

    let result: { jobTitle: string; companyName: string; cleanedDescription: string }
    try {
      result = JSON.parse(rawText) as { jobTitle: string; companyName: string; cleanedDescription: string }
    } catch {
      res.status(502).json({ error: 'Failed to parse AI response as JSON', raw: rawText })
      return
    }

    res.json(result)
  } catch (err) {
    console.error('JD parse error:', err)
    res.status(500).json({ error: 'Failed to parse job description' })
  }
})
