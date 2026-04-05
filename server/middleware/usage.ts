import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 100,
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

function isBeforeCurrentMonth(dateStr: string): boolean {
  const periodStart = new Date(dateStr)
  const now = new Date()
  return (
    periodStart.getFullYear() < now.getFullYear() ||
    (periodStart.getFullYear() === now.getFullYear() &&
      periodStart.getMonth() < now.getMonth())
  )
}

export async function usageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId!

  try {
    // Fetch existing usage row
    const { data: usage, error: fetchError } = await supabaseAdmin
      .from('usage_counters')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned — anything else is a real error
      console.error('Failed to fetch usage counter:', fetchError)
      res.status(500).json({ error: 'Failed to check usage limits' })
      return
    }

    let plan: string
    let analysesUsed: number

    if (!usage) {
      // Create a new row for this user
      const { error: insertError } = await supabaseAdmin
        .from('usage_counters')
        .insert({
          user_id: userId,
          plan: 'free',
          analyses_used: 0,
          period_start: getMonthStart(),
        })

      if (insertError) {
        console.error('Failed to create usage counter:', insertError)
        res.status(500).json({ error: 'Failed to initialise usage tracking' })
        return
      }

      plan = 'free'
      analysesUsed = 0
    } else if (isBeforeCurrentMonth(usage.period_start)) {
      // Reset for new month
      const { error: resetError } = await supabaseAdmin
        .from('usage_counters')
        .update({
          analyses_used: 0,
          period_start: getMonthStart(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (resetError) {
        console.error('Failed to reset usage counter:', resetError)
        res.status(500).json({ error: 'Failed to reset usage period' })
        return
      }

      plan = usage.plan
      analysesUsed = 0
    } else {
      plan = usage.plan
      analysesUsed = usage.analyses_used
    }

    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

    if (analysesUsed >= limit) {
      res.status(429).json({
        error: 'Monthly analysis limit reached',
        plan,
        limit,
        used: analysesUsed,
        upgradeUrl: '/settings',
      })
      return
    }

    // Increment usage
    const { error: incrementError } = await supabaseAdmin
      .from('usage_counters')
      .update({
        analyses_used: analysesUsed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (incrementError) {
      console.error('Failed to increment usage counter:', incrementError)
      res.status(500).json({ error: 'Failed to update usage tracking' })
      return
    }

    next()
  } catch (err) {
    console.error('Usage middleware error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
