// The actual LAN game server: room/session management, the WebSocket
// protocol handlers, and host-authoritative move validation. Factored out
// of server/index.ts so it can be attached to *any* Node HTTP server —
// the desktop process (server/index.ts, which also serves the built app as
// static files) and the embedded on-device server that lets an Android
// phone host a game itself (server/android-entry.ts, no static serving,
// just this). Both wrap the exact same room logic, so a hosted game behaves
// identically regardless of which machine is hosting it.

import type { Server as HttpServer } from 'node:http'
import { networkInterfaces } from 'node:os'
import crypto from 'node:crypto'
import { WebSocketServer, WebSocket } from 'ws'
import {
  applyMove,
  applyResultToScoreboard,
  createInitialScoreboard,
  createInitialState,
  otherSymbol,
} from '../src/engine/ticTacToe'
import type { GameState, Scoreboard, Symbol } from '../src/engine/ticTacToe'
import { generateGameCode, normalizeCode } from '../src/net/protocol'
import type { ClientMessage, ServerMessage } from '../src/net/protocol'

const RECONNECT_GRACE_MS = 60_000
const HEARTBEAT_INTERVAL_MS = 15_000

interface Player {
  clientId: string
  name: string
  symbol: Symbol
  ws: WebSocket | null
  connected: boolean
  disconnectTimer: ReturnType<typeof setTimeout> | null
}

interface Room {
  code: string
  host: Player
  guest: Player | null
  game: GameState
  scoreboard: Scoreboard
  gamesPlayed: number
  rematchVotes: Partial<Record<Symbol, boolean>>
  lastFirstTurn: Symbol
}

export function getLocalIp(): string | null {
  const nets = networkInterfaces()
  const candidates: string[] = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address)
    }
  }
  const preferred = candidates.find((ip) => /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(ip))
  return preferred ?? candidates[0] ?? null
}

/**
 * Attaches the WebSocket game server (path `/ws`) to an already-created
 * HTTP server and starts its heartbeat. Returns a `close()` to stop the
 * heartbeat (mainly useful for tests).
 */
export function attachGameServer(httpServer: HttpServer, port: number) {
  const rooms = new Map<string, Room>()
  const socketMeta = new WeakMap<WebSocket, { code: string; clientId: string }>()

  function send(ws: WebSocket | null, msg: ServerMessage) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(msg))
  }

  function broadcastState(room: Room) {
    const msg: ServerMessage = {
      type: 'state',
      game: room.game,
      scoreboard: room.scoreboard,
      gamesPlayed: room.gamesPlayed,
    }
    send(room.host.ws, msg)
    send(room.guest?.ws ?? null, msg)
  }

  function opponentOf(room: Room, player: Player): Player | null {
    return player === room.host ? room.guest : room.host
  }

  function makeCode(): string {
    let code = generateGameCode()
    while (rooms.has(code)) code = generateGameCode()
    return code
  }

  function scheduleRoomCleanup(room: Room, player: Player) {
    if (player.disconnectTimer) clearTimeout(player.disconnectTimer)
    player.disconnectTimer = setTimeout(() => {
      const other = opponentOf(room, player)
      if (!player.connected && (!other || !other.connected)) {
        rooms.delete(room.code)
      }
    }, RECONNECT_GRACE_MS)
  }

  function handleMessage(ws: WebSocket, raw: string) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    if (msg.type === 'create_room') {
      const name = (msg.name || 'Host').trim().slice(0, 16) || 'Host'
      const code = makeCode()
      const clientId = crypto.randomUUID()
      const host: Player = { clientId, name, symbol: 'X', ws, connected: true, disconnectTimer: null }
      const room: Room = {
        code,
        host,
        guest: null,
        game: createInitialState('X'),
        scoreboard: createInitialScoreboard(),
        gamesPlayed: 0,
        rematchVotes: {},
        lastFirstTurn: 'X',
      }
      rooms.set(code, room)
      socketMeta.set(ws, { code, clientId })
      send(ws, {
        type: 'room_created',
        code,
        clientId,
        hostIp: getLocalIp(),
        port,
        you: { name, symbol: 'X' },
      })
      return
    }

    if (msg.type === 'join_room') {
      const code = normalizeCode(msg.code)
      const room = rooms.get(code)
      if (!room) {
        send(ws, { type: 'error', code: 'room_not_found', message: 'No game found with that code.' })
        return
      }
      if (room.guest && room.guest.connected) {
        send(ws, { type: 'error', code: 'room_full', message: 'That game already has two players.' })
        return
      }
      const name = (msg.name || 'Player 2').trim().slice(0, 16) || 'Player 2'
      const clientId = crypto.randomUUID()
      const guest: Player = { clientId, name, symbol: 'O', ws, connected: true, disconnectTimer: null }
      room.guest = guest
      socketMeta.set(ws, { code, clientId })

      send(ws, {
        type: 'joined',
        code,
        clientId,
        you: { name, symbol: 'O' },
        opponent: { name: room.host.name, symbol: 'X' },
      })
      send(room.host.ws, { type: 'opponent_joined', opponent: { name, symbol: 'O' } })
      broadcastState(room)
      return
    }

    if (msg.type === 'reconnect') {
      const code = normalizeCode(msg.code)
      const room = rooms.get(code)
      if (!room) {
        send(ws, { type: 'error', code: 'stale_reconnect', message: 'That game no longer exists.' })
        return
      }
      const player = room.host.clientId === msg.clientId ? room.host : room.guest?.clientId === msg.clientId ? room.guest : null
      if (!player) {
        send(ws, { type: 'error', code: 'stale_reconnect', message: 'Could not resume that game.' })
        return
      }
      player.ws = ws
      player.connected = true
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer)
        player.disconnectTimer = null
      }
      socketMeta.set(ws, { code, clientId: player.clientId })
      const opponent = opponentOf(room, player)
      if (opponent) send(opponent.ws, { type: 'opponent_reconnected' })
      broadcastState(room)
      return
    }

    // All remaining message types require an established room membership.
    const meta = socketMeta.get(ws)
    if (!meta) return
    const room = rooms.get(meta.code)
    if (!room) return
    const player = room.host.clientId === meta.clientId ? room.host : room.guest?.clientId === meta.clientId ? room.guest : null
    if (!player) return

    switch (msg.type) {
      case 'move': {
        const result = applyMove(room.game, msg.index, player.symbol)
        if (!result.ok) {
          send(ws, { type: 'error', code: 'server_error', message: `Move rejected (${result.reason}).` })
          return
        }
        room.game = result.state
        if (result.state.status !== 'in_progress') {
          room.scoreboard = applyResultToScoreboard(room.scoreboard, result.state)
          room.gamesPlayed += 1
          room.rematchVotes = {}
        }
        broadcastState(room)
        break
      }
      case 'request_new_game': {
        room.lastFirstTurn = otherSymbol(room.lastFirstTurn)
        room.game = createInitialState(room.lastFirstTurn)
        room.rematchVotes = {}
        broadcastState(room)
        break
      }
      case 'request_rematch': {
        room.rematchVotes[player.symbol] = true
        const opponent = opponentOf(room, player)
        send(opponent?.ws ?? null, { type: 'rematch_requested', by: player.symbol })
        break
      }
      case 'accept_rematch': {
        room.rematchVotes[player.symbol] = true
        room.lastFirstTurn = otherSymbol(room.lastFirstTurn)
        room.game = createInitialState(room.lastFirstTurn)
        room.rematchVotes = {}
        broadcastState(room)
        break
      }
      case 'decline_rematch': {
        room.rematchVotes = {}
        const opponent = opponentOf(room, player)
        send(opponent?.ws ?? null, { type: 'rematch_declined' })
        break
      }
      case 'leave': {
        const opponent = opponentOf(room, player)
        player.connected = false
        player.ws = null
        send(opponent?.ws ?? null, { type: 'opponent_left' })
        if (!opponent || !opponent.connected) rooms.delete(room.code)
        break
      }
      case 'ping': {
        send(ws, { type: 'pong' })
        break
      }
    }
  }

  function handleClose(ws: WebSocket) {
    const meta = socketMeta.get(ws)
    if (!meta) return
    const room = rooms.get(meta.code)
    if (!room) return
    const player = room.host.clientId === meta.clientId ? room.host : room.guest?.clientId === meta.clientId ? room.guest : null
    if (!player || !player.connected) return
    player.connected = false
    player.ws = null
    const opponent = opponentOf(room, player)
    send(opponent?.ws ?? null, { type: 'opponent_left' })
    scheduleRoomCleanup(room, player)
  }

  interface TrackedSocket extends WebSocket {
    isAlive?: boolean
  }

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws: TrackedSocket) => {
    ws.isAlive = true
    ws.on('pong', () => {
      ws.isAlive = true
    })
    ws.on('message', (data) => handleMessage(ws, data.toString()))
    ws.on('close', () => handleClose(ws))
  })

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients as Set<TrackedSocket>) {
      if (ws.isAlive === false) {
        ws.terminate()
        continue
      }
      ws.isAlive = false
      ws.ping()
    }
  }, HEARTBEAT_INTERVAL_MS)

  return {
    close: () => {
      clearInterval(heartbeat)
      wss.close()
    },
  }
}
