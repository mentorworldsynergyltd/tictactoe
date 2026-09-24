import { applyMove, createInitialState } from '../src/engine/ticTacToe'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('ok  :', msg)
  }
}

// X wins top row
let s = createInitialState('X')
;[0, 3, 1, 4, 2].forEach((i) => {
  const r = applyMove(s, i, s.currentTurn)
  assert(r.ok, `move ${i} accepted`)
  s = r.state
})
assert(s.status === 'win' && s.winner === 'X', 'X wins top row')
assert(JSON.stringify(s.winningLine) === JSON.stringify([0, 1, 2]), 'winning line correct')

// Reject move on occupied cell
{
  let g = createInitialState('X')
  g = applyMove(g, 0, 'X').state
  const r = applyMove(g, 0, 'O')
  assert(!r.ok && r.reason === 'cell_occupied', 'rejects occupied cell')
}

// Reject wrong turn
{
  const g = createInitialState('X')
  const r = applyMove(g, 0, 'O')
  assert(!r.ok && r.reason === 'wrong_turn', 'rejects wrong turn')
}

// Draw detection
{
  let g = createInitialState('X')
  // X O X / X O O / O X X -> draw
  const seq: [number, 'X' | 'O'][] = [
    [0, 'X'], [1, 'O'], [2, 'X'],
    [4, 'O'], [3, 'X'], [5, 'O'],
    [7, 'O'], [6, 'X'], [8, 'X'],
  ]
  // Wait: this sequence must alternate turns matching currentTurn each step.
  g = createInitialState('X')
  const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8]
  for (const m of moves) {
    const r = applyMove(g, m, g.currentTurn)
    assert(r.ok, `draw-seq move ${m} accepted`)
    g = r.state
  }
  assert(g.status === 'draw', 'ends in draw')
}

// Reject move after game over
{
  let g = createInitialState('X')
  ;[0, 3, 1, 4, 2].forEach((i) => {
    g = applyMove(g, i, g.currentTurn).state
  })
  const r = applyMove(g, 5, 'O')
  assert(!r.ok && r.reason === 'game_over', 'rejects move after game over')
}

console.log('done')
