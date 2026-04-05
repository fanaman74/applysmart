import { Newspaper, Lightbulb, AlertTriangle } from 'lucide-react'
import type { CompanyInsightsResult } from '../../../types/analysis'
import { Card } from '../../common/Card'

interface CompanyInsightsProps {
  result: CompanyInsightsResult
}

export function CompanyInsights({ result }: CompanyInsightsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary">Overview</h3>
        <Card>
          <p className="text-sm leading-relaxed text-text">{result.overview}</p>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary">Culture</h3>
        <Card>
          <p className="text-sm leading-relaxed text-text">{result.culture}</p>
        </Card>
      </div>

      {result.recent_news.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">
            Recent News
          </h3>
          <ul className="space-y-2">
            {result.recent_news.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Newspaper
                  size={16}
                  className="mt-0.5 shrink-0 text-accent"
                />
                <span className="text-sm text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.interview_tips.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">
            Interview Tips
          </h3>
          <ul className="space-y-2">
            {result.interview_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb
                  size={16}
                  className="mt-0.5 shrink-0 text-warning"
                />
                <span className="text-sm text-text-secondary">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.red_flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-error">Red Flags</h3>
          <div className="space-y-2">
            {result.red_flags.map((flag, i) => (
              <Card key={i} className="border-error/30 bg-error/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-error"
                  />
                  <span className="text-sm text-text-secondary">{flag}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
