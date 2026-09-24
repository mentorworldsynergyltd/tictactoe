import type { CapacitorConfig } from '@capacitor/cli'

// App id follows Android's reverse-DNS package-name convention. Change this
// before publishing if you want a different package name — Android treats
// it as the app's permanent identity (changing it later means the Play
// Store sees it as a different app).
const config: CapacitorConfig = {
  appId: 'com.tictactoe.mentorworld',
  appName: 'Tic Tac Toe',
  webDir: 'dist',
  // Android blocks plain http/ws (cleartext) traffic by default from API 28+.
  // LAN multiplayer needs it (ws://<lan-ip>:8787), so cleartext is allowed
  // here and reinforced by android/app/src/main/res/xml/network_security_config.xml.
  server: {
    cleartext: true,
  },
  plugins: {
    Nodejs: {
      // Embedded Node runtime that runs the LAN game server on-device so an
      // Android phone can *host* a LAN match, not just join one. Starts
      // automatically when the app launches (see server/android-entry.ts) —
      // the runtime can only be started once per app launch, so "auto" is
      // simpler than trying to start it on-demand from the Create Game
      // screen. It sits idle (negligible resource use) until a room is
      // created.
      nodeDir: 'nodejs',
      startMode: 'auto',
    },
  },
}

export default config
