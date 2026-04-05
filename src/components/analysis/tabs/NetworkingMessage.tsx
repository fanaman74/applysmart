import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { NetworkingMessageResult } from '../../../types/analysis'
import { Button } from '../../common/Button'
import { Card } from '../../common/Card'

interface NetworkingMessageProps {
  result: NetworkingMessageResult
}

export function NetworkingMessage({ result }: NetworkingMessageProps) {
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  function handleCopyLinkedIn() {
    navigator.clipboard.writeText(result.linkedin_message)
    setCopiedLinkedIn(true)
    setTimeout(() => setCopiedLinkedIn(false), 2000)
  }

  function handleCopyEmail() {
    navigator.clipboard.writeText(result.follow_up_email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary">
          LinkedIn Connection Message
        </h3>
        <Card>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {result.linkedin_message}
          </div>
        </Card>
        <Button
          variant="secondary"
          size="sm"
          icon={copiedLinkedIn ? Check : Copy}
          onClick={handleCopyLinkedIn}
        >
          {copiedLinkedIn ? 'Copied!' : 'Copy message'}
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary">
          Follow-up Email
        </h3>
        <Card>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {result.follow_up_email}
          </div>
        </Card>
        <Button
          variant="secondary"
          size="sm"
          icon={copiedEmail ? Check : Copy}
          onClick={handleCopyEmail}
        >
          {copiedEmail ? 'Copied!' : 'Copy email'}
        </Button>
      </div>
    </div>
  )
}
