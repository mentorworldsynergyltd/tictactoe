// Public entry point for the online-play relay server: the one publicly
// reachable Node process that lets two phones on different networks (home
// Wi-Fi, cell data, opposite sides of the world — anywhere) find each other
// and play. Deploy *this file* by itself to any Node host with public
// internet access (Render, Fly.io, Railway, a VPS, ...); the app's "Play
// Online" mode connects to it directly over wss://, using the exact same
// wire protocol as LAN play (see gameServer.ts). The relay isn't a
// different game implementation — it's just an always-on, publicly
// reachable place to run the same room logic that a LAN host normally runs
// on their own device, so two players who aren't on the same network have
// somewhere to meet.
//
// Deliberately as thin as android-entry.ts: no Express, no static file
// serving, no game logic of its own beyond attachGameServer(). See
// ONLINE_PLAY_SETUP.md for how to actually deploy this.

import { createServer } from 'node:http'
import { attachGameServer } from './gameServer'

// Cloud hosts assign the port to listen on via $PORT and expect the process
// to bind to whatever they picked — unlike the LAN entry points, there's no
// fixed port to bake into the app here (the joining device doesn't need to
// know it; it just connects to the relay's public https/wss URL, which
// implies port 443).
const PORT = Number(process.env.PORT) || 10000

const httpServer = createServer((_req, res) => {
  // A plain 200 for anything that isn't the WebSocket upgrade — mostly so
  // the host's own health check, and anyone who opens the URL in a browser
  // out of curiosity, sees something sane instead of a connection refusal.
  // All real game traffic is the /ws WebSocket path, handled below.
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Tic Tac Toe online relay is running.\n')
})

attachGameServer(httpServer, PORT)

httpServer.listen(PORT, () => {
  console.log(`Tic Tac Toe online relay listening on port ${PORT}`)
})
