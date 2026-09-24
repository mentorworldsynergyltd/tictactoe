// Central place for the "Play Online" relay's address, so every screen that
// needs it (Online lobby, create/join, LanGameContext) stays in sync — same
// pattern as src/lib/links.ts.
//
// This has to point at a real, publicly reachable deployment of
// server/relay-entry.ts (see ONLINE_PLAY_SETUP.md for how to deploy one).
// Until you've deployed it and pasted the real wss:// URL in here, "Play
// Online" is left showing a friendly "not set up yet" message instead of a
// confusing connection failure — LAN play is completely unaffected either
// way, since it never uses this file.
export const ONLINE_SERVER_URL: string = 'wss://REPLACE_WITH_YOUR_RELAY_URL/ws'

export function isOnlineServerConfigured(): boolean {
  return ONLINE_SERVER_URL !== 'wss://REPLACE_WITH_YOUR_RELAY_URL/ws' && ONLINE_SERVER_URL.startsWith('wss://')
}
