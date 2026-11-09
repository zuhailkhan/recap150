import { test, expect } from '@playwright/test'

// After one visit the service worker has cached the whole app. Cut the network, reload, and use it.
test('works offline after the first visit', async ({ page, context }) => {
  test.setTimeout(180_000) // the worker precaches about 1,300 files, which is slow while 12 other workers hit the same server
  await page.goto('./#/')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload() // let the worker take control of the page
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('h1')).toContainText('Watch it run')

  // a problem the page has never opened: its code chunks must come from the cache
  await page.goto('./#/p/lru-cache')
  const next = page.getByRole('button', { name: 'Next', exact: true })
  await expect(next).toBeVisible()
  for (let i = 0; i < 5; i++) await next.click()
  await page.getByRole('button', { name: 'Reveal Go' }).click()
  await expect(page.getByRole('button', { name: 'Hide', exact: true })).toHaveCount(1)

  // recap works offline too, and reviews are saved locally
  await page.goto('./#/recap/run?mode=daily')
  await page.getByRole('button', { name: 'Show answer' }).click()
  await page.getByRole('button', { name: /^Good/ }).click()
  await expect(page.getByText(/Card 2 of/)).toBeVisible()
})
