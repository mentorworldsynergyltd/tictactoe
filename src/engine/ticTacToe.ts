// Pure, framework- and network-independent Tic-Tac-Toe engine.
// No UI, no DOM, no networking — just state transitions over plain data,
// so the same module can back local play, LAN host authority, or tests.

export type Symbol = 'X' | 'O'
export type CellValue = Symbol | null
export type Board = CellValue[] // length 9, row-major (0..8)

export type GameStatus = 'in_progress' | 'win' | 'draw'

export interface GameState {
  board: Board
  currentTurn: Symbol
  status: GameStatus
  winner: Symbol | null
  winningLine: number[] | null
  lastMove: number | null
  moveCount: number
}

export const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
]

export function createInitialState(firstTurn: Symbol = 'X'): GameState {
  return {
    board: Array(9).fill(null),
    currentTurn: firstTurn,
    status: 'in_progress',
    winner: null,
    winningLine: null,
    lastMove: null,
    moveCount: 0,
  }
}

function findWinningLine(board: Board, symbol: Symbol): number[] | null {
  for (const line of WINNING_LINES) {
    if (line.every((i) => board[i] === symbol)) return line
  }
  return null
}

export interface MoveResult {
  ok: boolean
  state: GameState
  reason?: 'cell_occupied' | 'game_over' | 'wrong_turn' | 'invalid_index'
}

/**
 * Applies a move for `symbol` at `index` (0-8) if legal, returning a new
 * GameState. Never mutates the input state. `symbol` should be the mover's
 * assigned symbol so callers (local pass-and-play, or a LAN host validating
 * a client's move) can reject out-of-turn or wrong-player moves.
 */
export function applyMove(state: GameState, index: number, symbol: Symbol): MoveResult {
  if (index < 0 || index > 8 || !Number.isInteger(index)) {
    return { ok: false, state, reason: 'invalid_index' }
  }
  if (state.status !== 'in_progress') {
    return { ok: false, state, reason: 'game_over' }
  }
  if (state.currentTurn !== symbol) {
    return { ok: false, state, reason: 'wrong_turn' }
  }
  if (state.board[index] !== null) {
    return { ok: false, state, reason: 'cell_occupied' }
  }

  const board = [...state.board]
  board[index] = symbol

  const winningLine = findWinningLine(board, symbol)
  const moveCount = state.moveCount + 1

  if (winningLine) {
    return {
      ok: true,
      state: {
        board,
        currentTurn: symbol,
        status: 'win',
        winner: symbol,
        winningLine,
        lastMove: index,
        moveCount,
      },
    }
  }

  if (moveCount === 9) {
    return {
      ok: true,
      state: {
        board,
        currentTurn: symbol,
        status: 'draw',
        winner: null,
        winningLine: null,
        lastMove: index,
        moveCount,
      },
    }
  }

  return {
    ok: true,
    state: {
      board,
      currentTurn: symbol === 'X' ? 'O' : 'X',
      status: 'in_progress',
      winner: null,
      winningLine: null,
      lastMove: index,
      moveCount,
    },
  }
}

export function otherSymbol(symbol: Symbol): Symbol {
  return symbol === 'X' ? 'O' : 'X'
}

export interface Scoreboard {
  xWins: number
  oWins: number
  draws: number
}

export function createInitialScoreboard(): Scoreboard {
  return { xWins: 0, oWins: 0, draws: 0 }
}

export function applyResultToScoreboard(board: Scoreboard, state: GameState): Scoreboard {
  if (state.status === 'win' && state.winner === 'X') return { ...board, xWins: board.xWins + 1 }
  if (state.status === 'win' && state.winner === 'O') return { ...board, oWins: board.oWins + 1 }
  if (state.status === 'draw') return { ...board, draws: board.draws + 1 }
  return board
}
