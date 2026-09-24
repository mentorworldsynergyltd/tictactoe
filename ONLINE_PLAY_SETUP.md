# Setting up "Play Online"

LAN play works by having one phone run its own little game server that the
other device connects to directly — that only works because both devices are
on the same Wi-Fi network. Over the internet, two phones generally *can't*
connect to each other directly (carrier networks and home routers hide
devices behind NAT, there's no port forwarding, etc.), so online play needs
a third machine in the middle: a small server that's always on and publicly
reachable, that both players connect *out* to.

That server is `server/relay-entry.ts` — already written and using the exact
same room/move logic as LAN play (`server/gameServer.ts`), just packaged to
run on a public host instead of on a player's own phone. This doc is the
remaining step: getting it actually running somewhere public, and pointing
the app at it.

**Until you do this, "Play Online" in the app will show a "not set up yet"
message instead of a connection error — LAN play is completely unaffected.**

## 1. Deploy the relay server (Render, free)

[Render](https://render.com) is the recommended host for this: a genuinely
free tier for a small Node web service, no credit card required, automatic
HTTPS/WSS on a `*.onrender.com` subdomain, and WebSocket connections are
treated like ordinary traffic (they don't get cut off while a game is
active). The one tradeoff on the free tier: **the service falls asleep after
15 minutes with no traffic**, and takes roughly a minute to wake back up on
the next connection — see the note about this in step 4.

1. **Push this project to a GitHub repo** (Render's free tier deploys from a
   connected Git repo — if you haven't already, create a new repo on GitHub
   and push this project to it).
2. On [render.com](https://render.com), sign up/sign in, then **New →
   Web Service**, and connect the GitHub repo you just pushed.
3. Fill in:
   - **Language**: `Node`
   - **Build Command**: `npm install && npm run build:relay`
   - **Start Command**: `npm run start:relay`
   - **Instance Type**: **Free**
4. Click **Create Web Service** and wait for the first deploy to finish
   (you'll see build logs, then "Your service is live 🎉"). Render assigns
   it a URL that looks like `https://tictactoe-relay-xxxx.onrender.com` —
   copy that.

You don't need to set any environment variables — the relay reads the port
to listen on from Render's own `$PORT`, which Render sets automatically.

## 2. Point the app at it

Open `src/lib/onlineServer.ts` and replace the placeholder:

```ts
export const ONLINE_SERVER_URL = 'wss://tictactoe-relay-xxxx.onrender.com/ws'
```

Two things matter here: use `wss://` (not `https://` or `ws://` — it has to
be a WebSocket URL, and secure since the page itself loads over HTTPS), and
keep the `/ws` path at the end — that's the path `attachGameServer()`
listens on.

## 3. Rebuild and test

```bash
npm run build:android
```

(or `npm run build` if you're only testing the web version). Then install
the rebuilt app on two devices on **different** networks — say, one on
Wi-Fi and one on cell data — and try **Play Online → Create Game** on one,
**Play Online → Join Game** with that code on the other.

## About the free tier's sleep behavior

If the relay has been idle for a while (no games played in the last 15
minutes), the *first* connection attempt after that will hit a sleeping
server, which takes up to about a minute to wake up. The app's default
connection timeout (6 seconds, adjustable in **Settings → Connection
timeout**) is too short to wait that out, so that first attempt will likely
show "Unable to connect" — but the attempt itself is what wakes the server
up. If that happens, just wait 20–30 seconds and tap **Try Again**; it
should connect quickly the second time, and stay fast for as long as people
keep playing.

If that's annoying and you want to avoid cold starts entirely, two options,
roughly in order of effort:

- Have a free external uptime monitor (e.g. UptimeRobot, cron-job.org) ping
  your relay's URL every 10 minutes — this keeps it from ever going idle
  long enough to sleep, and costs nothing.
- Upgrade the Render service off the Free instance type (their paid tiers
  remove the sleep behavior entirely — check current pricing on
  render.com, since it changes) — worth it once this is more than a
  hobby project shared with a few friends.

## Known limitations, honestly

- **No abuse protection.** Anyone who knows the 4-character game code can
  join that room — same as LAN play, but now reachable from the whole
  internet instead of just your Wi-Fi. Fine for casual play with people you
  actually shared the code with; if this ever needs to be more locked-down,
  the room logic in `gameServer.ts` is the place to add rate limiting or
  expiring codes.
- **In-memory only.** Like the LAN server, the relay keeps all rooms in
  memory — a redeploy or restart drops any games in progress. Not worth
  solving for a hobby project; just don't redeploy mid-tournament.
- **One relay, all your players.** There's no matchmaking or server
  selection — everyone using this app's "Play Online" connects to the one
  relay URL baked into the build. That's fine at hobby scale; it's not
  built to handle a large concurrent player base.
