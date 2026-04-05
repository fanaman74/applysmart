interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

function scoreColour(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 65) return '#d97706'
  return '#ef4444'
}

export function ScoreGauge({ score, size = 'md' }: ScoreGaugeProps) {
  const dims = { sm: 48, md: 64, lg: 80 }
  const strokes = { sm: 4, md: 5, lg: 6 }
  const dim = dims[size]
  const stroke = strokes[size]
  const r = (dim - stroke * 2) / 2
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const progress = (score / 100) * circumference
  const colour = scoreColour(score)
  const fontSize = { sm: '10px', md: '13px', lg: '16px' }

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth={stroke}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colour}
        fontSize={fontSize[size]}
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {score}
      </text>
    </svg>
  )
}
