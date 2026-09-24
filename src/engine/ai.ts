// Pure, framework-independent AI move selector. Like the rest of `engine/`,
// this has no UI or networking dependencies — it just looks at a board and
// picks an index. Kept separate from `ticTacToe.ts` (core rules) and
// `hints.ts` (UI-assist for humans) since "play a move for the computer" is
// a distinct concern from either.

import { WINNING_LINES } from './ticTacToe'
import type { Board, Symbol } from './ticTacToe'

export type Difficulty = 'easy' | 'medium' | 'hard'

function emptyIndices(board: Board): number[] {
  const out: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) out.push(i)
  }
  return out
}

function checkWinner(board: Board): Symbol | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

function isFull(board: Board): boolean {
  return board.every((c) => c !== null)
}

function otherSymbol(symbol: Symbol): Symbol {
  return symbol === 'X' ? 'O' : 'X'
}

/**
 * Returns an index that completes a line for `symbol` right now, or null.
 * Local to this module (deliberately not shared with `hints.ts`'s
 * `findWinningMove`, which is a UI concern) — same idea, kept independent so
 * either can evolve without coupling the AI to the hint system.
 */
function findImmediateWin(board: Board, symbol: Symbol): number | null {
  for (const line of WINNING_LINES) {
    const values = line.map((i) => board[i])
    const symbolCount = values.filter((v) => v === symbol).length
    const emptyCount = values.filter((v) => v === null).length
    if (symbolCount === 2 && emptyCount === 1) {
      return line[values.findIndex((v) => v === null)]
    }
  }
  return null
}

function randomChoice(board: Board): number {
  const options = emptyIndices(board)
  return options[Math.floor(Math.random() * options.length)]
}

const CENTER = 4
const CORNERS = [0, 2, 6, 8]

function heuristicMove(board: Board, aiSymbol: Symbol): number {
  const humanSymbol = otherSymbol(aiSymbol)

  const winMove = findImmediateWin(board, aiSymbol)
  if (winMove !== null) return winMove

  const blockMove = findImmediateWin(board, humanSymbol)
  if (blockMove !== null) return blockMove

  if (board[CENTER] === null) return CENTER

  const openCorners = CORNERS.filter((i) => board[i] === null)
  if (openCorners.length > 0) {
    return openCorners[Math.floor(Math.random() * openCorners.length)]
  }

  return randomChoice(board)
}

/**
 * Minimax with depth-weighted scoring: a win found sooner (fewer moves
 * deep) scores higher than one found later, and likewise a forced loss
 * further away scores better than one that's imminent. This makes the
 * "hard" difficulty not just unbeatable but also prefer the fastest
 * win / slowest loss, rather than being indifferent among winning lines.
 */
function minimax(board: Board, symbolToMove: Symbol, aiSymbol: Symbol, depth: number): number {
  const winner = checkWinner(board)
  if (winner === aiSymbol) return 10 - depth
  if (winner === otherSymbol(aiSymbol)) return depth - 10
  if (isFull(board)) return 0

  const scores = emptyIndices(board).map((i) => {
    const next = [...board]
    next[i] = symbolToMove
    return minimax(next, otherSymbol(symbolToMove), aiSymbol, depth + 1)
  })

  return symbolToMove === aiSymbol ? Math.max(...scores) : Math.min(...scores)
}

function minimaxMove(board: Board, aiSymbol: Symbol): number {
  const candidates = emptyIndices(board)

  // Full-strength minimax over 9 cells is cheap, but skip the search
  // entirely on the opening move (any of the >100k branches score the
  // same from an empty-ish board) and just take a strong opening square.
  if (candidates.length === 9) return CENTER
  if (candidates.length === 8 && board[CENTER] === null) return CENTER

  let bestScore = -Infinity
  let bestMoves: number[] = []
  for (const i of candidates) {
    const next = [...board]
    next[i] = aiSymbol
    const score = minimax(next, otherSymbol(aiSymbol), aiSymbol, 1)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [i]
    } else if (score === bestScore) {
      bestMoves.push(i)
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

/**
 * Picks the AI's next move for `aiSymbol` on `board`.
 * - easy: uniformly random among empty cells.
 * - medium: takes an immediate win, else blocks an immediate loss, else
 *   prefers the center, then a corner, else random. Beatable but not
 *   careless.
 * - hard: full minimax, depth-weighted — provably unbeatable; the best a
 *   human can force is a draw.
 */
export function getAiMove(board: Board, aiSymbol: Symbol, difficulty: Difficulty): number {
  const options = emptyIndices(board)
  if (options.length === 0) {
    throw new Error('getAiMove called on a full board')
  }
  if (options.length === 1) return options[0]

  switch (difficulty) {
    case 'easy':
      return randomChoice(board)
    case 'medium':
      return heuristicMove(board, aiSymbol)
    case 'hard':
      return minimaxMove(board, aiSymbol)
  }
}
