import { CheckCircle, Download } from 'lucide-react'
import type { TailoredCvResult } from '../../../types/analysis'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'

interface TailoredCvProps {
  result: TailoredCvResult
}

export function TailoredCv({ result }: TailoredCvProps) {
  function handleDownload() {
    const sections = [
      '=== Summary ===',
      result.summary,
      '',
      '=== Skills ===',
      result.skills_section,
      '',
      '=== Experience ===',
      ...result.experience_bullets.map((b) => `• ${b}`),
      '',
      '=== Key Changes ===',
      ...result.key_changes.map((c) => `✓ ${c}`),
    ].join('\n')

    const blob = new Blob([sections], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailored-cv.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary">Summary</h3>
        <Card>
          <p className="text-sm leading-relaxed text-text">{result.summary}</p>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary">Skills</h3>
        <Card>
          <p className="text-sm leading-relaxed text-text">
            {result.skills_section}
          </p>
        </Card>
      </div>

      {result.experience_bullets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">
            Experience
          </h3>
          <div className="space-y-2">
            {result.experience_bullets.map((bullet, i) => (
              <Card key={i} className="p-4">
                <p className="text-sm text-text">{bullet}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {result.key_changes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">
            Key Changes
          </h3>
          <ul className="space-y-2">
            {result.key_changes.map((change, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-success"
                />
                <span className="text-sm text-text-secondary">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={Download}
        onClick={handleDownload}
      >
        Download TXT
      </Button>
    </div>
  )
}
