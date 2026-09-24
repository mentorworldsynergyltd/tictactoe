import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { ActionCard } from '../components/ActionCard'
import { Button } from '../components/Button'

export function LanLobbyScreen() {
  const navigate = useNavigate()
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

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
              <p className="text-sm font-bold text-ink">Wi-Fi connected</p>
              <p className="text-xs text-muted">Local multiplayer works without internet</p>
            </div>
          </Card>
        ) : (
          <Card elevated className="flex items-center gap-3 border-danger/40 py-4">
            <span className="text-lg">🔴</span>
            <div>
              <p className="text-sm font-bold text-ink">Wi-Fi unavailable</p>
              <p className="text-xs text-muted">
                Connect both devices to the same Wi-Fi network to play.
              </p>
            </div>
          </Card>
        )}

        <h1 className="mt-6 text-2xl font-black text-ink">Play on LAN</h1>
        <p className="mt-1 text-sm text-muted">
          Connect by game code and host IP — enter details manually on the joining device.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <ActionCard
            icon={<span>🛰️</span>}
            title="Create Game"
            description="Host a new local game"
            accent="primary"
            onClick={() => navigate('/lan/create')}
          />
          <ActionCard
            icon={<span>🔗</span>}
            title="Join Game"
            description="Connect to another player"
            accent="secondary"
            onClick={() => navigate('/lan/join')}
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
