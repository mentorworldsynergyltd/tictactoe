import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { AvatarSymbol } from '../components/AvatarSymbol'
import { HowToPlayDemo } from '../components/HowToPlayDemo'

const steps = [
  {
    title: '1. Take turns',
    body: 'Players alternate placing X and O.',
    icon: <AvatarSymbol symbol="X" size="sm" />,
  },
  {
    title: '2. Complete a line',
    body: 'Get three matching symbols in a row, column, or diagonal.',
    icon: <span className="text-2xl">📏</span>,
  },
  {
    title: '3. Block your opponent',
    body: 'Stop the other player from completing a line.',
    icon: <span className="text-2xl">🛡️</span>,
  },
  {
    title: '4. LAN play',
    body: 'Connect both devices to the same Wi-Fi network.',
    icon: <span className="text-2xl">📡</span>,
  },
]

export function HowToPlayScreen() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-black text-ink">How to Play</h1>

      <div className="mt-6">
        <HowToPlayDemo />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {steps.map((s) => (
          <Card key={s.title} className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2">
              {s.icon}
            </div>
            <div>
              <p className="font-bold text-ink">{s.title}</p>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button size="lg" fullWidth onClick={() => navigate('/')}>
          GOT IT
        </Button>
      </div>
    </div>
  )
}
