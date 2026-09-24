import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Switch } from '../components/Switch'
import { SegmentedControl } from '../components/SegmentedControl'
import { SettingRow } from '../components/SettingRow'
import { useTheme } from '../lib/theme'
import type { ThemeMode } from '../lib/theme'
import { useSettings } from '../state/SettingsContext'
import { DEFAULT_LAN_PORT } from '../net/protocol'
import { APP_VERSION } from '../lib/links'

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const timeoutOptions: { value: string; label: string }[] = [
  { value: '3000', label: '3s' },
  { value: '6000', label: '6s' },
  { value: '10000', label: '10s' },
  { value: '15000', label: '15s' },
]

export function SettingsScreen() {
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()
  const { settings, updateSettings } = useSettings()
  const [portDraft, setPortDraft] = useState(String(settings.preferredPort))
  const [portError, setPortError] = useState<string | null>(null)

  const commitPort = () => {
    const parsed = Number(portDraft)
    if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) {
      setPortError('Enter a port between 1024 and 65535.')
      return
    }
    setPortError(null)
    updateSettings({ preferredPort: parsed })
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-black text-ink">Settings</h1>

      <Card className="mt-6 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Appearance</p>
        <SettingRow label="Theme">
          <SegmentedControl options={themeOptions} value={mode} onChange={setMode} />
        </SettingRow>
        <SettingRow label="Reduce motion" description="Minimize animations and transitions">
          <Switch
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
            label="Reduce motion"
          />
        </SettingRow>
      </Card>

      <Card className="mt-4 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Gameplay</p>
        <SettingRow label="Sound effects" description="Move, win, and draw sounds">
          <Switch
            checked={settings.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
            label="Sound effects"
          />
        </SettingRow>
        <SettingRow label="Vibration" description="Haptic feedback on supported devices">
          <Switch
            checked={settings.vibrationEnabled}
            onChange={(v) => updateSettings({ vibrationEnabled: v })}
            label="Vibration"
          />
        </SettingRow>
        <SettingRow label="Show move hints" description="Highlight a move that would win right now">
          <Switch
            checked={settings.showHints}
            onChange={(v) => updateSettings({ showHints: v })}
            label="Show move hints"
          />
        </SettingRow>
      </Card>

      <Card className="mt-4 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Network</p>
        <div className="py-2.5">
          <p className="text-sm font-semibold text-ink">Connection timeout</p>
          <p className="mt-0.5 text-xs text-muted">How long to wait when connecting to a host</p>
          <div className="mt-2">
            <SegmentedControl
              options={timeoutOptions}
              value={String(settings.connectionTimeoutMs)}
              onChange={(v) => updateSettings({ connectionTimeoutMs: Number(v) })}
            />
          </div>
        </div>
        <SettingRow label="Auto-reconnect" description="Silently retry after a dropped connection">
          <Switch
            checked={settings.autoReconnect}
            onChange={(v) => updateSettings({ autoReconnect: v })}
            label="Auto-reconnect"
          />
        </SettingRow>
        <div className="py-2.5">
          <p className="text-sm font-semibold text-ink">Preferred host port</p>
          <p className="mt-0.5 text-xs text-muted">
            Used when joining a game — only change this if your host is using a non-default port.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={portDraft}
              onChange={(e) => setPortDraft(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={commitPort}
              className="h-10 w-28 rounded-xl border border-line bg-surface-2 px-3 font-mono text-sm text-ink focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
            {settings.preferredPort !== DEFAULT_LAN_PORT && (
              <button
                onClick={() => {
                  setPortDraft(String(DEFAULT_LAN_PORT))
                  setPortError(null)
                  updateSettings({ preferredPort: DEFAULT_LAN_PORT })
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Reset to {DEFAULT_LAN_PORT}
              </button>
            )}
          </div>
          {portError && <p className="mt-1 text-xs font-semibold text-danger">{portError}</p>}
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">About</p>
        <button
          onClick={() => navigate('/about')}
          className="flex w-full items-center justify-between py-2.5 text-left"
        >
          <span className="text-sm text-ink">Tic Tac Toe &middot; Version {APP_VERSION}</span>
          <span className="text-sm font-bold text-primary">View &rsaquo;</span>
        </button>
      </Card>

      <div className="mt-8">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
          BACK
        </Button>
      </div>
    </div>
  )
}
