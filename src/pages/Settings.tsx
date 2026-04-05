import { LogOut, Crown, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUsage } from '../hooks/useUsage'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'

function usageColour(ratio: number): string {
  if (ratio >= 0.9) return 'bg-error'
  if (ratio >= 0.7) return 'bg-warning'
  return 'bg-success'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function periodEndDate(periodStart: string): string {
  if (!periodStart) return '—'
  const start = new Date(periodStart)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { plan, analysesUsed, limit, periodStart, loading } = useUsage()

  const usageRatio = limit > 0 ? analysesUsed / limit : 0
  const percentUsed = Math.min(Math.round(usageRatio * 100), 100)

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">Settings</h1>

      {/* Account */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">Account</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Email</p>
            <p className="text-text">{user?.email ?? '—'}</p>
          </div>
          <Button variant="secondary" icon={LogOut} onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>

      {/* Plan & Usage */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Plan &amp; Usage</h2>
          {!loading && (
            <Badge variant={plan === 'pro' ? 'accent' : 'default'}>
              {plan === 'pro' ? (
                <span className="flex items-center gap-1">
                  <Crown size={12} /> Pro
                </span>
              ) : (
                'Free'
              )}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Usage bar */}
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-sm text-text-secondary">Analyses this month</p>
                <p className="text-sm font-medium text-text">
                  {analysesUsed} / {limit}
                </p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usageColour(usageRatio)}`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>

            {/* Period dates */}
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-text-secondary">Period start</p>
                <p className="text-text">{formatDate(periodStart)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Period end</p>
                <p className="text-text">{periodEndDate(periodStart)}</p>
              </div>
            </div>

            {/* Upgrade CTA */}
            {plan !== 'pro' && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="mt-0.5 text-accent" />
                  <div className="flex-1">
                    <p className="font-medium text-text">Upgrade to Pro</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Get 100 analyses per month and priority processing.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      disabled
                    >
                      Coming soon
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
