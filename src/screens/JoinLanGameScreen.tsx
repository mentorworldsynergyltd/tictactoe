import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useLanGame } from '../state/LanGameContext'
import { GAME_CODE_LENGTH } from '../net/protocol'

const IPV4_RE =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

/**
 * Tolerates the common ways people paste an address instead of typing a bare
 * IP: a copied "http://192.168.1.25:8787" URL, a trailing ":8787" (our
 * Host Waiting Room used to show IP and port together), stray whitespace,
 * or a trailing slash.
 */
function sanitizeIp(raw: string): string {
  let value = raw.trim()
  value = value.replace(/^\w+:\/\//, '') // strip http:// or ws:// etc.
  value = value.replace(/\/.*$/, '') // strip any trailing path
  value = value.replace(/:\d+$/, '') // strip a trailing :port
  return value.trim()
}

export function JoinLanGameScreen() {
  const navigate = useNavigate()
  const { joinGame, status, errorMessage, resetError } = useLanGame()
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)

  const cleanIp = sanitizeIp(ip)
  const ipValid = IPV4_RE.test(cleanIp)
  const codeValid = code.trim().length === GAME_CODE_LENGTH
  const canSubmit = ipValid && codeValid && status !== 'connecting'

  const handleConnect = async () => {
    setTouched(true)
    if (!canSubmit) return
    resetError()
    try {
      await joinGame(name.trim() || 'Player 2', cleanIp, code.trim())
      navigate('/lan/game')
    } catch {
      // errorMessage/status already reflect the failure
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Join LAN Game</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Find a local opponent</h1>

        <Card className="mt-6 flex flex-col gap-4">
          <Field label="Your Name">
            <input
              id="join-name"
              type="text"
              value={name}
              maxLength={16}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
              className={inputClass()}
            />
          </Field>

          <Field label="Host IP Address">
            <input
              id="join-ip"
              type="text"
              value={ip}
              placeholder="192.168.1.25"
              inputMode="decimal"
              onChange={(e) => setIp(e.target.value)}
              className={inputClass(touched && !ipValid)}
            />
            {touched && !ipValid && (
              <p className="mt-1 text-xs font-semibold text-danger">Enter a valid local IP address.</p>
            )}
          </Field>

          <Field label="Game Code">
            <input
              id="join-code"
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
            <p className="text-sm font-bold text-warning">🟡 Connecting to host...</p>
          </Card>
        )}

        {status === 'error' && errorMessage && (
          <Card className="mt-4 border-danger/40 bg-danger/5">
            <p className="text-sm font-bold text-danger">Unable to connect</p>
            <p className="mt-1 text-sm text-muted">
              {errorMessage} Make sure both devices are connected to the same Wi-Fi network.
            </p>
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
            <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/lan')}>
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
