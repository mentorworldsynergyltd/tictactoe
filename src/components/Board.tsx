import type { Board as BoardType } from '../engine/ticTacToe'
import { Cell } from './Cell'

interface BoardProps {
  board: BoardType
  onSelect: (index: number) => void
  disabled: boolean
  lastMove: number | null
  winningLine: number[] | null
  hintIndex?: number | null
}

export function Board({ board, onSelect, disabled, lastMove, winningLine, hintIndex = null }: BoardProps) {
  return (
    <div
      role="grid"
      aria-label="Tic-tac-toe board"
      className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 rounded-3xl border border-line/60 bg-surface p-3 shadow-xl shadow-black/5 sm:gap-4 sm:p-4 dark:shadow-black/30"
    >
      {board.map((value, i) => (
        <Cell
          key={i}
          index={i}
          value={value}
          disabled={disabled}
          isLastMove={lastMove === i}
          isWinningCell={winningLine?.includes(i) ?? false}
          isHint={hintIndex === i}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
