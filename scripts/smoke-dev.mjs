// Quick browser check for specific problems. Starts its own dev server on a free port, so it is safe to run
// at the same time as other agents or the preview server.
//   node scripts/smoke-dev.mjs two-sum valid-parentheses [--shots]
// For each slug, at 360px and 1440px: open the explainer, step to the end, reveal all code, and fail on any
// console error or sideways page scroll. --shots also writes screenshots/<slug>-<viewport>-dev.png
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const shots = args.includes('--shots')
const slugs = args.filter((a) => !a.startsWith('--'))
if (!slugs.length) { console.error('usage: node scripts/smoke-dev.mjs <slug...> [--shots]'); process.exit(2) }

const server = await createServer({ server: { port: 0, strictPort: false, host: '127.0.0.1' }, logLevel: 'error', clearScreen: false, appType: 'spa' })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const failures = []
mkdirSync(new URL('../screenshots/', import.meta.url), { recursive: true })

for (const [name, viewport] of [['phone', { width: 360, height: 740 }], ['desktop', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' })
  for (const slug of slugs) {
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    const tag = `${slug} @ ${name}`
    try {
      await page.goto(`${base}#/p/${slug}`)
      await page.waitForSelector('h1', { timeout: 15000 })
      const next = page.getByRole('button', { name: 'Next', exact: true })
      await next.waitFor({ timeout: 15000 })
      for (let i = 0; i < 80 && (await next.isEnabled()); i++) await next.click()
      if (!(await page.locator('.result').count())) failures.push(`${tag}: no result shown at the last step`)
      // every preset must run
      const presets = page.locator('.presets button')
      for (let i = 0; i < (await presets.count()); i++) {
        await presets.nth(i).click()
        for (let k = 0; k < 80 && (await next.isEnabled()); k++) await next.click()
      }
      for (const lang of ['Pseudocode', 'TypeScript', 'Go']) await page.getByRole('button', { name: `Reveal ${lang}` }).click()
      const hides = await page.getByRole('button', { name: 'Hide' }).count()
      if (hides !== 3) failures.push(`${tag}: expected 3 Hide buttons, got ${hides}`)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (over > 0) failures.push(`${tag}: page scrolls sideways by ${over}px`)
      // any single figure wider than its container without its own scroll would show as overflow above; also check the demo renders
      if (!(await page.locator('#idea .card').first().innerText()).trim()) failures.push(`${tag}: the idea demo is empty`)
      if (shots) await page.screenshot({ path: new URL(`../screenshots/${slug}-${name}-dev.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true })
    } catch (e) {
      failures.push(`${tag}: ${String(e).split('\n')[0]}`)
    }
    for (const e of errors) failures.push(`${tag}: console error: ${e.slice(0, 200)}`)
    await page.close()
  }
  await ctx.close()
}
await browser.close()
await server.close()
if (failures.length) { console.error('smoke-dev FAILED\n' + failures.map((f) => ' - ' + f).join('\n')); process.exit(1) }
console.log(`smoke-dev OK: ${slugs.join(', ')}`)
