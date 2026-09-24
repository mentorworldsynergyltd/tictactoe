import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useLanGame } from '../state/LanGameContext'

export function CreateOnlineGameScreen() {
  const navigate = useNavigate()
  const { hostOnlineGame, status, errorMessage, resetError } = useLanGame()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    setSubmitting(true)
    resetError()
    try {
      await hostOnlineGame(name.trim() || 'Host')
      navigate('/lan/host')
    } catch {
      // errorMessage is already set by the context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Create Online Game</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Host a match online</h1>

        <Card className="mt-6">
          <label htmlFor="online-host-name" className="block text-xs font-bold uppercase tracking-wide text-muted">
            Your Name
          </label>
          <input
            id="online-host-name"
            type="text"
            value={name}
            maxLength={16}
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </Card>

        {errorMessage && status === 'error' && (
          <Card className="mt-4 border-danger/40 bg-danger/5">
            <p className="text-sm font-semibold text-danger">{errorMessage}</p>
          </Card>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={handleCreate} disabled={submitting}>
            {submitting ? 'CREATING...' : 'CREATE GAME'}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/online')}>
            BACK
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
