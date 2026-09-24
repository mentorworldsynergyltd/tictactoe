import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { ActionCard } from '../components/ActionCard'
import { Button } from '../components/Button'
import { isOnlineServerConfigured } from '../lib/onlineServer'

export function OnlineLobbyScreen() {
  const navigate = useNavigate()
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const configured = isOnlineServerConfigured()

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {online ? (
          <Card elevated className="flex items-center gap-3 py-4">
            <span className="text-lg">🟢</span>
            <div>
              <p className="text-sm font-bold text-ink">Internet connected</p>
              <p className="text-xs text-muted">Play with anyone, anywhere — no shared Wi-Fi needed</p>
            </div>
          </Card>
        ) : (
          <Card elevated className="flex items-center gap-3 border-danger/40 py-4">
            <span className="text-lg">🔴</span>
            <div>
              <p className="text-sm font-bold text-ink">No internet connection</p>
              <p className="text-xs text-muted">Online play needs a working internet connection.</p>
            </div>
          </Card>
        )}

        {!configured && (
          <Card className="mt-4 border-warning/40 bg-warning/5">
            <p className="text-sm font-bold text-ink">Online play isn&rsquo;t set up yet</p>
            <p className="mt-1 text-xs text-muted">
              This build hasn&rsquo;t been pointed at a relay server, so games can&rsquo;t connect. See{' '}
              <span className="font-mono">ONLINE_PLAY_SETUP.md</span> in the project for a step-by-step guide.
            </p>
          </Card>
        )}

        <h1 className="mt-6 text-2xl font-black text-ink">Play Online</h1>
        <p className="mt-1 text-sm text-muted">
          Create or join a match with a 4-character game code — works over any internet connection, not just the
          same Wi-Fi.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <ActionCard
            icon={<span>🌐</span>}
            title="Create Game"
            description="Start a new online match"
            accent="primary"
            onClick={() => navigate('/online/create')}
          />
          <ActionCard
            icon={<span>🔗</span>}
            title="Join Game"
            description="Enter a friend's game code"
            accent="secondary"
            onClick={() => navigate('/online/join')}
          />
        </div>

        <div className="mt-8">
          <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/')}>
            BACK TO MAIN MENU
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
