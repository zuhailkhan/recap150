// Lists the elements that stick out past the viewport on the phone layout (the cause of sideways page scroll).
//   node scripts/overflow.mjs lru-cache time-based-key-value-store [--width=360]
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const width = Number(args.find((a) => a.startsWith('--width='))?.slice(8) ?? 360)
const slugs = args.filter((a) => !a.startsWith('--'))
const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error', clearScreen: false })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 740 }, serviceWorkers: 'block' })
for (const slug of slugs) {
  const page = await ctx.newPage()
  await page.goto(`${base}#/p/${slug}`)
  await page.waitForSelector('.stepper')
  const next = page.getByRole('button', { name: 'Next', exact: true })
  for (let i = 0; i < 80 && (await next.isEnabled()); i++) await next.click()
  for (const lang of ['Pseudocode', 'TypeScript', 'Go']) await page.getByRole('button', { name: `Reveal ${lang}` }).click()
  const rows = await page.evaluate((w) => {
    const out = []
    for (const el of document.querySelectorAll('main *')) {
      const r = el.getBoundingClientRect()
      if (r.width && r.right > w + 0.5) {
        // skip elements that sit inside a container that scrolls on its own
        let p = el.parentElement, scrolled = false
        while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { scrolled = true; break } p = p.parentElement }
        if (!scrolled) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')} right=${Math.round(r.right)} width=${Math.round(r.width)} ${(el.textContent || '').trim().slice(0, 40)}`)
      }
    }
    return out.slice(0, 12)
  }, width)
  console.log(`== ${slug} (page scrolls by ${await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)}px)`)
  for (const r of rows) console.log('  ' + r)
  await page.close()
}
await browser.close()
await server.close()
