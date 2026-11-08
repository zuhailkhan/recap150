// Renders public/icon.svg to the PNG sizes the PWA manifest needs. Run once: node scripts/make-icons.mjs
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
const render = async (size, file, pad = 0) => {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  const inner = size - pad * 2
  await page.setContent(`<body style="margin:0;background:#1f4e4a"><div style="padding:${pad}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`)
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), omitBackground: false })
  await page.close()
}
await render(192, 'icon-192.png')
await render(512, 'icon-512.png')
await render(512, 'icon-maskable-512.png', 64) // extra padding keeps the mark inside the maskable safe zone
await browser.close()
console.log('icons written')
