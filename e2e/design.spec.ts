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
        // the estimator reacts to a slider
        const before = await page.locator('.est dd').first().innerText()
        const slider = page.locator('.est input[type=range]').first()
        await slider.focus()
        for (let i = 0; i < 12; i++) await slider.press('ArrowRight')
        await expect.poll(() => page.locator('.est dd').first().innerText()).not.toBe(before)
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
