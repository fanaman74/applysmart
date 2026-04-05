import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import type { CoverLetterResult } from '../../../types/analysis'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'

interface CoverLetterProps {
  result: CoverLetterResult
}

export function CoverLetter({ result }: CoverLetterProps) {
  const [copied, setCopied] = useState(false)

  const text = result.cover_letter
  const wordCount = text.trim().split(/\s+/).length
  const charCount = text.length

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadTxt() {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
          {text}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={Download}
          onClick={handleDownloadTxt}
        >
          Download TXT
        </Button>
      </div>

      <p className="text-xs text-text-muted">
        {wordCount} words &middot; {charCount} characters
      </p>
    </div>
  )
}
