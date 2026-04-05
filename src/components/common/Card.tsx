import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6',
        hover && 'transition-colors hover:border-accent',
        className,
      )}
    >
      {children}
    </div>
  )
}
