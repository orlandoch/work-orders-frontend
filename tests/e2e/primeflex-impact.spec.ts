import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'

/**
 * Smoke test: verify PrimeFlex import doesn't break existing pages.
 * Only checks console errors, blank pages, and basic rendering.
 */
const PAGES = [
  { path: '/#/dashboard', name: 'dashboard' },
  { path: '/#/inventory/kardex', name: 'kardex' },
  { path: '/#/inventory/stock-balances', name: 'stock-balances' },
  { path: '/#/inventory/adjustments/create', name: 'adjustments-create' },
  { path: '/#/purchases/receipts/create', name: 'receipts-create' },
  { path: '/#/banking/movements', name: 'banking-movements' },
  { path: '/#/banking/accounts', name: 'banking-accounts' },
  { path: '/#/banking/reconciliations', name: 'reconciliations' },
]

for (const p of PAGES) {
  test(`PrimeFlex no-break: ${p.name} (${p.path})`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        errors.push(`console.error: ${msg.text()}`)
      }
    })

    await injectToken(page)

    // Navigate to page
    const response = await page.goto(p.path, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // 1. Response should be OK
    expect(response?.status()).not.toBe(404)
    expect(response?.status()).not.toBe(500)

    // 2. Page should have Vue app content (not blank)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toBeTruthy()
    expect(bodyText.length).toBeGreaterThan(10)

    // 3. No undefined/null artifacts
    expect(bodyText).not.toContain('undefined')
    expect(bodyText).not.toContain('[object Object]')
    expect(bodyText).not.toContain('NaN')

    // 4. No console errors
    expect(errors).toEqual([])
  })
}
