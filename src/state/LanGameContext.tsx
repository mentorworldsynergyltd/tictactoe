import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { LanClient, buildWsUrl, sameOriginWsUrl } from '../net/LanClient'
import { DEFAULT_LAN_PORT } from '../net/protocol'
import type { PlayerInfo, ServerMessage } from '../net/protocol'
import type { GameState, Scoreboard, Symbol } from '../engine/ticTacToe'
import { useSettings } from './SettingsContext'
import { isAndroidNative, ensureAndroidServerReady, ANDROID_HOST_LOOPBACK_URL } from '../lib/androidHost'
import { ONLINE_SERVER_URL, isOnlineServerConfigured } from '../lib/onlineServer'

async function setHostKeepAwake(enabled: boolean) {
  if (!isAndroidNative()) return
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    if (enabled) await KeepAwake.keepAwake()
    else await KeepAwake.allowSleep()
  } catch {
    // Best-effort — hosting still works without it, just more exposed to
    // the OS suspending the socket if the screen sleeps.
  }
}

export type LanStatus =
  | 'idle'
  | 'connecting'
  | 'hosting_waiting'
  | 'in_room'
  | 'error'
  | 'closed'

export type RematchStatus = 'none' | 'waiting_for_opponent' | 'opponent_requested'

/** Which kind of connection the current/last room used — governs how the
 * shared waiting-room/board/results screens present things (an IP address
 * only ever makes sense for 'lan', for instance). */
export type ConnectionMode = 'lan' | 'online'

interface LanGameContextValue {
  status: LanStatus
  mode: ConnectionMode | null
  code: string | null
  hostIp: string | null
  port: number
  me: PlayerInfo | null
  opponent: PlayerInfo | null
  opponentConnected: boolean
  myConnectionLost: boolean
  game: GameState | null
  scoreboard: Scoreboard | null
  gamesPlayed: number
  errorMessage: string | null
  rematchStatus: RematchStatus
  rematchBy: Symbol | null
  hostGame: (name: string) => Promise<void>
  joinGame: (name: string, hostIp: string, code: string) => Promise<void>
  hostOnlineGame: (name: string) => Promise<void>
  joinOnlineGame: (name: string, code: string) => Promise<void>
  makeMove: (index: number) => void
  requestNewGame: () => void
  requestRematch: () => void
  acceptRematch: () => void
  declineRematch: () => void
  leaveGame: () => void
  resetError: () => void
}

const LanGameContext = createContext<LanGameContextValue | null>(null)

export function LanGameProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [status, setStatus] = useState<LanStatus>('idle')
  const [mode, setMode] = useState<ConnectionMode | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [hostIp, setHostIp] = useState<string | null>(null)
  const [port, setPort] = useState<number>(DEFAULT_LAN_PORT)
  const [me, setMe] = useState<PlayerInfo | null>(null)
  const [opponent, setOpponent] = useState<PlayerInfo | null>(null)
  const [opponentConnected, setOpponentConnected] = useState(true)
  const [myConnectionLost, setMyConnectionLost] = useState(false)
  const [game, setGame] = useState<GameState | null>(null)
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>('none')
  const [rematchBy, setRematchBy] = useState<Symbol | null>(null)

  const clientRef = useRef<LanClient | null>(null)
  const clientIdRef = useRef<string | null>(null)
  const codeRef = useRef<string | null>(null)
  const everConnectedRef = useRef(false)

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'room_created':
        clientIdRef.current = msg.clientId
        codeRef.current = msg.code
        setCode(msg.code)
        setHostIp(msg.hostIp)
        setPort(msg.port)
        setMe(msg.you)
        setStatus('hosting_waiting')
        break
      case 'joined':
        clientIdRef.current = msg.clientId
        codeRef.current = msg.code
        setCode(msg.code)
        setMe(msg.you)
        setOpponent(msg.opponent)
        setOpponentConnected(true)
        setStatus('in_room')
        break
      case 'opponent_joined':
        setOpponent(msg.opponent)
        setOpponentConnected(true)
        setStatus('in_room')
        break
      case 'state':
        setGame(msg.game)
        setScoreboard(msg.scoreboard)
        setGamesPlayed(msg.gamesPlayed)
        setRematchStatus('none')
        setRematchBy(null)
        setStatus((s) => (s === 'idle' || s === 'connecting' || s === 'error' ? 'in_room' : s))
        break
      case 'opponent_left':
        setOpponentConnected(false)
        break
      case 'opponent_reconnected':
        setOpponentConnected(true)
        break
      case 'rematch_requested':
        setRematchStatus('opponent_requested')
        setRematchBy(msg.by)
        break
      case 'rematch_declined':
        setRematchStatus('none')
        setRematchBy(null)
        break
      case 'room_closed':
        setErrorMessage(msg.reason)
        setStatus('closed')
        break
      case 'error':
        setErrorMessage(msg.message)
        if (
          msg.code === 'room_not_found' ||
          msg.code === 'room_full' ||
          msg.code === 'invalid_code' ||
          msg.code === 'stale_reconnect'
        ) {
          setStatus('error')
        }
        break
      case 'pong':
        break
    }
  }, [])

  const connectAndSend = useCallback(
    (url: string, initialSend: () => void) => {
      setStatus('connecting')
      setErrorMessage(null)
      everConnectedRef.current = false

      const client: LanClient = new LanClient(
        url,
        {
          onMessage: handleMessage,
          onOpen: () => {
            if (!everConnectedRef.current) {
              everConnectedRef.current = true
              initialSend()
            } else {
              // An automatic reconnect after an unexpected drop — resume the
              // same room instead of re-running the create/join handshake.
              setMyConnectionLost(false)
              if (codeRef.current && clientIdRef.current) {
                client.send({ type: 'reconnect', code: codeRef.current, clientId: clientIdRef.current })
              }
            }
          },
          onClose: (expected) => {
            if (!expected) setMyConnectionLost(true)
          },
        },
        {
          connectTimeoutMs: settings.connectionTimeoutMs,
          maxReconnectAttempts: settings.autoReconnect ? 5 : 0,
        },
      )
      clientRef.current = client
      return client.connect().catch((err: Error) => {
        setStatus('error')
        setErrorMessage(err.message || 'Could not connect.')
        throw err
      })
    },
    [handleMessage, settings.connectionTimeoutMs, settings.autoReconnect],
  )

  const hostGame = useCallback(
    async (name: string) => {
      setMode('lan')
      if (isAndroidNative()) {
        // The web build assumes a server is already running at the page's
        // own origin (npm run start). The native Android app has no such
        // thing — its "origin" is just the bundled WebView assets — so it
        // waits for the embedded on-device server to come up and talks to
        // it over loopback instead. See src/lib/androidHost.ts.
        await ensureAndroidServerReady()
        await setHostKeepAwake(true)
      }
      const url = isAndroidNative() ? ANDROID_HOST_LOOPBACK_URL : sameOriginWsUrl()
      await connectAndSend(url, () => {
        clientRef.current?.send({ type: 'create_room', name })
      })
    },
    [connectAndSend],
  )

  const joinGame = useCallback(
    async (name: string, hostIpAddr: string, joinCode: string) => {
      setMode('lan')
      const url = buildWsUrl(hostIpAddr, settings.preferredPort)
      setHostIp(hostIpAddr)
      await connectAndSend(url, () => {
        clientRef.current?.send({ type: 'join_room', code: joinCode, name })
      })
    },
    [connectAndSend, settings.preferredPort],
  )

  const hostOnlineGame = useCallback(
    async (name: string) => {
      setMode('online')
      if (!isOnlineServerConfigured()) {
        setStatus('error')
        setErrorMessage(
          'Online play isn’t set up yet — this app hasn’t been pointed at a relay server. See ONLINE_PLAY_SETUP.md.',
        )
        throw new Error('Online relay not configured')
      }
      // Unlike LAN hosting, there's no local/embedded server to spin up —
      // the relay is already running, publicly, all the time. Both the
      // "host" and the "guest" are just ordinary clients of it.
      await connectAndSend(ONLINE_SERVER_URL, () => {
        clientRef.current?.send({ type: 'create_room', name })
      })
    },
    [connectAndSend],
  )

  const joinOnlineGame = useCallback(
    async (name: string, joinCode: string) => {
      setMode('online')
      if (!isOnlineServerConfigured()) {
        setStatus('error')
        setErrorMessage(
          'Online play isn’t set up yet — this app hasn’t been pointed at a relay server. See ONLINE_PLAY_SETUP.md.',
        )
        throw new Error('Online relay not configured')
      }
      await connectAndSend(ONLINE_SERVER_URL, () => {
        clientRef.current?.send({ type: 'join_room', code: joinCode, name })
      })
    },
    [connectAndSend],
  )

  const makeMove = useCallback((index: number) => {
    clientRef.current?.send({ type: 'move', index })
  }, [])

  const requestNewGame = useCallback(() => {
    clientRef.current?.send({ type: 'request_new_game' })
  }, [])

  const requestRematch = useCallback(() => {
    setRematchStatus('waiting_for_opponent')
    clientRef.current?.send({ type: 'request_rematch' })
  }, [])

  const acceptRematch = useCallback(() => {
    clientRef.current?.send({ type: 'accept_rematch' })
  }, [])

  const declineRematch = useCallback(() => {
    setRematchStatus('none')
    setRematchBy(null)
    clientRef.current?.send({ type: 'decline_rematch' })
  }, [])

  const leaveGame = useCallback(() => {
    void setHostKeepAwake(false)
    clientRef.current?.send({ type: 'leave' })
    clientRef.current?.disconnect()
    clientRef.current = null
    clientIdRef.current = null
    codeRef.current = null
    everConnectedRef.current = false
    setStatus('idle')
    setMode(null)
    setCode(null)
    setHostIp(null)
    setMe(null)
    setOpponent(null)
    setOpponentConnected(true)
    setMyConnectionLost(false)
    setGame(null)
    setScoreboard(null)
    setGamesPlayed(0)
    setErrorMessage(null)
    setRematchStatus('none')
    setRematchBy(null)
  }, [])

  const resetError = useCallback(() => {
    setErrorMessage(null)
    setStatus('idle')
  }, [])

  const value = useMemo(
    () => ({
      status,
      mode,
      code,
      hostIp,
      port,
      me,
      opponent,
      opponentConnected,
      myConnectionLost,
      game,
      scoreboard,
      gamesPlayed,
      errorMessage,
      rematchStatus,
      rematchBy,
      hostGame,
      joinGame,
      hostOnlineGame,
      joinOnlineGame,
      makeMove,
      requestNewGame,
      requestRematch,
      acceptRematch,
      declineRematch,
      leaveGame,
      resetError,
    }),
    [
      status,
      mode,
      code,
      hostIp,
      port,
      me,
      opponent,
      opponentConnected,
      myConnectionLost,
      game,
      scoreboard,
      gamesPlayed,
      errorMessage,
      rematchStatus,
      rematchBy,
      hostGame,
      joinGame,
      hostOnlineGame,
      joinOnlineGame,
      makeMove,
      requestNewGame,
      requestRematch,
      acceptRematch,
      declineRematch,
      leaveGame,
      resetError,
    ],
  )

  return <LanGameContext.Provider value={value}>{children}</LanGameContext.Provider>
}

export function useLanGame() {
  const ctx = useContext(LanGameContext)
  if (!ctx) throw new Error('useLanGame must be used within LanGameProvider')
  return ctx
}
