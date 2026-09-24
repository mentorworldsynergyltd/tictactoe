// Ambient type for the `bridge` module that @capawesome/capacitor-nodejs
// injects into the embedded Node runtime at runtime — it isn't an npm
// package, so TypeScript needs to be told it exists. esbuild is told to
// treat 'bridge' as external (see package.json's build:mobile-server
// script) so the bundle keeps a plain `require('bridge')` for the runtime
// to satisfy, instead of trying to resolve/bundle it from node_modules.
declare module 'bridge' {
  export const app: {
    /** A writable directory for persistent on-device storage. Unused here — this server keeps no state beyond the current process. */
    datadir(): string
    on(event: 'pause', cb: (pauseLock: { release(): void }) => void): void
    on(event: 'resume', cb: () => void): void
  }
  export const channel: {
    on(event: string, cb: (...args: unknown[]) => void): void
    post(event: string, ...args: unknown[]): void
  }
}
