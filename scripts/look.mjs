import { createServer } from 'vite'
import { chromium } from '@playwright/test'
const [,, ...args] = process.argv
const server = await createServer({ root: 'C:/Users/zuhai/workspace/recap150', server: { port: 0, host: '127.0.0.1' }, logLevel: 'error', clearScreen: false })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
for (const spec of args) {
  const [name, route, w, h, theme, mode, sel] = spec.split(',')
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, serviceWorkers: 'block', colorScheme: theme === 'dark' ? 'dark' : 'light' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('ERR', e.message))
  page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 160)))
  await page.goto(base + '#' + route); await page.waitForSelector('h1'); await page.waitForTimeout(900)
  if (route.startsWith('/p/') && mode !== 'top') { const next = page.getByRole('button', { name: 'Next', exact: true }); for (let i = 0; i < 4; i++) await next.click() ; await page.waitForTimeout(200) }
  if (sel) { await page.locator(sel).first().screenshot({ path: `C:/Users/zuhai/workspace/recap150/screenshots/look-${name}.png` }); await ctx.close(); continue }
  await page.screenshot({ path: `C:/Users/zuhai/workspace/recap150/screenshots/look-${name}.png`, fullPage: mode === 'full' })
  await ctx.close()
}
await browser.close(); await server.close()
