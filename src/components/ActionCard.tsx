import type { ReactNode } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface ActionCardProps {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
  accent?: 'primary' | 'secondary' | 'success'
}

const accentRing: Record<NonNullable<ActionCardProps['accent']>, string> = {
  primary: 'group-hover:border-primary/60 group-hover:shadow-primary/20',
  secondary: 'group-hover:border-secondary/60 group-hover:shadow-secondary/20',
  success: 'group-hover:border-success/60 group-hover:shadow-success/20',
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  disabled,
  badge,
  accent = 'primary',
}: ActionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={clsx(
        'group relative flex w-full items-center gap-4 rounded-3xl border border-line/60 bg-surface p-5 text-left shadow-md shadow-black/5 transition-all duration-200 dark:shadow-black/20',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:shadow-xl',
        !disabled && accentRing[accent],
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {badge && (
            <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
    </motion.button>
  )
}
