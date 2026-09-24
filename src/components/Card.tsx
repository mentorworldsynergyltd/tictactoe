import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated, className, children, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-line/60 p-6 shadow-lg shadow-black/5 dark:shadow-black/20',
        elevated ? 'bg-surface-2' : 'bg-surface',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
