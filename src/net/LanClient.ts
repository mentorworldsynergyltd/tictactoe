import type { ClientMessage, ServerMessage } from './protocol'

export interface LanClientHandlers {
  onMessage: (msg: ServerMessage) => void
  onOpen?: () => void
  /** `expected` is true when the socket was closed by our own disconnect() call. */
  onClose?: (expected: boolean) => void
  onError?: (err: unknown) => void
}

export interface LanClientOptions {
  /** How long to wait for the initial handshake before giving up. */
  connectTimeoutMs?: number
  /** Automatic reconnect attempts after an unexpected drop. 0 disables it. */
  maxReconnectAttempts?: number
}

/**
 * Thin WebSocket wrapper for talking to the LAN host server. Handles
 * connect/timeout, JSON (de)serialization, and a small number of automatic
 * reconnect attempts with backoff when the connection drops unexpectedly
 * (e.g. a brief Wi-Fi hiccup) — the server keeps a room's player slot open
 * for a grace period specifically so this can succeed silently.
 */
export class LanClient {
  private ws: WebSocket | null = null
  private url: string
  private handlers: LanClientHandlers
  private intentionalClose = false
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private readonly maxReconnectAttempts: number
  private readonly connectTimeoutMs: number

  constructor(url: string, handlers: LanClientHandlers, options: LanClientOptions = {}) {
    this.url = url
    this.handlers = handlers
    this.connectTimeoutMs = options.connectTimeoutMs ?? 6000
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5
  }

  connect(timeoutMs = this.connectTimeoutMs): Promise<void> {
    this.intentionalClose = false
    return new Promise((resolve, reject) => {
      let settled = false
      const ws = new WebSocket(this.url)
      this.ws = ws

      const timer = window.setTimeout(() => {
        if (settled) return
        settled = true
        ws.close()
        reject(new Error('Connection timed out.'))
      }, timeoutMs)

      ws.addEventListener('open', () => {
        if (!settled) {
          settled = true
          window.clearTimeout(timer)
          resolve()
        }
        this.reconnectAttempt = 0
        this.handlers.onOpen?.()
      })

      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ServerMessage
          this.handlers.onMessage(msg)
        } catch {
          // ignore malformed frames
        }
      })

      ws.addEventListener('close', () => {
        if (!settled) {
          settled = true
          window.clearTimeout(timer)
          reject(new Error('Connection closed before it opened.'))
          return
        }
        const expected = this.intentionalClose
        this.handlers.onClose?.(expected)
        if (!expected) this.scheduleReconnect()
      })

      ws.addEventListener('error', (err) => {
        this.handlers.onError?.(err)
      })
    })
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) return
    this.reconnectAttempt += 1
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 8000)
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(() => {
        // connect() will have already scheduled the next attempt via onClose,
        // unless the socket never opened at all — retry once more here.
        this.scheduleReconnect()
      })
    }, delay)
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  disconnect() {
    this.intentionalClose = true
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
  }
}

export function buildWsUrl(hostIp: string, port: number): string {
  return `ws://${hostIp}:${port}/ws`
}

/** ws URL for connecting back to whatever origin served this page. */
export function sameOriginWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}
