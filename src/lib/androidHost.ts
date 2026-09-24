// Lets an Android phone HOST a LAN game, not just join one. On every other
// platform (the web build, iOS if it's ever added) this whole module is
// inert — isAndroidNative() gates every real action, so hostGame() falls
// back to its existing same-origin-server behavior unchanged.
//
// How it fits together: the embedded Node runtime (@capawesome/capacitor-nodejs,
// configured in capacitor.config.ts) auto-starts server/android-entry.ts —
// the exact same room/move logic as the desktop host (see server/gameServer.ts)
// — as soon as the app launches, listening on DEFAULT_LAN_PORT on all
// interfaces. This device's own WebView then talks to it over loopback,
// exactly as if it were "same origin," while other devices on the LAN
// reach it at this phone's Wi-Fi IP — same as any other host.
import { Capacitor } from '@capacitor/core'
import { DEFAULT_LAN_PORT } from '../net/protocol'

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export const ANDROID_HOST_LOOPBACK_URL = `ws://127.0.0.1:${DEFAULT_LAN_PORT}/ws`

let serverReady = false
let resolveReady: (() => void) | null = null
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

if (isAndroidNative()) {
  // Registered once, eagerly, at module load — the runtime starts
  // automatically on app launch and may post 'server-ready' before any
  // screen ever calls ensureAndroidServerReady(), so this can't be set up
  // lazily inside that function without risking missing the message.
  import('@capawesome/capacitor-nodejs')
    .then(({ Nodejs }) => {
      Nodejs.addListener('message', (event) => {
        if (event.eventName === 'server-ready') {
          serverReady = true
          resolveReady?.()
        }
      })
    })
    .catch(() => {
      // Plugin unavailable for some reason — ensureAndroidServerReady()'s
      // timeout fallback below covers this.
    })
}

/**
 * Resolves once the embedded on-device game server is confirmed listening,
 * or immediately on any platform other than native Android. Falls back to
 * a timeout rather than hanging forever if the 'server-ready' signal was
 * somehow missed — LanClient's own connect timeout + reconnect-with-backoff
 * covers a slightly-too-early connection attempt gracefully either way.
 */
export function ensureAndroidServerReady(timeoutMs = 8000): Promise<void> {
  if (!isAndroidNative()) return Promise.resolve()
  if (serverReady) return Promise.resolve()
  return Promise.race([readyPromise, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))])
}
