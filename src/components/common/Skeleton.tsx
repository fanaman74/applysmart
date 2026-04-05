import { cn } from '../../lib/cn'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines <= 1) {
    return (
      <div
        className={cn('h-4 animate-pulse rounded bg-surface-hover', className)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 animate-pulse rounded bg-surface-hover',
            i === lines - 1 && 'w-3/4',
            className,
          )}
        />
      ))}
    </div>
  )
}
