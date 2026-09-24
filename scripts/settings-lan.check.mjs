import { chromium } from 'playwright'

const HOST_BASE = 'http://localhost:9191' // custom-port server
const DEFAULT_BASE = 'http://localhost:8787' // default-port server
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

const errors = []
function trackErrors(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${label}] console: ${msg.text()}`)
  })
}

// ============================================================
// Part A: Settings persistence
// ============================================================
const settingsCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const settingsPage = await settingsCtx.newPage()
trackErrors(settingsPage, 'settings')

await settingsPage.goto(DEFAULT_BASE + '/settings')
await settingsPage.waitForTimeout(200)
await settingsPage.screenshot({ path: '/tmp/s3-01-settings-default.png' })

async function toggle(page, label) {
  await page.getByRole('switch', { name: label }).click()
}
await toggle(settingsPage, 'Show move hints')
await toggle(settingsPage, 'Sound effects')
await toggle(settingsPage, 'Reduce motion')

const portInput = settingsPage.locator('input[inputmode="numeric"]')
await portInput.fill('9191')
await portInput.blur()
await settingsPage.waitForTimeout(200)
await settingsPage.screenshot({ path: '/tmp/s3-02-settings-changed.png' })

await settingsPage.reload()
await settingsPage.waitForTimeout(300)
const hintsChecked = await settingsPage.getByRole('switch', { name: 'Show move hints' }).getAttribute('aria-checked')
const soundChecked = await settingsPage.getByRole('switch', { name: 'Sound effects' }).getAttribute('aria-checked')
const portValue = await settingsPage.locator('input[inputmode="numeric"]').inputValue()
console.log('After reload -> hints:', hintsChecked, 'sound:', soundChecked, 'port:', portValue)
if (hintsChecked !== 'true' || soundChecked !== 'false' || portValue !== '9191') {
  console.error('FAIL: settings did not persist across reload')
  process.exitCode = 1
} else {
  console.log('OK: settings persisted across reload')
}
await settingsCtx.close()

// ============================================================
// Part B: LAN join using a custom preferred port (this browser profile has
// preferredPort=9191 saved from Part A, but Part A ran in a different
// context/profile — settings are per-origin localStorage, so redo it here
// against a fresh context sharing HOST_BASE's origin).
// ============================================================
const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const guestCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const host = await hostCtx.newPage()
const guest = await guestCtx.newPage()
trackErrors(host, 'host')
trackErrors(guest, 'guest')

// Guest sets its preferred port to 9191 before joining.
await guest.goto(HOST_BASE + '/settings')
const guestPortInput = guest.locator('input[inputmode="numeric"]')
await guestPortInput.fill('9191')
await guestPortInput.blur()
await guest.waitForTimeout(150)

await host.goto(HOST_BASE + '/lan/create')
await host.fill('#host-name', 'Alex')
await host.click('text=CREATE GAME')
await host.waitForURL('**/lan/host')
await host.waitForTimeout(400)
const code = await host.locator('[data-testid="game-code"]').innerText()
console.log('Room code:', code)

await guest.goto(HOST_BASE + '/lan/join')
await guest.fill('#join-name', 'John')
await guest.fill('#join-ip', '127.0.0.1') // loopback workaround for this sandbox's egress proxy
await guest.fill('#join-code', code)
await guest.click('text=CONNECT')
await guest.waitForURL('**/lan/game', { timeout: 8000 })
await host.waitForURL('**/lan/game', { timeout: 8000 })
console.log('OK: LAN join succeeded using custom preferred port (9191)')

await hostCtx.close()
await guestCtx.close()

// ============================================================
// Part C: Move hints, deterministic local-multiplayer scenario
// ============================================================
const hintCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const hintPage = await hintCtx.newPage()
trackErrors(hintPage, 'hints')

await hintPage.goto(DEFAULT_BASE + '/settings')
const hintsSwitch = hintPage.getByRole('switch', { name: 'Show move hints' })
if ((await hintsSwitch.getAttribute('aria-checked')) !== 'true') {
  await hintsSwitch.click()
}

await hintPage.goto(DEFAULT_BASE + '/local/setup')
await hintPage.click('text=START GAME')
await hintPage.waitForURL('**/local/game')

// X: 0, O: 5, X: 1, O: 6  -> it's X's turn again with cells 0,1 filled in
// the top row; cell 2 should show a hint since placing X there wins.
const cells = () => hintPage.locator('[role="grid"] button')
await cells().nth(0).click() // X
await hintPage.waitForTimeout(120)
await cells().nth(5).click() // O
await hintPage.waitForTimeout(120)
await cells().nth(1).click() // X
await hintPage.waitForTimeout(120)
await cells().nth(6).click() // O
await hintPage.waitForTimeout(200)
await hintPage.screenshot({ path: '/tmp/s3-05-hint-visible.png' })

const hintDot = cells().nth(2).locator('span.bg-warning')
const hintVisible = await hintDot.isVisible().catch(() => false)
console.log('Hint indicator visible on the winning cell (index 2):', hintVisible)
if (!hintVisible) {
  console.error('FAIL: expected a hint indicator on cell 2')
  process.exitCode = 1
}

await hintCtx.close()

console.log('\nERRORS:', JSON.stringify(errors, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
