import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'

const variantStyles = {
  default: 'bg-surface text-text-secondary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  accent: 'bg-accent/15 text-accent',
} as const

type BadgeVariant = keyof typeof variantStyles

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  mono?: boolean
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  mono = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  )
}
