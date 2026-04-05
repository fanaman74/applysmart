import type { MatchScoreResult } from '../../../types/analysis'
import { Badge } from '../../common/Badge'
import { Card } from '../../common/Card'

function ScoreGauge({ score }: { score: number }) {
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100) / 100
  const offset = circumference * (1 - progress)

  const colour =
    score > 70
      ? 'var(--color-success)'
      : score >= 40
        ? 'var(--color-warning)'
        : 'var(--color-error)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colour}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={colour}
        className="text-4xl font-bold"
        style={{ fontSize: '2.25rem', fontWeight: 700 }}
      >
        {score}
      </text>
    </svg>
  )
}

interface MatchScoreProps {
  result: MatchScoreResult
}

export function MatchScore({ result }: MatchScoreProps) {
  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center gap-4 py-8">
        <ScoreGauge score={result.score} />
        <p className="text-center text-lg font-medium text-text">
          {result.verdict}
        </p>
      </Card>

      {result.matched_skills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">
            Matched Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.matched_skills.map((skill) => (
              <Badge key={skill} variant="success">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.missing_skills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">
            Missing Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.missing_skills.map((skill) => (
              <Badge key={skill} variant="error">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.keyword_gaps.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">
            Keyword Gaps
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.keyword_gaps.map((gap) => (
              <Badge key={gap} variant="warning">
                {gap}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
