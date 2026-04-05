import { cn } from '../../lib/cn'

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
} as const

interface SpinnerProps {
  size?: keyof typeof sizeMap
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const px = sizeMap[size]

  return (
    <svg
      className={cn('animate-spin text-accent', className)}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
