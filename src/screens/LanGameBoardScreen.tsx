import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Board } from '../components/Board'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusPill } from '../components/StatusPill'
import { useLanGame } from '../state/LanGameContext'
import { useGameFeedback } from '../lib/useGameFeedback'
import { useSettings } from '../state/SettingsContext'
import { findWinningMove } from '../engine/hints'

export function LanGameBoardScreen() {
  const navigate = useNavigate()
  const {
    mode,
    me,
    opponent,
    opponentConnected,
    myConnectionLost,
    game,
    scoreboard,
    makeMove,
    requestNewGame,
    leaveGame,
  } = useLanGame()
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const navigatedRef = useRef(false)

  useGameFeedback(game?.moveCount ?? 0, game?.status ?? 'in_progress')

  useEffect(() => {
    if (!me || !opponent) {
      navigate(mode === 'online' ? '/online' : '/lan', { replace: true })
    }
  }, [me, opponent, mode, navigate])

  useEffect(() => {
    if (!game || game.status === 'in_progress' || navigatedRef.current) return
    navigatedRef.current = true
    const t = window.setTimeout(() => navigate('/lan/results'), 1100)
    return () => window.clearTimeout(t)
  }, [game, navigate])

  useEffect(() => {
    if (game?.moveCount === 0) navigatedRef.current = false
  }, [game?.moveCount])

  const { settings } = useSettings()

  if (!me || !opponent || !game || !scoreboard) return null

  const isMyTurn = game.currentTurn === me.symbol && game.status === 'in_progress'
  const connectionStatus = myConnectionLost ? 'connecting' : opponentConnected ? 'connected' : 'disconnected'
  const boardDisabled = game.status !== 'in_progress' || !isMyTurn || !opponentConnected || myConnectionLost
  const hintIndex = settings.showHints && isMyTurn ? findWinningMove(game.board, me.symbol) : null

  const handleLeave = () => {
    leaveGame()
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-wide text-ink">TIC TAC TOE</h1>
        <StatusPill status={connectionStatus} />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-line/60 bg-surface px-4 py-3">
        <PlayerBadge name={me.name} symbol={me.symbol} wins={winsFor(scoreboard, me.symbol)} active={game.currentTurn === me.symbol} suffix="(You)" />
        <span className="text-xs font-bold text-muted">VS</span>
        <PlayerBadge
          name={opponent.name}
          symbol={opponent.symbol}
          wins={winsFor(scoreboard, opponent.symbol)}
          active={game.currentTurn === opponent.symbol}
          reverse
        />
      </div>

      <div className="mt-5 text-center">
        {myConnectionLost ? (
          <p className="text-sm font-bold text-warning">Reconnecting…</p>
        ) : isMyTurn ? (
          <p className="text-lg font-extrabold text-ink">Your Turn — Make your move</p>
        ) : (
          <p className="text-lg font-extrabold text-ink">
            {opponent.name}&rsquo;s Turn
            <span className="block text-sm font-medium text-muted">Waiting for opponent...</span>
          </p>
        )}
      </div>

      <div className="relative mt-6 flex-1">
        <Board
          board={game.board}
          onSelect={makeMove}
          disabled={boardDisabled}
          lastMove={game.lastMove}
          winningLine={game.winningLine}
          hintIndex={hintIndex}
        />

        {(!opponentConnected || myConnectionLost) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-bg/85 p-4 text-center backdrop-blur-sm"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-danger">
                {myConnectionLost ? 'Reconnecting…' : 'Opponent Disconnected'}
              </p>
              <p className="mt-2 max-w-[220px] text-xs text-muted">
                {myConnectionLost
                  ? 'Trying to restore your connection to the host.'
                  : `${opponent.name} has left the game. Waiting for them to reconnect...`}
              </p>
              {!myConnectionLost && (
                <Button size="md" className="mt-4" onClick={() => setConfirmLeave(true)}>
                  MAIN MENU
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

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
        description="The current board and turn will reset for both players."
        confirmLabel="NEW GAME"
        destructive={false}
        onConfirm={() => {
          setConfirmNewGame(false)
          navigatedRef.current = false
          requestNewGame()
        }}
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

function winsFor(scoreboard: { xWins: number; oWins: number }, symbol: 'X' | 'O') {
  return symbol === 'X' ? scoreboard.xWins : scoreboard.oWins
}

function PlayerBadge({
  name,
  symbol,
  wins,
  active,
  reverse,
  suffix,
}: {
  name: string
  symbol: 'X' | 'O'
  wins: number
  active: boolean
  reverse?: boolean
  suffix?: string
}) {
  return (
    <div className={clsx('flex items-center gap-2.5', reverse && 'flex-row-reverse text-right')}>
      <div className="relative">
        <AvatarSymbol symbol={symbol} size="sm" ring={active} />
        {active && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-bg">
            Turn
          </span>
        )}
      </div>
      <div>
        <p className="max-w-[92px] truncate text-sm font-bold text-ink">
          {name}
          {suffix ? <span className="ml-1 font-normal text-muted">{suffix}</span> : null}
        </p>
        <p className="text-[11px] font-semibold text-muted">{wins} Wins</p>
      </div>
    </div>
  )
}
