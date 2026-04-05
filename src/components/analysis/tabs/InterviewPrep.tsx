import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { InterviewPrepResult } from '../../../types/analysis'
import { Badge } from '../../common/Badge'
import { cn } from '../../../lib/cn'

const typeLabels: Record<string, string> = {
  behavioural: 'Behavioural',
  technical: 'Technical',
  situational: 'Situational',
  'role-specific': 'Role-specific',
}

const typeOrder = ['behavioural', 'technical', 'situational', 'role-specific']

interface InterviewPrepProps {
  result: InterviewPrepResult
}

export function InterviewPrep({ result }: InterviewPrepProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const grouped = typeOrder
    .map((type) => ({
      type,
      label: typeLabels[type] ?? type,
      questions: result.questions.filter((q) => q.type === type),
    }))
    .filter((group) => group.questions.length > 0)

  let globalIndex = -1

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.type} className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.questions.map((q) => {
              globalIndex++
              const idx = globalIndex
              const isOpen = expandedIndex === idx

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 p-4 text-left"
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  >
                    <span className="mt-0.5 shrink-0 text-text-muted">
                      {isOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-text">
                        {q.question}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="accent">
                          {typeLabels[q.type] ?? q.type}
                        </Badge>
                        <Badge
                          variant={
                            q.difficulty === 'tough' ? 'error' : 'default'
                          }
                        >
                          {q.difficulty === 'tough' ? 'Tough' : 'Standard'}
                        </Badge>
                      </div>
                    </div>
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      isOpen
                        ? 'max-h-[2000px] opacity-100'
                        : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="border-t border-border px-4 py-4 pl-11">
                      <div className="border-l-2 border-accent/40 pl-4">
                        <p className="text-sm leading-relaxed text-text-secondary">
                          {q.suggested_answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
