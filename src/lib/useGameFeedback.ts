import { useEffect, useRef } from 'react'
import { useSettings } from '../state/SettingsContext'
import {
  playMoveSound,
  playWinSound,
  playDrawSound,
  vibrate,
  VIBRATE_MOVE,
  VIBRATE_WIN,
  VIBRATE_DRAW,
} from './feedback'
import type { GameStatus } from '../engine/ticTacToe'

/**
 * Plays a move sound/vibration whenever moveCount increases and a
 * win/draw sound when status transitions out of 'in_progress' — for
 * whichever move just landed, on either the local pass-and-play board or a
 * LAN board driven by server broadcasts.
 */
export function useGameFeedback(moveCount: number, status: GameStatus) {
  const { settings } = useSettings()
  const prevMoveCount = useRef(moveCount)
  const prevStatus = useRef(status)

  useEffect(() => {
    if (moveCount > prevMoveCount.current) {
      if (status === 'in_progress') {
        if (settings.soundEnabled) playMoveSound()
        if (settings.vibrationEnabled) vibrate(VIBRATE_MOVE)
      } else if (prevStatus.current === 'in_progress') {
        if (status === 'win') {
          if (settings.soundEnabled) playWinSound()
          if (settings.vibrationEnabled) vibrate(VIBRATE_WIN)
        } else if (status === 'draw') {
          if (settings.soundEnabled) playDrawSound()
          if (settings.vibrationEnabled) vibrate(VIBRATE_DRAW)
        }
      }
    }
    prevMoveCount.current = moveCount
    prevStatus.current = status
  }, [moveCount, status, settings.soundEnabled, settings.vibrationEnabled])
}
