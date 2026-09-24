import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useState } from 'react'
import type { CellValue } from '../engine/ticTacToe'

interface CellProps {
  value: CellValue
  index: number
  disabled: boolean
  isLastMove: boolean
  isWinningCell: boolean
  isHint: boolean
  onSelect: (index: number) => void
}

export function Cell({ value, index, disabled, isLastMove, isWinningCell, isHint, onSelect }: CellProps) {
  const [shake, setShake] = useState(false)

  const handleClick = () => {
    if (value !== null) {
      setShake(true)
      window.setTimeout(() => setShake(false), 350)
      return
    }
    if (disabled) return
    onSelect(index)
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={value ? `Cell ${index + 1}, ${value}` : `Cell ${index + 1}, empty`}
      whileTap={value === null && !disabled ? { scale: 0.94 } : undefined}
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={shake ? { duration: 0.35 } : { duration: 0.15 }}
      className={clsx(
        'relative flex aspect-square min-h-[44px] items-center justify-center rounded-2xl text-4xl font-black sm:text-5xl',
        'bg-surface-2 border transition-colors duration-150',
        isWinningCell
          ? 'border-success shadow-[0_0_24px_2px_rgba(52,211,153,0.55)]'
          : isLastMove
            ? 'border-secondary shadow-[0_0_18px_0px_rgba(34,211,238,0.4)]'
            : isHint
              ? 'border-warning/70 shadow-[0_0_16px_0px_rgba(251,191,36,0.35)]'
              : 'border-line/60',
        value === null && !disabled && 'hover:bg-surface hover:border-primary/40 cursor-pointer',
        value === null && disabled && 'cursor-default',
        value !== null && 'cursor-default',
      )}
    >
      {isHint && value === null && (
        <motion.span
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-2.5 w-2.5 rounded-full bg-warning"
          aria-hidden="true"
        />
      )}
      {value && (
        <motion.span
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className={clsx(
            isWinningCell && 'animate-pulse-glow',
            value === 'X' ? 'text-x' : 'text-o',
          )}
        >
          {value}
        </motion.span>
      )}
    </motion.button>
  )
}
