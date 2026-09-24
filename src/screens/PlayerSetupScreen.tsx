import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { useLocalGame } from '../state/LocalGameContext'

export function PlayerSetupScreen() {
  const navigate = useNavigate()
  const { setPlayerNames, resetMatch } = useLocalGame()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  const p1Display = p1.trim() || 'Player 1'
  const p2Display = p2.trim() || 'Player 2'
  const canStart = true // defaults are valid names, so start is always enabled

  const handleStart = () => {
    resetMatch()
    setPlayerNames(p1, p2)
    navigate('/local/game')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Local Game</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Set up your players</h1>

        <Card className="mt-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <AvatarSymbol symbol="X" ring />
            <div className="flex-1">
              <label htmlFor="player1" className="block text-xs font-bold uppercase tracking-wide text-muted">
                Player 1 &middot; Symbol X
              </label>
              <input
                id="player1"
                type="text"
                value={p1}
                maxLength={16}
                placeholder="Player 1"
                onChange={(e) => setP1(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AvatarSymbol symbol="O" ring />
            <div className="flex-1">
              <label htmlFor="player2" className="block text-xs font-bold uppercase tracking-wide text-muted">
                Player 2 &middot; Symbol O
              </label>
              <input
                id="player2"
                type="text"
                value={p2}
                maxLength={16}
                placeholder="Player 2"
                onChange={(e) => setP2(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
          </div>
        </Card>

        <Card elevated className="mt-4 flex items-center justify-center gap-3 py-4 text-sm font-semibold">
          <span className="flex items-center gap-2 text-x">
            <AvatarSymbol symbol="X" size="sm" />
            {p1Display}
          </span>
          <span className="text-muted">vs</span>
          <span className="flex items-center gap-2 text-o">
            <AvatarSymbol symbol="O" size="sm" />
            {p2Display}
          </span>
        </Card>

        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" fullWidth disabled={!canStart} onClick={handleStart}>
            START GAME
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
            BACK
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
