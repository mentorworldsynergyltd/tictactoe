// Simulates full games to verify the AI engine's core guarantee: hard
// difficulty is unbeatable. Also sanity-checks that medium/easy at least
// produce legal games and that medium takes obvious wins/blocks.

import { applyMove, createInitialState, otherSymbol } from '../src/engine/ticTacToe'
import type { Board, GameState, Symbol } from '../src/engine/ticTacToe'
import { getAiMove } from '../src/engine/ai'
import type { Difficulty } from '../src/engine/ai'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('ok  :', msg)
  }
}

function randomLegalMove(board: Board): number {
  const options: number[] = []
  board.forEach((v, i) => {
    if (v === null) options.push(i)
  })
  return options[Math.floor(Math.random() * options.length)]
}

// Play `hardSymbol` as hard-difficulty AI against a uniformly-random
// opponent, alternating who moves first across trials. Hard should never
// lose (win or draw only).
function playOneGame(hardSymbol: Symbol, firstTurn: Symbol): GameState {
  let state = createInitialState(firstTurn)
  while (state.status === 'in_progress') {
    const mover = state.currentTurn
    const index =
      mover === hardSymbol
        ? getAiMove(state.board, hardSymbol, 'hard')
        : randomLegalMove(state.board)
    const result = applyMove(state, index, mover)
    if (!result.ok) throw new Error(`AI or opponent produced an illegal move: ${result.reason}`)
    state = result.state
  }
  return state
}

let hardLosses = 0
const TRIALS = 60
for (let i = 0; i < TRIALS; i++) {
  const hardSymbol: Symbol = i % 2 === 0 ? 'X' : 'O'
  const firstTurn: Symbol = i % 4 < 2 ? 'X' : 'O'
  const final = playOneGame(hardSymbol, firstTurn)
  if (final.status === 'win' && final.winner === otherSymbol(hardSymbol)) {
    hardLosses++
    console.error(`  hard AI (${hardSymbol}) lost a game — first turn was ${firstTurn}`)
  }
}
assert(hardLosses === 0, `hard AI never loses across ${TRIALS} games vs. a random opponent`)

// Hard vs hard from either starting player must always draw.
for (const firstTurn of ['X', 'O'] as Symbol[]) {
  let state = createInitialState(firstTurn)
  while (state.status === 'in_progress') {
    const index = getAiMove(state.board, state.currentTurn, 'hard')
    const result = applyMove(state, index, state.currentTurn)
    if (!result.ok) throw new Error('hard-vs-hard produced an illegal move')
    state = result.state
  }
  assert(state.status === 'draw', `hard vs hard draws (first turn ${firstTurn})`)
}

// Medium takes an immediate win instead of a random cell.
{
  // X: 0,1 filled, O has one elsewhere -> X's winning move is 2.
  let state = createInitialState('X')
  state = applyMove(state, 0, 'X').state
  state = applyMove(state, 4, 'O').state
  state = applyMove(state, 1, 'X').state
  state = applyMove(state, 5, 'O').state
  const move = getAiMove(state.board, 'X', 'medium')
  assert(move === 2, 'medium AI takes the immediate winning move')
}

// Medium blocks an immediate loss when it has no win of its own.
{
  // O about to complete column 0,3,6; X has no win available yet.
  let state = createInitialState('X')
  state = applyMove(state, 1, 'X').state
  state = applyMove(state, 0, 'O').state
  state = applyMove(state, 8, 'X').state
  state = applyMove(state, 3, 'O').state
  // Now O threatens 0,3,6 — it's X's turn.
  const move = getAiMove(state.board, 'X', 'medium')
  assert(move === 6, 'medium AI blocks an immediate opponent win')
}

// Easy only ever plays legal (empty) cells.
{
  let state = createInitialState('X')
  let ok = true
  while (state.status === 'in_progress') {
    const move = getAiMove(state.board, state.currentTurn, 'easy')
    if (state.board[move] !== null) ok = false
    const result = applyMove(state, move, state.currentTurn)
    if (!result.ok) ok = false
    state = result.state
  }
  assert(ok, 'easy AI always plays a legal move through a full game')
}

// getAiMove is deterministic-legal for every difficulty on a near-full board.
{
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
  for (const d of difficulties) {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null] as Board
    const move = getAiMove(board, 'X', d)
    assert(move === 8, `${d} AI plays the only remaining cell when just one is left`)
  }
}

console.log('done')
