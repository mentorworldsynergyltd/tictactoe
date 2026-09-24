import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Board } from '../components/Board'
import { Button } from '../components/Button'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { Card } from '../components/Card'
import { useLocalGame } from '../state/LocalGameContext'
import { useAdBanner } from '../lib/useAdBanner'
import { maybeShowInterstitial } from '../lib/ads'

export function ResultsScreen() {
  const navigate = useNavigate()
  const { players, game, scoreboard, gamesPlayed, startNewGame, resetMatch } = useLocalGame()
  const [p1, p2] = players
  useAdBanner()

  useEffect(() => {
    if (game.status === 'in_progress') navigate('/local/game', { replace: true })
  }, [game.status, navigate])

  if (game.status === 'in_progress') return null

  const winnerName = game.winner === 'X' ? p1.name : game.winner === 'O' ? p2.name : null

  const handlePlayAgain = async () => {
    await maybeShowInterstitial(gamesPlayed)
    startNewGame()
    navigate('/local/game')
  }

  const handleNewGame = async () => {
    await maybeShowInterstitial(gamesPlayed)
    resetMatch()
    navigate('/local/game')
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
            <p className="text-4xl">🎉</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{winnerName} WINS!</h1>
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
          <PlayerSummary name={p1.name} symbol="X" wins={scoreboard.xWins} />
          <PlayerSummary name={p2.name} symbol="O" wins={scoreboard.oWins} reverse />
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 border-t border-line/60 pt-4 text-xs font-semibold text-muted">
          <span>Draws: {scoreboard.draws}</span>
          <span>Games played: {gamesPlayed}</span>
        </div>
      </Card>

      <div className="mt-8 flex w-full flex-col gap-3">
        <Button size="lg" fullWidth onClick={handlePlayAgain}>
          PLAY AGAIN
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={handleNewGame}>
          NEW GAME
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/')}>
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
