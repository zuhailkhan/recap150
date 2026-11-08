// Screenshots for review. Needs the built app: npm run build && npm run preview
// usage: node scripts/shots.mjs [slug ...]   (default: the three pilots)  -> screenshots/<slug>-<phone|desktop>*.png
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ['group-anagrams', 'two-sum', 'valid-parentheses']
const base = process.env.BASE ?? 'http://localhost:4173/'
const out = new URL('../screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
for (const [name, viewport] of [['phone', { width: 360, height: 740 }], ['desktop', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: name === 'phone' ? 2 : 1 })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()))
  page.on('pageerror', (e) => console.log('page error:', String(e)))
  for (const slug of slugs) {
    await page.goto(`${base}#/p/${slug}`)
    await page.waitForSelector('h1')
    await page.waitForTimeout(400)
    const next = page.getByRole('button', { name: 'Next', exact: true })
    for (let i = 0; i < 4 && (await next.count()) && (await next.isEnabled()); i++) await next.click()
    await page.screenshot({ path: `${out}${slug}-${name}-full.png`, fullPage: true })
    // stepper section on its own, mid-run
    const sec = page.locator('#watch')
    if (await sec.count()) await sec.screenshot({ path: `${out}${slug}-${name}-stepper.png` })
    for (const lang of ['Pseudocode', 'TypeScript', 'Go']) await page.getByRole('button', { name: `Reveal ${lang}` }).click().catch(() => {})
    const code = page.locator('#code')
    if (await code.count()) await code.screenshot({ path: `${out}${slug}-${name}-code.png` })
  }
  await ctx.close()
}
await browser.close()
console.log('screenshots in', out)
