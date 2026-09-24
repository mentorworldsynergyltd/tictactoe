import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Capacitor } from '@capacitor/core'
import { Board } from '../components/Board'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useLocalGame } from '../state/LocalGameContext'
import { useGameFeedback } from '../lib/useGameFeedback'
import { useSettings } from '../state/SettingsContext'
import { findWinningMove } from '../engine/hints'
import { getAiMove } from '../engine/ai'
import { showRewardedHint } from '../lib/ads'

const AI_MOVE_DELAY_MS = 550
const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export function GameBoardScreen() {
  const navigate = useNavigate()
  const { players, vsAI, aiSymbol, aiDifficulty, game, scoreboard, makeMove, startNewGame } = useLocalGame()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [rewardedHintIndex, setRewardedHintIndex] = useState<number | null>(null)
  const [requestingHintAd, setRequestingHintAd] = useState(false)
  const navigatedRef = useRef(false)

  useGameFeedback(game.moveCount, game.status)
  const { settings } = useSettings()

  const [p1, p2] = players
  const active = game.currentTurn === 'X' ? p1 : p2
  const isAiTurn = vsAI && game.status === 'in_progress' && game.currentTurn === aiSymbol
  const isHumanTurnVsAi = vsAI && game.status === 'in_progress' && !isAiTurn
  const hintIndex = settings.showHints && game.status === 'in_progress' && !isAiTurn
    ? findWinningMove(game.board, game.currentTurn)
    : null
  const displayedHintIndex = hintIndex !== null ? hintIndex : rewardedHintIndex
  // Offer a one-off "watch an ad for a hint" only where it adds value: vs.
  // the unbeatable Hard AI, on the human's own turn, and only if they
  // haven't already turned on free hints in Settings (no point paying for
  // what's already free). Native Android only — showRewardedHint() no-ops
  // everywhere else, so there'd be nothing for the button to do.
  const canOfferHintAd =
    isNativeAndroid && vsAI && aiDifficulty === 'hard' && isHumanTurnVsAi && !settings.showHints && rewardedHintIndex === null

  // A rewarded hint is only good for the move it was shown for.
  useEffect(() => {
    setRewardedHintIndex(null)
  }, [game.moveCount])

  const handleWatchAdForHint = async () => {
    setRequestingHintAd(true)
    try {
      const earned = await showRewardedHint()
      if (earned) {
        setRewardedHintIndex(getAiMove(game.board, game.currentTurn, 'hard'))
      }
    } finally {
      setRequestingHintAd(false)
    }
  }

  useEffect(() => {
    if (game.status === 'in_progress' || navigatedRef.current) return
    navigatedRef.current = true
    const t = window.setTimeout(() => navigate('/local/results'), 1100)
    return () => window.clearTimeout(t)
  }, [game.status, navigate])

  // Auto-play the AI's move a short beat after it becomes its turn, so it
  // reads as "thinking" rather than instant. `game` (specifically the board
  // and whose turn it is) is what actually needs to re-trigger this, so it's
  // the effect's real dependency; aiSymbol/aiDifficulty only change alongside
  // a fresh vsAI game, but are included since they're read inside.
  useEffect(() => {
    if (!vsAI || !aiSymbol || game.status !== 'in_progress' || game.currentTurn !== aiSymbol) return
    const t = window.setTimeout(() => {
      const index = getAiMove(game.board, aiSymbol, aiDifficulty)
      makeMove(index)
    }, AI_MOVE_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [vsAI, aiSymbol, aiDifficulty, game, makeMove])

  const handleNewGame = () => {
    setConfirmNewGame(false)
    navigatedRef.current = false
    startNewGame()
  }

  const handleLeave = () => {
    setConfirmLeave(false)
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-wide text-ink">TIC TAC TOE</h1>
        <div className="relative flex items-center gap-1">
          <button
            aria-label="Settings"
            onClick={() => navigate('/settings')}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            ⚙
          </button>
          <button
            aria-label="More options"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-2xl border border-line/60 bg-surface shadow-xl">
              <button
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-surface-2"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmNewGame(true)
                }}
              >
                New Game
              </button>
              <button
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-surface-2"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmLeave(true)
                }}
              >
                Leave Game
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-line/60 bg-surface px-4 py-3">
        <PlayerBadge name={p1.name} symbol="X" wins={scoreboard.xWins} active={game.currentTurn === 'X'} />
        <span className="text-xs font-bold text-muted">VS</span>
        <PlayerBadge
          name={p2.name}
          symbol="O"
          wins={scoreboard.oWins}
          active={game.currentTurn === 'O'}
          reverse
        />
      </div>

      <div className="mt-5 text-center">
        <p className="text-lg font-extrabold text-ink">
          {isAiTurn ? (
            <span className="inline-flex items-center gap-1.5">
              AI is thinking
              <span className="flex gap-0.5" aria-hidden="true">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-ink/60"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-ink/60"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-ink/60"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </span>
            </span>
          ) : (
            <>{active.name}&rsquo;s Turn</>
          )}
        </p>
        <p className="text-sm text-muted">{isAiTurn ? 'Sit tight' : 'Make your move'}</p>
      </div>

      <div className="mt-6 flex-1">
        <Board
          board={game.board}
          onSelect={makeMove}
          disabled={game.status !== 'in_progress' || isAiTurn}
          lastMove={game.lastMove}
          winningLine={game.winningLine}
          hintIndex={displayedHintIndex}
        />
      </div>

      {canOfferHintAd && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleWatchAdForHint}
            disabled={requestingHintAd}
            className="flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-xs font-bold text-warning hover:bg-warning/15 disabled:opacity-50"
          >
            🎁 {requestingHintAd ? 'Loading ad…' : 'Watch ad for a hint'}
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-sm font-semibold text-muted">
        <span className="text-x">X Wins: {scoreboard.xWins}</span>
        <span>Draws: {scoreboard.draws}</span>
        <span className="text-o">O Wins: {scoreboard.oWins}</span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmNewGame(true)}>
          NEW GAME
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmLeave(true)}>
          LEAVE GAME
        </Button>
      </div>

      <ConfirmDialog
        open={confirmNewGame}
        title="Start New Game?"
        description="The current board and turn will reset."
        confirmLabel="NEW GAME"
        destructive={false}
        onConfirm={handleNewGame}
        onCancel={() => setConfirmNewGame(false)}
      />
      <ConfirmDialog
        open={confirmLeave}
        title="Leave Game?"
        description="Your current match will end."
        confirmLabel="LEAVE"
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  )
}

function PlayerBadge({
  name,
  symbol,
  wins,
  active,
  reverse,
}: {
  name: string
  symbol: 'X' | 'O'
  wins: number
  active: boolean
  reverse?: boolean
}) {
  return (
    <div className={clsx('flex items-center gap-2.5', reverse && 'flex-row-reverse text-right')}>
      <div className="relative">
        <AvatarSymbol symbol={symbol} size="sm" ring={active} />
        {active && (
          <motion.span
            layoutId="turn-badge"
            className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-bg"
          >
            Turn
          </motion.span>
        )}
      </div>
      <div>
        <p className="max-w-[92px] truncate text-sm font-bold text-ink">{name}</p>
        <p className="text-[11px] font-semibold text-muted">{wins} Wins</p>
      </div>
    </div>
  )
}
