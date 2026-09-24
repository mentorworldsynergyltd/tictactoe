// Entry point for the embedded Node runtime that lets an Android phone HOST
// a LAN game itself, not just join one — see the Nodejs plugin config in
// capacitor.config.ts and @capawesome/capacitor-nodejs. Bundled by esbuild
// into public/nodejs/main.js (`npm run build:mobile-server`) as a single
// CommonJS file — the embedded runtime doesn't get an `npm install` step on
// the device, so everything this needs has to already be inlined.
//
// Deliberately lean compared to server/index.ts: no Express, no static file
// serving — the web app is already loaded by the WebView itself, this just
// needs to be the game server. It wraps the exact same attachGameServer()
// that the desktop host uses, so a phone-hosted game behaves identically to
// a laptop-hosted one; nothing about the room/move logic is duplicated.
//
// Runs automatically on app launch (startMode: 'auto') and just sits idle,
// listening, until someone actually creates a room.

import { createServer } from 'node:http'
import { channel } from 'bridge'
import { attachGameServer, getLocalIp } from './gameServer'
import { DEFAULT_LAN_PORT } from '../src/net/protocol'

const PORT = DEFAULT_LAN_PORT

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Tic Tac Toe LAN server (on-device) is running.\n')
})

attachGameServer(httpServer, PORT)

httpServer.listen(PORT, '0.0.0.0', () => {
  // A precise readiness signal for the app's own UI (see
  // src/lib/androidHost.ts), which needs to know the *socket* is listening
  // before it tries to connect to itself over loopback — more exact than
  // the plugin's generic 'ready' event, which only means "the script
  // required the bridge module," not "the server is actually up."
  channel.post('server-ready', { port: PORT, ip: getLocalIp() })
})
