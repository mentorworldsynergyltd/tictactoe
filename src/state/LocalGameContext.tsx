import { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  applyMove,
  applyResultToScoreboard,
  createInitialScoreboard,
  createInitialState,
  otherSymbol,
} from '../engine/ticTacToe'
import type { GameState, Scoreboard, Symbol } from '../engine/ticTacToe'
import type { Difficulty } from '../engine/ai'

export interface LocalPlayer {
  name: string
  symbol: Symbol
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

interface LocalGameContextValue {
  players: [LocalPlayer, LocalPlayer]
  setPlayerNames: (p1: string, p2: string) => void
  vsAI: boolean
  aiSymbol: Symbol | null
  aiDifficulty: Difficulty
  configureAiGame: (humanName: string, humanSymbol: Symbol, difficulty: Difficulty) => void
  game: GameState
  scoreboard: Scoreboard
  gamesPlayed: number
  makeMove: (index: number) => void
  startNewGame: (opts?: { alternateFirstTurn?: boolean }) => void
  resetMatch: () => void
}

const LocalGameContext = createContext<LocalGameContextValue | null>(null)

export function LocalGameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<[LocalPlayer, LocalPlayer]>([
    { name: 'Player 1', symbol: 'X' },
    { name: 'Player 2', symbol: 'O' },
  ])
  const [game, setGame] = useState<GameState>(() => createInitialState('X'))
  const [scoreboard, setScoreboard] = useState<Scoreboard>(createInitialScoreboard)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [vsAI, setVsAI] = useState(false)
  const [aiSymbol, setAiSymbol] = useState<Symbol | null>(null)
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium')
  // Bookkeeping only — doesn't need to trigger a render on its own, so a ref
  // avoids nesting a setState call inside another updater (which React's
  // StrictMode double-invokes, turning any side effect inside it into a
  // real double side effect).
  const lastFirstTurn = useRef<Symbol>('X')

  const setPlayerNames = useCallback((p1: string, p2: string) => {
    setVsAI(false)
    setAiSymbol(null)
    setPlayers([
      { name: p1.trim() || 'Player 1', symbol: 'X' },
      { name: p2.trim() || 'Player 2', symbol: 'O' },
    ])
  }, [])

  const configureAiGame = useCallback(
    (humanName: string, humanSymbol: Symbol, difficulty: Difficulty) => {
      const human = { name: humanName.trim() || 'Player', symbol: humanSymbol }
      const ai = { name: `AI · ${DIFFICULTY_LABEL[difficulty]}`, symbol: otherSymbol(humanSymbol) }
      setPlayers(humanSymbol === 'X' ? [human, ai] : [ai, human])
      setVsAI(true)
      setAiSymbol(otherSymbol(humanSymbol))
      setAiDifficulty(difficulty)
    },
    [],
  )

  const makeMove = useCallback(
    (index: number) => {
      const result = applyMove(game, index, game.currentTurn)
      if (!result.ok) return
      setGame(result.state)
      if (result.state.status !== 'in_progress') {
        setScoreboard((sb) => applyResultToScoreboard(sb, result.state))
        setGamesPlayed((n) => n + 1)
      }
    },
    [game],
  )

  const startNewGame = useCallback((opts?: { alternateFirstTurn?: boolean }) => {
    const first =
      opts?.alternateFirstTurn === false ? lastFirstTurn.current : otherSymbol(lastFirstTurn.current)
    lastFirstTurn.current = first
    setGame(createInitialState(first))
  }, [])

  const resetMatch = useCallback(() => {
    lastFirstTurn.current = 'X'
    setGame(createInitialState('X'))
    setScoreboard(createInitialScoreboard())
    setGamesPlayed(0)
  }, [])

  const value = useMemo(
    () => ({
      players,
      setPlayerNames,
      vsAI,
      aiSymbol,
      aiDifficulty,
      configureAiGame,
      game,
      scoreboard,
      gamesPlayed,
      makeMove,
      startNewGame,
      resetMatch,
    }),
    [
      players,
      setPlayerNames,
      vsAI,
      aiSymbol,
      aiDifficulty,
      configureAiGame,
      game,
      scoreboard,
      gamesPlayed,
      makeMove,
      startNewGame,
      resetMatch,
    ],
  )

  return <LocalGameContext.Provider value={value}>{children}</LocalGameContext.Provider>
}

export function useLocalGame() {
  const ctx = useContext(LocalGameContext)
  if (!ctx) throw new Error('useLocalGame must be used within LocalGameProvider')
  return ctx
}
