const marks = [
  { s: 'X', top: '8%', left: '10%', size: 64, rotate: -12 },
  { s: 'O', top: '18%', left: '82%', size: 48, rotate: 6 },
  { s: 'X', top: '68%', left: '4%', size: 56, rotate: 10 },
  { s: 'O', top: '78%', left: '88%', size: 72, rotate: -8 },
  { s: 'X', top: '42%', left: '92%', size: 40, rotate: 18 },
  { s: 'O', top: '32%', left: '2%', size: 36, rotate: -20 },
  { s: 'X', top: '88%', left: '46%', size: 44, rotate: 4 },
  { s: 'O', top: '4%', left: '46%', size: 32, rotate: 0 },
] as const

/** A subtle, static translucent field of X/O marks used behind hero content. */
export function BackgroundPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {marks.map((m, i) => (
        <span
          key={i}
          className="absolute font-black select-none text-line/25 dark:text-line/20"
          style={{
            top: m.top,
            left: m.left,
            fontSize: m.size,
            transform: `rotate(${m.rotate}deg)`,
          }}
        >
          {m.s}
        </span>
      ))}
    </div>
  )
}
