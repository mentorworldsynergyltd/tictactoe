interface Option<T extends string> {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-line">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            value === opt.value ? 'bg-primary text-white' : 'bg-transparent text-muted hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
