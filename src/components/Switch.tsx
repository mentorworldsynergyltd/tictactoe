import clsx from 'clsx'

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        checked ? 'bg-primary' : 'bg-line',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
