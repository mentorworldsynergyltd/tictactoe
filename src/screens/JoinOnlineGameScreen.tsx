import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useLanGame } from '../state/LanGameContext'
import { GAME_CODE_LENGTH } from '../net/protocol'

export function JoinOnlineGameScreen() {
  const navigate = useNavigate()
  const { joinOnlineGame, status, errorMessage, resetError } = useLanGame()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)

  const codeValid = code.trim().length === GAME_CODE_LENGTH
  const canSubmit = codeValid && status !== 'connecting'

  const handleConnect = async () => {
    setTouched(true)
    if (!canSubmit) return
    resetError()
    try {
      await joinOnlineGame(name.trim() || 'Player 2', code.trim())
      navigate('/lan/game')
    } catch {
      // errorMessage/status already reflect the failure
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Join Online Game</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Enter a game code</h1>

        <Card className="mt-6 flex flex-col gap-4">
          <Field label="Your Name">
            <input
              id="online-join-name"
              type="text"
              value={name}
              maxLength={16}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="Game Code">
            <input
              id="online-join-code"
              type="text"
              value={code}
              maxLength={GAME_CODE_LENGTH}
              placeholder="A7K4"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inputClass(touched && !codeValid) + ' font-mono tracking-[0.3em] uppercase'}
            />
            {touched && !codeValid && (
              <p className="mt-1 text-xs font-semibold text-danger">
                Game code must contain {GAME_CODE_LENGTH} characters.
              </p>
            )}
          </Field>
        </Card>

        {status === 'connecting' && (
          <Card elevated className="mt-4 py-3 text-center">
            <p className="text-sm font-bold text-warning">🟡 Connecting...</p>
          </Card>
        )}

        {status === 'error' && errorMessage && (
          <Card className="mt-4 border-danger/40 bg-danger/5">
            <p className="text-sm font-bold text-danger">Unable to connect</p>
            <p className="mt-1 text-sm text-muted">{errorMessage}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button size="md" fullWidth onClick={handleConnect}>
                TRY AGAIN
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={resetError}>
                EDIT DETAILS
              </Button>
            </div>
          </Card>
        )}

        {status !== 'error' && (
          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" fullWidth onClick={handleConnect} disabled={status === 'connecting'}>
              CONNECT
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/online')}>
              BACK
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function inputClass(invalid = false) {
  return [
    'h-11 w-full rounded-xl border bg-surface-2 px-3 text-ink placeholder:text-muted/60',
    'focus:outline-none focus:ring-2 focus:ring-secondary/40',
    invalid ? 'border-danger focus:border-danger' : 'border-line focus:border-secondary',
  ].join(' ')
}
