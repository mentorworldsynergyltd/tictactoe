import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_LAN_PORT } from '../net/protocol'

export interface Settings {
  reduceMotion: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  showHints: boolean
  autoReconnect: boolean
  connectionTimeoutMs: number
  preferredPort: number
}

export const DEFAULT_SETTINGS: Settings = {
  reduceMotion: false,
  soundEnabled: true,
  vibrationEnabled: true,
  showHints: false,
  autoReconnect: true,
  connectionTimeoutMs: 6000,
  preferredPort: DEFAULT_LAN_PORT,
}

interface SettingsContextValue {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)
const STORAGE_KEY = 'ttt.settings'

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // best-effort persistence only
    }
  }, [settings])

  useEffect(() => {
    document.documentElement.classList.toggle('force-reduce-motion', settings.reduceMotion)
  }, [settings.reduceMotion])

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const resetSettings = () => setSettings(DEFAULT_SETTINGS)

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
