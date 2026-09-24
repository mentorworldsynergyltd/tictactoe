import clsx from 'clsx'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

const config: Record<ConnectionStatus, { label: string; dot: string; text: string; bg: string }> = {
  connected: { label: 'Connected', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
  connecting: { label: 'Connecting...', dot: 'bg-warning animate-pulse', text: 'text-warning', bg: 'bg-warning/10' },
  disconnected: { label: 'Disconnected', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10' },
}

export function StatusPill({ status, className }: { status: ConnectionStatus; className?: string }) {
  const c = config[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
        c.bg,
        c.text,
        className,
      )}
    >
      <span className={clsx('h-2 w-2 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
