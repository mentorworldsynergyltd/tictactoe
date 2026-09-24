// Lightweight move/win/draw feedback using the Web Audio API (synthesized
// tones, no external audio files to fetch or ship) and the Vibration API.
// Both are best-effort: a browser without AudioContext or navigator.vibrate
// just silently does nothing.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioCtx) audioCtx = new AudioContextCtor()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

function tone(freq: number, startOffset: number, durationSec: number, ctx: AudioContext, gainPeak = 0.08) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const start = ctx.currentTime + startOffset
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + durationSec + 0.02)
}

export function playMoveSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  tone(520, 0, 0.09, ctx)
}

export function playWinSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.09, 0.22, ctx, 0.07))
}

export function playDrawSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  tone(392, 0, 0.16, ctx, 0.06)
  tone(329.63, 0.12, 0.22, ctx, 0.06)
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore — vibration is a nice-to-have
  }
}

export const VIBRATE_MOVE = 15
export const VIBRATE_WIN = [40, 60, 40, 60, 80]
export const VIBRATE_DRAW = [30, 40, 30]
