import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { applyMove, createInitialState } from '../engine/ticTacToe'
import type { GameState } from '../engine/ticTacToe'
import { useSettings } from '../state/SettingsContext'

// A real sequence of engine moves (not hard-coded fake board states) so the
// demo always reflects actual game rules: X takes the top row.
const SCRIPT: number[] = [0, 3, 1, 4, 2]

function buildFrames(): GameState[] {
  const frames: GameState[] = [createInitialState('X')]
  let state = frames[0]
  for (const index of SCRIPT) {
    const result = applyMove(state, index, state.currentTurn)
    if (result.ok) {
      state = result.state
      frames.push(state)
    }
  }
  return frames
}

const FRAMES = buildFrames()

export function HowToPlayDemo() {
  const { settings } = useSettings()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (settings.reduceMotion) return
    const holdAtEnd = step === FRAMES.length - 1
    const holdAtStart = step === 0
    const delay = holdAtEnd ? 1400 : holdAtStart ? 500 : 650
    const t = window.setTimeout(() => {
      setStep((s) => (s + 1) % FRAMES.length)
    }, delay)
    return () => window.clearTimeout(t)
  }, [step, settings.reduceMotion])

  const frame = settings.reduceMotion ? FRAMES[FRAMES.length - 1] : FRAMES[step]

  const cells = useMemo(() => frame.board, [frame])

  return (
    <div className="mx-auto grid w-40 grid-cols-3 gap-1.5 rounded-2xl border border-line/60 bg-surface p-2 shadow-md">
      {cells.map((value, i) => {
        const isWinning = frame.winningLine?.includes(i) ?? false
        return (
          <div
            key={i}
            className={clsx(
              'flex aspect-square items-center justify-center rounded-lg border text-lg font-black',
              isWinning ? 'border-success shadow-[0_0_10px_1px_rgba(52,211,153,0.5)]' : 'border-line/50',
              'bg-surface-2',
            )}
          >
            {value && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={value === 'X' ? 'text-x' : 'text-o'}
              >
                {value}
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
