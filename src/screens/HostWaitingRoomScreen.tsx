import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../components/Button'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { useLanGame } from '../state/LanGameContext'
import { isAndroidNative } from '../lib/androidHost'

function CopyField({ label, value, testId }: { label: string; value: string; testId?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // clipboard API can be unavailable (e.g. insecure context) — fail quietly
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-line/60 bg-surface-2 px-4 py-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p data-testid={testId} className="mt-0.5 font-mono text-xl font-bold tracking-[0.15em] text-ink">
          {value}
        </p>
      </div>
      <div className="relative">
        <button
          onClick={handleCopy}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-surface px-3 text-sm font-bold text-primary hover:bg-primary/10"
        >
          📋 COPY
        </button>
        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 right-0 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-bg"
            >
              Copied!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function HostWaitingRoomScreen() {
  const navigate = useNavigate()
  const { status, mode, code, hostIp, port, me, opponent, hostGame, hostOnlineGame, leaveGame } = useLanGame()
  const isOnline = mode === 'online'
  const [countdown, setCountdown] = useState<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!code && status !== 'connecting') {
      navigate(isOnline ? '/online/create' : '/lan/create', { replace: true })
    }
  }, [code, status, isOnline, navigate])

  useEffect(() => {
    if (opponent && countdown === null && !startedRef.current) {
      startedRef.current = true
      setCountdown(3)
    }
  }, [opponent, countdown])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      navigate('/lan/game')
      return
    }
    const t = window.setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 700)
    return () => window.clearTimeout(t)
  }, [countdown, navigate])

  const handleCancel = () => {
    leaveGame()
    navigate(isOnline ? '/online' : '/lan')
  }

  const handleRefresh = async () => {
    leaveGame()
    startedRef.current = false
    setCountdown(null)
    if (isOnline) await hostOnlineGame(me?.name ?? 'Host')
    else await hostGame(me?.name ?? 'Host')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
        {isOnline ? 'Host Online Game' : 'Host Game'}
      </p>
      <h1 className="mt-1 text-2xl font-black text-ink">Waiting for opponent</h1>

      <div className="relative mt-8 flex h-40 items-center justify-center">
        {!opponent && (
          <>
            <span className="absolute h-24 w-24 rounded-full border-2 border-primary/50 animate-radar" />
            <span className="absolute h-24 w-24 rounded-full border-2 border-primary/50 animate-radar [animation-delay:0.8s]" />
          </>
        )}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-4xl">
          {isOnline ? '🌐' : '📡'}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <CopyField label="Game Code" value={code ?? '----'} testId="game-code" />
        {isOnline ? (
          <p className="text-center text-[11px] text-muted">
            Share this code with your opponent — they can enter it from anywhere, no shared Wi-Fi required.
          </p>
        ) : (
          <>
            <CopyField label="IP Address" value={hostIp ?? 'unavailable'} testId="host-ip" />
            <p className="text-center text-[11px] text-muted">
              Enter just the IP address on the joining device — the port ({port}) is handled automatically.
            </p>
          </>
        )}
        {isAndroidNative() && !isOnline && (
          <p className="text-center text-[11px] text-warning">
            Keep this app open and this screen on — the game server is running on this
            phone, and Android may cut it off if it goes to sleep or gets backgrounded.
          </p>
        )}
        {isAndroidNative() && isOnline && (
          <p className="text-center text-[11px] text-warning">
            Keep this app open while you wait — backgrounding it can drop your connection to the relay.
          </p>
        )}
      </div>

      <div className="mt-6 text-center">
        <AnimatePresence mode="wait">
          {!opponent ? (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm font-bold text-warning">🟡 Waiting for opponent...</p>
              <p className="mt-2 text-xs text-muted">
                {isOnline
                  ? 'Ask your opponent to open the app, choose Play Online → Join Game, and enter this code.'
                  : 'Ask your opponent to open the app and enter this code and IP address manually.'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="connected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <p className="text-sm font-bold text-success">🟢 Opponent connected</p>
              <div className="mt-4 flex items-center justify-center gap-8">
                <span className="flex items-center gap-2 font-bold text-x">
                  <AvatarSymbol symbol="X" size="sm" />
                  {me?.name}
                </span>
                <span className="flex items-center gap-2 font-bold text-o">
                  <AvatarSymbol symbol="O" size="sm" />
                  {opponent.name}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-muted">
                Starting game{countdown ? ` in ${countdown}…` : '…'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!opponent && (
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="secondary" size="lg" fullWidth onClick={handleRefresh}>
            REFRESH SERVER
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={handleCancel}>
            CANCEL
          </Button>
        </div>
      )}
    </div>
  )
}
