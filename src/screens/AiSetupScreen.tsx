import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { SegmentedControl } from '../components/SegmentedControl'
import { useLocalGame } from '../state/LocalGameContext'
import type { Symbol } from '../engine/ticTacToe'
import type { Difficulty } from '../engine/ai'

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const difficultyBlurb: Record<Difficulty, string> = {
  easy: 'The AI moves at random — great for beginners.',
  medium: 'The AI takes wins and blocks yours, but can still slip up.',
  hard: 'The AI plays perfectly. The best you can do is a draw.',
}

export function AiSetupScreen() {
  const navigate = useNavigate()
  const { configureAiGame, resetMatch } = useLocalGame()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState<Symbol>('X')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const handleStart = () => {
    resetMatch()
    configureAiGame(name, symbol, difficulty)
    navigate('/local/game')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-success">Play Against AI</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Set up your match</h1>

        <Card className="mt-6 flex flex-col gap-5">
          <div>
            <label htmlFor="aiPlayerName" className="block text-xs font-bold uppercase tracking-wide text-muted">
              Your Name
            </label>
            <input
              id="aiPlayerName"
              type="text"
              value={name}
              maxLength={16}
              placeholder="Player 1"
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Play As</p>
            <div className="mt-2 flex gap-3">
              {(['X', 'O'] as Symbol[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSymbol(s)}
                  aria-pressed={symbol === s}
                  className={clsx(
                    'flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 font-bold transition-colors',
                    symbol === s ? 'border-secondary bg-secondary/10' : 'border-line bg-surface-2 hover:border-line',
                  )}
                >
                  <AvatarSymbol symbol={s} size="sm" ring={symbol === s} />
                  <span className="text-sm text-ink">{s === 'X' ? 'Go first' : 'Go second'}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Difficulty</p>
            <div className="mt-2">
              <SegmentedControl options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
            </div>
            <p className="mt-2 text-xs text-muted">{difficultyBlurb[difficulty]}</p>
          </div>
        </Card>

        <Card elevated className="mt-4 flex items-center justify-center gap-3 py-4 text-sm font-semibold">
          <span className="flex items-center gap-2 text-x">
            <AvatarSymbol symbol={symbol} size="sm" />
            {name.trim() || 'Player 1'}
          </span>
          <span className="text-muted">vs</span>
          <span className="flex items-center gap-2 text-o">
            <AvatarSymbol symbol={symbol === 'X' ? 'O' : 'X'} size="sm" />
            AI &middot; {difficultyOptions.find((d) => d.value === difficulty)?.label}
          </span>
        </Card>

        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={handleStart}>
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
