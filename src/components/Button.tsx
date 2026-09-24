import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-[0_8px_24px_-8px_rgba(108,99,255,0.6)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-primary/60 hover:bg-surface',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2',
  danger:
    'bg-danger text-white shadow-[0_8px_24px_-8px_rgba(248,113,113,0.6)] hover:brightness-110',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide',
        'transition-all duration-200 ease-out active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
