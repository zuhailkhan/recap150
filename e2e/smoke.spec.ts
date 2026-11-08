import { test, expect, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Opens every explainer at a phone and a desktop size, steps to the end, reveals every code block,
// and fails on any console error or sideways page scroll.
const problemsDir = join(import.meta.dirname, '../src/problems')
const slugs = readdirSync(problemsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((s) => JSON.parse(readFileSync(join(problemsDir, s, 'meta.json'), 'utf8')).status === 'ready')

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

for (const size of sizes) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } })

    for (const slug of slugs) {
      test(`explainer ${slug}`, async ({ page }) => {
        const errors = watchConsole(page)
        await page.goto(`./#/p/${slug}`)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible()

        // step to the end
        const next = page.getByRole('button', { name: 'Next', exact: true })
        for (let i = 0; i < 80 && (await next.isEnabled()); i++) await next.click()
        await expect(next).toBeDisabled()
        await expect(page.locator('.result')).toBeVisible()

        // reveal each code block, then use Hide and Copy
        for (const lang of ['Pseudocode', 'TypeScript', 'Go']) {
          await page.getByRole('button', { name: `Reveal ${lang}` }).click()
        }
        await expect(page.getByRole('button', { name: 'Hide', exact: true })).toHaveCount(3)
        await expect(page.getByRole('button', { name: 'Copy', exact: true })).toHaveCount(3)
        await expect(page.locator('.howto')).toHaveCount(3)
        await noSidewaysScroll(page, `${slug} at ${size.name}`)
        expect(errors, errors.join('\n')).toEqual([])
      })
    }

    test('home, recap and backup pages', async ({ page }) => {
      const errors = watchConsole(page)
      for (const route of ['', 'recap', 'settings', 'recap/run?mode=daily']) {
        await page.goto(`./#/${route}`)
        await expect(page.locator('h1')).toBeVisible()
        await noSidewaysScroll(page, `/${route} at ${size.name}`)
      }
      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}

test('recap: a card can be revealed and rated', async ({ page }) => {
  const errors = watchConsole(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./#/recap/run?mode=daily')
  await page.getByRole('button', { name: 'Show answer' }).click()
  await page.getByRole('button', { name: 'Reveal TypeScript' }).click()
  await page.getByRole('button', { name: /^Good/ }).click()
  await expect(page.getByText(/Card 2 of/)).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

test('phone: navigation drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('./#/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Problems' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('navigation', { name: 'Problems' })).toBeHidden()
})

test('sidebar search and filter narrow the problem list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./#/')
  const nav = page.getByRole('navigation', { name: 'Problems' })
  await nav.getByLabel('Search problems').fill('two sum')
  await expect(nav.getByRole('link', { name: /Two Sum/ }).first()).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Valid Parentheses' })).toHaveCount(0)
  await nav.getByLabel('Search problems').fill('zzzz-no-such')
  await expect(nav.getByText('0 matches')).toBeVisible()
  await nav.getByLabel('Search problems').fill('')
  await nav.getByLabel('Filter').selectOption('todo')
  await expect(nav.getByRole('link', { name: 'Valid Parentheses' })).toHaveCount(0)
})
