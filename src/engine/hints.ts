// UI-assist helper, deliberately separate from the core engine: finding a
// "good move to suggest" is not a game rule, so it lives here rather than in
// ticTacToe.ts. Pure function, still framework-independent.

import { WINNING_LINES } from './ticTacToe'
import type { Board, Symbol } from './ticTacToe'

/**
 * Returns the index of a cell that would let `symbol` complete a line right
 * now, or null if there isn't one. Used to give a subtle "Show move hints"
 * indicator — it never plays the move itself.
 */
export function findWinningMove(board: Board, symbol: Symbol): number | null {
  for (const line of WINNING_LINES) {
    const values = line.map((i) => board[i])
    const symbolCount = values.filter((v) => v === symbol).length
    const emptyIndex = line[values.findIndex((v) => v === null)]
    if (symbolCount === 2 && values.includes(null)) {
      return emptyIndex
    }
  }
  return null
}
