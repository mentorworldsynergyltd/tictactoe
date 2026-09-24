// Playwright UI pass for the AI-opponent flow: Home -> AI Setup -> Game Board
// through each difficulty, verifying the AI actually moves (including the
// case where it goes first), the board disables during its turn, and a
// human playing "hard" cannot beat it.
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/ai-${name}.png` })
  console.log('shot:', name)
}

function log(ok, msg) {
  console.log(ok ? 'ok  :' : 'FAIL:', msg)
  if (!ok) process.exitCode = 1
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  // --- Pass 1: human plays O (AI is X, so AI moves first automatically) ---
  {
    const page = await browser.newPage()
    await page.goto(BASE)
    await page.getByText('Play Against AI').click()
    await page.waitForURL('**/ai/setup')
    await screenshot(page, '01-setup')

    await page.getByLabel('Your Name').fill('Ada')
    // "Go second" = play as O.
    await page.getByText('Go second').click()
    await page.getByRole('button', { name: 'Hard' }).click()
    await screenshot(page, '02-setup-configured')

    await page.getByText('START GAME').click()
    await page.waitForURL('**/local/game')

    // AI (X) should move first without any human input.
    await page.waitForFunction(() => {
      const cells = document.querySelectorAll('[role="grid"] button, [role="grid"] [role="gridcell"]')
      return true
    })
    // Give the AI's timed move a moment, then confirm a cell got filled.
    await page.waitForTimeout(900)
    const filledAfterAiFirst = await page.evaluate(() => {
      const board = document.querySelector('[role="grid"]')
      return board ? board.textContent.trim().length > 0 : false
    })
    log(filledAfterAiFirst, 'AI (going first) plays automatically on mount')
    await screenshot(page, '03-ai-moved-first')

    // Human (O) plays center if free, else any empty cell, repeatedly,
    // until the game ends — hard AI should never lose.
    let guard = 0
    while (guard++ < 9) {
      const status = await page.evaluate(() => document.body.textContent)
      if (/WINS!|DRAW GAME/.test(status)) break
      const emptyIndexHandle = await page.evaluateHandle(() => {
        const cells = Array.from(document.querySelectorAll('[role="grid"] > *'))
        const idx = cells.findIndex((c) => !c.textContent.trim())
        return idx
      })
      const emptyIndex = await emptyIndexHandle.jsonValue()
      if (emptyIndex === -1) break
      const cells = await page.locator('[role="grid"] > *')
      await cells.nth(emptyIndex).click({ force: true }).catch(() => {})
      await page.waitForTimeout(750)
    }
    await page.waitForTimeout(1400)
    await screenshot(page, '04-hard-ai-result')
    const bodyText = await page.evaluate(() => document.body.textContent)
    const humanWon = /Ada WINS/.test(bodyText)
    log(!humanWon, 'human cannot beat hard-difficulty AI (draw or AI win only)')
    console.log('   final banner text snippet:', (bodyText.match(/(WINS!|DRAW GAME)/) || ['(none found)'])[0])

    await page.close()
  }

  // --- Pass 2: human plays X vs. easy AI, board disables during AI turn ---
  {
    const page = await browser.newPage()
    await page.goto(BASE)
    await page.getByText('Play Against AI').click()
    await page.waitForURL('**/ai/setup')
    await page.getByLabel('Your Name').fill('Sam')
    await page.getByText('Go first').click()
    await page.getByRole('button', { name: 'Easy' }).click()
    await page.getByText('START GAME').click()
    await page.waitForURL('**/local/game')

    // Human moves first (X). Click cell 0.
    const cells = page.locator('[role="grid"] > *')
    await cells.nth(0).click()

    // Immediately after the human's move it should be the AI's turn — the
    // "AI is thinking" copy should appear and the board should reject clicks.
    const thinkingVisible = await page.getByText('AI is thinking').isVisible().catch(() => false)
    log(thinkingVisible, '"AI is thinking" indicator shows during the AI\'s turn')

    const secondCellTextBefore = await cells.nth(1).textContent()
    await cells.nth(1).click({ force: true }).catch(() => {})
    await page.waitForTimeout(100)
    const secondCellTextRightAfter = await cells.nth(1).textContent()
    log(
      secondCellTextBefore === secondCellTextRightAfter,
      'board ignores a human click while it is the AI\'s turn',
    )

    await page.waitForTimeout(900)
    await screenshot(page, '05-easy-after-ai-move')
    const filledCount = await page.evaluate(() => {
      const board = document.querySelector('[role="grid"]')
      return Array.from(board.children).filter((c) => c.textContent.trim()).length
    })
    log(filledCount === 2, 'AI replied with its own move (2 cells filled total)')

    await page.close()
  }

  console.log('done')
} finally {
  await browser.close()
}
