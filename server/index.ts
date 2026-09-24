// LAN host server: serves the built frontend (when present) and runs the
// WebSocket game server (see gameServer.ts) that makes this machine the
// authoritative host for one Tic-Tac-Toe room at a time. No internet
// access, no cloud services — just this process on the LAN.
//
// This is the desktop/`npm run start` entry point. The Android app uses a
// different, leaner entry point (android-entry.ts, no static file serving)
// that runs inside an embedded Node runtime on the phone — but both wrap
// the exact same attachGameServer() from gameServer.ts, so hosting behaves
// identically wherever it's running.

import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { attachGameServer, getLocalIp } from './gameServer'
import { DEFAULT_LAN_PORT } from '../src/net/protocol'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || DEFAULT_LAN_PORT

const app = express()
const distDir = path.resolve(__dirname, '../dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback for client-side routing. Express 5's router (path-to-regexp
  // v8) no longer accepts a bare '*' pattern, so this is a path-less
  // catch-all middleware instead of app.get('*', ...).
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
} else {
  app.get('/', (_req, res) =>
    res.type('text/plain').send('Tic Tac Toe LAN server is running. Build the app with `npm run build` to serve it from here too.'),
  )
}

const httpServer = createServer(app)
const gameServer = attachGameServer(httpServer, PORT)

httpServer.listen(PORT, () => {
  const ip = getLocalIp()
  console.log(`Tic Tac Toe LAN server listening on port ${PORT}`)
  console.log(`  Local:   http://localhost:${PORT}`)
  if (ip) console.log(`  Network: http://${ip}:${PORT}`)
})

process.on('SIGINT', () => {
  gameServer.close()
  httpServer.close(() => process.exit(0))
})
