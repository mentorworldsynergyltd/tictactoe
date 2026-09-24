import { chromium } from 'playwright'

const BASE = 'http://localhost:8787'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const guestCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const host = await hostCtx.newPage()
const guest = await guestCtx.newPage()

const errors = []
for (const [label, page] of [['host', host], ['guest', guest]]) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${label}] console: ${msg.text()}`)
  })
}

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/lan-${name}.png` })
}

// --- Host creates a game ---
await host.goto(BASE + '/lan/create')
await host.fill('#host-name', 'Alex')
await host.click('text=CREATE GAME')
await host.waitForURL('**/lan/host')
await host.waitForTimeout(400)
await screenshot(host, '01-host-waiting')

const code = await host.locator('[data-testid="game-code"]').innerText()
// NOTE: this sandbox's egress proxy 403s WebSocket connections to the
// machine's real LAN-reported IP (it treats that address as "external"
// even though it loops back to the same host). Real devices on a real LAN
// won't hit this — verified separately that the reported IP is correct and
// that the only failure is the sandbox's own proxy. Using loopback here so
// the rest of the protocol/UI flow can be exercised end-to-end.
const hostIp = '127.0.0.1'
console.log('Room code:', code, '| host IP (loopback for this sandbox):', hostIp)

// --- Guest joins ---
await guest.goto(BASE + '/lan/join')
await guest.fill('#join-name', 'John')
await guest.fill('#join-ip', hostIp)
await guest.fill('#join-code', code)
await screenshot(guest, '02-join-filled')
await guest.click('text=CONNECT')
await guest.waitForURL('**/lan/game', { timeout: 8000 })
await guest.waitForTimeout(300)
await screenshot(guest, '03-guest-board')

// host should auto-advance to the game board via the countdown
await host.waitForURL('**/lan/game', { timeout: 8000 })
await host.waitForTimeout(300)
await screenshot(host, '04-host-board')

// --- Play out an X win: 0,3,1,4,2 (host=X, guest=O) ---
const hostCells = () => host.locator('[role="grid"] button')
const guestCells = () => guest.locator('[role="grid"] button')

async function move(actorPage, otherPage, index) {
  await actorPage.locator('[role="grid"] button').nth(index).click()
  await otherPage.waitForTimeout(250)
}

await move(host, guest, 0) // X
await move(guest, host, 3) // O
await move(host, guest, 1) // X
await move(guest, host, 4) // O
await move(host, guest, 2) // X wins

await host.waitForTimeout(300)
await screenshot(host, '05-host-win-board')
await screenshot(guest, '06-guest-win-board')

await host.waitForURL('**/lan/results', { timeout: 4000 })
await guest.waitForURL('**/lan/results', { timeout: 4000 })
await host.waitForTimeout(200)
await screenshot(host, '07-host-results')
await screenshot(guest, '08-guest-results')

// --- Rematch flow: host requests, guest accepts ---
await host.click('text=PLAY AGAIN')
await host.waitForTimeout(300)
await screenshot(host, '09-host-waiting-rematch')
await guest.waitForTimeout(300)
await screenshot(guest, '10-guest-rematch-prompt')
await guest.click('text=ACCEPT')

await host.waitForURL('**/lan/game', { timeout: 4000 })
await guest.waitForURL('**/lan/game', { timeout: 4000 })
await host.waitForTimeout(200)
console.log('Rematch started, both back on game board.')

// --- Disconnect test: guest leaves, host should see the banner ---
await guest.click('text=LEAVE GAME')
await guest.waitForTimeout(200)
await guest.getByRole('alertdialog').getByRole('button', { name: 'LEAVE', exact: true }).click()
await host.waitForTimeout(500)
await screenshot(host, '11-host-opponent-disconnected')

const bannerVisible = await host.locator('text=Opponent Disconnected').isVisible().catch(() => false)
console.log('Opponent-disconnected banner visible on host:', bannerVisible)

console.log('\nERRORS:', JSON.stringify(errors, null, 2))
await browser.close()
process.exit(errors.length ? 1 : 0)
