import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

const variantStyles = {
  primary:
    'bg-accent text-base hover:bg-accent-hover focus-visible:ring-accent',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-hover focus-visible:ring-border',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text focus-visible:ring-border',
  danger:
    'bg-error text-white hover:bg-error/90 focus-visible:ring-error',
} as const

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
} as const

type ButtonVariant = keyof typeof variantStyles
type ButtonSize = keyof typeof sizeStyles

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: LucideIcon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : Icon ? (
          <Icon size={iconSize} />
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
