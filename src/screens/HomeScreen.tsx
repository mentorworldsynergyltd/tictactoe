import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AnimatedMark } from '../components/AnimatedMark'
import { BackgroundPattern } from '../components/BackgroundPattern'
import { ActionCard } from '../components/ActionCard'
import { Button } from '../components/Button'
import { useAdBanner } from '../lib/useAdBanner'

export function HomeScreen() {
  const navigate = useNavigate()
  useAdBanner()

  return (
    <div className="relative flex min-h-full flex-col items-center overflow-hidden px-6 py-10">
      <BackgroundPattern />

      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <AnimatedMark size={84} />
          <h1 className="mt-4 text-center text-4xl font-black tracking-tight text-ink">
            TIC TAC TOE
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-muted">
            Play anywhere. Connect locally.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-10 flex w-full flex-col gap-4"
        >
          <ActionCard
            icon={<span>🎮</span>}
            title="Local Multiplayer"
            description="Play together on one device"
            accent="secondary"
            onClick={() => navigate('/local/setup')}
          />
          <ActionCard
            icon={<span>📡</span>}
            title="Play on LAN"
            description="Connect with a nearby player"
            accent="primary"
            onClick={() => navigate('/lan')}
          />
          <ActionCard
            icon={<span>🌐</span>}
            title="Play Online"
            description="Challenge anyone, anywhere"
            accent="primary"
            onClick={() => navigate('/online')}
          />
          <ActionCard
            icon={<span>🤖</span>}
            title="Play Against AI"
            description="Practice against the computer"
            accent="success"
            onClick={() => navigate('/ai/setup')}
          />
        </motion.div>

        <div className="mt-8 flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <span className="h-2 w-2 rounded-full bg-success" />
          Offline-ready
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button variant="ghost" size="md" onClick={() => navigate('/settings')}>
          ⚙ Settings
        </Button>
        <Button variant="ghost" size="md" onClick={() => navigate('/how-to-play')}>
          ❓ How to Play
        </Button>
        <Button variant="ghost" size="md" onClick={() => navigate('/about')}>
          ℹ️ About
        </Button>
      </motion.div>
    </div>
  )
}
