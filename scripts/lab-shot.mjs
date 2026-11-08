// Screenshots the /lab gallery (every panel kind) at phone and desktop width: screenshots/lab-<phone|desktop>.png
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error', clearScreen: false })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
mkdirSync(new URL('../screenshots/', import.meta.url), { recursive: true })
const errors = []
for (const [name, viewport] of [['phone', { width: 360, height: 740 }], ['desktop', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`${base}#/lab`)
  await page.waitForSelector('.lab .card')
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (over > 0) errors.push(`${name}: sideways scroll ${over}px`)
  await page.screenshot({ path: new URL(`../screenshots/lab-${name}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true })
  await ctx.close()
}
await browser.close()
await server.close()
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('lab ok')
