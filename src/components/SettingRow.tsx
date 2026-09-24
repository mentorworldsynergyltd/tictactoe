import type { ReactNode } from 'react'

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {children}
    </div>
  )
}
