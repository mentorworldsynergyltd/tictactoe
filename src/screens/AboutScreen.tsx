import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { AnimatedMark } from '../components/AnimatedMark'
import { isAndroidNative } from '../lib/androidHost'
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, APP_VERSION } from '../lib/links'

export function AboutScreen() {
  const navigate = useNavigate()
  const onAndroid = isAndroidNative()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <h1 className="text-2xl font-black text-ink">About</h1>

      <div className="mt-6 flex flex-col items-center text-center">
        <AnimatedMark size={64} />
        <p className="mt-3 text-lg font-black text-ink">Tic Tac Toe</p>
        <p className="text-sm font-medium text-muted">Version {APP_VERSION}</p>
        <p className="mt-3 max-w-xs text-sm text-muted">
          Classic Tic-Tac-Toe with a smart AI and local Wi-Fi multiplayer. No accounts,
          no cloud saves — just a fast, well-made game.
        </p>
      </div>

      <Card className="mt-6 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Privacy</p>
        <div className="py-2.5">
          <p className="text-sm text-ink">
            Local games and games against the computer never leave your device. LAN
            games are sent directly between the two devices playing — never through a
            server we operate.
          </p>
        </div>
        {onAndroid && (
          <div className="py-2.5">
            <p className="text-sm text-ink">
              This app shows ads through Google AdMob, which may collect device and
              advertising identifiers to serve and measure ads.
            </p>
          </div>
        )}
        <div className="py-2.5">
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary hover:underline"
          >
            Read the full privacy policy ↗
          </a>
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Open source</p>
        <div className="py-2.5">
          <p className="text-sm text-muted">
            Built with React, Vite, Tailwind CSS, Framer Motion, React Router, Express,
            and ws — each under the MIT license.
          </p>
        </div>
      </Card>

      <Card className="mt-4 divide-y divide-line/50">
        <p className="pb-1 text-xs font-bold uppercase tracking-wide text-muted">Contact</p>
        <div className="py-2.5">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-bold text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </Card>

      <div className="mt-8">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
          BACK
        </Button>
      </div>
    </div>
  )
}
