import { motion } from 'framer-motion'

/** The animated tic-tac-toe mark used as the app logo on the Home screen. */
export function AnimatedMark({ size = 88 }: { size?: number }) {
  const stroke = size * 0.045
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      initial="hidden"
      animate="visible"
      aria-hidden="true"
    >
      {/* grid */}
      {[33.3, 66.6].map((pos, i) => (
        <motion.line
          key={`v${i}`}
          x1={pos}
          y1="8"
          x2={pos}
          y2="92"
          stroke="var(--color-line)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
        />
      ))}
      {[33.3, 66.6].map((pos, i) => (
        <motion.line
          key={`h${i}`}
          x1="8"
          y1={pos}
          x2="92"
          y2={pos}
          stroke="var(--color-line)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.16 + i * 0.08, ease: 'easeOut' }}
        />
      ))}
      {/* X top-left */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 16 }}
      >
        <line x1="16" y1="16" x2="27" y2="27" stroke="var(--color-x)" strokeWidth={stroke} strokeLinecap="round" />
        <line x1="27" y1="16" x2="16" y2="27" stroke="var(--color-x)" strokeWidth={stroke} strokeLinecap="round" />
      </motion.g>
      {/* O center */}
      <motion.circle
        cx="50"
        cy="50"
        r="10.5"
        stroke="var(--color-o)"
        strokeWidth={stroke}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 16 }}
      />
      {/* X bottom-right */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.75, type: 'spring', stiffness: 300, damping: 16 }}
      >
        <line x1="73" y1="73" x2="84" y2="84" stroke="var(--color-x)" strokeWidth={stroke} strokeLinecap="round" />
        <line x1="84" y1="73" x2="73" y2="84" stroke="var(--color-x)" strokeWidth={stroke} strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  )
}
