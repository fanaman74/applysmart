import { z } from 'zod'
import type { AgentName } from './types.js'

export const matchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  keyword_gaps: z.array(z.string()),
  verdict: z.string(),
})

export const coverLetterSchema = z.object({
  cover_letter: z.string(),
})

export const gapAnalysisSchema = z.object({
  critical: z.array(
    z.object({
      skill: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    }),
  ),
  important: z.array(
    z.object({
      skill: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    }),
  ),
  nice_to_have: z.array(
    z.object({
      skill: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    }),
  ),
  action_plan: z.array(z.string()),
})

export const tailoredCvSchema = z.object({
  summary: z.string(),
  skills_section: z.string(),
  experience_bullets: z.array(z.string()),
  key_changes: z.array(z.string()),
})

export const companyInsightsSchema = z.object({
  overview: z.string(),
  culture: z.string(),
  recent_news: z.array(z.string()),
  interview_tips: z.array(z.string()),
  red_flags: z.array(z.string()),
})

export const interviewPrepSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      suggested_answer: z.string(),
      type: z.enum(['behavioural', 'technical', 'situational', 'role-specific']),
      difficulty: z.enum(['standard', 'tough']),
    }),
  ),
})

export const networkingMessageSchema = z.object({
  linkedin_message: z.string(),
  follow_up_email: z.string(),
})

export const schemaMap: Record<AgentName, z.ZodSchema> = {
  'match-score': matchScoreSchema,
  'cover-letter': coverLetterSchema,
  'gap-analysis': gapAnalysisSchema,
  'tailored-cv': tailoredCvSchema,
  'company-insights': companyInsightsSchema,
  'interview-prep': interviewPrepSchema,
  'networking-message': networkingMessageSchema,
}
