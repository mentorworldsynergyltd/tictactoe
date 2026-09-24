import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Board } from '../components/Board'
import { Button } from '../components/Button'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { Card } from '../components/Card'
import { useLanGame } from '../state/LanGameContext'
import { useAdBanner } from '../lib/useAdBanner'
import { maybeShowInterstitial } from '../lib/ads'

export function LanResultsScreen() {
  const navigate = useNavigate()
  const {
    mode,
    me,
    opponent,
    game,
    scoreboard,
    gamesPlayed,
    rematchStatus,
    rematchBy,
    requestRematch,
    acceptRematch,
    declineRematch,
    requestNewGame,
    leaveGame,
  } = useLanGame()
  useAdBanner()

  useEffect(() => {
    if (!me || !opponent || !game) {
      navigate(mode === 'online' ? '/online' : '/lan', { replace: true })
      return
    }
    if (game.status === 'in_progress') navigate('/lan/game', { replace: true })
  }, [me, opponent, game, mode, navigate])

  if (!me || !opponent || !game || !scoreboard || game.status === 'in_progress') return null

  const winnerName = game.winner === me.symbol ? me.name : game.winner === opponent.symbol ? opponent.name : null
  const iWon = game.winner === me.symbol

  const handleMainMenu = () => {
    leaveGame()
    navigate('/')
  }

  const handleRequestRematch = async () => {
    await maybeShowInterstitial(gamesPlayed)
    requestRematch()
  }

  const handleNewGame = async () => {
    await maybeShowInterstitial(gamesPlayed)
    requestNewGame()
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-center"
      >
        {game.status === 'win' ? (
          <>
            <p className="text-4xl">{iWon ? '🎉' : ''}</p>
            <h1 className="mt-2 text-3xl font-black text-ink">
              {iWon ? 'YOU WIN!' : `${winnerName?.toUpperCase()} WINS`}
            </h1>
            <p className="mt-1 text-sm text-muted">{winnerName} completed the line.</p>
          </>
        ) : (
          <>
            <p className="text-4xl">🤝</p>
            <h1 className="mt-2 text-3xl font-black text-ink">DRAW GAME</h1>
            <p className="mt-1 text-sm text-muted">The board is full.</p>
          </>
        )}
      </motion.div>

      <div className="mt-6 w-full max-w-xs">
        <Board board={game.board} onSelect={() => {}} disabled lastMove={null} winningLine={game.winningLine} />
      </div>

      <Card elevated className="mt-6 w-full">
        <div className="flex items-center justify-between">
          <PlayerSummary name={me.name} symbol={me.symbol} wins={me.symbol === 'X' ? scoreboard.xWins : scoreboard.oWins} />
          <PlayerSummary
            name={opponent.name}
            symbol={opponent.symbol}
            wins={opponent.symbol === 'X' ? scoreboard.xWins : scoreboard.oWins}
            reverse
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 border-t border-line/60 pt-4 text-xs font-semibold text-muted">
          <span>Draws: {scoreboard.draws}</span>
          <span>Games played: {gamesPlayed}</span>
        </div>
      </Card>

      <div className="mt-8 flex w-full flex-col gap-3">
        {rematchStatus === 'opponent_requested' ? (
          <Card className="border-primary/40 bg-primary/5 text-center">
            <p className="text-sm font-bold text-ink">{rematchBy === me.symbol ? 'You' : opponent.name} wants a rematch!</p>
            <div className="mt-3 flex gap-3">
              <Button size="md" fullWidth onClick={acceptRematch}>
                ACCEPT
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={declineRematch}>
                DECLINE
              </Button>
            </div>
          </Card>
        ) : rematchStatus === 'waiting_for_opponent' ? (
          <Button size="lg" fullWidth disabled>
            Waiting for opponent to accept rematch...
          </Button>
        ) : (
          <Button size="lg" fullWidth onClick={handleRequestRematch}>
            PLAY AGAIN
          </Button>
        )}
        <Button variant="secondary" size="lg" fullWidth onClick={handleNewGame}>
          NEW GAME
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={handleMainMenu}>
          MAIN MENU
        </Button>
      </div>
    </div>
  )
}

function PlayerSummary({
  name,
  symbol,
  wins,
  reverse,
}: {
  name: string
  symbol: 'X' | 'O'
  wins: number
  reverse?: boolean
}) {
  return (
    <div className={reverse ? 'text-right' : 'text-left'}>
      <div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
        <AvatarSymbol symbol={symbol} size="sm" />
        <p className="font-bold text-ink">{name}</p>
      </div>
      <p className="mt-1 text-sm text-muted">Wins: {wins}</p>
    </div>
  )
}
