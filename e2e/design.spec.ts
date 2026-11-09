import { test, expect, type Page } from '@playwright/test'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Opens every LLD and HLD explainer at a phone and a desktop size. Steps every stepper to the end,
// exercises the estimator or the code blocks, and fails on any console error or sideways page scroll.
const designDir = join(import.meta.dirname, '../src/design')
function readySlugs(track: 'lld' | 'hld') {
  const dir = join(designDir, track)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => JSON.parse(readFileSync(join(dir, s, 'meta.json'), 'utf8')).status === 'ready')
}
const lld = readySlugs('lld')
const hld = readySlugs('hld')

const sizes = [
  { name: 'phone', width: 360, height: 740 },
  { name: 'desktop', width: 1440, height: 900 },
]

function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}
async function noSidewaysScroll(page: Page, where: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over, `horizontal overflow on ${where}`).toBeLessThanOrEqual(0)
}
async function stepToEnd(page: Page, stepperIndex: number) {
  const stepper = page.locator('.stepper').nth(stepperIndex)
  const next = stepper.getByRole('button', { name: 'Next', exact: true })
  await expect(next).toBeVisible()
  for (let i = 0; i < 40 && (await next.isEnabled()); i++) await next.click()
  await expect(next).toBeDisabled()
}

for (const size of sizes) {
  test.describe(`design ${size.name}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })

    for (const slug of lld) {
      test(`lld ${slug}`, async ({ page }) => {
        const errors = watchConsole(page)
        await page.goto(`./#/lld/${slug}`)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('#model svg').first()).toBeVisible()
        // every scenario preset runs to its end
        const presets = page.locator('#watch .presets button')
        for (let i = 0; i < (await presets.count()); i++) { await presets.nth(i).click(); await stepToEnd(page, 0) }
        for (const lang of ['TypeScript', 'Go']) await page.getByRole('button', { name: `Reveal ${lang}` }).click()
        await expect(page.getByRole('button', { name: 'Hide', exact: true })).toHaveCount(2)
        await page.locator('#followups summary').first().click()
        await noSidewaysScroll(page, `lld ${slug} at ${size.name}`)
        expect(errors, errors.join('\n')).toEqual([])
      })
    }

    for (const slug of hld) {
      test(`hld ${slug}`, async ({ page }) => {
        const errors = watchConsole(page)
        await page.goto(`./#/hld/${slug}`)
        await expect(page.locator('h1')).toBeVisible()
        // the estimator reacts: push every slider to its maximum and the outputs must change
        const outputs = () => page.locator('.est dd').allInnerTexts().then((t) => t.join('|'))
        const before = await outputs()
        const sliders = page.locator('.est input[type=range]')
        for (let k = 0; k < (await sliders.count()); k++) { await sliders.nth(k).focus(); await sliders.nth(k).press('End') }
        await expect.poll(outputs).not.toBe(before)
        // both steppers (evolution, then request flows) run to the end, and every flow preset runs
        await stepToEnd(page, 0)
        await stepToEnd(page, 1)
        const flows = page.locator('#flows .presets button')
        for (let i = 0; i < (await flows.count()); i++) { await flows.nth(i).click(); await stepToEnd(page, 1) }
        await noSidewaysScroll(page, `hld ${slug} at ${size.name}`)
        expect(errors, errors.join('\n')).toEqual([])
      })
    }
  })
}

test('sidebar track switch lists each track', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./#/')
  const nav = page.getByRole('navigation', { name: 'Problems' })
  await nav.getByRole('button', { name: 'LLD', exact: true }).click()
  await expect(nav.getByText('Big products', { exact: true })).toBeVisible()
  await nav.getByRole('button', { name: 'HLD', exact: true }).click()
  await expect(nav.getByText('Ride, food and marketplaces')).toBeVisible()
  await nav.getByRole('button', { name: 'DSA', exact: true }).click()
  await expect(nav.getByText('Arrays & Hashing')).toBeVisible()
})

for (const deck of ['lld', 'hld'] as const) {
  test(`recap ${deck} deck: reveal and rate a card`, async ({ page }) => {
    const errors = watchConsole(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`./#/recap/run?deck=${deck}&mode=daily`)
    await page.getByRole('button', { name: 'Show answer' }).click()
    if (deck === 'lld') await page.getByRole('button', { name: 'Reveal TypeScript' }).click()
    await page.getByRole('button', { name: /^Good/ }).click()
    await expect(page.getByText(/Card 2 of|Done for now/)).toBeVisible()
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('recap home switches decks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./#/recap')
  await expect(page.getByText(/Data structures and algorithms\./)).toBeVisible()
  const decks = page.getByRole('group', { name: 'Deck' })
  await decks.getByRole('button', { name: 'LLD', exact: true }).click()
  await expect(page.getByText(/Low-level design\./)).toBeVisible()
  await decks.getByRole('button', { name: 'HLD', exact: true }).click()
  await expect(page.getByText(/High-level design\./)).toBeVisible()
})

test.describe('mark complete', () => {
  for (const [name, path] of [['DSA', '/#/p/two-sum'], ['LLD', '/#/lld/parking-lot'], ['HLD', '/#/hld/url-shortener']] as const) {
    test(`${name}: mark complete, undo, and it persists`, async ({ page }) => {
      await page.goto(path)
      const mark = page.getByRole('button', { name: 'Mark complete', exact: true })
      await expect(mark).toBeVisible()
      await mark.click()
      await expect(page.getByRole('status').filter({ hasText: 'Completed' })).toBeVisible()
      await page.getByRole('button', { name: 'Undo', exact: true }).click()
      await expect(mark).toBeVisible()
      await mark.click()
      await expect(page.getByRole('status').filter({ hasText: 'Completed' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('status').filter({ hasText: 'Completed' })).toBeVisible()
      await expect(mark).toHaveCount(0)
    })
  }
})
