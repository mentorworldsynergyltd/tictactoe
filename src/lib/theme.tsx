import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ttt.theme'

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })
  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPref)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystemPref(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  const resolved = mode === 'system' ? systemPref : mode

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
