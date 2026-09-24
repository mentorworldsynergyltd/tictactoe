// Wire protocol shared between the browser client and the Node LAN host
// server. Plain JSON messages over a single WebSocket connection per client.

import type { GameState, Scoreboard, Symbol } from '../engine/ticTacToe'

export interface PlayerInfo {
  name: string
  symbol: Symbol
}

// --- Client -> Server -------------------------------------------------

export type ClientMessage =
  | { type: 'create_room'; name: string }
  | { type: 'join_room'; code: string; name: string; clientId?: string }
  | { type: 'reconnect'; code: string; clientId: string }
  | { type: 'move'; index: number }
  | { type: 'request_new_game' }
  | { type: 'request_rematch' }
  | { type: 'accept_rematch' }
  | { type: 'decline_rematch' }
  | { type: 'leave' }
  | { type: 'ping' }

// --- Server -> Client -------------------------------------------------

export type ServerMessage =
  | {
      type: 'room_created'
      code: string
      clientId: string
      hostIp: string | null
      port: number
      you: PlayerInfo
    }
  | {
      type: 'joined'
      code: string
      clientId: string
      you: PlayerInfo
      opponent: PlayerInfo
    }
  | { type: 'opponent_joined'; opponent: PlayerInfo }
  | { type: 'state'; game: GameState; scoreboard: Scoreboard; gamesPlayed: number }
  | { type: 'opponent_left' }
  | { type: 'opponent_reconnected' }
  | { type: 'rematch_requested'; by: Symbol }
  | { type: 'rematch_declined' }
  | { type: 'room_closed'; reason: string }
  | { type: 'error'; code: ErrorCode; message: string }
  | { type: 'pong' }

export type ErrorCode =
  | 'room_not_found'
  | 'room_full'
  | 'invalid_code'
  | 'invalid_name'
  | 'server_error'
  | 'stale_reconnect'

export const GAME_CODE_LENGTH = 4
// Avoid visually ambiguous characters (0/O, 1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateGameCode(): string {
  let code = ''
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export const DEFAULT_LAN_PORT = 8787
