import { Router } from 'express'
import type { Response } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 100,
}

export const usageRouter = Router()

usageRouter.get('/usage', authMiddleware, async (req, res: Response) => {
  const userId = req.userId!

  try {
    const { data: usage, error } = await supabaseAdmin
      .from('usage_counters')
      .select('plan, analyses_used, period_start')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch usage:', error)
      res.status(500).json({ error: 'Failed to fetch usage data' })
      return
    }

    if (!usage) {
      res.json({
        plan: 'free',
        analysesUsed: 0,
        limit: PLAN_LIMITS.free,
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      })
      return
    }

    const plan = usage.plan as string
    res.json({
      plan,
      analysesUsed: usage.analyses_used,
      limit: PLAN_LIMITS[plan] ?? PLAN_LIMITS.free,
      periodStart: usage.period_start,
    })
  } catch (err) {
    console.error('Usage endpoint error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
