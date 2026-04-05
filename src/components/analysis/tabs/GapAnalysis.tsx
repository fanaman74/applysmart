import type { GapAnalysisResult } from '../../../types/analysis'
import { Badge } from '../../common/Badge'
import { Card } from '../../common/Card'

type GapItem = { skill: string; effort: string; suggestion: string }

const effortVariant = (effort: string) => {
  const lower = effort.toLowerCase()
  if (lower === 'low') return 'success' as const
  if (lower === 'medium') return 'warning' as const
  return 'error' as const
}

function GapItemCard({ item }: { item: GapItem }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-3">
        <span className="font-medium text-text">{item.skill}</span>
        <Badge variant={effortVariant(item.effort)}>{item.effort}</Badge>
      </div>
      <p className="text-sm text-text-secondary">{item.suggestion}</p>
    </Card>
  )
}

function GapSection({
  title,
  titleColour,
  items,
}: {
  title: string
  titleColour: string
  items: GapItem[]
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-semibold ${titleColour}`}>{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <GapItemCard key={item.skill} item={item} />
        ))}
      </div>
    </div>
  )
}

interface GapAnalysisProps {
  result: GapAnalysisResult
}

export function GapAnalysis({ result }: GapAnalysisProps) {
  return (
    <div className="space-y-6">
      <GapSection
        title="Critical"
        titleColour="text-error"
        items={result.critical}
      />
      <GapSection
        title="Important"
        titleColour="text-warning"
        items={result.important}
      />
      <GapSection
        title="Nice to Have"
        titleColour="text-text-muted"
        items={result.nice_to_have}
      />

      {result.action_plan.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Action Plan</h3>
          <ol className="list-inside space-y-2">
            {result.action_plan.map((step, i) => (
              <li key={i} className="text-sm text-text-secondary">
                <span className="mr-2 font-mono text-xs text-accent">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
